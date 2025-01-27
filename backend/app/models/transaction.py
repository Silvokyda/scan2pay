from app import db
from datetime import datetime

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), nullable=False)
    type = db.Column(db.String(10), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    customer = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='pending')
    mpesa_checkout_request_id = db.Column(db.String(100))

    vendor = db.relationship('Vendor', backref=db.backref('transactions', lazy=True))