from app import create_app, db
from sqlalchemy import text

app = create_app()

def check_database_connection():
    try:
        with app.app_context():
            db.session.execute(text("SELECT 1"))
            print("Database connection successful!")
    except Exception as e:
        print(f"Database connection failed: {e}")
        exit(1)

if __name__ == '__main__':
    with app.app_context():
        check_database_connection()
        db.create_all()
    
    app.run(host="0.0.0.0", port=5000, debug=True)