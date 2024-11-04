from flask import Flask, request, jsonify
from dotenv import load_dotenv
from mpesa import MpesaExpress

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Initialize the MpesaExpress instance
mpesa = MpesaExpress()

@app.route('/stk-push', methods=['POST'])
def stk_push():
    """Endpoint for initiating STK Push."""
    data = request.get_json()
    
    # Extract data from the request
    amount = data.get('amount')
    phone_number = data.get('phone_number')
    callback_url = data.get('callback_url')
    reference_code = data.get('reference_code')
    description = data.get('description')

    # Validate input data
    if not all([amount, phone_number, callback_url, reference_code, description]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        response = mpesa.stk_push(
            business_shortcode=os.getenv("BUSINESS_SHORTCODE"),
            passcode=os.getenv("PASSCODE"),
            amount=amount,
            callback_url=callback_url,
            reference_code=reference_code,
            phone_number=phone_number,
            description=description
        )
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/query', methods=['POST'])
def query():
    """Endpoint for querying the status of an STK Push."""
    data = request.get_json()
    
    # Extract data from the request
    checkout_request_id = data.get('checkout_request_id')
    
    # Validate input data
    if not checkout_request_id:
        return jsonify({"error": "Missing checkout_request_id"}), 400

    try:
        response = mpesa.query(
            business_shortcode=os.getenv("BUSINESS_SHORTCODE"),
            checkout_request_id=checkout_request_id,
            passcode=os.getenv("PASSCODE")
        )
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
