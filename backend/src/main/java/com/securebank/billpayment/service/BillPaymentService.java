package com.securebank.billpayment.service;

import com.securebank.account.entity.Account;
import com.securebank.account.entity.AccountStatus;
import com.securebank.account.entity.AccountType;
import com.securebank.account.repository.AccountRepository;
import com.securebank.audit.entity.AuditLog;
import com.securebank.audit.repository.AuditLogRepository;
import com.securebank.billpayment.dto.BillPaymentResponseDTO;
import com.securebank.billpayment.dto.PayBillRequestDTO;
import com.securebank.billpayment.entity.BillPayment;
import com.securebank.billpayment.repository.BillPaymentRepository;
import com.securebank.common.exception.AccountRestrictedException;
import com.securebank.common.exception.InsufficientFundsException;
import com.securebank.common.exception.ResourceNotFoundException;
import com.securebank.customer.entity.Customer;
import com.securebank.customer.repository.CustomerRepository;
import com.securebank.ledger.entity.EntryType;
import com.securebank.ledger.entity.LedgerEntry;
import com.securebank.ledger.repository.LedgerRepository;
import com.securebank.notification.entity.Notification;
import com.securebank.notification.repository.NotificationRepository;
import com.securebank.transaction.entity.Transaction;
import com.securebank.transaction.entity.TransactionStatus;
import com.securebank.transaction.entity.TransactionType;
import com.securebank.transaction.repository.TransactionRepository;
import com.securebank.user.entity.User;
import com.securebank.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BillPaymentService {

    private static final BigDecimal SAVINGS_MIN_BALANCE = new BigDecimal("500.00");

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerRepository ledgerRepository;
    private final BillPaymentRepository billPaymentRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final com.securebank.dormant.service.DormantScamService dormantScamService;

    public BillPaymentService(AccountRepository accountRepository,
                              CustomerRepository customerRepository,
                              UserRepository userRepository,
                              TransactionRepository transactionRepository,
                              LedgerRepository ledgerRepository,
                              BillPaymentRepository billPaymentRepository,
                              NotificationRepository notificationRepository,
                              AuditLogRepository auditLogRepository,
                              com.securebank.dormant.service.DormantScamService dormantScamService) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerRepository = ledgerRepository;
        this.billPaymentRepository = billPaymentRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.dormantScamService = dormantScamService;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BillPaymentResponseDTO payBill(String username, PayBillRequestDTO req, String clientIp) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found."));

        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        if (accounts.isEmpty()) {
            throw new ResourceNotFoundException("No bank account found for this customer.");
        }

        // Lock account for update
        Account account = accountRepository.findByIdForUpdate(accounts.get(0).getId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));

        // Status checks
        if (account.getStatus() == AccountStatus.DORMANT) {
            dormantScamService.recordDormantScamAttempt(account, "Bill Payment (" + req.getBillerName() + ")", req.getAmount(), clientIp, user.getUsername());
            throw new AccountRestrictedException("ACCOUNT_DORMANT", "Your account is dormant. Dormant Account Anti-Scam Shield prevented bill payment. Please complete KYC re-verification to reactivate.");
        }
        if (account.getStatus() == AccountStatus.FROZEN) {
            throw new AccountRestrictedException("ACCOUNT_FROZEN", "Your account is frozen. Transactions are disabled.");
        }
        if (account.getStatus() == AccountStatus.CLOSED) {
            throw new AccountRestrictedException("ACCOUNT_CLOSED", "Your account is closed.");
        }

        // Balance check
        BigDecimal newBalance = account.getBalance().subtract(req.getAmount());
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new InsufficientFundsException(account.getAccountNumber(), "Insufficient funds for this bill payment. Current balance: ₹" + account.getBalance());
        }
        if (account.getAccountType() == AccountType.SAVINGS && newBalance.compareTo(SAVINGS_MIN_BALANCE) < 0) {
            throw new InsufficientFundsException(account.getAccountNumber(), String.format(
                    "Minimum balance requirement not met. Balance after debit (₹%.2f) must remain at least ₹%.2f.",
                    newBalance, SAVINGS_MIN_BALANCE));
        }

        // Debit account
        account.setBalance(newBalance);
        account.setLastActivityAt(LocalDateTime.now());
        accountRepository.save(account);

        // Create transaction
        String refNo = "BILL" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"))
                + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        String idempotencyKey = "BILL-" + UUID.randomUUID().toString();

        Transaction tx = new Transaction(
                refNo,
                idempotencyKey,
                account,
                account,
                req.getAmount(),
                TransactionType.BILL_PAYMENT,
                TransactionStatus.SUCCESS,
                req.getBillCategory() + " Bill - " + req.getBillerName() + " (" + req.getConsumerNumber() + ")"
        );
        tx.setCompletedAt(LocalDateTime.now());
        Transaction savedTx = transactionRepository.save(tx);

        // Ledger Entry: DEBIT
        LedgerEntry ledgerEntry = new LedgerEntry(savedTx, account, EntryType.DEBIT, req.getAmount(), newBalance);
        ledgerRepository.save(ledgerEntry);

        // Save BillPayment
        BillPayment billPayment = new BillPayment(
                account,
                savedTx,
                req.getBillCategory(),
                req.getConsumerNumber().trim(),
                req.getAmount(),
                req.getBillerName().trim()
        );
        BillPayment savedBill = billPaymentRepository.save(billPayment);

        // In-app Notification
        notificationRepository.save(new Notification(
                customer,
                "💡 Bill Paid Successfully",
                String.format("₹%.2f paid for %s bill (%s). Ref: %s. New Balance: ₹%.2f",
                        req.getAmount(), req.getBillCategory(), req.getBillerName(), refNo, newBalance),
                "TRANSACTION"
        ));

        // Audit Log
        auditLogRepository.save(new AuditLog(
                user,
                "BILL_PAYMENT",
                "BillPayment",
                savedBill.getId().toString(),
                clientIp,
                "SUCCESS",
                String.format("Paid ₹%.2f to %s [%s]", req.getAmount(), req.getBillerName(), req.getConsumerNumber())
        ));

        return BillPaymentResponseDTO.fromEntity(savedBill, newBalance);
    }

    @Transactional(readOnly = true)
    public List<BillPaymentResponseDTO> getBillPaymentHistory(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found."));
        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        if (accounts.isEmpty()) {
            return List.of();
        }

        Account account = accounts.get(0);
        return billPaymentRepository.findByAccountIdOrderByPaidAtDesc(account.getId())
                .stream()
                .map(bp -> BillPaymentResponseDTO.fromEntity(bp, account.getBalance()))
                .collect(Collectors.toList());
    }
}
