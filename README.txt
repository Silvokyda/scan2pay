# Scan2Pay

Scan2Pay is a mobile payment system that allows users to scan QR codes to initiate payments via STK push using the Safaricom Daraja API. The system is built with a **React Native Expo** frontend and a **Python Flask** backend.

## 📁 Project Structure

```
scan2pay/
├── QRPaymentApp        # React Native frontend
├── backend             # Python Flask backend
├── qr_code.png         # Sample QR code
└── README.md           # Project documentation
```

---

## 📱 Frontend - QRPaymentApp

### Tech Stack:
- React Native (Expo)
- Vision Camera (for scanning QR codes)
- Ngrok (for tunneling backend during development)

### Setup Instructions

1. Navigate to the frontend directory:

   ```bash
   cd QRPaymentApp
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Expo app:

   ```bash
   npx expo start
   ```

4. Update the backend URL in your environment/config file as needed (e.g., use your Ngrok URL if you're testing on a real device).

---

## 🔙 Backend - Flask API

### Tech Stack:
- Python Flask
- MySQL (or SQLite for quick setup)
- Daraja API (Safaricom STK Push)
- Ngrok (for testing mobile app with local backend)

### Setup Instructions

1. Navigate to the backend folder:

   ```bash
   cd backend
   ```

2. Create a virtual environment:

   ```bash
   python3 -m venv myenv
   source myenv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask server:

   ```bash
   python app.py
   ```

5. (Optional) Expose your local server using Ngrok:

   ```bash
   ./ngrok http 5000
   ```

---

## ✅ Features

- QR Code scanner using Vision Camera
- STK Push via Safaricom Daraja API
- Order summary before payment
- Backend logging of transactions
- Basic authentication and validation

---

## 📸 Sample QR Code

`qr_code.png` contains a sample QR you can scan for testing.

---

## 🛠 Future Improvements

- Add user authentication
- Track payment status updates
- Implement notifications for transaction success/failure
- Admin dashboard for transaction logs

---

## 👨‍💻 Author

**Silvanus Owino**  
[GitHub - @Silvokyda](https://github.com/Silvokyda)  
[Portfolio](https://react-portfolio-pied-one.vercel.app)

