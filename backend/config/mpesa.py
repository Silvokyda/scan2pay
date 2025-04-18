from config.auth import MpesaBase
import base64
import requests
import datetime

class MpesaExpress(MpesaBase):
    def __init__(self, env=None, sandbox_url=None, live_url=None):
        super().__init__(env, sandbox_url=sandbox_url, live_url=live_url)
        self.authentication_token = self.authenticate()

    def stk_push(self, business_shortcode, passcode, amount, callback_url, reference_code,
                 phone_number, description):
        """This method uses Mpesa's Express API to initiate online payment on behalf of a customer..

        **Args:**
            - business_shortcode (int): The short code of the organization.
            - passcode (str): Get from developer portal
            - amount (int): The amount being transacted
            - callback_url (str): A CallBack URL is a valid secure URL that is used to receive notifications from M-Pesa API.
            - reference_code: Account Reference: This is an Alpha-Numeric parameter that is defined by your system
                as an Identifier of the transaction for CustomerPayBillOnline transaction type.
            - phone_number: The Mobile Number to receive the STK Pin Prompt.
            - description: This is any additional information/comment that can be sent along with
                the request from your system. MAX 13 characters


        **Returns:**
            - CustomerMessage (str):
            - CheckoutRequestID (str):
            - ResponseDescription (str):
            - MerchantRequestID (str):
            - ResponseCode (str):

        """

        time = str(datetime.datetime.now()).split(".")[0].replace(
            "-", "").replace(" ", "").replace(":", "")
        password = f"{business_shortcode}{passcode}{time}"
        encoded = base64.b64encode(password.encode())
        payload = {
            "BusinessShortCode": business_shortcode,
            "Password": encoded.decode('utf-8'),
            "Timestamp": time,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": int(phone_number),
            "PartyB": business_shortcode,
            "PhoneNumber": int(phone_number),
            "CallBackURL": callback_url,
            "AccountReference": reference_code,
            "TransactionDesc": description
        }
        headers = {'Authorization': f"Bearer {self.authentication_token}", 'Content-Type': "application/json"}
        if self.env == "production":
            base_safaricom_url = self.live_url
        else:
            base_safaricom_url = self.sandbox_url
        saf_url = f"{base_safaricom_url}/mpesa/stkpush/v1/processrequest"
        r = requests.post(saf_url, headers=headers, json=payload)
        return r.json()

    def query(self, business_shortcode=None, checkout_request_id=None, passcode=None):
        """This method uses Mpesa's Express API to check the status of a Lipa Na M-Pesa Online Payment..

                                                    **Args:**
                                                        - business_shortcode (int): This is organizations shortcode (Paybill or Buygoods - A 5 to 6 digit account number) used to identify an organization and receive the transaction.
                                                        - checkout_request_id (str): This is a global unique identifier of the processed checkout transaction request.
                                                        - passcode (str): Get from developer portal


                                                    **Returns:**
                                                        - CustomerMessage (str):
                                                        - CheckoutRequestID (str):
                                                        - ResponseDescription (str):
                                                        - MerchantRequestID (str):
                                                        - ResponseCode (str):


        """

        time = str(datetime.datetime.now()).split(".")[0].replace(
            "-", "").replace(" ", "").replace(":", "")
        password = f"{business_shortcode}{passcode}{time}"
        encoded = base64.b64encode(password.encode())
        payload = {
            "BusinessShortCode": business_shortcode,
            "Password": str(encoded),
            "Timestamp": time,
            "CheckoutRequestID": checkout_request_id
        }
        headers = {'Authorization': f"Bearer {self.authentication_token}", 'Content-Type': "application/json"}
        if self.env == "production":
            base_safaricom_url = self.live_url
        else:
            base_safaricom_url = self.sandbox_url
        saf_url = f"{base_safaricom_url}/mpesa/stkpushquery/v1/query"
        r = requests.post(saf_url, headers=headers, json=payload)
        return r.json()