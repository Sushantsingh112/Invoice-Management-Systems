-- ============================================================
-- Quotation & Invoice Management System - Seed Data
-- ============================================================

USE quotation_invoice_db;

-- ============================================================
-- DEFAULT ADMIN USER (password: Admin@123)
-- ============================================================
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@invoiceapp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgni4qNTPiA4UlCNqKbCX6', 'System Administrator', 'admin'),
('staff1', 'staff@invoiceapp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgni4qNTPiA4UlCNqKbCX6', 'John Staff', 'staff');

-- ============================================================
-- BUSINESS SETTINGS
-- ============================================================
INSERT INTO business_settings (business_name, address, email, phone, website, gst_number, country, city, state, postal_code, extra_info) VALUES
('TechCorp Solutions Pvt Ltd', '123 Business Park, Tech Street', 'billing@techcorp.com', '+91-9876543210', 'www.techcorp.com', '27AABCT3518Q1ZV', 'India', 'Mumbai', 'Maharashtra', '400001', 'CIN: U72900MH2010PTC123456\nPAN: AABCT3518Q');

-- ============================================================
-- GENERAL SETTINGS
-- ============================================================
INSERT INTO general_settings (year_start, year_end, predefined_items) VALUES
('2026-04-01', '2027-03-31', '[
  {"name": "Web Design", "description": "Custom website design and development", "price": 5000.00, "tax": 18},
  {"name": "Mobile App Development", "description": "Android/iOS app development", "price": 15000.00, "tax": 18},
  {"name": "SEO Services", "description": "Search engine optimization - Monthly", "price": 3000.00, "tax": 18},
  {"name": "Cloud Hosting", "description": "AWS/Azure hosting - Monthly", "price": 2000.00, "tax": 18},
  {"name": "Technical Support", "description": "IT support and maintenance per hour", "price": 500.00, "tax": 18},
  {"name": "API Integration", "description": "Third-party API integration service", "price": 8000.00, "tax": 18},
  {"name": "Database Management", "description": "Database setup and optimization", "price": 4000.00, "tax": 18},
  {"name": "UI/UX Design", "description": "User interface and experience design", "price": 6000.00, "tax": 18}
]');

-- ============================================================
-- QUOTATION SETTINGS
-- ============================================================
INSERT INTO quotation_settings (quote_prefix, next_number, auto_numbering, validity_days, default_notes, default_terms, footer, email_subject, email_message) VALUES
('QUO', 4, TRUE, 30,
'Thank you for considering our services. Please review this quotation and feel free to contact us for any clarifications.',
'1. This quotation is valid for the specified period only.\n2. Prices are subject to change without prior notice.\n3. 50% advance payment required to initiate work.\n4. Balance payment due upon project completion.\n5. All disputes subject to Mumbai jurisdiction.',
'TechCorp Solutions Pvt Ltd | www.techcorp.com | billing@techcorp.com',
'Quotation {{quote_number}} from TechCorp Solutions',
'Dear {{client_name}},\n\nPlease find attached quotation {{quote_number}} dated {{quote_date}} for your reference.\n\nQuotation Total: {{total}}\nValid Until: {{valid_until}}\n\nPlease review and let us know if you have any questions.\n\nBest Regards,\n{{company_name}}');

-- ============================================================
-- INVOICE SETTINGS
-- ============================================================
INSERT INTO invoice_settings (invoice_prefix, next_number, auto_numbering, default_due_days, default_notes, default_terms, payment_instructions, footer) VALUES
('INV', 4, TRUE, 30,
'Thank you for your business. Please process payment by the due date.',
'1. Payment due within 30 days of invoice date.\n2. Late payments subject to 2% monthly interest.\n3. Please include invoice number in payment reference.\n4. GST is applicable as per government regulations.',
'Bank: HDFC Bank Ltd\nAccount Name: TechCorp Solutions Pvt Ltd\nAccount No: 12345678901234\nIFSC: HDFC0001234\nBranch: Bandra West, Mumbai',
'TechCorp Solutions Pvt Ltd | GST: 27AABCT3518Q1ZV | www.techcorp.com');

-- ============================================================
-- PAYMENT SETTINGS
-- ============================================================
INSERT INTO payment_settings (currency_symbol, currency_code, currency_position, thousand_separator, decimal_separator, decimal_places, payment_methods, payment_instructions) VALUES
('₹', 'INR', 'before', ',', '.', 2,
'["cash", "bank_transfer", "upi", "card", "cheque", "other"]',
'UPI ID: techcorp@upi\nGPay/PhonePe accepted\nBank transfer details available on request');

