from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps
import os
from dotenv import load_dotenv
import random

# mpesa service
from mpesa import MpesaExpress

# Load environment variables
load_dotenv()

# Initialize M-Pesa Express
mpesa = MpesaExpress(
    env="sandbox", 
    sandbox_url="https://sandbox.safaricom.co.ke",
    live_url="https://api.safaricom.co.ke"
)

# M-Pesa configuration
BUSINESS_SHORTCODE = "174379" 
PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"  
CALLBACK_URL = "https://37b8-102-219-210-201.ngrok-free.app/mpesa/callback" 


app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('APP_SECRET')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure the database connection
db_host = os.getenv('DB_HOST')
db_name = os.getenv('DB_NAME')
db_user = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')
db_port = os.getenv('DB_PORT', 3306)

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
)

db = SQLAlchemy(app)

# Vendor Model
class Vendor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    phone_number = db.Column(db.String(15), unique=True, nullable=False)
    business_type = db.Column(db.String(50))
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_verified = db.Column(db.Boolean, default=False)
    balance = db.Column(db.Float, default=0.0)
    business_number = db.Column(db.String(12), unique=True) 
    full_name = db.Column(db.String(100), nullable=False)
    id_number = db.Column(db.String(20), nullable=False)

# Transaction Model
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), nullable=False)
    type = db.Column(db.String(10), nullable=False) 
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    customer = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='pending')

    vendor = db.relationship('Vendor', backref=db.backref('transactions', lazy=True))

# Token decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            token = token.split(' ')[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_vendor = Vendor.query.get(data['vendor_id'])
        except:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(current_vendor, *args, **kwargs)
    return decorated

# Database connection check
def check_database_connection():
    try:
        db.session.execute('SELECT 1')
        print("Database connection successful!")
    except Exception as e:
        print(f"Database connection failed: {e}")
        exit(1)

# Autogenerate business number
def generate_business_number():
    return str(random.randint(1000000000, 9999999999))

# Routes
@app.route('/vendor/register', methods=['POST'])
def register():
    data = request.get_json()
    print(data)
    required_fields = ['business_name', 'email', 'password', 'phone_number', 'business_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
        
    if Vendor.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
        
    if Vendor.query.filter_by(phone_number=data['phone_number']).first():
        return jsonify({'error': 'Phone number already registered'}), 400
        
    try:
        vendor = Vendor(
            business_name=data['business_name'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            phone_number=data['phone_number'],
            business_type=data['business_type'],
            business_number=generate_business_number(),
            id_number=data['id_number'],
            full_name=data['full_name']
        )
        db.session.add(vendor)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Registration successful'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/vendor/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400

    vendor = Vendor.query.filter_by(email=data['email']).first()
    
    if not vendor:
        return jsonify({'error': 'Email not found'}), 401 

    if not check_password_hash(vendor.password_hash, data['password']):
        return jsonify({'error': 'Incorrect password'}), 401

    token = jwt.encode({
        'vendor_id': vendor.id,
        'exp': datetime.now(timezone.utc) + timedelta(days=1)  
    }, app.config['SECRET_KEY'])

    return jsonify({
        'success': True,
        'token': token,
        'vendor': {
            'id': vendor.id,
            'vendorName': vendor.full_name,
            'accountName': vendor.business_name,
            'email': vendor.email,
            'balance': vendor.balance,
            'is_verified': vendor.is_verified,
            'accountNumber': vendor.business_number
        }
    }), 200


@app.route('/pay', methods=['POST'])
def pay():
    data = request.get_json()
    amount = data.get('amount')
    phone_number = data.get('phone_number')  
    customer = data.get('customer', 'Unknown Customer')
    vendor = data.get('account_number')

    if not amount or not phone_number:
        return jsonify({'error': 'Amount and phone number are required'}), 400

    try:
        # Initiate STK Push
        stk_push_response = mpesa.stk_push(
            business_shortcode=BUSINESS_SHORTCODE,
            passcode=PASSKEY,
            amount=int(amount),
            callback_url=CALLBACK_URL,
            reference_code=str(vendor),
            phone_number=phone_number,
            description=f"Payment to {vendor}"
        )

        if 'ResponseCode' in stk_push_response and stk_push_response['ResponseCode'] == '0':
            # STK push initiated successfully
            checkout_request_id = stk_push_response['CheckoutRequestID']
            
            # Save pending transaction
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

# Callback route to handle M-Pesa responses
@app.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    data = request.get_json()
    
    try:
        # Extract relevant information from callback
        result_code = data['Body']['stkCallback']['ResultCode']
        checkout_request_id = data['Body']['stkCallback']['CheckoutRequestID']

        # Find the pending transaction
        transaction = Transaction.query.filter_by(
            mpesa_checkout_request_id=checkout_request_id
        ).first()

        if transaction and result_code == 0:
            # Payment successful
            transaction.status = 'completed'
            
            # Update vendor balance
            vendor = transaction.vendor
            vendor.balance += transaction.amount
            
            db.session.commit()
            
            return jsonify({'message': 'Success'}), 200
        else:
            # Payment failed
            if transaction:
                transaction.status = 'failed'
                db.session.commit()
            
            return jsonify({'message': 'Failed'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Transactions Route
@app.route('/transactions', methods=['GET'])
@token_required
def get_transactions(current_vendor):
    transactions = Transaction.query.filter_by(vendor_id=current_vendor.id).all()
    result = [{
        'id': transaction.id,
        'type': transaction.type,
        'amount': transaction.amount,
        'date': transaction.date.isoformat(),
        'customer': transaction.customer
    } for transaction in transactions]

    return jsonify(result), 200

if __name__ == '__main__':
    with app.app_context():
        check_database_connection()
        db.create_all()
        
    app.run(debug=True)