from flask import Blueprint, request, jsonify
from app import db, mpesa
from app.models.transaction import Transaction
from app.models.vendor import Vendor
from config.config import Config
import logging
bp = Blueprint('payment', __name__)



@bp.route('/pay', methods=['POST'])
def pay():
    data = request.get_json()
    amount = data.get('amount')
    phone_number = data.get('phone_number')
    customer = data.get('customer', 'Unknown Customer')
    business_number = data.get('account_number')
    
    if not amount or not phone_number:
        print("Amount and phone number are required")
        return jsonify({'error': 'Amount and phone number are required'}), 400
    
    # Look up the vendor by business_number
    vendor = Vendor.query.filter_by(business_number=business_number).first()
    print("Vendor", vendor)
    if not vendor:
        return jsonify({'error': f'Vendor with business number {business_number} not found'}), 404
        
    try:
        stk_push_response = mpesa.stk_push(
            business_shortcode=Config.MPESA_BUSINESS_SHORTCODE,
            passcode=Config.MPESA_PASSKEY,
            amount=int(amount),
            callback_url=Config.MPESA_CALLBACK_URL,
            reference_code=business_number, 
            phone_number=phone_number,
            description=f"Payment to {vendor.business_name}"  
        )
        
        if 'ResponseCode' in stk_push_response and stk_push_response['ResponseCode'] == '0':
            checkout_request_id = stk_push_response['CheckoutRequestID']
            
            # Create transaction with the correct vendor.id
            transaction = Transaction(
                vendor_id=vendor.id,  #
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
            print("Failed to initiate payment", stk_push_response)
            return jsonify({
                'error': 'Failed to initiate payment',
                'details': stk_push_response
            }), 400
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error occurred: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    
@bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    data = request.get_json()
    print("Callback data", data)
    
    try:
        stk_callback = data.get('Body', {}).get('stkCallback', {})
        result_code = stk_callback.get('ResultCode')
        checkout_request_id = stk_callback.get('CheckoutRequestID')

        if not checkout_request_id:
            return jsonify({'error': 'Missing CheckoutRequestID'}), 400

        transaction = Transaction.query.filter_by(
            mpesa_checkout_request_id=checkout_request_id
        ).first()

        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        # Handle transaction based on result_code
        if result_code == 0:
            transaction.status = 'completed'
            vendor = transaction.vendor
            vendor.balance = (vendor.balance or 0) + transaction.amount
        else:
            transaction.status = 'failed'

        db.session.commit()
        return jsonify({'message': 'Success' if result_code == 0 else 'Failed'}), 200

    except Exception as e:
        print("Error processing callback:", str(e))
        return jsonify({'error': str(e)}), 500

@bp.route('/withdraw', methods=['POST'])
def withdraw():
    data = request.get_json()
    amount = data.get('amount')
    phone_number = data.get('phone')
    business_number = data.get('business_number')

    if not amount or not phone_number or not business_number:
        return jsonify({'error': 'Amount, phone number, and business number are required'}), 400

    vendor = Vendor.query.filter_by(business_number=business_number).first()
    if not vendor:
        return jsonify({'error': f'Vendor with business number {business_number} not found'}), 404

    # Check if the vendor has sufficient balance
    if vendor.balance < float(amount):
        return jsonify({'error': 'Insufficient balance for withdrawal'}), 400

    try:
        # Create a transaction of type 'out'
        transaction = Transaction(
            vendor_id=vendor.id,
            type='out',
            amount=amount,
            customer='Withdrawal', 
            status='completed' 
        )
        
        vendor.balance -= float(amount)

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            'message': 'Withdrawal processed successfully',
            'transaction_id': transaction.id,
            'remaining_balance': vendor.balance
        }), 200

    except Exception as e:
        db.session.rollback()
        logging.error(f"Error occurred: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500