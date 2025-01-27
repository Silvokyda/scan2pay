from app import mpesa
from config.config import Config

class MpesaService:
    @staticmethod
    def initiate_stk_push(amount, phone_number, account_number):
        try:
            response = mpesa.stk_push(
                business_shortcode=Config.MPESA_BUSINESS_SHORTCODE,
                passcode=Config.MPESA_PASSKEY,
                amount=int(amount),
                callback_url=Config.MPESA_CALLBACK_URL,
                reference_code=str(account_number),
                phone_number=phone_number,
                description=f"Payment to {account_number}"
            )
            return response
        except Exception as e:
            raise Exception(f"MPesa STK push failed: {str(e)}")