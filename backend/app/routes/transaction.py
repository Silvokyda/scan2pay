from email.mime.text import MIMEText
from flask import Blueprint, request, jsonify, current_app
from app.utils.decorators import token_required
from app.models.transaction import Transaction
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
from reportlab.lib.units import inch

bp = Blueprint('transaction', __name__)

@bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions(current_vendor):
    transactions = Transaction.query.filter_by(vendor_id=current_vendor.id).order_by(Transaction.date.desc()).all()
    
    result = [{
        'id': transaction.id,
        'type': transaction.type,
        'amount': transaction.amount,
        'date': transaction.date.isoformat(),
        'customer': transaction.customer,
        'status': transaction.status
    } for transaction in transactions]

    return jsonify({
        'balance': current_vendor.balance,
        'transactions': result
    }), 200

@bp.route('/export-statement', methods=['POST'])
@token_required
def export_statement(current_vendor):
    data = request.get_json()
    email = data.get('email')
    duration = data.get('duration')

    if not email or not duration:
        return jsonify({'error': 'Email and duration are required'}), 400

    # Calculate the date range based on the duration
    end_date = datetime.utcnow()
    if duration == '3 months':
        start_date = end_date - timedelta(days=90)
    elif duration == '6 months':
        start_date = end_date - timedelta(days=180)
    elif duration == '1 year':
        start_date = end_date - timedelta(days=365)
    else:
        return jsonify({'error': 'Invalid duration'}), 400

    # Fetch transactions within the date range
    transactions = Transaction.query.filter(
        Transaction.vendor_id == current_vendor.id,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).order_by(Transaction.date.desc()).all()

    # Calculate totals
    total_in = sum(t.amount for t in transactions if t.type == 'in')
    total_out = sum(t.amount for t in transactions if t.type == 'out')

    # Generate PDF
    pdf_filename = f'statement_{current_vendor.id}_{datetime.now().strftime("%Y%m%d%H%M%S")}.pdf'
    pdf_path = os.path.join(current_app.config['UPLOAD_FOLDER'], pdf_filename)
    generate_pdf(pdf_path, transactions, start_date, end_date, total_in, total_out, duration, current_vendor.business_name)

    send_email_with_attachment(email, pdf_path)

    return jsonify({'message': 'Statement export request has been sent to your email.'}), 200

def generate_pdf(pdf_path, transactions, start_date, end_date, total_in, total_out, duration, vendor_business_name):
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Create a custom style for center alignment
    centered_style = styles['Normal'].clone('CenteredStyle')
    centered_style.alignment = 1  

    elements = []

    # Title
    title = Paragraph('<b>SCAN2PAY STATEMENT</b>', styles['Title'])
    title.alignment = 1 
    elements.append(title)
    elements.append(Spacer(1, 12)) 

    # Vendor Business Name
    business_name_paragraph = Paragraph(vendor_business_name, centered_style)  
    elements.append(business_name_paragraph)
    elements.append(Spacer(1, 12))

    # Duration Heading
    duration_text = f"{duration.capitalize()} Statement"
    duration_paragraph = Paragraph(duration_text, centered_style)  
    elements.append(duration_paragraph)
    elements.append(Spacer(1, 12))  

    # Date Range
    date_range_text = f"From: {start_date.strftime('%Y-%m-%d')} To: {end_date.strftime('%Y-%m-%d')}"
    date_range_paragraph = Paragraph(date_range_text, centered_style)  
    elements.append(date_range_paragraph)
    elements.append(Spacer(1, 24))  

    # Summary Table
    summary_data = [
        ['Money In', f"KES {total_in:.2f}"],
        ['Money Out', f"KES {total_out:.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[doc.width * 0.4, doc.width * 0.4])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2A2A2A')),  
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke), 
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), 
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),  
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),  
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F5F5F5')), 
        ('GRID', (0, 0), (-1, -1), 1, colors.black), 
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 24)) 

    # Transaction Records Table
    transaction_data = [['Date', 'Type', 'Customer', 'Amount (KES)']]
    for t in transactions:
        transaction_data.append([t.date.strftime('%Y-%m-%d'), t.type.capitalize(), t.customer, f"{t.amount:.2f}"])

    # Set table width to 90% of the page width
    table_width = doc.width * 0.9
    col_widths = [table_width * 0.25, table_width * 0.25, table_width * 0.35, table_width * 0.15]
    transaction_table = Table(transaction_data, colWidths=col_widths)
    transaction_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2A2A2A')), 
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),  
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),  
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),  
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),  
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F5F5F5')),  
        ('GRID', (0, 0), (-1, -1), 1, colors.black),  
    ]))
    elements.append(transaction_table)

    # Build the PDF
    doc.build(elements)

def send_email_with_attachment(email, pdf_path):
    smtp_server = current_app.config['SMTP_SERVER']
    smtp_port = current_app.config['SMTP_PORT']
    smtp_username = current_app.config['SMTP_USERNAME']
    smtp_password = current_app.config['SMTP_PASSWORD']
    from_email = current_app.config['FROM_EMAIL']

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = email
    msg['Subject'] = 'Your Transaction Statement'

    body = 'Please find your transaction statement attached.'
    msg.attach(MIMEText(body, 'plain'))

    with open(pdf_path, 'rb') as attachment:
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(attachment.read())
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename={os.path.basename(pdf_path)}'
        )
        msg.attach(part)

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)

    # Clean up the generated PDF
    os.remove(pdf_path)