-- ============================================================
-- TAX SETTINGS
-- ============================================================
INSERT INTO tax_settings (tax_name, tax_percentage, tax_type, is_default) VALUES
('GST', 18.00, 'exclusive', TRUE),
('IGST', 18.00, 'exclusive', FALSE),
('GST 5%', 5.00, 'exclusive', FALSE),
('GST 12%', 12.00, 'exclusive', FALSE),
('GST 28%', 28.00, 'exclusive', FALSE),
('No Tax', 0.00, 'exclusive', FALSE);

-- ============================================================
-- EMAIL SETTINGS
-- ============================================================
INSERT INTO email_settings (smtp_host, smtp_port, smtp_username, smtp_password, encryption, from_name, from_email, templates) VALUES
('smtp.gmail.com', 587, 'billing@techcorp.com', '', 'tls', 'TechCorp Billing', 'billing@techcorp.com',
'{
  "invoice_created": {
    "subject": "Invoice {{invoice_number}} Created",
    "body": "Dear {{client_name}},\n\nYour invoice {{invoice_number}} for {{total}} has been created.\n\nDue Date: {{due_date}}\n\nThank you for your business.\n\nBest Regards,\n{{company_name}}"
  },
  "invoice_sent": {
    "subject": "Invoice {{invoice_number}} from {{company_name}}",
    "body": "Dear {{client_name}},\n\nPlease find attached invoice {{invoice_number}} dated {{invoice_date}}.\n\nAmount Due: {{total}}\nDue Date: {{due_date}}\n\nPlease process payment at your earliest convenience.\n\nBest Regards,\n{{company_name}}"
  },
  "payment_received": {
    "subject": "Payment Received - Invoice {{invoice_number}}",
    "body": "Dear {{client_name}},\n\nWe have received your payment of {{paid}} for invoice {{invoice_number}}.\n\nBalance Due: {{balance_due}}\n\nThank you!\n\nBest Regards,\n{{company_name}}"
  },
  "payment_reminder": {
    "subject": "Payment Reminder - Invoice {{invoice_number}} Due {{due_date}}",
    "body": "Dear {{client_name}},\n\nThis is a friendly reminder that invoice {{invoice_number}} for {{total}} is due on {{due_date}}.\n\nBalance Due: {{balance_due}}\n\nPlease arrange payment at the earliest.\n\nBest Regards,\n{{company_name}}"
  },
  "quotation_sent": {
    "subject": "Quotation {{quote_number}} from {{company_name}}",
    "body": "Dear {{client_name}},\n\nPlease find attached quotation {{quote_number}} dated {{quote_date}}.\n\nTotal: {{total}}\nValid Until: {{valid_until}}\n\nPlease review and revert.\n\nBest Regards,\n{{company_name}}"
  },
  "quotation_accepted": {
    "subject": "Quotation {{quote_number}} Accepted",
    "body": "Dear {{client_name}},\n\nThank you for accepting quotation {{quote_number}}.\n\nWe will proceed with the work and keep you updated.\n\nBest Regards,\n{{company_name}}"
  }
}');

-- ============================================================
-- TRANSLATION SETTINGS
-- ============================================================
INSERT INTO translation_settings (language, labels) VALUES
('en', '{
  "quotation": "Quotation",
  "quotation_number": "Quotation Number",
  "invoice": "Invoice",
  "invoice_number": "Invoice Number",
  "date": "Date",
  "due_date": "Due Date",
  "valid_until": "Valid Until",
  "client": "Client",
  "item": "Item",
  "description": "Description",
  "quantity": "Quantity",
  "rate": "Rate",
  "price": "Price",
  "discount": "Discount",
  "subtotal": "Subtotal",
  "tax": "Tax",
  "total": "Total",
  "paid": "Paid",
  "balance_due": "Balance Due",
  "notes": "Notes",
  "terms": "Terms & Conditions",
  "payment_instructions": "Payment Instructions",
  "bill_to": "Bill To",
  "from": "From",
  "reference": "Reference",
  "currency": "Currency",
  "payment_method": "Payment Method"
}');

-- ============================================================
-- PDF TEMPLATES
-- ============================================================
INSERT INTO pdf_templates (template_key, template_name, description, is_active) VALUES
('template1', 'Modern Blue Corporate', 'Professional blue corporate template with header and footer', TRUE),
('template2', 'Professional Blue/White', 'Clean white background with blue accents and table layout', TRUE);

