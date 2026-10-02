# 🏦 SecureBank — Full-Stack Online Banking & Transaction Management System

> **Secure Transactions. Smarter Banking. A Better Tomorrow.**

SecureBank is a production-grade, educational online banking simulation platform built with **Spring Boot 3**, **React**, and **MySQL**. It demonstrates real-world banking architecture including ACID-compliant transaction processing, double-entry bookkeeping, pessimistic locking, idempotency controls, dormant account protection, and role-based administration.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              React Frontend (Vite + Tailwind CSS)            │
│   Login · Dashboard · Transfer · Beneficiaries · Bills      │
│           Statements · Dormant · Admin Portal               │
└─────────────────┬────────────────────────────────────────────┘
                  │ JWT Auth · REST API (Axios + Proxy)
┌─────────────────▼────────────────────────────────────────────┐
│         Spring Boot 3.x REST API (Port 8080)                 │
│  Spring Security 6 · JWT (HS512) · BCrypt · Validation      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Core Business Modules                    │   │
│  │  ✓ Atomic Transfer Engine  ✓ Double-Entry Ledger     │   │
│  │  ✓ Idempotency Guard       ✓ Dormant Account Engine  │   │
│  │  ✓ Beneficiary Cooling-Off ✓ Bill Payment Engine     │   │
│  │  ✓ Audit Trail Logger      ✓ Admin Governance Portal │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────┬────────────────────────────────────────────┘
                  │ HikariCP Connection Pool · Pessimistic Lock
┌─────────────────▼────────────────────────────────────────────┐
│                  MySQL 8.x Database                          │
│  users · customers · accounts · transactions · ledger_entries│
│  beneficiaries · bill_payments · reactivation_requests      │
│  audit_logs · notifications                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Features Implemented

### 🔐 Security & Authentication
- JWT (HS512) stateless authentication with 24-hour token expiry
- BCrypt password hashing (cost factor 10)
- Spring Security 6 role-based access control (`ROLE_CUSTOMER`, `ROLE_ADMIN`)
- Immutable audit trail for all security events

### 💰 Transaction Engine
- **ACID-compliant atomic fund transfers** with Spring `@Transactional(isolation = SERIALIZABLE)`
- **Pessimistic write locking** (`PESSIMISTIC_WRITE`) prevents race conditions in concurrent transfers
- **Idempotency keys** — retrying a transfer with the same key returns the existing transaction (no double-charge)
- Transfer types: IMPS, NEFT, RTGS, UPI
- Minimum balance protection for SAVINGS accounts (₹500 buffer)
- Account status validation (ACTIVE required for both sender and receiver)

### 📒 Double-Entry Ledger Bookkeeping
- Every transfer creates two `LedgerEntry` records: DEBIT (sender) and CREDIT (receiver)
- Opening balance calculation: `closing_balance - total_credits + total_debits` within the period

### 👥 Beneficiary Management
- Add beneficiaries by Account Number + IFSC code (automatically resolved to customer name)
- **30-minute cooling-off period** — transfers to newly added beneficiaries are blocked for 30 minutes
- Duplicate beneficiary check per user

### 🧾 Bill Payments
- Categories: ELECTRICITY, WATER, MOBILE, INTERNET, DTH
- Creates a real ledger debit and reduces account balance atomically

### 🛡️ Dormant Account Safety & Anti-Scam Shield (Core Innovation)
- **Automatic Dormancy Detection**: Accounts inactive for 90+ days or manually placed by administration due to lack of transactions are locked under the **Dormant Scam Shield**.
- **Complete Debit Freeze**: Transfers, withdrawals, and bill payments from dormant accounts are blocked with `403 ACCOUNT_DORMANT` to prevent cybercriminals and rogue actors from siphoning unattended balances.
- **Insider Threat & Rogue Officer Scam Prevention**:
  - Bank officers **cannot** arbitrarily activate or unfreeze a dormant account without a customer-submitted application.
  - Profile alterations (address, email, phone, Aadhaar) on dormant accounts by bank personnel are strictly prohibited.
