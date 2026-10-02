-- =============================================================================
-- SecureBank Database Schema
-- Tagline: Secure Transactions. Smarter Banking. A Better Tomorrow.
-- Database: MySQL 8.x (InnoDB Engine with UTF-8 support)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS securebank_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE securebank_db;

-- -----------------------------------------------------------------------------
-- 1. Table: users
-- Core authentication credentials and authorization roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ROLE_CUSTOMER', 'ROLE_ADMIN') NOT NULL DEFAULT 'ROLE_CUSTOMER',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_username (username)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. Table: customers
-- Personal identity and demographic information linked to a User
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_customers_email (email),
    INDEX idx_customers_phone (phone_number)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. Table: accounts
-- Financial accounts storing verified balances, account numbers, and dormancy states
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    account_number VARCHAR(16) NOT NULL UNIQUE,
    ifsc_code VARCHAR(16) NOT NULL DEFAULT 'SECURE000001',
    account_type ENUM('SAVINGS', 'CURRENT') NOT NULL DEFAULT 'SAVINGS',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status ENUM('ACTIVE', 'DORMANT', 'FROZEN', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dormant_since TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_accounts_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_account_balance_non_negative CHECK (balance >= 0.00),
    INDEX idx_accounts_lookup (account_number, ifsc_code),
    INDEX idx_accounts_status (status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. Table: transactions
-- Master transaction journal tracking transfers, deposits, and bill payments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(36) NOT NULL UNIQUE,
    idempotency_key VARCHAR(64) NOT NULL UNIQUE,
    sender_account_id BIGINT NOT NULL,
    receiver_account_id BIGINT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type ENUM('TRANSFER', 'BILL_PAYMENT', 'INITIAL_DEPOSIT') NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    description VARCHAR(255) NULL,
    initiated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_tx_sender FOREIGN KEY (sender_account_id) REFERENCES accounts(id),
    CONSTRAINT fk_tx_receiver FOREIGN KEY (receiver_account_id) REFERENCES accounts(id),
    CONSTRAINT chk_tx_amount_positive CHECK (amount > 0.00),
    INDEX idx_tx_reference (reference_number),
    INDEX idx_tx_idempotency (idempotency_key),
    INDEX idx_tx_sender (sender_account_id),
    INDEX idx_tx_receiver (receiver_account_id),
    INDEX idx_tx_date (initiated_at)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. Table: ledger_entries
-- Immutable double-entry bookkeeping (Every transfer produces 1 DEBIT and 1 CREDIT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    entry_type ENUM('DEBIT', 'CREDIT') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    posted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    CONSTRAINT fk_ledger_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ledger_amount_positive CHECK (amount > 0.00),
    INDEX idx_ledger_account_date (account_id, posted_at)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. Table: beneficiaries
-- Saved payees with simulated cooling-off period validation
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS beneficiaries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    beneficiary_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(16) NOT NULL,
    ifsc_code VARCHAR(16) NOT NULL,
    bank_name VARCHAR(50) NOT NULL DEFAULT 'SecureBank',
    nickname VARCHAR(50) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    cooling_off_until TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_beneficiaries_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT uk_customer_beneficiary UNIQUE (customer_id, account_number, ifsc_code)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 7. Table: bill_payments
-- Simulated utility bill payments linked to a transaction debit
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bill_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL,
    transaction_id BIGINT NOT NULL UNIQUE,
    bill_category ENUM('ELECTRICITY', 'WATER', 'MOBILE', 'INTERNET', 'DTH') NOT NULL,
    consumer_number VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    biller_name VARCHAR(100) NOT NULL,
    status ENUM('SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bills_account FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT fk_bills_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 8. Table: reactivation_requests
-- Dormant account reactivation queue submitted by customers for administrative review
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reactivation_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL,
    request_reference VARCHAR(36) NOT NULL UNIQUE,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    verification_details JSON NULL,
    reviewed_by BIGINT NULL,
    review_notes TEXT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_reactivation_account FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT fk_reactivation_admin FOREIGN KEY (reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 9. Table: otp_verifications
-- One-Time Passwords for step-up verification and reactivation (Hashed, expiring, attempt-limited)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    purpose ENUM('TRANSFER_VERIFICATION', 'DORMANT_REACTIVATION', 'MOBILE_CHANGE', 'KYC_CHANGE') NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_otp_user_purpose (user_id, purpose, used)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 10. Table: audit_logs
-- Immutable compliance and security audit trail (Strictly NO passwords or secrets)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NULL,
    ip_address VARCHAR(45) NULL,
    status ENUM('SUCCESS', 'FAILURE') NOT NULL,
    details TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user_time (user_id, created_at),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 11. Table: security_events
-- Threat monitoring, suspicious activity detection, and security alerts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    event_type VARCHAR(50) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('OPEN', 'ACKNOWLEDGED', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_security_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_security_severity (severity),
    INDEX idx_security_status (status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 12. Table: notifications
-- Customer inbox notifications for transactions, security alerts, and system notices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('TRANSACTION', 'SECURITY', 'ACCOUNT', 'SYSTEM') NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_notifications_unread (customer_id, is_read)
) ENGINE=InnoDB;
