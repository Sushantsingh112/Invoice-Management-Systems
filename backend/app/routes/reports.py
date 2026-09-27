from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import date, timedelta
from sqlalchemy import func, extract
from app import db
from app.models.models import Invoice, Quotation, Payment, Client
import csv
import io

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/sales', methods=['GET'])
@jwt_required()
def sales_report():
    date_from = request.args.get('date_from', str(date.today().replace(month=1, day=1)))
    date_to = request.args.get('date_to', str(date.today()))

    invoices = Invoice.query.filter(
        Invoice.invoice_date >= date_from,
        Invoice.invoice_date <= date_to
    ).order_by(Invoice.invoice_date.desc()).all()

    total = sum(float(i.total) for i in invoices)
    paid = sum(float(i.paid_amount) for i in invoices)
    pending = sum(float(i.balance_due) for i in invoices)
    tax = sum(float(i.tax_amount) for i in invoices)

    return jsonify({
        "success": True,
        "data": {
            "invoices": [i.to_dict(include_items=False) for i in invoices],
            "summary": {"total": total, "paid": paid, "pending": pending, "tax_collected": tax,
                        "count": len(invoices)}
        }
    }), 200


@reports_bp.route('/payments', methods=['GET'])
@jwt_required()
def payment_report():
    date_from = request.args.get('date_from', str(date.today().replace(month=1, day=1)))
    date_to = request.args.get('date_to', str(date.today()))

    payments = Payment.query.filter(
        Payment.payment_date >= date_from,
        Payment.payment_date <= date_to
    ).order_by(Payment.payment_date.desc()).all()

    total = sum(float(p.amount) for p in payments)
    by_method = {}
    for p in payments:
        by_method[p.payment_method] = by_method.get(p.payment_method, 0) + float(p.amount)

    return jsonify({
        "success": True,
        "data": {
            "payments": [p.to_dict() for p in payments],
            "summary": {"total": total, "count": len(payments), "by_method": by_method}
        }
    }), 200


@reports_bp.route('/outstanding', methods=['GET'])
@jwt_required()
def outstanding_report():
    today = date.today()
    invoices = Invoice.query.filter(
        Invoice.status.in_(['sent', 'partially_paid', 'overdue'])
    ).order_by(Invoice.due_date.asc()).all()

    overdue = [i for i in invoices if i.due_date < today]
    upcoming = [i for i in invoices if i.due_date >= today]

    return jsonify({
        "success": True,
        "data": {
            "overdue": [i.to_dict(include_items=False) for i in overdue],
            "upcoming": [i.to_dict(include_items=False) for i in upcoming],
            "summary": {
                "overdue_count": len(overdue),
                "overdue_amount": sum(float(i.balance_due) for i in overdue),
                "upcoming_count": len(upcoming),
                "upcoming_amount": sum(float(i.balance_due) for i in upcoming),
            }
        }
    }), 200


@reports_bp.route('/quotations', methods=['GET'])
@jwt_required()
def quotation_report():
    date_from = request.args.get('date_from', str(date.today().replace(month=1, day=1)))
    date_to = request.args.get('date_to', str(date.today()))

    quotations = Quotation.query.filter(
        Quotation.quote_date >= date_from,
        Quotation.quote_date <= date_to
    ).order_by(Quotation.quote_date.desc()).all()

    by_status = {}
    for q in quotations:
        by_status[q.status] = by_status.get(q.status, 0) + 1

    return jsonify({
        "success": True,
        "data": {
            "quotations": [q.to_dict(include_items=False) for q in quotations],
            "summary": {"count": len(quotations), "by_status": by_status,
                        "total_value": sum(float(q.total) for q in quotations)}
        }
    }), 200


@reports_bp.route('/tax', methods=['GET'])
@jwt_required()
def tax_report():
    date_from = request.args.get('date_from', str(date.today().replace(month=1, day=1)))
    date_to = request.args.get('date_to', str(date.today()))

    invoices = Invoice.query.filter(
        Invoice.invoice_date >= date_from,
        Invoice.invoice_date <= date_to,
        Invoice.status.in_(['paid', 'partially_paid', 'sent'])
    ).all()

    total_tax = sum(float(i.tax_amount) for i in invoices)
    paid_tax = sum(float(i.tax_amount) for i in invoices if i.status == 'paid')

    return jsonify({
        "success": True,
        "data": {
            "summary": {
                "total_invoices": len(invoices),
                "total_tax_billed": total_tax,
                "tax_collected": paid_tax,
                "tax_pending": total_tax - paid_tax,
            },
            "invoices": [{"invoice_number": i.invoice_number, "client": i.client.client_name if i.client else '',
                          "date": i.invoice_date.isoformat(), "subtotal": float(i.subtotal),
                          "tax": float(i.tax_amount), "total": float(i.total), "status": i.status}
                         for i in invoices]
        }
    }), 200


@reports_bp.route('/export/invoices', methods=['GET'])
@jwt_required()
def export_invoices_csv():
    from flask import Response
    date_from = request.args.get('date_from', str(date.today().replace(month=1, day=1)))
    date_to = request.args.get('date_to', str(date.today()))

    invoices = Invoice.query.filter(
        Invoice.invoice_date >= date_from,
        Invoice.invoice_date <= date_to
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Invoice Number', 'Client', 'Date', 'Due Date', 'Status',
                     'Subtotal', 'Discount', 'Tax', 'Total', 'Paid', 'Balance Due'])
    for i in invoices:
        writer.writerow([
            i.invoice_number,
            i.client.client_name if i.client else '',
            i.invoice_date.isoformat(),
            i.due_date.isoformat(),
            i.status,
            float(i.subtotal), float(i.discount_amount), float(i.tax_amount),
            float(i.total), float(i.paid_amount), float(i.balance_due)
        ])

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={"Content-Disposition": f"attachment;filename=invoices_{date_from}_{date_to}.csv"}
    )