-- ============================================================
-- SAMPLE CLIENTS
-- ============================================================
INSERT INTO clients (client_name, company_name, email, phone, address, city, state, country, postal_code, tax_number, gst_number) VALUES
('Rajesh Kumar', 'InfoSys Technologies', 'rajesh@infosys.com', '+91-9876500001', '456 IT Park, Whitefield', 'Bengaluru', 'Karnataka', 'India', '560066', 'PAN: ABCDE1234F', '29ABCDE1234F1Z1'),
('Priya Sharma', 'DataCore Analytics', 'priya@datacore.in', '+91-9876500002', '789 Business Center, Andheri East', 'Mumbai', 'Maharashtra', 'India', '400069', 'PAN: FGHIJ5678G', '27FGHIJ5678G1Z2'),
('Amit Patel', 'WebFlow Digital', 'amit@webflow.io', '+91-9876500003', '321 Cyber Hub, DLF', 'Gurugram', 'Haryana', 'India', '122002', 'PAN: KLMNO9012H', '06KLMNO9012H1Z3'),
('Sunita Rao', 'CloudNine Services', 'sunita@cloudnine.co', '+91-9876500004', '654 Tech Square, Hitech City', 'Hyderabad', 'Telangana', 'India', '500081', 'PAN: PQRST3456I', '36PQRST3456I1Z4'),
('Vikram Singh', 'StartUp Ventures', 'vikram@startupv.com', '+91-9876500005', '987 Innovation Hub, Koregaon Park', 'Pune', 'Maharashtra', 'India', '411001', 'PAN: UVWXY7890J', '27UVWXY7890J1Z5');

-- ============================================================
-- SAMPLE QUOTATIONS
-- ============================================================
INSERT INTO quotations (quote_number, client_id, quote_date, valid_until, status, currency, reference, subtotal, discount_amount, tax_amount, total, notes, terms) VALUES
('QUO-000001', 1, '2026-09-01', '2026-09-30', 'accepted', 'INR', 'Website Redesign Project', 25000.00, 2500.00, 4050.00, 26550.00, 'Thank you for considering our services.', '50% advance required.'),
('QUO-000002', 2, '2026-09-05', '2026-10-05', 'sent', 'INR', 'Data Analytics Dashboard', 35000.00, 0.00, 6300.00, 41300.00, 'Includes training and documentation.', 'Payment within 30 days.'),
('QUO-000003', 3, '2026-09-10', '2026-10-10', 'draft', 'INR', 'Mobile App Development', 75000.00, 5000.00, 12600.00, 82600.00, 'Estimated timeline: 3 months.', '40% advance, 30% milestone, 30% delivery.');

-- ============================================================
-- SAMPLE QUOTATION ITEMS
-- ============================================================
INSERT INTO quotation_items (quotation_id, item_name, description, quantity, unit_price, discount_percentage, discount_amount, tax_percentage, tax_amount, subtotal, total) VALUES
(1, 'Web Design', 'Custom website design - 10 pages', 1, 15000.00, 10, 1500.00, 18, 2430.00, 15000.00, 16230.00),
(1, 'SEO Setup', 'On-page SEO optimization', 1, 10000.00, 10, 1000.00, 18, 1620.00, 10000.00, 10620.00),
(2, 'Analytics Dashboard', 'Custom BI dashboard development', 1, 25000.00, 0, 0.00, 18, 4500.00, 25000.00, 29500.00),
(2, 'Data Pipeline Setup', 'ETL pipeline configuration', 1, 10000.00, 0, 0.00, 18, 1800.00, 10000.00, 11800.00),
(3, 'Mobile App - Android', 'Native Android application', 1, 40000.00, 5, 2000.00, 18, 6840.00, 40000.00, 44840.00),
(3, 'Mobile App - iOS', 'Native iOS application', 1, 35000.00, 5, 1750.00, 18, 5985.00, 35000.00, 39235.00),
(3, 'Backend API', 'REST API development', 1, 5000.00, 5, 250.00, 18, 855.00, 5000.00, 5605.00);

