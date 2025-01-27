from functools import wraps
from flask import request, jsonify
import jwt
from app.models.vendor import Vendor
from config.config import Config

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            token = token.split(' ')[1]
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            current_vendor = Vendor.query.get(data['vendor_id'])
        except:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(current_vendor, *args, **kwargs)
    return decorated