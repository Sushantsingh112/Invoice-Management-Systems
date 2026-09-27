/**
 * Format a number as currency using payment settings.
 */
export function formatCurrency(amount, paymentSettings) {
  if (!paymentSettings) return `₹${parseFloat(amount || 0).toFixed(2)}`;
  const { currency_symbol = '₹', currency_position = 'before',
    decimal_places = 2, thousand_separator = ',', decimal_separator = '.' } = paymentSettings;

  let formatted = parseFloat(amount || 0).toFixed(decimal_places);
  // Apply thousand separator
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand_separator);
  formatted = parts.join(decimal_separator);

  return currency_position === 'before' ? `${currency_symbol}${formatted}` : `${formatted}${currency_symbol}`;
}

/**
 * Calculate line item totals.
 */
export function calcLineItem(quantity, unitPrice, discountPct = 0, taxPct = 0) {
  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(unitPrice) || 0;
  const disc = parseFloat(discountPct) || 0;
  const tax = parseFloat(taxPct) || 0;

  const subtotal = qty * price;
  const discountAmount = parseFloat(((subtotal * disc) / 100).toFixed(2));
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = parseFloat(((taxableAmount * tax) / 100).toFixed(2));
  const total = parseFloat((taxableAmount + taxAmount).toFixed(2));

  return { subtotal: parseFloat(subtotal.toFixed(2)), discountAmount, taxAmount, total };
}

/**
 * Calculate document-level totals from items array.
 */
export function calcDocumentTotals(items) {
  let subtotal = 0, discount = 0, tax = 0;
  items.forEach(item => {
    const calc = calcLineItem(item.quantity, item.unit_price, item.discount_percentage, item.tax_percentage);
    subtotal += calc.subtotal;
    discount += calc.discountAmount;
    tax += calc.taxAmount;
  });
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount_amount: parseFloat(discount.toFixed(2)),
    tax_amount: parseFloat(tax.toFixed(2)),
    total: parseFloat((subtotal - discount + tax).toFixed(2)),
  };
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Format a date string to display format.
 */
export function formatDate(dateStr, format = 'DD/MM/YYYY') {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return format.replace('DD', day).replace('MM', month).replace('YYYY', year);
}

/**
 * Get status badge color classes.
 */
export function getStatusColor(status) {
  const map = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700',
    converted: 'bg-purple-100 text-purple-700',
    paid: 'bg-green-100 text-green-700',
    partially_paid: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
    pending: 'bg-yellow-100 text-yellow-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function getStatusLabel(status) {
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Generate today's date in YYYY-MM-DD format.
 */
export function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Add days to a date and return YYYY-MM-DD.
 */
export function addDays(dateStr, days) {
  const d = new Date(dateStr || new Date());
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