- **Original Details Re-KYC Before Modification**:
  - The customer must first authenticate and re-verify using their **original registered KYC details** (Aadhaar & PAN 2FA).
  - Only after original KYC authentication can the customer submit change requests (new email, phone, or address).
- **Two-Step Verification on Officer Side**:
  - Officer approvals require a dynamic **Officer 2FA Security Key** dispatched to `admin@securebank.com`.
  - Every review action is permanently recorded in the immutable audit log with officer identity, timestamp, and client IP.
- **Automatic Status Transition**:
  - Once verified and approved by the officer with 2FA, the account immediately transitions to `ACTIVE`, clearing dormancy restrictions and restoring all debit capabilities.

### ✉️ Web Mail & OTP Simulation System
- Interactive banking webmail simulation (`/mail`) with dedicated inboxes for all customers and bank officers (`admin@securebank.com`).
- Live OTP dispatch, account alert notifications, and security alert monitoring.
- Allows real-time viewing of 2FA OTPs without hardcoded placeholders or insecure display on forms.

### 🏛️ Admin Governance Portal
- Comprehensive account ledger overview with risk indicators (CRITICAL / HIGH / MEDIUM / LOW).
- Manual dormancy enforcement for accounts with months of inactivity.
- Dormant Approvals queue with side-by-side comparison of old vs. updated customer details.
- Paginated, tamper-evident security audit trail viewer.

### 📊 Statements & Reports
- Account statement with opening/closing balances and transaction breakdown
- Custom date range support
- CSV export (downloadable file)

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend Framework** | Spring Boot 3.3.4 |
| **Language** | Java 21 (LTS) |
| **Security** | Spring Security 6, JWT (JJWT 0.12) |
| **Database** | MySQL 8.x (InnoDB / ACID) |
| **ORM** | Spring Data JPA + Hibernate 6 |
| **Connection Pool** | HikariCP |
| **Frontend Framework** | React 18 (Vite 6) |
| **Styling** | Tailwind CSS v4 |
| **HTTP Client** | Axios |
| **Icons** | Lucide React |
| **Build Tool (Backend)** | Apache Maven |
| **Build Tool (Frontend)** | Vite |

---

## 📂 Project Structure

```
ip_project/
├── backend/                          # Spring Boot Application
│   ├── src/main/java/com/securebank/
│   │   ├── auth/                     # JWT auth, login, register
│   │   ├── account/                  # Account management, dashboard
│   │   ├── transaction/              # Transfer engine, history, statements
│   │   ├── beneficiary/              # Beneficiary CRUD + cooling-off
│   │   ├── billpayment/              # Bill payment engine
│   │   ├── dormant/                  # Dormant detection + reactivation
│   │   ├── admin/                    # Admin governance portal
│   │   ├── ledger/                   # Double-entry ledger
│   │   ├── audit/                    # Immutable audit trail
│   │   ├── notification/             # In-app notifications
│   │   ├── security/                 # JWT filter, UserDetails
│   │   ├── config/                   # Spring Security, CORS
│   │   └── common/                   # ApiResponse, exceptions
│   ├── src/main/resources/
│   │   └── application.yml           # DB config, JWT secret, JPA
│   └── pom.xml
├── frontend/                         # React Application
│   ├── src/
│   │   ├── pages/                    # All page components
│   │   ├── components/               # Navbar, Sidebar, ProtectedRoute
│   │   ├── context/                  # AuthContext (JWT storage)
│   │   ├── api/                      # Axios client with interceptors
│   │   └── index.css                 # Tailwind + glass UI utilities
│   └── vite.config.js                # Proxy: /api → localhost:8080
├── database/
│   ├── schema.sql                    # DDL for all 10 tables
│   └── sample-data.sql               # Seed data with BCrypt passwords
├── SecureBank_Postman_Collection.json # 30+ API tests
└── README.md
```

