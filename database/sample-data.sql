-- =============================================================================
-- SecureBank Sample & Demonstration Seed Data
-- Passwords:
--   Customers (siddartha, rahul, vikram): Password@123
--   Administrator (admin): Admin@123
-- =============================================================================

USE securebank_db;

-- Clear any existing records in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE security_events;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE otp_verifications;
TRUNCATE TABLE reactivation_requests;
TRUNCATE TABLE bill_payments;
TRUNCATE TABLE beneficiaries;
TRUNCATE TABLE ledger_entries;
TRUNCATE TABLE transactions;
TRUNCATE TABLE accounts;
TRUNCATE TABLE customers;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. Seed Users
-- -----------------------------------------------------------------------------
INSERT INTO users (id, username, password_hash, role, enabled, created_at) VALUES
-- Admin user (Password: Admin@123)
(1, 'admin', '$2a$10$d4ItNRKttUrA6jAGm8nU2.IlmLbz761LM1lpXXSUg8PmfxHg24Tfy', 'ROLE_ADMIN', TRUE, NOW()),
-- Customer 1: Siddartha (Password: Password@123)
(2, 'siddartha', '$2a$10$KKy74sJZM.2u2iuJ7GaqeuMvRiYsTwZqUlHsX5u9C8Oj4udUDV/ZS', 'ROLE_CUSTOMER', TRUE, NOW()),
-- Customer 2: Rahul (Password: Password@123)
(3, 'rahul', '$2a$10$KKy74sJZM.2u2iuJ7GaqeuMvRiYsTwZqUlHsX5u9C8Oj4udUDV/ZS', 'ROLE_CUSTOMER', TRUE, NOW()),
-- Customer 3: Vikram (Dormant demo) (Password: Password@123)
(4, 'vikram', '$2a$10$KKy74sJZM.2u2iuJ7GaqeuMvRiYsTwZqUlHsX5u9C8Oj4udUDV/ZS', 'ROLE_CUSTOMER', TRUE, NOW());

-- -----------------------------------------------------------------------------
-- 2. Seed Customers
-- -----------------------------------------------------------------------------
INSERT INTO customers (id, user_id, full_name, email, phone_number, date_of_birth, address, created_at) VALUES
(1, 2, 'Siddartha Varma', 'siddartha@securebank.com', '+919876543210', '1998-05-15', 'Plot 42, Hitech City, Hyderabad, Telangana - 500081', NOW()),
(2, 3, 'Rahul Sharma', 'rahul@securebank.com', '+919876543211', '1999-08-22', 'Flat 301, Indiranagar, Bengaluru, Karnataka - 560038', NOW()),
(3, 4, 'Vikram Malhotra', 'vikram@securebank.com', '+919876543212', '1995-12-10', 'B-12, Bandra West, Mumbai, Maharashtra - 400050', NOW());

-- -----------------------------------------------------------------------------
-- 3. Seed Accounts
-- Account 1: Siddartha (Balance: ₹50,000.00, ACTIVE)
-- Account 2: Rahul (Balance: ₹10,000.00, ACTIVE)
-- Account 3: Vikram (Balance: ₹25,000.00, DORMANT - inactive for >90 days)
-- -----------------------------------------------------------------------------
INSERT INTO accounts (id, customer_id, account_number, ifsc_code, account_type, balance, status, last_activity_at, dormant_since, created_at) VALUES
(1, 1, '100100000001', 'SECURE000001', 'SAVINGS', 50000.00, 'ACTIVE', NOW(), NULL, NOW()),
(2, 2, '100100000002', 'SECURE000001', 'SAVINGS', 10000.00, 'ACTIVE', NOW(), NULL, NOW()),
(3, 3, '100100000003', 'SECURE000001', 'SAVINGS', 25000.00, 'DORMANT', DATE_SUB(NOW(), INTERVAL 120 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 120 DAY));

