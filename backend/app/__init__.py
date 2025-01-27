from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config.config import Config
from config.mpesa import MpesaExpress 

db = SQLAlchemy()
mpesa = MpesaExpress(
    env="sandbox",
    sandbox_url="https://sandbox.safaricom.co.ke",
    live_url="https://api.safaricom.co.ke"
)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    
    from app.routes import auth, payment, transaction
    app.register_blueprint(auth.bp)
    app.register_blueprint(payment.bp)
    app.register_blueprint(transaction.bp)
    
    return app