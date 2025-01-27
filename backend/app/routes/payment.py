from flask import Blueprint, request, jsonify
from app import db, mpesa
from app.models.transaction import Transaction
from config.config import Config

bp = Blueprint('payment', __name__)

@bp.route('/pay', methods=['POST'])
def pay():
    data = request.get_json()
    amount = data.get('amount')
    phone_number = data.get('phone_number')
    customer = data.get('customer', 'Unknown Customer')
    vendor = data.get('account_number')

    if not amount or not phone_number:
        return jsonify({'error': 'Amount and phone number are required'}), 400

    try:
        stk_push_response = mpesa.stk_push(
            business_shortcode=Config.MPESA_BUSINESS_SHORTCODE,
            passcode=Config.MPESA_PASSKEY,
            amount=int(amount),
            callback_url=Config.MPESA_CALLBACK_URL,
            reference_code=str(vendor),
            phone_number=phone_number,
            description=f"Payment to {vendor}"
        )

        if 'ResponseCode' in stk_push_response and stk_push_response['ResponseCode'] == '0':
            checkout_request_id = stk_push_response['CheckoutRequestID']
            
            transaction = Transaction(
                vendor_id=vendor,
                type='in',
                amount=amount,
                customer=customer,
                mpesa_checkout_request_id=checkout_request_id,
                status='pending'
            )
            
            db.session.add(transaction)
            db.session.commit()
            
            return jsonify({
                'message': 'STK Push sent successfully',
                'checkout_request_id': checkout_request_id
            }), 200
        else:
            return jsonify({
                'error': 'Failed to initiate payment',
                'details': stk_push_response
            }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    data = request.get_json()
    
    try:
        result_code = data['Body']['stkCallback']['ResultCode']
        checkout_request_id = data['Body']['stkCallback']['CheckoutRequestID']

        transaction = Transaction.query.filter_by(
            mpesa_checkout_request_id=checkout_request_id
        ).first()

        if transaction and result_code == 0:
            transaction.status = 'completed'
            vendor = transaction.vendor
            vendor.balance += transaction.amount
            db.session.commit()
            return jsonify({'message': 'Success'}), 200
        else:
            if transaction:
                transaction.status = 'failed'
                db.session.commit()
            return jsonify({'message': 'Failed'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500