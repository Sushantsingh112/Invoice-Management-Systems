from app.models.models import (Invoice, Quotation, BusinessSettings,
                                PaymentSettings, TranslationSettings, EmailSettings)
from jinja2 import Environment, FileSystemLoader
import os
import base64


def _get_logo_b64(logo_path, upload_folder):
    """Read logo and convert to base64 for embedding in PDF."""
    if not logo_path:
        return None
    full_path = os.path.join(upload_folder, logo_path)
    if not os.path.exists(full_path):
        return None
    try:
        with open(full_path, 'rb') as f:
            ext = logo_path.rsplit('.', 1)[-1].lower()
            mime = {'jpg': 'jpeg', 'jpeg': 'jpeg', 'png': 'png', 'gif': 'gif', 'webp': 'webp'}.get(ext, 'png')
            b64 = base64.b64encode(f.read()).decode('utf-8')
            return f"data:image/{mime};base64,{b64}"
    except Exception:
        return None


def _format_currency(amount, ps):
    """Format amount using payment settings."""
    try:
        decimals = ps.decimal_places if ps else 2
        formatted = f"{float(amount):,.{decimals}f}"
        ts = ps.thousand_separator if ps else ','
        ds = ps.decimal_separator if ps else '.'
        if ts != ',':
            formatted = formatted.replace(',', ts)
        if ds != '.':
            formatted = formatted.replace('.', ds)
        symbol = ps.currency_symbol if ps else '₹'
        pos = ps.currency_position if ps else 'before'
        return f"{symbol}{formatted}" if pos == 'before' else f"{formatted}{symbol}"
    except Exception:
        return str(amount)


def generate_pdf(doc_type, doc_id):
    """
    Generate PDF for invoice or quotation.
    Returns bytes or None on failure.
    """
    try:
        from flask import current_app
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'app/static/uploads')

        business = BusinessSettings.query.first()
        payment_settings = PaymentSettings.query.first()
        translation = TranslationSettings.query.first()
        labels = translation.labels if translation else {}

        if doc_type == 'invoice':
            doc = Invoice.query.get(doc_id)
            if not doc:
                return None
            template_name = doc.pdf_template or 'template1'
            payments = doc.payments.all()
        elif doc_type == 'quotation':
            doc = Quotation.query.get(doc_id)
            if not doc:
                return None
            template_name = doc.pdf_template or 'template1'
            payments = []
        else:
            return None

        logo_b64 = _get_logo_b64(business.logo_path if business else None, upload_folder)

        def fmt(amount):
            return _format_currency(amount, payment_settings)

        context = {
            'doc': doc,
            'doc_type': doc_type,
            'business': business,
            'payment_settings': payment_settings,
            'labels': labels,
            'logo_b64': logo_b64,
            'payments': payments,
            'fmt': fmt,
            'items': doc.items,
            'is_invoice': doc_type == 'invoice',
            'is_quotation': doc_type == 'quotation',
        }

        html_content = _render_template(template_name, doc_type, context)
        return _html_to_pdf(html_content)

    except Exception as e:
        import logging
        logging.error(f"PDF generation error for {doc_type} {doc_id}: {str(e)}")
        return None


def _render_template(template_name, doc_type, context):
    """Render HTML template for PDF."""
    if template_name == 'template2':
        return _render_template2(context)
    return _render_template1(context)


def _html_to_pdf(html_content):
    """Convert HTML to PDF bytes using WeasyPrint, fallback to ReportLab."""
    try:
        from weasyprint import HTML, CSS
        pdf_bytes = HTML(string=html_content).write_pdf()
        return pdf_bytes
    except ImportError:
        pass
    except Exception as e:
        import logging
        logging.warning(f"WeasyPrint failed: {e}, trying ReportLab")

    try:
        return _reportlab_fallback(html_content)
    except Exception as e:
        import logging
        logging.error(f"ReportLab fallback also failed: {e}")
        return None


def _reportlab_fallback(html_content):
    """Minimal PDF via ReportLab when WeasyPrint unavailable."""
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import cm
    import io, re

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=1.5*cm, rightMargin=1.5*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    # Strip HTML tags for plain text fallback
    clean = re.sub(r'<[^>]+>', '\n', html_content)
    clean = re.sub(r'\n+', '\n', clean).strip()

    for line in clean.split('\n')[:100]:
        line = line.strip()
        if line:
            story.append(Paragraph(line, styles['Normal']))
            story.append(Spacer(1, 0.1*cm))

    doc.build(story)
    return buffer.getvalue()


