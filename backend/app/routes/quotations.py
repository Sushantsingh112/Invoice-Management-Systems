from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from app import db
from app.models.models import (Quotation, QuotationItem, QuotationSettings,
                                Invoice, InvoiceSettings, Client, User)
from app.middleware.auth import log_audit, paginate_query
from app.utils.helpers import calculate_document_totals, generate_document_number
import io

quotations_bp = Blueprint('quotations', __name__)


def _save_items(quotation_id, items_data, ItemModel):
    """Save line items and return calculated totals."""
    totals = calculate_document_totals(items_data)
    for i, item_data in enumerate(items_data):
        from app.utils.helpers import calculate_line_item
        calc = calculate_line_item(
            item_data.get('quantity', 1),
            item_data.get('unit_price', 0),
            item_data.get('discount_percentage', 0),
            item_data.get('tax_percentage', 0)
        )
        item = ItemModel(
            quotation_id=quotation_id,
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


@quotations_bp.route('', methods=['GET'])
@jwt_required()
def get_quotations():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    search = request.args.get('search', '').strip()
    status = request.args.get('status', '').strip()
    client_id = request.args.get('client_id', None, type=int)
    date_from = request.args.get('date_from', None)
    date_to = request.args.get('date_to', None)
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = Quotation.query.join(Client)

    if search:
        like = f'%{search}%'
        query = query.filter(
            db.or_(
                Quotation.quote_number.ilike(like),
                Quotation.reference.ilike(like),
                Client.client_name.ilike(like),
                Client.company_name.ilike(like)
            )
        )
    if status:
        query = query.filter(Quotation.status == status)
    if client_id:
        query = query.filter(Quotation.client_id == client_id)
    if date_from:
        query = query.filter(Quotation.quote_date >= date_from)
    if date_to:
        query = query.filter(Quotation.quote_date <= date_to)

    sort_col = getattr(Quotation, sort_by, Quotation.created_at)
    query = query.order_by(sort_col.desc() if sort_order == 'desc' else sort_col.asc())

    result = paginate_query(query, page, per_page)
    return jsonify({
        "success": True,
        "data": [q.to_dict(include_items=False) for q in result['items']],
        "pagination": {
            "total": result['total'], "page": result['page'],
            "per_page": result['per_page'], "pages": result['pages'],
            "has_next": result['has_next'], "has_prev": result['has_prev'],
        }
    }), 200


@quotations_bp.route('/<int:qid>', methods=['GET'])
@jwt_required()
def get_quotation(qid):
    q = Quotation.query.get_or_404(qid)
    return jsonify({"success": True, "data": q.to_dict()}), 200


@quotations_bp.route('', methods=['POST'])
@jwt_required()
def create_quotation():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('client_id'):
        return jsonify({"success": False, "message": "Client is required"}), 400
    if not data.get('items') or len(data['items']) == 0:
        return jsonify({"success": False, "message": "At least one line item is required"}), 400

    # Get quotation settings for auto-numbering
    settings = QuotationSettings.query.first()
    if not settings:
        return jsonify({"success": False, "message": "Quotation settings not configured"}), 500

    try:
        with db.session.begin_nested():
            quote_number = data.get('quote_number') or generate_document_number(
                settings.quote_prefix, settings.next_number)

            # Check uniqueness
            if Quotation.query.filter_by(quote_number=quote_number).first():
                return jsonify({"success": False, "message": "Quote number already exists", "error": "DUPLICATE_NUMBER"}), 409

            q_date = datetime.strptime(data['quote_date'], '%Y-%m-%d').date() if data.get('quote_date') else date.today()
            valid_until = datetime.strptime(data['valid_until'], '%Y-%m-%d').date() if data.get('valid_until') else (
                date.today() + timedelta(days=settings.validity_days))

            quotation = Quotation(
                quote_number=quote_number,
                client_id=data['client_id'],
                quote_date=q_date,
                valid_until=valid_until,
                status=data.get('status', 'draft'),
                currency=data.get('currency', 'INR'),
                reference=data.get('reference', ''),
                notes=data.get('notes', settings.default_notes or ''),
                terms=data.get('terms', settings.default_terms or ''),
                pdf_template=data.get('pdf_template', settings.pdf_template or 'template1'),
                created_by=user_id
            )
            db.session.add(quotation)
            db.session.flush()  # get quotation.id

            totals = _save_items(quotation.id, data['items'], QuotationItem)
            quotation.subtotal = totals['subtotal']
            quotation.discount_amount = totals['discount_amount']
            quotation.tax_amount = totals['tax_amount']
            quotation.total = totals['total']

            if settings.auto_numbering:
                settings.next_number += 1

        db.session.commit()
        user = User.query.get(user_id)
        log_audit(user_id, user.email if user else '', 'CREATE', 'quotation', quotation.id,
                  new_value={'quote_number': quotation.quote_number, 'total': str(quotation.total)})

        return jsonify({"success": True, "message": "Quotation created successfully",
                        "data": quotation.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        import logging
        logging.error(f"Create quotation error: {str(e)}")
        return jsonify({"success": False, "message": "Failed to create quotation", "error": str(e)}), 500


@quotations_bp.route('/<int:qid>', methods=['PUT'])
@jwt_required()
def update_quotation(qid):
    user_id = get_jwt_identity()
    q = Quotation.query.get_or_404(qid)
    old = q.to_dict(include_items=False)
    data = request.get_json()

    try:
        if data.get('client_id'):
            q.client_id = data['client_id']
        if data.get('quote_date'):
            q.quote_date = datetime.strptime(data['quote_date'], '%Y-%m-%d').date()
        if data.get('valid_until'):
            q.valid_until = datetime.strptime(data['valid_until'], '%Y-%m-%d').date()
        if data.get('status'):
            q.status = data['status']

        for field in ['currency', 'reference', 'notes', 'terms', 'pdf_template']:
            if field in data:
                setattr(q, field, data[field])

        if data.get('items'):
            QuotationItem.query.filter_by(quotation_id=qid).delete()
            totals = _save_items(qid, data['items'], QuotationItem)
            q.subtotal = totals['subtotal']
            q.discount_amount = totals['discount_amount']
            q.tax_amount = totals['tax_amount']
            q.total = totals['total']

        q.updated_by = user_id
        db.session.commit()
        user = User.query.get(user_id)
        log_audit(user_id, user.email if user else '', 'UPDATE', 'quotation', qid, old_value=old, new_value=q.to_dict(include_items=False))
        return jsonify({"success": True, "message": "Quotation updated successfully", "data": q.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@quotations_bp.route('/<int:qid>', methods=['DELETE'])
@jwt_required()
def delete_quotation(qid):
    user_id = get_jwt_identity()
    q = Quotation.query.get_or_404(qid)
    if q.status == 'converted':
        return jsonify({"success": False, "message": "Cannot delete a converted quotation"}), 409
    old = q.to_dict(include_items=False)
    db.session.delete(q)
    db.session.commit()
    user = User.query.get(user_id)
    log_audit(user_id, user.email if user else '', 'DELETE', 'quotation', qid, old_value=old)
    return jsonify({"success": True, "message": "Quotation deleted successfully"}), 200


@quotations_bp.route('/<int:qid>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_quotation(qid):
    user_id = get_jwt_identity()
    original = Quotation.query.get_or_404(qid)
    settings = QuotationSettings.query.first()

    new_number = generate_document_number(settings.quote_prefix, settings.next_number)
    new_q = Quotation(
        quote_number=new_number,
        client_id=original.client_id,
        quote_date=date.today(),
        valid_until=date.today() + timedelta(days=settings.validity_days or 30),
        status='draft',
        currency=original.currency,
        reference=original.reference,
        notes=original.notes,
        terms=original.terms,
        pdf_template=original.pdf_template,
        created_by=user_id
    )
    db.session.add(new_q)
    db.session.flush()

    for item in original.items:
        new_item = QuotationItem(
            quotation_id=new_q.id,
            item_name=item.item_name,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_percentage=item.discount_percentage,
            discount_amount=item.discount_amount,
            tax_percentage=item.tax_percentage,
            tax_amount=item.tax_amount,
            subtotal=item.subtotal,
            total=item.total,
        )
        db.session.add(new_item)

    new_q.subtotal = original.subtotal
    new_q.discount_amount = original.discount_amount
    new_q.tax_amount = original.tax_amount
    new_q.total = original.total

    if settings.auto_numbering:
        settings.next_number += 1

    db.session.commit()
    return jsonify({"success": True, "message": "Quotation duplicated", "data": new_q.to_dict()}), 201


@quotations_bp.route('/<int:qid>/convert-to-invoice', methods=['POST'])
@jwt_required()
def convert_to_invoice(qid):
    user_id = get_jwt_identity()
    q = Quotation.query.get_or_404(qid)

    if q.status == 'converted':
        return jsonify({"success": False, "message": "Already converted to invoice"}), 409

    inv_settings = InvoiceSettings.query.first()
    if not inv_settings:
        return jsonify({"success": False, "message": "Invoice settings not configured"}), 500

    try:
        inv_number = generate_document_number(inv_settings.invoice_prefix, inv_settings.next_number)

        invoice = Invoice(
            invoice_number=inv_number,
            client_id=q.client_id,
            quotation_id=q.id,
            invoice_date=date.today(),
            due_date=date.today() + timedelta(days=inv_settings.default_due_days or 30),
            status='draft',
            currency=q.currency,
            reference=q.reference,
            subtotal=q.subtotal,
            discount_amount=q.discount_amount,
            tax_amount=q.tax_amount,
            total=q.total,
            paid_amount=0,
            balance_due=q.total,
            notes=q.notes,
            terms=q.terms,
            pdf_template=q.pdf_template,
            created_by=user_id
        )
        db.session.add(invoice)
        db.session.flush()

        for item in q.items:
            inv_item = InvoiceItem(
                invoice_id=invoice.id,
                item_name=item.item_name,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_percentage=item.discount_percentage,
                discount_amount=item.discount_amount,
                tax_percentage=item.tax_percentage,
                tax_amount=item.tax_amount,
                subtotal=item.subtotal,
                total=item.total,
            )
            db.session.add(inv_item)

        q.status = 'converted'
        q.converted_invoice_id = invoice.id
        if inv_settings.auto_numbering:
            inv_settings.next_number += 1

        db.session.commit()
        user = User.query.get(user_id)
        log_audit(user_id, user.email if user else '', 'CONVERT', 'quotation', qid,
                  new_value={'converted_to': inv_number, 'invoice_id': invoice.id})

        return jsonify({"success": True, "message": f"Converted to invoice {inv_number}",
                        "data": invoice.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@quotations_bp.route('/<int:qid>/send', methods=['POST'])
@jwt_required()
def send_quotation(qid):
    user_id = get_jwt_identity()
    q = Quotation.query.get_or_404(qid)

    from app.services.email_service import send_document_email
    result = send_document_email('quotation', q.id)

    if result['success']:
        q.status = 'sent'
        q.sent_at = datetime.utcnow()
        db.session.commit()
        user = User.query.get(user_id)
        log_audit(user_id, user.email if user else '', 'SEND', 'quotation', qid)
        return jsonify({"success": True, "message": "Quotation sent successfully"}), 200
    else:
        return jsonify({"success": False, "message": result['message']}), 500


@quotations_bp.route('/<int:qid>/pdf', methods=['GET'])
@jwt_required()
def download_quotation_pdf(qid):
    q = Quotation.query.get_or_404(qid)
    from app.pdf.generator import generate_pdf
    pdf_bytes = generate_pdf('quotation', q.id)
    if not pdf_bytes:
        return jsonify({"success": False, "message": "PDF generation failed"}), 500

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{q.quote_number}.pdf"
    )


@quotations_bp.route('/<int:qid>/status', methods=['PATCH'])
@jwt_required()
def update_status(qid):
    q = Quotation.query.get_or_404(qid)
    data = request.get_json()
    new_status = data.get('status')
    valid = ['draft', 'sent', 'accepted', 'rejected', 'expired']
    if new_status not in valid:
        return jsonify({"success": False, "message": f"Invalid status. Must be one of: {valid}"}), 400
    q.status = new_status
    db.session.commit()
    return jsonify({"success": True, "message": "Status updated", "data": q.to_dict(include_items=False)}), 200