-- -----------------------------------------------------------------------------
-- 4. Seed Initial Funding Transactions & Double-Entry Ledger
-- -----------------------------------------------------------------------------
-- Initial Deposit for Siddartha (₹50,000)
INSERT INTO transactions (id, reference_number, idempotency_key, sender_account_id, receiver_account_id, amount, transaction_type, status, description, initiated_at, completed_at) VALUES
(1, 'TXN-INIT-100100000001', 'INIT-DEP-100100000001', 1, 1, 50000.00, 'INITIAL_DEPOSIT', 'SUCCESS', 'Opening Account Initial Deposit', NOW(), NOW()),
(2, 'TXN-INIT-100100000002', 'INIT-DEP-100100000002', 2, 2, 10000.00, 'INITIAL_DEPOSIT', 'SUCCESS', 'Opening Account Initial Deposit', NOW(), NOW()),
(3, 'TXN-INIT-100100000003', 'INIT-DEP-100100000003', 3, 3, 25000.00, 'INITIAL_DEPOSIT', 'SUCCESS', 'Opening Account Initial Deposit', DATE_SUB(NOW(), INTERVAL 120 DAY), DATE_SUB(NOW(), INTERVAL 120 DAY));

-- Corresponding Ledger Entries
INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, balance_after, posted_at) VALUES
(1, 1, 1, 'CREDIT', 50000.00, 50000.00, NOW()),
(2, 2, 2, 'CREDIT', 10000.00, 10000.00, NOW()),
(3, 3, 3, 'CREDIT', 25000.00, 25000.00, DATE_SUB(NOW(), INTERVAL 120 DAY));

-- -----------------------------------------------------------------------------
-- 5. Seed Beneficiaries
-- Siddartha has saved Rahul as a trusted beneficiary
-- -----------------------------------------------------------------------------
INSERT INTO beneficiaries (id, customer_id, beneficiary_name, account_number, ifsc_code, bank_name, nickname, active, cooling_off_until, created_at) VALUES
(1, 1, 'Rahul Sharma', '100100000002', 'SECURE000001', 'SecureBank', 'Rahul Friend', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

-- -----------------------------------------------------------------------------
-- 6. Seed Welcome & Security Notifications
-- -----------------------------------------------------------------------------
INSERT INTO notifications (id, customer_id, title, message, type, is_read, created_at) VALUES
(1, 1, 'Welcome to SecureBank', 'Your Savings Account 100100000001 has been activated with ₹50,000 initial balance.', 'ACCOUNT', TRUE, NOW()),
(2, 1, 'Beneficiary Added', 'Beneficiary Rahul Sharma (100100000002) was added successfully.', 'SECURITY', FALSE, NOW()),
(3, 2, 'Welcome to SecureBank', 'Your Savings Account 100100000002 has been activated with ₹10,000 initial balance.', 'ACCOUNT', TRUE, NOW()),
(4, 3, 'Account Marked Dormant', 'No debit transactions detected for over 90 days. Account marked DORMANT for your protection.', 'SECURITY', FALSE, DATE_SUB(NOW(), INTERVAL 30 DAY));

-- -----------------------------------------------------------------------------
-- 7. Seed Initial Audit Logs
-- -----------------------------------------------------------------------------
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, ip_address, status, details, created_at) VALUES
(1, 2, 'ACCOUNT_CREATED', 'ACCOUNT', '100100000001', '127.0.0.1', 'SUCCESS', 'Account opened with initial deposit of ₹50,000.00', NOW()),
(2, 3, 'ACCOUNT_CREATED', 'ACCOUNT', '100100000002', '127.0.0.1', 'SUCCESS', 'Account opened with initial deposit of ₹10,000.00', NOW()),
(3, 4, 'DORMANT_STATUS_TRIGGERED', 'ACCOUNT', '100100000003', 'SYSTEM', 'SUCCESS', 'Account marked DORMANT due to 90-day inactivity threshold', DATE_SUB(NOW(), INTERVAL 30 DAY));

-- -----------------------------------------------------------------------------
-- 8. Seed Security Event for Dormant Account
-- -----------------------------------------------------------------------------
INSERT INTO security_events (id, user_id, event_type, severity, description, status, detected_at) VALUES
(1, 4, 'DORMANT_ACCOUNT_DETECTED', 'MEDIUM', 'Account 100100000003 transitioned to DORMANT status due to inactivity.', 'OPEN', DATE_SUB(NOW(), INTERVAL 30 DAY));