def _render_template1(ctx):
    """Modern Blue Corporate template."""
    doc = ctx['doc']
    business = ctx['business']
    fmt = ctx['fmt']
    items = ctx['items']
    payments = ctx['payments']
    logo_b64 = ctx['logo_b64']
    is_invoice = ctx['is_invoice']

    doc_title = 'INVOICE' if is_invoice else 'QUOTATION'
    doc_number = doc.invoice_number if is_invoice else doc.quote_number
    doc_date_label = 'Invoice Date' if is_invoice else 'Quotation Date'
    doc_date = doc.invoice_date if is_invoice else doc.quote_date
    second_date_label = 'Due Date' if is_invoice else 'Valid Until'
    second_date = doc.due_date if is_invoice else doc.valid_until
    status = doc.status.upper().replace('_', ' ')

    status_colors = {
        'PAID': '#16a34a', 'DRAFT': '#6b7280', 'SENT': '#2563eb',
        'PARTIALLY PAID': '#d97706', 'OVERDUE': '#dc2626', 'CANCELLED': '#6b7280',
        'ACCEPTED': '#16a34a', 'REJECTED': '#dc2626', 'CONVERTED': '#7c3aed', 'EXPIRED': '#6b7280'
    }
    status_color = status_colors.get(status, '#6b7280')

    client = doc.client
    biz_address = (business.address or '').replace('\n', '<br/>')
    biz_extra = (business.extra_info or '').replace('\n', '<br/>')
    client_address = (client.address if client else '').replace('\n', '<br/>') if client else ''

    items_html = ''
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">{item.item_name}<br/>
                <small style="color:#6b7280;">{item.description or ''}</small></td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">{float(item.quantity):.2f}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">{fmt(item.unit_price)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">{float(item.discount_percentage):.1f}%</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">{float(item.tax_percentage):.1f}%</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">{fmt(item.total)}</td>
        </tr>"""

    payments_html = ''
    if is_invoice and payments:
        for p in payments:
            payments_html += f"""
            <tr>
                <td style="padding:6px 12px;color:#374151;">{p.payment_date}</td>
                <td style="padding:6px 12px;color:#374151;text-transform:capitalize;">{p.payment_method.replace('_',' ')}</td>
                <td style="padding:6px 12px;color:#374151;">{p.transaction_id or '-'}</td>
                <td style="padding:6px 12px;text-align:right;color:#16a34a;font-weight:600;">{fmt(p.amount)}</td>
            </tr>"""

    logo_html = f'<img src="{logo_b64}" style="max-height:70px;max-width:200px;object-fit:contain;" alt="Logo"/>' if logo_b64 else f'<div style="font-size:22px;font-weight:700;color:#1e40af;">{business.business_name if business else "Company"}</div>'

    paid_section = ''
    if is_invoice:
        paid_section = f"""
        <tr><td style="padding:6px 0;color:#374151;">Paid Amount</td>
            <td style="padding:6px 0;text-align:right;color:#16a34a;font-weight:600;">{fmt(doc.paid_amount)}</td></tr>
        <tr><td style="padding:6px 0;font-size:16px;font-weight:700;color:#1e3a5f;border-top:2px solid #1e40af;padding-top:8px;">Balance Due</td>
            <td style="padding:6px 0;font-size:16px;font-weight:700;color:#dc2626;text-align:right;border-top:2px solid #1e40af;padding-top:8px;">{fmt(doc.balance_due)}</td></tr>
        """

    inv_settings_section = ''
    if is_invoice:
        from app.models.models import InvoiceSettings
        inv_s = InvoiceSettings.query.first()
        if inv_s and inv_s.payment_instructions:
            inv_settings_section = f"""
            <div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:8px;border-left:4px solid #1e40af;">
                <div style="font-weight:600;color:#1e3a5f;margin-bottom:8px;">Payment Instructions</div>
                <div style="color:#374151;font-size:13px;white-space:pre-line;">{inv_s.payment_instructions}</div>
            </div>"""

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family: 'Segoe UI', Arial, sans-serif; color:#1f2937; background:#fff; font-size:13px; }}
  @page {{ size:A4; margin:0; }}
</style>
</head>
<body>
<div style="width:794px;min-height:1123px;margin:0 auto;background:#fff;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e3a5f 0%,#1e40af 100%);padding:32px 40px;display:flex;justify-content:space-between;align-items:center;">
    <div>{logo_html}</div>
    <div style="text-align:right;">
      <div style="font-size:32px;font-weight:700;color:#fff;letter-spacing:2px;">{doc_title}</div>
      <div style="color:#93c5fd;font-size:14px;margin-top:4px;">#{doc_number}</div>
      <div style="margin-top:8px;display:inline-block;background:{status_color};color:#fff;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;">{status}</div>
    </div>
  </div>

  <!-- Info Bar -->
  <div style="background:#1e40af;padding:12px 40px;display:flex;gap:40px;">
    <div style="color:#bfdbfe;font-size:12px;">{doc_date_label}: <strong style="color:#fff;">{doc_date}</strong></div>
    <div style="color:#bfdbfe;font-size:12px;">{second_date_label}: <strong style="color:#fff;">{second_date}</strong></div>
    {f'<div style="color:#bfdbfe;font-size:12px;">Currency: <strong style="color:#fff;">{doc.currency}</strong></div>' if doc.currency else ''}
  </div>

  <!-- From / To -->
  <div style="display:flex;gap:0;padding:32px 40px 24px;border-bottom:1px solid #e5e7eb;">
    <div style="flex:1;padding-right:24px;">
      <div style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">From</div>
      <div style="font-weight:700;font-size:15px;color:#1e3a5f;">{business.business_name if business else ''}</div>
      <div style="color:#4b5563;margin-top:6px;line-height:1.6;">{biz_address}<br/>{biz_extra}</div>
      {'<div style="color:#4b5563;margin-top:4px;">📧 ' + business.email + '</div>' if business and business.email else ''}
      {'<div style="color:#4b5563;">📞 ' + business.phone + '</div>' if business and business.phone else ''}
      {'<div style="color:#4b5563;">GST: ' + business.gst_number + '</div>' if business and business.gst_number else ''}
    </div>
    <div style="width:1px;background:#e5e7eb;"></div>
    <div style="flex:1;padding-left:24px;">
      <div style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Bill To</div>
      <div style="font-weight:700;font-size:15px;color:#1e3a5f;">{client.client_name if client else ''}</div>
      {f'<div style="color:#4b5563;margin-top:2px;">{client.company_name}</div>' if client and client.company_name else ''}
      <div style="color:#4b5563;margin-top:6px;line-height:1.6;">{client_address}</div>
      {f'<div style="color:#4b5563;margin-top:4px;">📧 {client.email}</div>' if client and client.email else ''}
      {f'<div style="color:#4b5563;">📞 {client.phone}</div>' if client and client.phone else ''}
      {f'<div style="color:#4b5563;">GST: {client.gst_number}</div>' if client and client.gst_number else ''}
    </div>
  </div>

  <!-- Line Items Table -->
  <div style="padding:24px 40px;">
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#1e3a5f;color:#fff;">
          <th style="padding:12px;text-align:left;border-radius:4px 0 0 4px;">Item / Description</th>
          <th style="padding:12px;text-align:center;">Qty</th>
          <th style="padding:12px;text-align:right;">Rate</th>
          <th style="padding:12px;text-align:center;">Disc%</th>
          <th style="padding:12px;text-align:center;">Tax%</th>
          <th style="padding:12px;text-align:right;border-radius:0 4px 4px 0;">Amount</th>
        </tr>
      </thead>
      <tbody>{items_html}</tbody>
    </table>
  </div>

  <!-- Totals -->
  <div style="padding:0 40px 24px;display:flex;justify-content:flex-end;">
    <table style="width:280px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#374151;">Subtotal</td>
          <td style="padding:6px 0;text-align:right;">{fmt(doc.subtotal)}</td></tr>
      <tr><td style="padding:6px 0;color:#374151;">Discount</td>
          <td style="padding:6px 0;text-align:right;color:#dc2626;">- {fmt(doc.discount_amount)}</td></tr>
      <tr><td style="padding:6px 0;color:#374151;">Tax</td>
          <td style="padding:6px 0;text-align:right;color:#059669;">+ {fmt(doc.tax_amount)}</td></tr>
      <tr><td style="padding:10px 0 6px;font-size:16px;font-weight:700;color:#1e3a5f;border-top:2px solid #1e40af;">Grand Total</td>
          <td style="padding:10px 0 6px;font-size:16px;font-weight:700;text-align:right;border-top:2px solid #1e40af;">{fmt(doc.total)}</td></tr>
      {paid_section}
    </table>
  </div>

  <!-- Payments Made -->
  {f'''<div style="padding:0 40px 24px;">
    <div style="font-weight:600;color:#1e3a5f;margin-bottom:8px;">Payment History</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#f3f4f6;">
        <th style="padding:8px 12px;text-align:left;font-size:12px;">Date</th>
        <th style="padding:8px 12px;text-align:left;font-size:12px;">Method</th>
        <th style="padding:8px 12px;text-align:left;font-size:12px;">Reference</th>
        <th style="padding:8px 12px;text-align:right;font-size:12px;">Amount</th>
      </tr></thead>
      <tbody>{payments_html}</tbody>
    </table>
  </div>''' if payments_html else ''}

  {inv_settings_section}

  <!-- Notes & Terms -->
  {f'<div style="padding:0 40px 16px;"><strong style="color:#1e3a5f;">Notes:</strong> <span style="color:#4b5563;">{doc.notes}</span></div>' if doc.notes else ''}
  {f'<div style="padding:0 40px 24px;"><strong style="color:#1e3a5f;">Terms & Conditions:</strong><div style="color:#4b5563;white-space:pre-line;margin-top:4px;font-size:12px;">{doc.terms}</div></div>' if doc.terms else ''}

  <!-- Footer -->
  <div style="background:#1e3a5f;padding:16px 40px;margin-top:auto;display:flex;justify-content:space-between;align-items:center;">
    <div style="color:#93c5fd;font-size:12px;">{business.business_name if business else ''} | {business.website if business else ''}</div>
    <div style="color:#93c5fd;font-size:12px;">Thank you for your business!</div>
  </div>
</div>
</body>
</html>"""


def _render_template2(ctx):
    """Professional Blue/White template - alternate layout."""
    doc = ctx['doc']
    business = ctx['business']
    fmt = ctx['fmt']
    items = ctx['items']
    payments = ctx['payments']
    logo_b64 = ctx['logo_b64']
    is_invoice = ctx['is_invoice']

    doc_title = 'INVOICE' if is_invoice else 'QUOTATION'
    doc_number = doc.invoice_number if is_invoice else doc.quote_number
    doc_date = doc.invoice_date if is_invoice else doc.quote_date
    second_date = doc.due_date if is_invoice else doc.valid_until
    second_label = 'Due Date' if is_invoice else 'Valid Until'
    client = doc.client
    status = doc.status.upper().replace('_', ' ')

    logo_html = f'<img src="{logo_b64}" style="max-height:60px;max-width:180px;" alt="Logo"/>' if logo_b64 else f'<span style="font-size:20px;font-weight:700;color:#1e40af;">{business.business_name if business else ""}</span>'

    rows = ''
    for item in items:
        rows += f"""<tr style="border-bottom:1px solid #dbeafe;">
            <td style="padding:10px 8px;">{item.item_name}<br/><small style="color:#6b7280;">{item.description or ''}</small></td>
            <td style="padding:10px 8px;text-align:center;">{float(item.quantity):.2f}</td>
            <td style="padding:10px 8px;text-align:right;">{fmt(item.unit_price)}</td>
            <td style="padding:10px 8px;text-align:center;">{float(item.discount_percentage):.0f}%</td>
            <td style="padding:10px 8px;text-align:center;">{float(item.tax_percentage):.0f}%</td>
            <td style="padding:10px 8px;text-align:right;font-weight:700;color:#1e40af;">{fmt(item.total)}</td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/>
<style>* {{margin:0;padding:0;box-sizing:border-box;}} body {{font-family:Arial,sans-serif;font-size:12px;color:#1f2937;}}</style>
</head>
<body style="background:#f8fafc;">
<div style="width:794px;min-height:1123px;background:#fff;margin:0 auto;padding:40px;">

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:3px solid #1e40af;">
    <div>{logo_html}
      {f'<div style="margin-top:8px;font-size:11px;color:#4b5563;">{(business.address or "").replace(chr(10), ", ")}</div>' if business else ''}
      {f'<div style="font-size:11px;color:#4b5563;">{business.email} | {business.phone}</div>' if business else ''}
    </div>
    <div style="text-align:right;">
      <div style="font-size:28px;font-weight:700;color:#1e40af;">{doc_title}</div>
      <div style="font-size:18px;font-weight:600;color:#1e3a5f;margin-top:4px;">#{doc_number}</div>
      <table style="margin-top:12px;margin-left:auto;font-size:12px;">
        <tr><td style="color:#6b7280;padding:2px 8px 2px 0;">Date:</td><td style="font-weight:600;">{doc_date}</td></tr>
        <tr><td style="color:#6b7280;padding:2px 8px 2px 0;">{second_label}:</td><td style="font-weight:600;color:#dc2626;">{second_date}</td></tr>
        {'<tr><td style="color:#6b7280;padding:2px 8px 2px 0;">Status:</td><td style="font-weight:600;color:#1e40af;">' + status + '</td></tr>' if status else ''}
      </table>
    </div>
  </div>

  <div style="display:flex;gap:40px;margin-bottom:32px;">
    <div style="flex:1;background:#eff6ff;padding:16px;border-radius:8px;">
      <div style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;margin-bottom:8px;">Billed By</div>
      <div style="font-weight:700;">{business.business_name if business else ''}</div>
      {f'<div style="color:#4b5563;font-size:11px;">GST: {business.gst_number}</div>' if business and business.gst_number else ''}
    </div>
    <div style="flex:1;background:#f0fdf4;padding:16px;border-radius:8px;">
      <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:8px;">Billed To</div>
      <div style="font-weight:700;">{client.client_name if client else ''}</div>
      {f'<div style="color:#4b5563;">{client.company_name}</div>' if client and client.company_name else ''}
      {f'<div style="color:#4b5563;font-size:11px;">{client.email}</div>' if client and client.email else ''}
      {f'<div style="color:#4b5563;font-size:11px;">GST: {client.gst_number}</div>' if client and client.gst_number else ''}
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#1e40af;color:#fff;">
        <th style="padding:10px 8px;text-align:left;">Item</th>
        <th style="padding:10px 8px;text-align:center;">Qty</th>
        <th style="padding:10px 8px;text-align:right;">Rate</th>
        <th style="padding:10px 8px;text-align:center;">Disc%</th>
        <th style="padding:10px 8px;text-align:center;">Tax%</th>
        <th style="padding:10px 8px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;">
    <div style="width:260px;background:#eff6ff;padding:16px;border-radius:8px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#4b5563;">Subtotal</span><span>{fmt(doc.subtotal)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#4b5563;">Discount</span><span style="color:#dc2626;">- {fmt(doc.discount_amount)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #bfdbfe;"><span style="color:#4b5563;">Tax</span><span style="color:#059669;">+ {fmt(doc.tax_amount)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#1e40af;margin-bottom:8px;"><span>Total</span><span>{fmt(doc.total)}</span></div>
      {f'<div style="display:flex;justify-content:space-between;color:#16a34a;margin-bottom:4px;"><span>Paid</span><span>{fmt(doc.paid_amount)}</span></div><div style="display:flex;justify-content:space-between;font-weight:700;color:#dc2626;font-size:14px;"><span>Balance Due</span><span>{fmt(doc.balance_due)}</span></div>' if is_invoice else ''}
    </div>
  </div>

  {f'<div style="margin-top:20px;padding:12px;background:#fefce8;border-radius:6px;"><strong>Notes:</strong> {doc.notes}</div>' if doc.notes else ''}
  {f'<div style="margin-top:12px;padding:12px;background:#f9fafb;border-radius:6px;"><strong>Terms:</strong><div style="white-space:pre-line;font-size:11px;color:#4b5563;margin-top:4px;">{doc.terms}</div></div>' if doc.terms else ''}

  <div style="margin-top:32px;padding-top:16px;border-top:2px solid #dbeafe;display:flex;justify-content:space-between;font-size:11px;color:#6b7280;">
    <span>{business.business_name if business else ''} — {business.website if business else ''}</span>
    <span>Generated on {__import__('datetime').date.today()}</span>
  </div>
</div>
</body></html>"""