---

## 🚀 Setup & Running Locally

### Prerequisites
| Requirement | Version |
|-------------|---------|
| Java (JDK) | 21+ |
| Apache Maven | 3.8+ |
| MySQL | 8.x |
| Node.js | 18+ |
| npm | 9+ |

### Quick Start (One-Click)
On Windows, simply run:
```bat
start-all.bat
```
This automatically launches both the Spring Boot Backend (Port 8080) and React Vite Frontend (Port 5173) in separate command windows.

### Docker Compose (Full-Stack Deployment)
To start MySQL 8, Spring Boot Backend, and React Frontend in Docker containers:
```bash
docker compose up --build
```
- Frontend: http://localhost:80
- Backend:  http://localhost:8080
- MySQL:    localhost:3306

---

### Step 1: Database Setup (Manual Local Setup)

```sql
-- Option A: Fresh install
mysql -u root -p < database/schema.sql
mysql -u root -p < database/sample-data.sql

-- Option B: Only seed data (schema exists)
mysql -u root -p securebank_db < database/sample-data.sql
```

### Step 2: Configure Database Password

Edit `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/securebank_db
    username: root
    password: root           # ← Change to your MySQL root password
```

Or set environment variable:
```powershell
$env:SPRING_DATASOURCE_PASSWORD = "your_password"
```

### Step 3: Run Backend Tests & Start

```bash
cd backend
mvn clean test             # Runs all 11 integration & unit tests
mvn spring-boot:run        # Starts backend on http://localhost:8080
```

Verify backend health:
```
GET http://localhost:8080/api/health
→ {"status": "UP", "database": "CONNECTED"}
```

### Step 4: Start Frontend Dev Server

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**.

---

