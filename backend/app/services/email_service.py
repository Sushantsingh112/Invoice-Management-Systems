from flask import current_app
from flask_mail import Message
from datetime import datetime
from app import mail, db
from app.models.models import (EmailSettings, BusinessSettings, Invoice,
                                Quotation, EmailLog, TranslationSettings)
import logging


def _get_email_settings():
    return EmailSettings.query.first()


def _replace_vars(template_str, variables):
    """Replace {{variable}} placeholders in template."""
    if not template_str:
        return ''
    for key, value in variables.items():
        template_str = template_str.replace(f'{{{{{key}}}}}', str(value or ''))
    return template_str


def _build_variables(doc_type, doc):
    """Build template variables from document."""
    business = BusinessSettings.query.first()
    fmt_amount = lambda a: f"{float(a or 0):,.2f}"

    if doc_type == 'invoice':
        return {
            'client_name': doc.client.client_name if doc.client else '',
            'company_name': business.business_name if business else '',
            'invoice_number': doc.invoice_number,
            'invoice_date': str(doc.invoice_date),
            'due_date': str(doc.due_date),
            'total': fmt_amount(doc.total),
            'paid': fmt_amount(doc.paid_amount),
            'balance_due': fmt_amount(doc.balance_due),
            'currency': doc.currency,
            'reference': doc.reference or '',
        }
    else:
        return {
            'client_name': doc.client.client_name if doc.client else '',
            'company_name': business.business_name if business else '',
            'quote_number': doc.quote_number,
            'quote_date': str(doc.quote_date),
            'valid_until': str(doc.valid_until),
            'total': fmt_amount(doc.total),
            'currency': doc.currency,
            'reference': doc.reference or '',
        }


def _configure_mail_from_settings(app):
    """Dynamically update Flask-Mail config from DB settings."""
    es = _get_email_settings()
    if not es or not es.smtp_host:
        return False
    app.config['MAIL_SERVER'] = es.smtp_host
    app.config['MAIL_PORT'] = es.smtp_port or 587
    app.config['MAIL_USERNAME'] = es.smtp_username
    app.config['MAIL_PASSWORD'] = es.smtp_password
    app.config['MAIL_USE_TLS'] = es.encryption == 'tls'
    app.config['MAIL_USE_SSL'] = es.encryption == 'ssl'
    app.config['MAIL_DEFAULT_SENDER'] = (es.from_name, es.from_email)
    mail.init_app(app)
    return True


def send_document_email(doc_type, doc_id):
    """Send invoice or quotation email with PDF attachment."""
    try:
        es = _get_email_settings()
        if not es or not es.smtp_host:
            return {"success": False, "message": "SMTP settings not configured. Please configure Email Settings first."}

        if doc_type == 'invoice':
            doc = Invoice.query.get(doc_id)
            template_key = 'invoice_sent'
            recipient_email = doc.client.email if doc and doc.client else None
            filename = f"{doc.invoice_number}.pdf"
        else:
            doc = Quotation.query.get(doc_id)
            template_key = 'quotation_sent'
            recipient_email = doc.client.email if doc and doc.client else None
            filename = f"{doc.quote_number}.pdf"

        if not doc:
            return {"success": False, "message": f"{doc_type.capitalize()} not found"}
        if not recipient_email:
            return {"success": False, "message": "Client email address not found"}

        variables = _build_variables(doc_type, doc)
        templates = es.templates or {}
        template = templates.get(template_key, {})

        subject = _replace_vars(template.get('subject', f"{doc_type.upper()} - {filename}"), variables)
        body = _replace_vars(template.get('body', f"Please find attached {filename}."), variables)

        # Generate PDF
        from app.pdf.generator import generate_pdf
        pdf_bytes = generate_pdf(doc_type, doc_id)

        # Log before send
        log = EmailLog(
            entity_type=doc_type,
            entity_id=doc_id,
            recipient_email=recipient_email,
            subject=subject,
            body=body,
            status='pending'
        )
        db.session.add(log)
        db.session.flush()

        try:
            msg = Message(
                subject=subject,
                recipients=[recipient_email],
                body=body,
                sender=(es.from_name, es.from_email)
            )
            if pdf_bytes:
                msg.attach(filename, 'application/pdf', pdf_bytes)

            # Re-init mail with current DB settings
            app = current_app._get_current_object()
            if _configure_mail_from_settings(app):
                mail.send(msg)

            log.status = 'sent'
            log.sent_at = datetime.utcnow()
            db.session.commit()
            return {"success": True, "message": f"Email sent to {recipient_email}"}

        except Exception as smtp_err:
            log.status = 'failed'
            log.error_message = str(smtp_err)
            db.session.commit()
            logging.error(f"SMTP error: {smtp_err}")
            return {"success": False, "message": f"Failed to send email: {str(smtp_err)}"}

    except Exception as e:
        logging.error(f"Email service error: {str(e)}")
        return {"success": False, "message": f"Email service error: {str(e)}"}


def send_test_email(to_email):
    """Send a test email to verify SMTP configuration."""
    try:
        es = _get_email_settings()
        if not es or not es.smtp_host:
            return {"success": False, "message": "SMTP not configured"}

        business = BusinessSettings.query.first()
        msg = Message(
            subject="Test Email - Invoice System",
            recipients=[to_email],
            body=f"This is a test email from your Quotation & Invoice Management System.\n\nSMTP configuration is working correctly.\n\n— {business.business_name if business else 'Invoice App'}",
            sender=(es.from_name, es.from_email)
        )
        app = current_app._get_current_object()
        _configure_mail_from_settings(app)
        mail.send(msg)
        return {"success": True, "message": f"Test email sent to {to_email}"}
    except Exception as e:
        return {"success": False, "message": f"Test failed: {str(e)}"}
