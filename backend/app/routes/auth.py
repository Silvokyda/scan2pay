from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import random
from app import db
from app.models.vendor import Vendor
from config.config import Config

bp = Blueprint('auth', __name__)

def generate_business_number():
    return str(random.randint(1000000000, 9999999999))

@bp.route('/vendor/register', methods=['POST'])
def register():
    data = request.get_json()
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

@bp.route('/vendor/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    vendor = Vendor.query.filter_by(email=email).first()
    if not vendor:
        return jsonify({'error': 'Invalid email or password'}), 401

    if not check_password_hash(vendor.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = jwt.encode(
        {'vendor_id': vendor.id, 'exp': datetime.utcnow() + timedelta(hours=24)},
        Config.SECRET_KEY, 
        algorithm="HS256"
    )  

    return jsonify({'success': True, 'token': token, 'vendor': {
        'id': vendor.id,
        'business_name': vendor.business_name,
        'business_number': vendor.business_number,
        'email': vendor.email,
        'phone_number': vendor.phone_number,
        'business_type': vendor.business_type,
    }})