## 📚 Academic Documentation & Viva Preparation
For college submission, project defense, DFDs, ERDs, and comprehensive viva preparation:
👉 See [`docs/ACADEMIC_DOCUMENTATION.md`](file:///c:/ip_project/docs/ACADEMIC_DOCUMENTATION.md)
- Level 0, Level 1, Level 2 Data Flow Diagrams (DFD)
- Complete Entity Relationship Diagram (ERD)
- ACID & Pessimistic Locking Mathematical Analysis
- 30-Question Viva Voce Examination Guide with In-Depth Technical Answers

---

## 👤 Demo Accounts

| Username | Password | Role | Balance | Account Status |
|----------|----------|------|---------|----------------|
| `siddartha` | `Password@123` | Customer | ₹50,000 | ACTIVE |
| `rahul` | `Password@123` | Customer | ₹10,000 | ACTIVE |
| `vikram` | `Password@123` | Customer | ₹25,000 | **DORMANT** |
| `admin` | `Admin@123` | Administrator | — | — |

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new customer |
| POST | `/api/auth/login` | None | Login → JWT token |
| POST | `/api/auth/logout` | Bearer | Logout |

### Account & Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Backend health check |
| GET | `/api/accounts/dashboard` | Bearer | Balance, recent transactions, notifications |
| GET | `/api/accounts/lookup?accountNumber=&ifscCode=` | Bearer | Verify receiver account |

### Transactions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/transactions/transfer` | Bearer | Atomic fund transfer |
| GET | `/api/transactions/history?page=&size=` | Bearer | Paginated transaction history |
| GET | `/api/transactions/{referenceNumber}` | Bearer | Transaction by reference |
| GET | `/api/transactions/statement` | Bearer | Account statement (JSON) |
| GET | `/api/transactions/statement/csv` | Bearer | Download statement as CSV |

### Beneficiaries
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/beneficiaries` | Bearer | List my beneficiaries |
| POST | `/api/beneficiaries` | Bearer | Add beneficiary |
| DELETE | `/api/beneficiaries/{id}` | Bearer | Delete beneficiary |

### Bill Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bills/pay` | Bearer | Pay a utility bill |
| GET | `/api/bills/history` | Bearer | Bill payment history |

### Dormant Account
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/dormant/reactivate` | Bearer | Submit reactivation request |
| GET | `/api/dormant/requests` | Bearer | My reactivation requests |

### Admin (ROLE_ADMIN Only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/accounts` | Admin | All bank accounts |
| POST | `/api/admin/accounts/{id}/freeze` | Admin | Freeze an account |
| POST | `/api/admin/accounts/{id}/unfreeze` | Admin | Unfreeze an account |
| GET | `/api/admin/reactivations` | Admin | Pending reactivation requests |
| POST | `/api/admin/reactivations/{id}/review` | Admin | Approve/reject reactivation |
| GET | `/api/admin/audits?page=&size=` | Admin | Audit log (immutable) |

---

## 🧪 Testing with Postman

1. Import `SecureBank_Postman_Collection.json` into Postman
2. Run **"Login (Siddartha - Customer)"** → Token auto-saved
3. Run **"Login (Admin)"** → Admin token auto-saved
4. Execute any other requests — auth is pre-configured
5. The **Security & Edge Case Tests** folder verifies:
   - Unauthenticated access → `401`
   - Customer accessing admin → `403`
   - Transfer to dormant account → `403 ACCOUNT_DORMANT`
   - Idempotent duplicate transfer → `isIdempotent: true`
   - Insufficient funds → `400/422`

---

## 🔒 Security Design

| Feature | Implementation |
|---------|----------------|
| Password Storage | BCrypt (strength=10) — never stored in plain text |
| Token Security | JWT signed with HS512 (256-bit secret) |
| Concurrency Safety | Pessimistic WRITE lock on account rows during transfers |
| Idempotency | Transfer idempotency key prevents double-charges on retry |
| Account Protection | Status checks (ACTIVE/FROZEN/DORMANT/CLOSED) before any debit |
| Admin Auditing | Every admin action is recorded in immutable `audit_logs` table |
| CORS | Configured for localhost development (5173, 5174, 3000) |
| Minimum Balance | ₹500 minimum balance maintained in SAVINGS accounts |

---

## 📊 Database Schema Overview

```
users (id, username, password_hash, role, enabled)
  └─ customers (id, user_id, full_name, email, phone_number, dob, address)
       └─ accounts (id, customer_id, account_number, ifsc_code, type, balance, status)
            ├─ transactions (id, sender_account_id, receiver_account_id, amount, type, status, idempotency_key, reference_number)
            │    └─ ledger_entries (id, account_id, transaction_id, entry_type, amount, balance_after)
            ├─ beneficiaries (id, customer_id, account_number, ifsc_code, cooling_off_until)
            ├─ bill_payments (id, customer_id, account_id, bill_category, biller_name, amount, status)
            ├─ reactivation_requests (id, customer_id, reason, status, admin_notes)
            ├─ notifications (id, customer_id, title, message, is_read)
            └─ audit_logs (id, user_id, action, entity_type, entity_id, ip_address, outcome)
```

---

## 📝 Academic Context

This project was built as a college project demonstrating:

1. **Database Design**: Normalized relational schema with proper FK constraints, indexes, and InnoDB engine for ACID support
2. **Transaction Management**: Spring's declarative `@Transactional` with isolation levels and pessimistic locking
3. **Security Principles**: Stateless JWT auth, role-based authorization, BCrypt password hashing
4. **Design Patterns**: Service layer pattern, Repository pattern, DTO pattern, Idempotency pattern
5. **REST API Design**: Proper HTTP methods, status codes, consistent response envelopes
6. **Frontend Architecture**: SPA with React Context for auth state, protected routes, Axios interceptors

---

## 📜 License

MIT License — For educational use only. Not for production banking use.

---

*Built with ❤️ using Spring Boot 3, React, and MySQL*