-- ============================================================
-- SAMPLE INVOICES
-- ============================================================
INSERT INTO invoices (invoice_number, client_id, quotation_id, invoice_date, due_date, status, currency, reference, subtotal, discount_amount, tax_amount, total, paid_amount, balance_due, notes, terms) VALUES
('INV-000001', 1, 1, '2026-09-15', '2026-10-15', 'paid', 'INR', 'Website Redesign - Phase 1', 25000.00, 2500.00, 4050.00, 26550.00, 26550.00, 0.00, 'Thank you for your business!', 'Payment received. Project initiated.'),
('INV-000002', 2, NULL, '2026-09-18', '2026-10-18', 'partially_paid', 'INR', 'Analytics Dashboard Development', 35000.00, 0.00, 6300.00, 41300.00, 20000.00, 21300.00, 'Balance due on delivery.', 'Payment within 30 days.'),
('INV-000003', 4, NULL, '2026-09-20', '2026-10-05', 'overdue', 'INR', 'Cloud Infrastructure Setup', 15000.00, 0.00, 2700.00, 17700.00, 0.00, 17700.00, 'Urgent: Please arrange payment.', 'Payment overdue. Interest applicable.');

-- Update quotation as converted
UPDATE quotations SET status='converted', converted_invoice_id=1 WHERE id=1;

-- ============================================================
-- SAMPLE INVOICE ITEMS
-- ============================================================
INSERT INTO invoice_items (invoice_id, item_name, description, quantity, unit_price, discount_percentage, discount_amount, tax_percentage, tax_amount, subtotal, total) VALUES
(1, 'Web Design', 'Custom website design - 10 pages', 1, 15000.00, 10, 1500.00, 18, 2430.00, 15000.00, 16230.00),
(1, 'SEO Setup', 'On-page SEO optimization', 1, 10000.00, 10, 1000.00, 18, 1620.00, 10000.00, 10620.00),
(2, 'Analytics Dashboard', 'Custom BI dashboard development', 1, 25000.00, 0, 0.00, 18, 4500.00, 25000.00, 29500.00),
(2, 'Data Pipeline Setup', 'ETL pipeline configuration', 1, 10000.00, 0, 0.00, 18, 1800.00, 10000.00, 11800.00),
(3, 'Cloud Server Setup', 'AWS EC2 setup and configuration', 1, 10000.00, 0, 0.00, 18, 1800.00, 10000.00, 11800.00),
(3, 'SSL Certificate', 'Wildcard SSL - Annual', 1, 5000.00, 0, 0.00, 18, 900.00, 5000.00, 5900.00);

-- ============================================================
-- SAMPLE PAYMENTS
-- ============================================================
INSERT INTO payments (invoice_id, payment_date, payment_method, transaction_id, amount, notes, status) VALUES
(1, '2026-09-16', 'bank_transfer', 'TXN20260916001', 26550.00, 'Full payment received via NEFT', 'paid'),
(2, '2026-09-22', 'upi', 'UPI20260922001', 20000.00, 'Advance payment - 50%', 'partial');

-- ============================================================
-- SAMPLE AUDIT LOGS
-- ============================================================
INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, new_value) VALUES
(1, 'admin@invoiceapp.com', 'CREATE', 'invoice', 1, '{"invoice_number": "INV-000001", "total": 26550.00}'),
(1, 'admin@invoiceapp.com', 'CREATE', 'invoice', 2, '{"invoice_number": "INV-000002", "total": 41300.00}'),
(1, 'admin@invoiceapp.com', 'PAYMENT', 'invoice', 1, '{"amount": 26550.00, "method": "bank_transfer"}'),
(1, 'admin@invoiceapp.com', 'CREATE', 'quotation', 1, '{"quote_number": "QUO-000001", "total": 26550.00}'),
(1, 'admin@invoiceapp.com', 'CONVERT', 'quotation', 1, '{"converted_to": "INV-000001"}');

-- ============================================================
-- PREDEFINED LINE ITEMS
-- ============================================================
INSERT INTO predefined_items (item_name, description, unit_price, tax_percentage) VALUES
('Web Design', 'Custom website design and development', 5000.00, 18),
('Mobile App Development', 'Android/iOS app development', 15000.00, 18),
('SEO Services', 'Search engine optimization - Monthly', 3000.00, 18),
('Cloud Hosting', 'AWS/Azure hosting - Monthly', 2000.00, 18),
('Technical Support', 'IT support and maintenance per hour', 500.00, 18),
('API Integration', 'Third-party API integration service', 8000.00, 18),
('Database Management', 'Database setup and optimization', 4000.00, 18),
('UI/UX Design', 'User interface and experience design', 6000.00, 18);
