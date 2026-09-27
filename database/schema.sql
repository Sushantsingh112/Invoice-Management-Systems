-- ============================================================
-- Quotation & Invoice Management System - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS quotation_invoice_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quotation_invoice_db;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ============================================================
-- BUSINESS SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS business_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_name VARCHAR(255) DEFAULT '',
    logo_path VARCHAR(500) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    extra_info TEXT DEFAULT NULL,
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    website VARCHAR(255) DEFAULT '',
    gst_number VARCHAR(100) DEFAULT '',
    vat_number VARCHAR(100) DEFAULT '',
    registration_number VARCHAR(100) DEFAULT '',
    country VARCHAR(100) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    state VARCHAR(100) DEFAULT '',
    postal_code VARCHAR(20) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- GENERAL SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS general_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year_start DATE DEFAULT NULL,
    year_end DATE DEFAULT NULL,
    predefined_items JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- QUOTATION SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS quotation_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_prefix VARCHAR(20) DEFAULT 'QUO',
    next_number INT DEFAULT 1,
    auto_numbering BOOLEAN DEFAULT TRUE,
    date_format VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    validity_days INT DEFAULT 30,
    default_notes TEXT DEFAULT NULL,
    default_terms TEXT DEFAULT NULL,
    footer TEXT DEFAULT NULL,
    email_subject VARCHAR(255) DEFAULT 'Quotation {{quote_number}}',
    email_message TEXT DEFAULT NULL,
    pdf_template VARCHAR(50) DEFAULT 'template1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- INVOICE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_prefix VARCHAR(20) DEFAULT 'INV',
    next_number INT DEFAULT 1,
    auto_numbering BOOLEAN DEFAULT TRUE,
    date_format VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    default_due_days INT DEFAULT 30,
    footer TEXT DEFAULT NULL,
    payment_instructions TEXT DEFAULT NULL,
    default_notes TEXT DEFAULT NULL,
    default_terms TEXT DEFAULT NULL,
    admin_notice TEXT DEFAULT NULL,
    pdf_template VARCHAR(50) DEFAULT 'template1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- PAYMENT SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    currency_symbol VARCHAR(10) DEFAULT '$',
    currency_code VARCHAR(10) DEFAULT 'USD',
    currency_position ENUM('before', 'after') DEFAULT 'before',
    thousand_separator VARCHAR(5) DEFAULT ',',
    decimal_separator VARCHAR(5) DEFAULT '.',
    decimal_places INT DEFAULT 2,
    payment_methods JSON DEFAULT NULL,
    payment_instructions TEXT DEFAULT NULL,
    paypal_enabled BOOLEAN DEFAULT FALSE,
    paypal_email VARCHAR(255) DEFAULT NULL,
    payment_page_text TEXT DEFAULT NULL,
    payment_page_footer TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TAX SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tax_name VARCHAR(100) DEFAULT 'GST',
    tax_percentage DECIMAL(5,2) DEFAULT 18.00,
    tax_type ENUM('inclusive', 'exclusive') DEFAULT 'exclusive',
    tax_rules TEXT DEFAULT NULL,
    is_default BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- EMAIL SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    smtp_host VARCHAR(255) DEFAULT '',
    smtp_port INT DEFAULT 587,
    smtp_username VARCHAR(255) DEFAULT '',
    smtp_password VARCHAR(255) DEFAULT '',
    encryption ENUM('none', 'ssl', 'tls') DEFAULT 'tls',
    from_name VARCHAR(255) DEFAULT '',
    from_email VARCHAR(255) DEFAULT '',
    -- Email templates stored as JSON
    templates JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TRANSLATION SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS translation_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    language VARCHAR(10) DEFAULT 'en',
    labels JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- PDF TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS pdf_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_key VARCHAR(50) NOT NULL UNIQUE,
    template_name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    template_config JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- CLIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(100) DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    tax_number VARCHAR(100) DEFAULT NULL,
    gst_number VARCHAR(100) DEFAULT NULL,
    additional_info TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_company (company_name),
    INDEX idx_name (client_name)
) ENGINE=InnoDB;

-- ============================================================
-- QUOTATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    client_id INT NOT NULL,
    quote_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted') DEFAULT 'draft',
    currency VARCHAR(10) DEFAULT 'USD',
    reference VARCHAR(255) DEFAULT NULL,
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT DEFAULT NULL,
    terms TEXT DEFAULT NULL,
    pdf_template VARCHAR(50) DEFAULT 'template1',
    converted_invoice_id INT DEFAULT NULL,
    sent_at DATETIME DEFAULT NULL,
    created_by INT DEFAULT NULL,
    updated_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_quote_number (quote_number),
    INDEX idx_client_id (client_id),
    INDEX idx_status (status),
    INDEX idx_quote_date (quote_date)
) ENGINE=InnoDB;

-- ============================================================
-- QUOTATION ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quotation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1.000,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) DEFAULT 0.00,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    INDEX idx_quotation_id (quotation_id)
) ENGINE=InnoDB;

-- ============================================================
-- INVOICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    client_id INT NOT NULL,
    quotation_id INT DEFAULT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    currency VARCHAR(10) DEFAULT 'USD',
    reference VARCHAR(255) DEFAULT NULL,
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) DEFAULT 0.00,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    balance_due DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT DEFAULT NULL,
    terms TEXT DEFAULT NULL,
    pdf_template VARCHAR(50) DEFAULT 'template1',
    sent_at DATETIME DEFAULT NULL,
    created_by INT DEFAULT NULL,
    updated_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_client_id (client_id),
    INDEX idx_status (status),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB;

-- ============================================================
-- INVOICE ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1.000,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) DEFAULT 0.00,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id)
) ENGINE=InnoDB;

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other') NOT NULL DEFAULT 'bank_transfer',
    transaction_id VARCHAR(255) DEFAULT NULL,
    amount DECIMAL(15,2) NOT NULL,
    notes TEXT DEFAULT NULL,
    status ENUM('pending', 'partial', 'paid', 'failed') DEFAULT 'paid',
    created_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_payment_date (payment_date),
    CONSTRAINT chk_positive_amount CHECK (amount > 0)
) ENGINE=InnoDB;

-- ============================================================
-- EMAIL LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('invoice', 'quotation') NOT NULL,
    entity_id INT NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT DEFAULT NULL,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT DEFAULT NULL,
    sent_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    user_email VARCHAR(255) DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT DEFAULT NULL,
    old_value JSON DEFAULT NULL,
    new_value JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- PREDEFINED LINE ITEMS (General Settings Reference)
-- ============================================================
CREATE TABLE IF NOT EXISTS predefined_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    unit_price DECIMAL(15,2) DEFAULT 0.00,
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
