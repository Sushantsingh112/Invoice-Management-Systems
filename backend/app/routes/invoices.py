from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from decimal import Decimal
from app import db
from app.models.models import Invoice, InvoiceItem, InvoiceSettings, Payment, Client, User
from app.middleware.auth import log_audit, paginate_query
from app.utils.helpers import calculate_document_totals, generate_document_number, calculate_line_item
import io

invoices_bp = Blueprint('invoices', __name__)


def _save_invoice_items(invoice_id, items_data):
    totals = calculate_document_totals(items_data)
    for i, item_data in enumerate(items_data):
        calc = calculate_line_item(
            item_data.get('quantity', 1),
            item_data.get('unit_price', 0),
            item_data.get('discount_percentage', 0),
            item_data.get('tax_percentage', 0)
        )
        item = InvoiceItem(
            invoice_id=invoice_id,
            item_name=item_data.get('item_name', ''),
            description=item_data.get('description', ''),
            quantity=item_data.get('quantity', 1),
            unit_price=item_data.get('unit_price', 0),
            discount_percentage=item_data.get('discount_percentage', 0),
            discount_amount=calc['discount_amount'],
            tax_percentage=item_data.get('tax_percentage', 0),
            tax_amount=calc['tax_amount'],
            subtotal=calc['subtotal'],
            total=calc['total'],
            sort_order=i
        )
        db.session.add(item)
    return totals


def _update_invoice_payment_status(invoice):
    """Recalculate and update invoice status based on total paid amount."""
    total_paid = db.session.query(
        db.func.coalesce(db.func.sum(Payment.amount), 0)
    ).filter(
        Payment.invoice_id == invoice.id,
        Payment.status != 'failed'
    ).scalar()

    invoice.paid_amount = float(total_paid)
    invoice.balance_due = max(0, float(invoice.total) - float(total_paid))

    if float(total_paid) <= 0:
        if invoice.status not in ('draft', 'cancelled'):
            invoice.status = 'sent'
    elif float(total_paid) >= float(invoice.total):
        invoice.status = 'paid'
    else:
        invoice.status = 'partially_paid'


@invoices_bp.route('', methods=['GET'])
@jwt_required()
def get_invoices():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    search = request.args.get('search', '').strip()
    status = request.args.get('status', '').strip()
    client_id = request.args.get('client_id', None, type=int)
    date_from = request.args.get('date_from', None)
    date_to = request.args.get('date_to', None)
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = Invoice.query.join(Client)

    if search:
        like = f'%{search}%'
        query = query.filter(
            db.or_(
                Invoice.invoice_number.ilike(like),
                Invoice.reference.ilike(like),
                Client.client_name.ilike(like),
                Client.email.ilike(like)
            )
        )
    if status:
        query = query.filter(Invoice.status == status)
    if client_id:
        query = query.filter(Invoice.client_id == client_id)
    if date_from:
        query = query.filter(Invoice.invoice_date >= date_from)
    if date_to:
        query = query.filter(Invoice.invoice_date <= date_to)

    sort_col = getattr(Invoice, sort_by, Invoice.created_at)
    query = query.order_by(sort_col.desc() if sort_order == 'desc' else sort_col.asc())

    result = paginate_query(query, page, per_page)
    return jsonify({
        "success": True,
        "data": [inv.to_dict(include_items=False) for inv in result['items']],
        "pagination": {
            "total": result['total'], "page": result['page'],
            "per_page": result['per_page'], "pages": result['pages'],
            "has_next": result['has_next'], "has_prev": result['has_prev'],
        }
    }), 200


@invoices_bp.route('/<int:inv_id>', methods=['GET'])
@jwt_required()
def get_invoice(inv_id):
    inv = Invoice.query.get_or_404(inv_id)
    data = inv.to_dict()
    data['payments'] = [p.to_dict() for p in inv.payments.all()]
    return jsonify({"success": True, "data": data}), 200


