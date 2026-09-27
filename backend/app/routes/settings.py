from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from app import db
from app.models.models import (BusinessSettings, GeneralSettings, QuotationSettings,
                                InvoiceSettings, PaymentSettings, TaxSettings,
                                EmailSettings, TranslationSettings, PdfTemplate,
                                PredefinedItem, User)
from app.middleware.auth import log_audit
from app.utils.helpers import allowed_file

settings_bp = Blueprint('settings', __name__)


def _get_or_create(Model):
    obj = Model.query.first()
    if not obj:
        obj = Model()
        db.session.add(obj)
        db.session.commit()
    return obj


# ── General Settings ──────────────────────────────────────────
@settings_bp.route('/general', methods=['GET'])
@jwt_required()
def get_general():
    return jsonify({"success": True, "data": _get_or_create(GeneralSettings).to_dict()}), 200


@settings_bp.route('/general', methods=['PUT'])
@jwt_required()
def update_general():
    s = _get_or_create(GeneralSettings)
    data = request.get_json()
    if data.get('year_start'):
        from datetime import datetime
        s.year_start = datetime.strptime(data['year_start'], '%Y-%m-%d').date()
    if data.get('year_end'):
        from datetime import datetime
        s.year_end = datetime.strptime(data['year_end'], '%Y-%m-%d').date()
    if 'predefined_items' in data:
        s.predefined_items = data['predefined_items']
    db.session.commit()
    return jsonify({"success": True, "message": "General settings updated", "data": s.to_dict()}), 200


# ── Business Settings ─────────────────────────────────────────
@settings_bp.route('/business', methods=['GET'])
@jwt_required()
def get_business():
    return jsonify({"success": True, "data": _get_or_create(BusinessSettings).to_dict()}), 200


@settings_bp.route('/business', methods=['PUT'])
@jwt_required()
def update_business():
    s = _get_or_create(BusinessSettings)
    data = request.get_json()
    fields = ['business_name', 'address', 'extra_info', 'email', 'phone', 'website',
              'gst_number', 'vat_number', 'registration_number', 'country', 'city', 'state', 'postal_code']
    for f in fields:
        if f in data:
            setattr(s, f, data[f])
    db.session.commit()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    log_audit(user_id, user.email if user else '', 'UPDATE', 'business_settings', s.id)
    return jsonify({"success": True, "message": "Business settings updated", "data": s.to_dict()}), 200


@settings_bp.route('/business/logo', methods=['POST'])
@jwt_required()
def upload_logo():
    if 'logo' not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400

    file = request.files['logo']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not allowed_file(file.filename, current_app.config['ALLOWED_EXTENSIONS']):
        return jsonify({"success": False, "message": "Invalid file type. Allowed: png, jpg, jpeg, gif, webp"}), 400

    filename = secure_filename(f"logo_{file.filename}")
    upload_path = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_path, exist_ok=True)
    filepath = os.path.join(upload_path, filename)
    file.save(filepath)

    s = _get_or_create(BusinessSettings)
    s.logo_path = filename
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Logo uploaded successfully",
        "data": {"logo_path": filename, "logo_url": f"/api/settings/uploads/{filename}"}
    }), 200


@settings_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    upload_folder = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(upload_folder, filename)


# ── Quotation Settings ────────────────────────────────────────
@settings_bp.route('/quotation', methods=['GET'])
@jwt_required()
def get_quotation_settings():
    return jsonify({"success": True, "data": _get_or_create(QuotationSettings).to_dict()}), 200


@settings_bp.route('/quotation', methods=['PUT'])
@jwt_required()
def update_quotation_settings():
    s = _get_or_create(QuotationSettings)
    data = request.get_json()
    fields = ['quote_prefix', 'next_number', 'auto_numbering', 'date_format', 'validity_days',
              'default_notes', 'default_terms', 'footer', 'email_subject', 'email_message', 'pdf_template']
    for f in fields:
        if f in data:
            setattr(s, f, data[f])
    db.session.commit()
    return jsonify({"success": True, "message": "Quotation settings updated", "data": s.to_dict()}), 200


# ── Invoice Settings ──────────────────────────────────────────
@settings_bp.route('/invoice', methods=['GET'])
@jwt_required()
def get_invoice_settings():
    return jsonify({"success": True, "data": _get_or_create(InvoiceSettings).to_dict()}), 200


@settings_bp.route('/invoice', methods=['PUT'])
@jwt_required()
def update_invoice_settings():
    s = _get_or_create(InvoiceSettings)
    data = request.get_json()
    fields = ['invoice_prefix', 'next_number', 'auto_numbering', 'date_format', 'default_due_days',
              'footer', 'payment_instructions', 'default_notes', 'default_terms', 'admin_notice', 'pdf_template']
    for f in fields:
        if f in data:
            setattr(s, f, data[f])
    db.session.commit()
    return jsonify({"success": True, "message": "Invoice settings updated", "data": s.to_dict()}), 200


# ── Payment Settings ──────────────────────────────────────────
@settings_bp.route('/payment', methods=['GET'])
@jwt_required()
def get_payment_settings():
    return jsonify({"success": True, "data": _get_or_create(PaymentSettings).to_dict()}), 200


