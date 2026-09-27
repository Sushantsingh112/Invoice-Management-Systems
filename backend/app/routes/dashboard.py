from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from datetime import date, timedelta
from sqlalchemy import func
from app import db
from app.models.models import Invoice, Quotation, Client, Payment

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    today = date.today()

    total_clients = Client.query.filter_by(is_active=True).count()
    total_quotations = Quotation.query.count()
    total_invoices = Invoice.query.count()
    paid_invoices = Invoice.query.filter_by(status='paid').count()
    pending_invoices = Invoice.query.filter(Invoice.status.in_(['draft', 'sent'])).count()
    overdue_invoices = Invoice.query.filter(
        Invoice.status.in_(['sent', 'partially_paid']),
        Invoice.due_date < today
    ).count()
    partial_invoices = Invoice.query.filter_by(status='partially_paid').count()

    total_revenue = db.session.query(func.coalesce(func.sum(Invoice.total), 0)
        ).filter(Invoice.status == 'paid').scalar()

    total_paid = db.session.query(func.coalesce(func.sum(Invoice.paid_amount), 0)).scalar()

    pending_amount = db.session.query(func.coalesce(func.sum(Invoice.balance_due), 0)
        ).filter(Invoice.status.in_(['sent', 'partially_paid', 'overdue'])).scalar()

    tax_collected = db.session.query(func.coalesce(func.sum(Invoice.tax_amount), 0)
        ).filter(Invoice.status == 'paid').scalar()

    return jsonify({
        "success": True,
        "data": {
            "total_clients": total_clients,
            "total_quotations": total_quotations,
            "total_invoices": total_invoices,
            "paid_invoices": paid_invoices,
            "pending_invoices": pending_invoices,
            "overdue_invoices": overdue_invoices,
            "partial_invoices": partial_invoices,
            "total_revenue": float(total_revenue),
            "total_paid": float(total_paid),
            "pending_amount": float(pending_amount),
            "tax_collected": float(tax_collected),
        }
    }), 200


@dashboard_bp.route('/revenue', methods=['GET'])
@jwt_required()
def get_revenue_chart():
    """Monthly revenue for the last 12 months."""
    today = date.today()
    months_data = []

    for i in range(11, -1, -1):
        month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1, day=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1, day=1)

        revenue = db.session.query(func.coalesce(func.sum(Invoice.total), 0)).filter(
            Invoice.invoice_date >= month_start,
            Invoice.invoice_date < month_end,
            Invoice.status.in_(['paid', 'partially_paid', 'sent'])
        ).scalar()

        paid = db.session.query(func.coalesce(func.sum(Invoice.paid_amount), 0)).filter(
            Invoice.invoice_date >= month_start,
            Invoice.invoice_date < month_end,
        ).scalar()

        months_data.append({
            "month": month_start.strftime('%b %Y'),
            "month_short": month_start.strftime('%b'),
            "revenue": float(revenue),
            "paid": float(paid),
        })

    return jsonify({"success": True, "data": months_data}), 200


@dashboard_bp.route('/invoice-status', methods=['GET'])
@jwt_required()
def get_invoice_status():
    statuses = ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled']
    result = []
    for s in statuses:
        count = Invoice.query.filter_by(status=s).count()
        total = db.session.query(func.coalesce(func.sum(Invoice.total), 0)).filter_by(status=s).scalar()
        result.append({"status": s, "count": count, "total": float(total)})

    return jsonify({"success": True, "data": result}), 200


@dashboard_bp.route('/quotation-status', methods=['GET'])
@jwt_required()
def get_quotation_status():
    statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']
    result = []
    for s in statuses:
        count = Quotation.query.filter_by(status=s).count()
        total = db.session.query(func.coalesce(func.sum(Quotation.total), 0)).filter_by(status=s).scalar()
        result.append({"status": s, "count": count, "total": float(total)})

    return jsonify({"success": True, "data": result}), 200


@dashboard_bp.route('/payment-summary', methods=['GET'])
@jwt_required()
def get_payment_summary():
    methods = ['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other']
    result = []
    for m in methods:
        total = db.session.query(func.coalesce(func.sum(Payment.amount), 0)
            ).filter_by(payment_method=m).scalar()
        count = Payment.query.filter_by(payment_method=m).count()
        result.append({"method": m, "total": float(total), "count": count})

    return jsonify({"success": True, "data": result}), 200


@dashboard_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    recent_invoices = Invoice.query.order_by(Invoice.created_at.desc()).limit(5).all()
    recent_payments = Payment.query.order_by(Payment.created_at.desc()).limit(5).all()
    recent_quotations = Quotation.query.order_by(Quotation.created_at.desc()).limit(5).all()

    return jsonify({
        "success": True,
        "data": {
            "recent_invoices": [i.to_dict(include_items=False) for i in recent_invoices],
            "recent_payments": [p.to_dict() for p in recent_payments],
            "recent_quotations": [q.to_dict(include_items=False) for q in recent_quotations],
        }
    }), 200
