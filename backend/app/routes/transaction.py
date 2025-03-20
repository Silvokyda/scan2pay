from flask import Blueprint, jsonify
from app.utils.decorators import token_required

bp = Blueprint('transaction', __name__)

@bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions(current_vendor):
    transactions = current_vendor.transactions
    result = [{
        'id': transaction.id,
        'type': transaction.type,
        'amount': transaction.amount,
        'date': transaction.date.isoformat(),
        'customer': transaction.customer,
        'status': transaction.status
    } for transaction in transactions]

    return jsonify({
        'balance': current_vendor.balance,  
        'transactions': result
    }), 200