@invoices_bp.route('', methods=['POST'])
@jwt_required()
def create_invoice():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('client_id'):
        return jsonify({"success": False, "message": "Client is required"}), 400
    if not data.get('items') or len(data['items']) == 0:
        return jsonify({"success": False, "message": "At least one line item is required"}), 400

    settings = InvoiceSettings.query.first()
    if not settings:
        return jsonify({"success": False, "message": "Invoice settings not configured"}), 500

    try:
        inv_number = data.get('invoice_number') or generate_document_number(
            settings.invoice_prefix, settings.next_number)

        if Invoice.query.filter_by(invoice_number=inv_number).first():
            return jsonify({"success": False, "message": "Invoice number already exists", "error": "DUPLICATE_NUMBER"}), 409

        inv_date = datetime.strptime(data['invoice_date'], '%Y-%m-%d').date() if data.get('invoice_date') else date.today()
        due = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else (
            date.today() + timedelta(days=settings.default_due_days or 30))

        invoice = Invoice(
            invoice_number=inv_number,
            client_id=data['client_id'],
            invoice_date=inv_date,
            due_date=due,
            status=data.get('status', 'draft'),
            currency=data.get('currency', 'INR'),
            reference=data.get('reference', ''),
            notes=data.get('notes', settings.default_notes or ''),
            terms=data.get('terms', settings.default_terms or ''),
            pdf_template=data.get('pdf_template', settings.pdf_template or 'template1'),
            created_by=user_id
        )
        db.session.add(invoice)
        db.session.flush()

        totals = _save_invoice_items(invoice.id, data['items'])
        invoice.subtotal = totals['subtotal']
        invoice.discount_amount = totals['discount_amount']
        invoice.tax_amount = totals['tax_amount']
        invoice.total = totals['total']
        invoice.paid_amount = 0
        invoice.balance_due = totals['total']

        if settings.auto_numbering:
            settings.next_number += 1

        db.session.commit()
        user = User.query.get(user_id)
        log_audit(user_id, user.email if user else '', 'CREATE', 'invoice', invoice.id,
                  new_value={'invoice_number': invoice.invoice_number, 'total': str(invoice.total)})
        return jsonify({"success": True, "message": "Invoice created successfully", "data": invoice.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        import logging; logging.error(f"Create invoice error: {str(e)}")
        return jsonify({"success": False, "message": "Failed to create invoice", "error": str(e)}), 500


@invoices_bp.route('/<int:inv_id>', methods=['PUT'])
@jwt_required()
def update_invoice(inv_id):
    user_id = get_jwt_identity()
    inv = Invoice.query.get_or_404(inv_id)
    if inv.status in ('paid', 'cancelled'):
        return jsonify({"success": False, "message": "Cannot edit a paid or cancelled invoice"}), 409

    old = inv.to_dict(include_items=False)
    data = request.get_json()

    try:
        if data.get('client_id'): inv.client_id = data['client_id']
        if data.get('invoice_date'):
            inv.invoice_date = datetime.strptime(data['invoice_date'], '%Y-%m-%d').date()
        if data.get('due_date'):
            inv.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        if data.get('status'): inv.status = data['status']

        for field in ['currency', 'reference', 'notes', 'terms', 'pdf_template']:
            if field in data: setattr(inv, field, data[field])

        if data.get('items'):
            InvoiceItem.query.filter_by(invoice_id=inv_id).delete()
            totals = _save_invoice_items(inv_id, data['items'])
            inv.subtotal = totals['subtotal']
            inv.discount_amount = totals['discount_amount']
            inv.tax_amount = totals['tax_amount']
            inv.total = totals['total']
            inv.balance_due = max(0, totals['total'] - float(inv.paid_amount or 0))

        inv.updated_by = user_id
        db.session.commit()
        user = User.query.get(user_id)
        log_audit(user_id, user.email if user else '', 'UPDATE', 'invoice', inv_id, old_value=old, new_value=inv.to_dict(include_items=False))
        return jsonify({"success": True, "message": "Invoice updated", "data": inv.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@invoices_bp.route('/<int:inv_id>', methods=['DELETE'])
@jwt_required()
def delete_invoice(inv_id):
    user_id = get_jwt_identity()
    inv = Invoice.query.get_or_404(inv_id)
    if inv.status == 'paid':
        return jsonify({"success": False, "message": "Cannot delete a paid invoice"}), 409
    old = inv.to_dict(include_items=False)
    db.session.delete(inv)
    db.session.commit()
    user = User.query.get(user_id)
    log_audit(user_id, user.email if user else '', 'DELETE', 'invoice', inv_id, old_value=old)
    return jsonify({"success": True, "message": "Invoice deleted"}), 200


@invoices_bp.route('/<int:inv_id>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_invoice(inv_id):
    user_id = get_jwt_identity()
    original = Invoice.query.get_or_404(inv_id)
    settings = InvoiceSettings.query.first()

    new_number = generate_document_number(settings.invoice_prefix, settings.next_number)
    new_inv = Invoice(
        invoice_number=new_number,
        client_id=original.client_id,
        invoice_date=date.today(),
        due_date=date.today() + timedelta(days=settings.default_due_days or 30),
        status='draft',
        currency=original.currency,
        reference=original.reference,
        subtotal=original.subtotal,
        discount_amount=original.discount_amount,
        tax_amount=original.tax_amount,
        total=original.total,
        paid_amount=0,
        balance_due=original.total,
        notes=original.notes,
        terms=original.terms,
        pdf_template=original.pdf_template,
        created_by=user_id
    )
    db.session.add(new_inv)
    db.session.flush()

    for item in original.items:
        new_item = InvoiceItem(
            invoice_id=new_inv.id,
            item_name=item.item_name, description=item.description,
            quantity=item.quantity, unit_price=item.unit_price,
            discount_percentage=item.discount_percentage, discount_amount=item.discount_amount,
            tax_percentage=item.tax_percentage, tax_amount=item.tax_amount,
            subtotal=item.subtotal, total=item.total,
        )
        db.session.add(new_item)

    if settings.auto_numbering:
        settings.next_number += 1

    db.session.commit()
    return jsonify({"success": True, "message": "Invoice duplicated", "data": new_inv.to_dict()}), 201


@invoices_bp.route('/<int:inv_id>/send', methods=['POST'])
@jwt_required()
def send_invoice(inv_id):
    user_id = get_jwt_identity()
    inv = Invoice.query.get_or_404(inv_id)
    from app.services.email_service import send_document_email
    result = send_document_email('invoice', inv.id)
    if result['success']:
        if inv.status == 'draft':
            inv.status = 'sent'
        inv.sent_at = datetime.utcnow()
        db.session.commit()
        user = User.query.get(user_id)
        log_audit(user_id, user.email if user else '', 'SEND', 'invoice', inv_id)
        return jsonify({"success": True, "message": "Invoice sent successfully"}), 200
    return jsonify({"success": False, "message": result['message']}), 500


@invoices_bp.route('/<int:inv_id>/pdf', methods=['GET'])
@jwt_required()
def download_invoice_pdf(inv_id):
    inv = Invoice.query.get_or_404(inv_id)
    from app.pdf.generator import generate_pdf
    pdf_bytes = generate_pdf('invoice', inv.id)
    if not pdf_bytes:
        return jsonify({"success": False, "message": "PDF generation failed"}), 500
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{inv.invoice_number}.pdf"
    )


@invoices_bp.route('/<int:inv_id>/payments', methods=['POST'])
@jwt_required()
def record_payment(inv_id):
    user_id = get_jwt_identity()
    inv = Invoice.query.get_or_404(inv_id)
    data = request.get_json()

    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({"success": False, "message": "Payment amount must be positive"}), 400
    if amount > float(inv.balance_due):
        return jsonify({"success": False, "message": f"Payment amount exceeds balance due ({inv.balance_due})"}), 400

    try:
        payment = Payment(
            invoice_id=inv.id,
            payment_date=datetime.strptime(data['payment_date'], '%Y-%m-%d').date() if data.get('payment_date') else date.today(),
            payment_method=data.get('payment_method', 'bank_transfer'),
            transaction_id=data.get('transaction_id', ''),
            amount=amount,
            notes=data.get('notes', ''),
            status='paid',
            created_by=user_id
        )
        db.session.add(payment)
        db.session.flush()

        _update_invoice_payment_status(inv)
        db.session.commit()

        user = User.query.get(user_id)
        log_audit(user_id, user.email if user else '', 'PAYMENT', 'invoice', inv_id,
                  new_value={'amount': amount, 'method': payment.payment_method})

        return jsonify({
            "success": True,
            "message": "Payment recorded successfully",
            "data": {"payment": payment.to_dict(), "invoice": inv.to_dict(include_items=False)}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
