import os
import requests
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv()

class MpesaBase:
    def __init__(self, env=None, app_key=None, app_secret=None,
                 sandbox_url="https://sandbox.safaricom.co.ke",
                 live_url="https://api.safaricom.co.ke"):
        self.env = env or os.getenv("ENV", "sandbox") 
        self.app_key = app_key or os.getenv("APP_KEY")
        self.app_secret = app_secret or os.getenv("APP_SECRET")
        self.sandbox_url = sandbox_url or os.getenv("SANDBOX_URL")
        self.live_url = live_url or os.getenv("LIVE_URL")
        self.token = None

    def authenticate(self):
        """To make Mpesa API calls, you will need to authenticate your app. This method is used to fetch the access token
        required by Mpesa. Mpesa supports client_credentials grant type. To authorize your API calls to Mpesa,
        you will need a Basic Auth over HTTPS authorization token. The Basic Auth string is a base64 encoded string
        of your app's client key and client secret.

            **Args:**
                - env (str): Current app environment. Options: sandbox, live.
                - app_key (str): The app key obtained from the developer portal.
                - app_secret (str): The app key obtained from the developer portal.
                - sandbox_url (str): Base Safaricom sandbox url.
                - live_url (str): Base Safaricom live url.

            **Returns:**
                - access_token (str): This token is to be used with the Bearer header for further API calls to Mpesa.

            """
        if self.env == "production":
            base_safaricom_url = self.live_url
        else:
            base_safaricom_url = self.sandbox_url
        authenticate_uri = "/oauth/v1/generate?grant_type=client_credentials"
        authenticate_url = f"{base_safaricom_url}{authenticate_uri}"
        r = requests.get(authenticate_url,
                         auth=HTTPBasicAuth(str(self.app_key), str(self.app_secret)))
        self.token = r.json()['access_token']
        return r.json()['access_token']