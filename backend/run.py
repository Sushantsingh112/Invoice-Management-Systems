from app import create_app, db
from app.models.models import (User, BusinessSettings, GeneralSettings, QuotationSettings,
                                InvoiceSettings, PaymentSettings, TaxSettings, EmailSettings,
                                TranslationSettings, PdfTemplate, PredefinedItem, Client,
                                Quotation, QuotationItem, Invoice, InvoiceItem, Payment)
import bcrypt
import click
from datetime import date, timedelta


app = create_app()


@app.cli.command("create-admin")
@click.option('--email', prompt=True, help='Admin email')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='Admin password')
@click.option('--name', prompt=True, help='Full name')
def create_admin(email, password, name):
    """Create an admin user from CLI."""
    with app.app_context():
        if User.query.filter_by(email=email).first():
            click.echo("User with that email already exists.")
            return
        user = User(
            username=email.split('@')[0],
            email=email.lower(),
            full_name=name,
            role='admin',
            is_active=True
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        click.echo(f"Admin user '{email}' created successfully.")


@app.cli.command("init-db")
def init_db():
    """Initialize the database tables and seed data."""
    with app.app_context():
        db.create_all()
        click.echo("Database tables created.")

        # Seed if empty
        if not User.query.first():
            click.echo("Seeding initial data...")
            _seed_data()
            click.echo("Seed data inserted.")
        else:
            click.echo("Data already exists, skipping seed.")


def _seed_data():
    """Insert initial seed data programmatically."""
    # Admin user (password: Admin@123)
    admin = User(username='admin', email='admin@invoiceapp.com', full_name='System Administrator', role='admin')
    admin.set_password('Admin@123')
    db.session.add(admin)

    # Business settings
    db.session.add(BusinessSettings(
        business_name='TechCorp Solutions Pvt Ltd',
        address='123 Business Park, Tech Street',
        email='billing@techcorp.com', phone='+91-9876543210',
        website='www.techcorp.com', gst_number='27AABCT3518Q1ZV',
        country='India', city='Mumbai', state='Maharashtra', postal_code='400001',
        extra_info='CIN: U72900MH2010PTC123456\nPAN: AABCT3518Q'
    ))

    # Settings
    db.session.add(GeneralSettings(year_start=date(2026,4,1), year_end=date(2027,3,31)))
    db.session.add(QuotationSettings(quote_prefix='QUO', next_number=4, validity_days=30,
        default_notes='Thank you for considering our services.',
        default_terms='50% advance required to initiate work.'))
    db.session.add(InvoiceSettings(invoice_prefix='INV', next_number=4, default_due_days=30,
        default_notes='Thank you for your business.',
        payment_instructions='Bank: HDFC Bank\nAccount: TechCorp Solutions\nIFSC: HDFC0001234'))
    db.session.add(PaymentSettings(currency_symbol='₹', currency_code='INR',
        payment_methods=['cash','bank_transfer','upi','card','cheque','other']))
    db.session.add(TaxSettings(tax_name='GST', tax_percentage=18.00, is_default=True))
    db.session.add(EmailSettings(smtp_host='smtp.gmail.com', smtp_port=587,
        from_name='TechCorp Billing', from_email='billing@techcorp.com'))
    db.session.add(TranslationSettings(language='en', labels={
        'invoice': 'Invoice', 'quotation': 'Quotation', 'total': 'Total',
        'paid': 'Paid', 'balance_due': 'Balance Due', 'date': 'Date',
        'due_date': 'Due Date', 'client': 'Client', 'item': 'Item',
        'quantity': 'Quantity', 'rate': 'Rate', 'discount': 'Discount',
        'subtotal': 'Subtotal', 'tax': 'Tax',
    }))
    db.session.add(PdfTemplate(template_key='template1', template_name='Modern Blue Corporate', is_active=True))
    db.session.add(PdfTemplate(template_key='template2', template_name='Professional Blue/White', is_active=True))

    db.session.commit()
    click.echo("Base settings seeded.")


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
