from app import db
from datetime import datetime
import bcrypt


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('admin', 'staff'), nullable=False, default='staff')
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Client(db.Model):
    __tablename__ = 'clients'

    id = db.Column(db.Integer, primary_key=True)
    client_name = db.Column(db.String(255), nullable=False)
    company_name = db.Column(db.String(255))
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(50))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    country = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    tax_number = db.Column(db.String(100))
    gst_number = db.Column(db.String(100))
    additional_info = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    quotations = db.relationship('Quotation', backref='client', lazy='dynamic')
    invoices = db.relationship('Invoice', backref='client', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'client_name': self.client_name,
            'company_name': self.company_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'postal_code': self.postal_code,
            'tax_number': self.tax_number,
            'gst_number': self.gst_number,
            'additional_info': self.additional_info,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Quotation(db.Model):
    __tablename__ = 'quotations'

    id = db.Column(db.Integer, primary_key=True)
    quote_number = db.Column(db.String(50), unique=True, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    quote_date = db.Column(db.Date, nullable=False)
    valid_until = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('draft','sent','accepted','rejected','expired','converted'), default='draft')
    currency = db.Column(db.String(10), default='INR')
    reference = db.Column(db.String(255))
    subtotal = db.Column(db.Numeric(15, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    discount_percentage = db.Column(db.Numeric(5, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    total = db.Column(db.Numeric(15, 2), default=0)
    notes = db.Column(db.Text)
    terms = db.Column(db.Text)
    pdf_template = db.Column(db.String(50), default='template1')
    converted_invoice_id = db.Column(db.Integer, nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    updated_by = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship('QuotationItem', backref='quotation', lazy='joined', cascade='all, delete-orphan')

    def to_dict(self, include_items=True):
        data = {
            'id': self.id,
            'quote_number': self.quote_number,
            'client_id': self.client_id,
            'client': self.client.to_dict() if self.client else None,
            'quote_date': self.quote_date.isoformat() if self.quote_date else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'status': self.status,
            'currency': self.currency,
            'reference': self.reference,
            'subtotal': float(self.subtotal or 0),
            'discount_amount': float(self.discount_amount or 0),
            'discount_percentage': float(self.discount_percentage or 0),
            'tax_amount': float(self.tax_amount or 0),
            'total': float(self.total or 0),
            'notes': self.notes,
            'terms': self.terms,
            'pdf_template': self.pdf_template,
            'converted_invoice_id': self.converted_invoice_id,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data


class QuotationItem(db.Model):
    __tablename__ = 'quotation_items'

    id = db.Column(db.Integer, primary_key=True)
    quotation_id = db.Column(db.Integer, db.ForeignKey('quotations.id', ondelete='CASCADE'), nullable=False)
    item_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(10, 3), nullable=False, default=1)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    discount_percentage = db.Column(db.Numeric(5, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    tax_percentage = db.Column(db.Numeric(5, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    subtotal = db.Column(db.Numeric(15, 2), default=0)
    total = db.Column(db.Numeric(15, 2), default=0)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'quotation_id': self.quotation_id,
            'item_name': self.item_name,
            'description': self.description,
            'quantity': float(self.quantity or 0),
            'unit_price': float(self.unit_price or 0),
            'discount_percentage': float(self.discount_percentage or 0),
            'discount_amount': float(self.discount_amount or 0),
            'tax_percentage': float(self.tax_percentage or 0),
            'tax_amount': float(self.tax_amount or 0),
            'subtotal': float(self.subtotal or 0),
            'total': float(self.total or 0),
            'sort_order': self.sort_order,
        }


class Invoice(db.Model):
    __tablename__ = 'invoices'

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    quotation_id = db.Column(db.Integer, nullable=True)
    invoice_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('draft','sent','partially_paid','paid','overdue','cancelled'), default='draft')
    currency = db.Column(db.String(10), default='INR')
    reference = db.Column(db.String(255))
    subtotal = db.Column(db.Numeric(15, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    discount_percentage = db.Column(db.Numeric(5, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    total = db.Column(db.Numeric(15, 2), default=0)
    paid_amount = db.Column(db.Numeric(15, 2), default=0)
    balance_due = db.Column(db.Numeric(15, 2), default=0)
    notes = db.Column(db.Text)
    terms = db.Column(db.Text)
    pdf_template = db.Column(db.String(50), default='template1')
    sent_at = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    updated_by = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship('InvoiceItem', backref='invoice', lazy='joined', cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='invoice', lazy='dynamic')

    def to_dict(self, include_items=True):
        data = {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'client_id': self.client_id,
            'client': self.client.to_dict() if self.client else None,
            'quotation_id': self.quotation_id,
            'invoice_date': self.invoice_date.isoformat() if self.invoice_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'currency': self.currency,
            'reference': self.reference,
            'subtotal': float(self.subtotal or 0),
            'discount_amount': float(self.discount_amount or 0),
            'discount_percentage': float(self.discount_percentage or 0),
            'tax_amount': float(self.tax_amount or 0),
            'total': float(self.total or 0),
            'paid_amount': float(self.paid_amount or 0),
            'balance_due': float(self.balance_due or 0),
            'notes': self.notes,
            'terms': self.terms,
            'pdf_template': self.pdf_template,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data


class InvoiceItem(db.Model):
    __tablename__ = 'invoice_items'

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False)
    item_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(10, 3), nullable=False, default=1)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    discount_percentage = db.Column(db.Numeric(5, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    tax_percentage = db.Column(db.Numeric(5, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    subtotal = db.Column(db.Numeric(15, 2), default=0)
    total = db.Column(db.Numeric(15, 2), default=0)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'item_name': self.item_name,
            'description': self.description,
            'quantity': float(self.quantity or 0),
            'unit_price': float(self.unit_price or 0),
            'discount_percentage': float(self.discount_percentage or 0),
            'discount_amount': float(self.discount_amount or 0),
            'tax_percentage': float(self.tax_percentage or 0),
            'tax_amount': float(self.tax_amount or 0),
            'subtotal': float(self.subtotal or 0),
            'total': float(self.total or 0),
            'sort_order': self.sort_order,
        }


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    payment_method = db.Column(db.Enum('cash','bank_transfer','upi','card','cheque','other'), nullable=False)
    transaction_id = db.Column(db.String(255))
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    notes = db.Column(db.Text)
    status = db.Column(db.Enum('pending','partial','paid','failed'), default='paid')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'invoice_number': self.invoice.invoice_number if self.invoice else None,
            'client_name': self.invoice.client.client_name if self.invoice and self.invoice.client else None,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'amount': float(self.amount or 0),
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user_email = db.Column(db.String(255))
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(100), nullable=False)
    entity_id = db.Column(db.Integer)
    old_value = db.Column(db.JSON)
    new_value = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_email': self.user_email,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class EmailLog(db.Model):
    __tablename__ = 'email_logs'

    id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.Enum('invoice', 'quotation'), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    recipient_email = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(500), nullable=False)
    body = db.Column(db.Text)
    status = db.Column(db.Enum('sent', 'failed', 'pending'), default='pending')
    error_message = db.Column(db.Text)
    sent_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'recipient_email': self.recipient_email,
            'subject': self.subject,
            'status': self.status,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# Settings models
class BusinessSettings(db.Model):
    __tablename__ = 'business_settings'
    id = db.Column(db.Integer, primary_key=True)
    business_name = db.Column(db.String(255), default='')
    logo_path = db.Column(db.String(500))
    address = db.Column(db.Text)
    extra_info = db.Column(db.Text)
    email = db.Column(db.String(255), default='')
    phone = db.Column(db.String(50), default='')
    website = db.Column(db.String(255), default='')
    gst_number = db.Column(db.String(100), default='')
    vat_number = db.Column(db.String(100), default='')
    registration_number = db.Column(db.String(100), default='')
    country = db.Column(db.String(100), default='')
    city = db.Column(db.String(100), default='')
    state = db.Column(db.String(100), default='')
    postal_code = db.Column(db.String(20), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'business_name': self.business_name,
            'logo_path': self.logo_path,
            'logo_url': f'/api/static/uploads/{self.logo_path}' if self.logo_path else None,
            'address': self.address,
            'extra_info': self.extra_info,
            'email': self.email,
            'phone': self.phone,
            'website': self.website,
            'gst_number': self.gst_number,
            'vat_number': self.vat_number,
            'registration_number': self.registration_number,
            'country': self.country,
            'city': self.city,
            'state': self.state,
            'postal_code': self.postal_code,
        }


class GeneralSettings(db.Model):
    __tablename__ = 'general_settings'
    id = db.Column(db.Integer, primary_key=True)
    year_start = db.Column(db.Date)
    year_end = db.Column(db.Date)
    predefined_items = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'year_start': self.year_start.isoformat() if self.year_start else None,
            'year_end': self.year_end.isoformat() if self.year_end else None,
            'predefined_items': self.predefined_items or [],
        }


class QuotationSettings(db.Model):
    __tablename__ = 'quotation_settings'
    id = db.Column(db.Integer, primary_key=True)
    quote_prefix = db.Column(db.String(20), default='QUO')
    next_number = db.Column(db.Integer, default=1)
    auto_numbering = db.Column(db.Boolean, default=True)
    date_format = db.Column(db.String(50), default='DD/MM/YYYY')
    validity_days = db.Column(db.Integer, default=30)
    default_notes = db.Column(db.Text)
    default_terms = db.Column(db.Text)
    footer = db.Column(db.Text)
    email_subject = db.Column(db.String(255))
    email_message = db.Column(db.Text)
    pdf_template = db.Column(db.String(50), default='template1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'quote_prefix': self.quote_prefix,
            'next_number': self.next_number,
            'auto_numbering': self.auto_numbering,
            'date_format': self.date_format,
            'validity_days': self.validity_days,
            'default_notes': self.default_notes,
            'default_terms': self.default_terms,
            'footer': self.footer,
            'email_subject': self.email_subject,
            'email_message': self.email_message,
            'pdf_template': self.pdf_template,
        }


class InvoiceSettings(db.Model):
    __tablename__ = 'invoice_settings'
    id = db.Column(db.Integer, primary_key=True)
    invoice_prefix = db.Column(db.String(20), default='INV')
    next_number = db.Column(db.Integer, default=1)
    auto_numbering = db.Column(db.Boolean, default=True)
    date_format = db.Column(db.String(50), default='DD/MM/YYYY')
    default_due_days = db.Column(db.Integer, default=30)
    footer = db.Column(db.Text)
    payment_instructions = db.Column(db.Text)
    default_notes = db.Column(db.Text)
    default_terms = db.Column(db.Text)
    admin_notice = db.Column(db.Text)
    pdf_template = db.Column(db.String(50), default='template1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_prefix': self.invoice_prefix,
            'next_number': self.next_number,
            'auto_numbering': self.auto_numbering,
            'date_format': self.date_format,
            'default_due_days': self.default_due_days,
            'footer': self.footer,
            'payment_instructions': self.payment_instructions,
            'default_notes': self.default_notes,
            'default_terms': self.default_terms,
            'admin_notice': self.admin_notice,
            'pdf_template': self.pdf_template,
        }


class PaymentSettings(db.Model):
    __tablename__ = 'payment_settings'
    id = db.Column(db.Integer, primary_key=True)
    currency_symbol = db.Column(db.String(10), default='₹')
    currency_code = db.Column(db.String(10), default='INR')
    currency_position = db.Column(db.Enum('before', 'after'), default='before')
    thousand_separator = db.Column(db.String(5), default=',')
    decimal_separator = db.Column(db.String(5), default='.')
    decimal_places = db.Column(db.Integer, default=2)
    payment_methods = db.Column(db.JSON)
    payment_instructions = db.Column(db.Text)
    paypal_enabled = db.Column(db.Boolean, default=False)
    paypal_email = db.Column(db.String(255))
    payment_page_text = db.Column(db.Text)
    payment_page_footer = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'currency_symbol': self.currency_symbol,
            'currency_code': self.currency_code,
            'currency_position': self.currency_position,
            'thousand_separator': self.thousand_separator,
            'decimal_separator': self.decimal_separator,
            'decimal_places': self.decimal_places,
            'payment_methods': self.payment_methods or [],
            'payment_instructions': self.payment_instructions,
            'paypal_enabled': self.paypal_enabled,
            'paypal_email': self.paypal_email,
            'payment_page_text': self.payment_page_text,
            'payment_page_footer': self.payment_page_footer,
        }


class TaxSettings(db.Model):
    __tablename__ = 'tax_settings'
    id = db.Column(db.Integer, primary_key=True)
    tax_name = db.Column(db.String(100), default='GST')
    tax_percentage = db.Column(db.Numeric(5, 2), default=18.00)
    tax_type = db.Column(db.Enum('inclusive', 'exclusive'), default='exclusive')
    tax_rules = db.Column(db.Text)
    is_default = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'tax_name': self.tax_name,
            'tax_percentage': float(self.tax_percentage or 0),
            'tax_type': self.tax_type,
            'tax_rules': self.tax_rules,
            'is_default': self.is_default,
        }


class EmailSettings(db.Model):
    __tablename__ = 'email_settings'
    id = db.Column(db.Integer, primary_key=True)
    smtp_host = db.Column(db.String(255), default='')
    smtp_port = db.Column(db.Integer, default=587)
    smtp_username = db.Column(db.String(255), default='')
    smtp_password = db.Column(db.String(255), default='')
    encryption = db.Column(db.Enum('none', 'ssl', 'tls'), default='tls')
    from_name = db.Column(db.String(255), default='')
    from_email = db.Column(db.String(255), default='')
    templates = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, hide_password=True):
        return {
            'id': self.id,
            'smtp_host': self.smtp_host,
            'smtp_port': self.smtp_port,
            'smtp_username': self.smtp_username,
            'smtp_password': '••••••••' if hide_password and self.smtp_password else (self.smtp_password or ''),
            'encryption': self.encryption,
            'from_name': self.from_name,
            'from_email': self.from_email,
            'templates': self.templates or {},
        }


class TranslationSettings(db.Model):
    __tablename__ = 'translation_settings'
    id = db.Column(db.Integer, primary_key=True)
    language = db.Column(db.String(10), default='en')
    labels = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'language': self.language,
            'labels': self.labels or {},
        }


class PdfTemplate(db.Model):
    __tablename__ = 'pdf_templates'
    id = db.Column(db.Integer, primary_key=True)
    template_key = db.Column(db.String(50), unique=True, nullable=False)
    template_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    template_config = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'template_key': self.template_key,
            'template_name': self.template_name,
            'description': self.description,
            'is_active': self.is_active,
            'template_config': self.template_config,
        }


class PredefinedItem(db.Model):
    __tablename__ = 'predefined_items'
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    unit_price = db.Column(db.Numeric(15, 2), default=0)
    tax_percentage = db.Column(db.Numeric(5, 2), default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'item_name': self.item_name,
            'description': self.description,
            'unit_price': float(self.unit_price or 0),
            'tax_percentage': float(self.tax_percentage or 0),
            'is_active': self.is_active,
        }