@settings_bp.route('/payment', methods=['PUT'])
@jwt_required()
def update_payment_settings():
    s = _get_or_create(PaymentSettings)
    data = request.get_json()
    fields = ['currency_symbol', 'currency_code', 'currency_position', 'thousand_separator',
              'decimal_separator', 'decimal_places', 'payment_methods', 'payment_instructions',
              'paypal_enabled', 'paypal_email', 'payment_page_text', 'payment_page_footer']
    for f in fields:
        if f in data:
            setattr(s, f, data[f])
    db.session.commit()
    return jsonify({"success": True, "message": "Payment settings updated", "data": s.to_dict()}), 200


# ── Tax Settings ──────────────────────────────────────────────
@settings_bp.route('/tax', methods=['GET'])
@jwt_required()
def get_tax_settings():
    taxes = TaxSettings.query.order_by(TaxSettings.is_default.desc(), TaxSettings.tax_name).all()
    return jsonify({"success": True, "data": [t.to_dict() for t in taxes]}), 200


@settings_bp.route('/tax', methods=['POST'])
@jwt_required()
def create_tax():
    data = request.get_json()
    tax = TaxSettings(
        tax_name=data.get('tax_name', 'Tax'),
        tax_percentage=data.get('tax_percentage', 0),
        tax_type=data.get('tax_type', 'exclusive'),
        tax_rules=data.get('tax_rules', ''),
        is_default=data.get('is_default', False)
    )
    if tax.is_default:
        TaxSettings.query.update({'is_default': False})
    db.session.add(tax)
    db.session.commit()
    return jsonify({"success": True, "message": "Tax created", "data": tax.to_dict()}), 201


@settings_bp.route('/tax/<int:tax_id>', methods=['PUT'])
@jwt_required()
def update_tax(tax_id):
    tax = TaxSettings.query.get_or_404(tax_id)
    data = request.get_json()
    for f in ['tax_name', 'tax_percentage', 'tax_type', 'tax_rules', 'is_default']:
        if f in data:
            setattr(tax, f, data[f])
    if data.get('is_default'):
        TaxSettings.query.filter(TaxSettings.id != tax_id).update({'is_default': False})
    db.session.commit()
    return jsonify({"success": True, "message": "Tax updated", "data": tax.to_dict()}), 200


@settings_bp.route('/tax/<int:tax_id>', methods=['DELETE'])
@jwt_required()
def delete_tax(tax_id):
    tax = TaxSettings.query.get_or_404(tax_id)
    db.session.delete(tax)
    db.session.commit()
    return jsonify({"success": True, "message": "Tax deleted"}), 200


# ── Email Settings ────────────────────────────────────────────
@settings_bp.route('/email', methods=['GET'])
@jwt_required()
def get_email_settings():
    s = _get_or_create(EmailSettings)
    return jsonify({"success": True, "data": s.to_dict(hide_password=True)}), 200


@settings_bp.route('/email', methods=['PUT'])
@jwt_required()
def update_email_settings():
    s = _get_or_create(EmailSettings)
    data = request.get_json()
    fields = ['smtp_host', 'smtp_port', 'smtp_username', 'encryption', 'from_name', 'from_email', 'templates']
    for f in fields:
        if f in data:
            setattr(s, f, data[f])
    if data.get('smtp_password') and data['smtp_password'] != '••••••••':
        s.smtp_password = data['smtp_password']
    db.session.commit()
    return jsonify({"success": True, "message": "Email settings updated", "data": s.to_dict()}), 200


@settings_bp.route('/email/test', methods=['POST'])
@jwt_required()
def test_email():
    data = request.get_json()
    test_email_addr = data.get('email', '')
    if not test_email_addr:
        return jsonify({"success": False, "message": "Test email address required"}), 400
    from app.services.email_service import send_test_email
    result = send_test_email(test_email_addr)
    return jsonify(result), 200 if result['success'] else 500


# ── Translation Settings ──────────────────────────────────────
@settings_bp.route('/translation', methods=['GET'])
@jwt_required()
def get_translation():
    return jsonify({"success": True, "data": _get_or_create(TranslationSettings).to_dict()}), 200


@settings_bp.route('/translation', methods=['PUT'])
@jwt_required()
def update_translation():
    s = _get_or_create(TranslationSettings)
    data = request.get_json()
    if 'language' in data:
        s.language = data['language']
    if 'labels' in data:
        s.labels = data['labels']
    db.session.commit()
    return jsonify({"success": True, "message": "Translation updated", "data": s.to_dict()}), 200


# ── PDF Templates ─────────────────────────────────────────────
@settings_bp.route('/pdf-templates', methods=['GET'])
@jwt_required()
def get_pdf_templates():
    templates = PdfTemplate.query.filter_by(is_active=True).all()
    return jsonify({"success": True, "data": [t.to_dict() for t in templates]}), 200


# ── Predefined Items ──────────────────────────────────────────
@settings_bp.route('/predefined-items', methods=['GET'])
@jwt_required()
def get_predefined_items():
    items = PredefinedItem.query.filter_by(is_active=True).all()
    return jsonify({"success": True, "data": [i.to_dict() for i in items]}), 200


@settings_bp.route('/predefined-items', methods=['POST'])
@jwt_required()
def create_predefined_item():
    data = request.get_json()
    item = PredefinedItem(
        item_name=data.get('item_name', ''),
        description=data.get('description', ''),
        unit_price=data.get('unit_price', 0),
        tax_percentage=data.get('tax_percentage', 0),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({"success": True, "message": "Item created", "data": item.to_dict()}), 201


@settings_bp.route('/predefined-items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_predefined_item(item_id):
    item = PredefinedItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"success": True, "message": "Item deleted"}), 200
