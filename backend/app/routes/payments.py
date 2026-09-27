from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from app import db
from app.models.models import Payment, Invoice, User
from app.middleware.auth import log_audit, paginate_query

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('', methods=['GET'])
@jwt_required()
def get_payments():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    invoice_id = request.args.get('invoice_id', None, type=int)
    method = request.args.get('payment_method', '').strip()
    date_from = request.args.get('date_from', None)
    date_to = request.args.get('date_to', None)

    query = Payment.query
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    if method:
        query = query.filter(Payment.payment_method == method)
    if date_from:
        query = query.filter(Payment.payment_date >= date_from)
    if date_to:
        query = query.filter(Payment.payment_date <= date_to)

    query = query.order_by(Payment.payment_date.desc())
    result = paginate_query(query, page, per_page)

    return jsonify({
        "success": True,
        "data": [p.to_dict() for p in result['items']],
        "pagination": {
            "total": result['total'], "page": result['page'],
            "per_page": result['per_page'], "pages": result['pages'],
            "has_next": result['has_next'], "has_prev": result['has_prev'],
        }
    }), 200


@payments_bp.route('/<int:pay_id>', methods=['GET'])
@jwt_required()
def get_payment(pay_id):
    payment = Payment.query.get_or_404(pay_id)
    return jsonify({"success": True, "data": payment.to_dict()}), 200


@payments_bp.route('/<int:pay_id>', methods=['PUT'])
@jwt_required()
def update_payment(pay_id):
    user_id = get_jwt_identity()
    payment = Payment.query.get_or_404(pay_id)
    data = request.get_json()

    if data.get('payment_date'):
        payment.payment_date = datetime.strptime(data['payment_date'], '%Y-%m-%d').date()
    if data.get('payment_method'):
        payment.payment_method = data['payment_method']
    if data.get('transaction_id') is not None:
        payment.transaction_id = data['transaction_id']
    if data.get('notes') is not None:
        payment.notes = data['notes']

    db.session.commit()
    return jsonify({"success": True, "message": "Payment updated", "data": payment.to_dict()}), 200


@payments_bp.route('/<int:pay_id>', methods=['DELETE'])
@jwt_required()
def delete_payment(pay_id):
    user_id = get_jwt_identity()
    payment = Payment.query.get_or_404(pay_id)
    invoice = Invoice.query.get(payment.invoice_id)

    db.session.delete(payment)
    db.session.flush()

    # Recalculate invoice
    if invoice:
        total_paid = db.session.query(
            db.func.coalesce(db.func.sum(Payment.amount), 0)
        ).filter(Payment.invoice_id == invoice.id, Payment.status != 'failed').scalar()

        invoice.paid_amount = float(total_paid)
        invoice.balance_due = max(0, float(invoice.total) - float(total_paid))

        if float(total_paid) <= 0:
            invoice.status = 'sent'
        elif float(total_paid) >= float(invoice.total):
            invoice.status = 'paid'
        else:
            invoice.status = 'partially_paid'

    db.session.commit()
    user = User.query.get(user_id)
    log_audit(user_id, user.email if user else '', 'DELETE_PAYMENT', 'payment', pay_id)
    return jsonify({"success": True, "message": "Payment deleted"}), 200
