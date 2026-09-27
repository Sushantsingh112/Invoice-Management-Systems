from decimal import Decimal, ROUND_HALF_UP


def calculate_line_item(quantity, unit_price, discount_percentage=0, tax_percentage=0):
    """
    Calculate line item totals with precision.
    Formula: (qty * price) - discount + tax = total
    """
    qty = Decimal(str(quantity))
    price = Decimal(str(unit_price))
    disc_pct = Decimal(str(discount_percentage))
    tax_pct = Decimal(str(tax_percentage))

    subtotal = qty * price
    discount_amount = (subtotal * disc_pct / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    taxable_amount = subtotal - discount_amount
    tax_amount = (taxable_amount * tax_pct / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    total = taxable_amount + tax_amount

    return {
        'subtotal': float(subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
        'discount_amount': float(discount_amount),
        'tax_amount': float(tax_amount),
        'total': float(total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
    }


def calculate_document_totals(items):
    """
    Calculate overall document totals from list of item dicts.
    Returns subtotal, discount_amount, tax_amount, total.
    """
    subtotal = Decimal('0')
    discount_total = Decimal('0')
    tax_total = Decimal('0')

    for item in items:
        qty = Decimal(str(item.get('quantity', 1)))
        price = Decimal(str(item.get('unit_price', 0)))
        disc_pct = Decimal(str(item.get('discount_percentage', 0)))
        tax_pct = Decimal(str(item.get('tax_percentage', 0)))

        line_subtotal = qty * price
        line_discount = (line_subtotal * disc_pct / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        line_taxable = line_subtotal - line_discount
        line_tax = (line_taxable * tax_pct / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        subtotal += line_subtotal
        discount_total += line_discount
        tax_total += line_tax

    grand_total = subtotal - discount_total + tax_total

    return {
        'subtotal': float(subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
        'discount_amount': float(discount_total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
        'tax_amount': float(tax_total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
        'total': float(grand_total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
    }


def format_currency(amount, symbol='₹', position='before', decimals=2, thousands=',', decimal_sep='.'):
    """Format a numeric amount as a currency string."""
    try:
        formatted = f"{float(amount):,.{decimals}f}"
        if thousands != ',':
            formatted = formatted.replace(',', thousands)
        if decimal_sep != '.':
            formatted = formatted.replace('.', decimal_sep)
        if position == 'before':
            return f"{symbol}{formatted}"
        return f"{formatted}{symbol}"
    except Exception:
        return str(amount)


def generate_document_number(prefix, next_number):
    """Generate a zero-padded document number like INV-000001."""
    return f"{prefix}-{str(next_number).zfill(6)}"


def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
