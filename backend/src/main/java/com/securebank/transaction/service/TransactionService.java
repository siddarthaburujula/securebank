package com.securebank.transaction.service;

import com.securebank.account.dto.AccountResponseDTO;
import com.securebank.account.entity.Account;
import com.securebank.account.entity.AccountStatus;
import com.securebank.account.repository.AccountRepository;
import com.securebank.audit.entity.AuditLog;
import com.securebank.audit.repository.AuditLogRepository;
import com.securebank.common.exception.*;
import com.securebank.customer.entity.Customer;
import com.securebank.customer.repository.CustomerRepository;
import com.securebank.ledger.entity.EntryType;
import com.securebank.ledger.entity.LedgerEntry;
import com.securebank.ledger.repository.LedgerRepository;
import com.securebank.notification.entity.Notification;
import com.securebank.notification.repository.NotificationRepository;
import com.securebank.transaction.dto.StatementSummaryDTO;
import com.securebank.transaction.dto.TransactionHistoryDTO;
import com.securebank.transaction.dto.TransferRequestDTO;
import com.securebank.transaction.dto.TransferResponseDTO;
import com.securebank.transaction.entity.Transaction;
import com.securebank.transaction.entity.TransactionStatus;
import com.securebank.transaction.entity.TransactionType;
import com.securebank.transaction.repository.TransactionRepository;
import com.securebank.user.entity.User;
import com.securebank.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    // Minimum balance that must be maintained in SAVINGS accounts after a debit
    private static final BigDecimal SAVINGS_MIN_BALANCE = new BigDecimal("500.00");

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerRepository ledgerRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final jakarta.persistence.EntityManager entityManager;
    private final com.securebank.dormant.service.DormantScamService dormantScamService;

    public TransactionService(AccountRepository accountRepository,
                              CustomerRepository customerRepository,
                              UserRepository userRepository,
                              TransactionRepository transactionRepository,
                              LedgerRepository ledgerRepository,
                              AuditLogRepository auditLogRepository,
                              NotificationRepository notificationRepository,
                              jakarta.persistence.EntityManager entityManager,
                              com.securebank.dormant.service.DormantScamService dormantScamService) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerRepository = ledgerRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationRepository = notificationRepository;
        this.entityManager = entityManager;
        this.dormantScamService = dormantScamService;
    }

    // ─── FUND TRANSFER (Core — ACID, Pessimistic Lock) ────────────────────────

    /**
     * Executes a fund transfer atomically with:
     * 1. Idempotency guard (idempotencyKey unique constraint)
     * 2. Pessimistic WRITE locks on both sender and receiver accounts
     *    (always locked in ascending ID order to prevent deadlocks)
     * 3. Pre-transfer validations: account status, sufficient balance, self-transfer
     * 4. Atomic balance debit/credit via setBalance()
     * 5. Ledger double-entry bookkeeping
     * 6. Audit log for compliance
     * 7. In-app notifications for both sender and receiver
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransferResponseDTO initiateTransfer(String username, TransferRequestDTO req, String clientIp) {
        // ── 1. Resolve requesting user's account ─────────────────────────────
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Customer senderCustomer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user: " + username));

        List<Account> senderAccounts = accountRepository.findByCustomerId(senderCustomer.getId());
        if (senderAccounts.isEmpty()) {
            throw new ResourceNotFoundException("No account found for sender.");
        }
        Long senderAccountId = senderAccounts.get(0).getId();

        // ── 2. Resolve receiver account ───────────────────────────────────────
        Account receiverLookup = accountRepository
                .findByAccountNumberAndIfscCode(req.getReceiverAccountNumber(), req.getReceiverIfscCode())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Receiver account not found. Please verify account number and IFSC."));

        Long receiverAccountId = receiverLookup.getId();

        // ── 3. Self-transfer guard ────────────────────────────────────────────
        if (senderAccountId.equals(receiverAccountId)) {
            throw new AccountRestrictedException("SELF_TRANSFER",
                    "You cannot transfer funds to your own account.");
        }

        // ── 4. Idempotency guard ──────────────────────────────────────────────
        if (transactionRepository.existsByIdempotencyKey(req.getIdempotencyKey())) {
            // Return the existing transaction details safely
            Optional<Transaction> existing = transactionRepository.findByIdempotencyKey(req.getIdempotencyKey());
            if (existing.isPresent()) {
                log.warn("Idempotent duplicate request blocked for key: {}", req.getIdempotencyKey());
                TransferResponseDTO idempotentResponse = buildTransferResponse(existing.get(), true);
                return idempotentResponse;
            }
            throw new DuplicateTransactionException(req.getIdempotencyKey());
        }

        // ── 5. Pessimistic locks (always in ascending ID order to prevent deadlock) ──
        Account firstLock  = senderAccountId < receiverAccountId
                ? accountRepository.findByIdForUpdate(senderAccountId).orElseThrow()
                : accountRepository.findByIdForUpdate(receiverAccountId).orElseThrow();
        Account secondLock = senderAccountId < receiverAccountId
                ? accountRepository.findByIdForUpdate(receiverAccountId).orElseThrow()
                : accountRepository.findByIdForUpdate(senderAccountId).orElseThrow();

        // Refresh entities from DB to ensure first-level cache is synchronized after acquiring the lock
        entityManager.refresh(firstLock);
        entityManager.refresh(secondLock);

        Account senderAccount   = senderAccountId.equals(firstLock.getId()) ? firstLock : secondLock;
        Account receiverAccount = receiverAccountId.equals(firstLock.getId()) ? firstLock : secondLock;

        // ── 6. Account status validation ──────────────────────────────────────
        validateAccountForTransfer(senderAccount, "Sender", req.getAmount(), clientIp, user.getUsername());
        validateAccountForTransfer(receiverAccount, "Receiver", req.getAmount(), clientIp, user.getUsername());

        // ── 7. Balance & minimum balance check ────────────────────────────────
        BigDecimal amount = req.getAmount();
        BigDecimal senderBalanceBefore = senderAccount.getBalance();
        BigDecimal balanceAfterDebit   = senderBalanceBefore.subtract(amount);

        if (balanceAfterDebit.compareTo(BigDecimal.ZERO) < 0) {
            auditFailure(user, senderAccount, "TRANSFER_FAILED", clientIp,
                    "Insufficient funds. Requested: ₹" + amount + " | Available: ₹" + senderBalanceBefore);
            throw new InsufficientFundsException(senderAccount.getAccountNumber(),
                    String.format("Insufficient funds. Available balance: ₹%.2f, Requested: ₹%.2f",
                            senderBalanceBefore, amount));
        }

        // Enforce minimum balance for SAVINGS accounts
        if (senderAccount.getAccountType().name().equals("SAVINGS")
                && balanceAfterDebit.compareTo(SAVINGS_MIN_BALANCE) < 0) {
            auditFailure(user, senderAccount, "TRANSFER_FAILED", clientIp,
                    "Savings minimum balance ₹" + SAVINGS_MIN_BALANCE + " would be breached.");
            throw new InsufficientFundsException(senderAccount.getAccountNumber(),
                    String.format("Transfer would breach the minimum savings balance of ₹%.2f. " +
                            "Available for transfer: ₹%.2f",
                            SAVINGS_MIN_BALANCE, senderBalanceBefore.subtract(SAVINGS_MIN_BALANCE)));
        }

        // ── 8. Generate reference number ──────────────────────────────────────
        String referenceNumber = generateReferenceNumber(req.getTransferType());

        // ── 9. Create Transaction record (status = PENDING initially) ─────────
        TransactionType txType = TransactionType.TRANSFER;
        String description = req.getDescription() != null && !req.getDescription().isBlank()
                ? req.getDescription()
                : buildDefaultDescription(req.getTransferType(), senderCustomer.getFullName());

        Transaction transaction = new Transaction(
                referenceNumber,
                req.getIdempotencyKey(),
                senderAccount,
                receiverAccount,
                amount,
                txType,
                TransactionStatus.PENDING,
                description
        );
        transaction = transactionRepository.save(transaction);

        try {
            // ── 10. Atomic balance update ─────────────────────────────────────
            BigDecimal receiverBalanceBefore = receiverAccount.getBalance();
            BigDecimal receiverBalanceAfter  = receiverBalanceBefore.add(amount);

            senderAccount.setBalance(balanceAfterDebit);
            senderAccount.setLastActivityAt(LocalDateTime.now());
            accountRepository.save(senderAccount);

            receiverAccount.setBalance(receiverBalanceAfter);
            receiverAccount.setLastActivityAt(LocalDateTime.now());
            accountRepository.save(receiverAccount);

            // ── 11. Double-entry ledger bookkeeping ───────────────────────────
            LedgerEntry debitEntry = new LedgerEntry(transaction, senderAccount, EntryType.DEBIT, amount, balanceAfterDebit);
            ledgerRepository.save(debitEntry);

            LedgerEntry creditEntry = new LedgerEntry(transaction, receiverAccount, EntryType.CREDIT, amount, receiverBalanceAfter);
            ledgerRepository.save(creditEntry);

            // ── 12. Mark transaction SUCCESS ──────────────────────────────────
            transaction.setStatus(TransactionStatus.SUCCESS);
            transaction.setCompletedAt(LocalDateTime.now());
            transaction = transactionRepository.save(transaction);

            // ── 13. Audit log ─────────────────────────────────────────────────
            auditLogRepository.save(new AuditLog(
                    user,
                    "FUND_TRANSFER",
                    "Transaction",
                    referenceNumber,
                    clientIp,
                    "SUCCESS",
                    String.format("Transfer of ₹%.2f from [%s] to [%s] via %s",
                            amount,
                            senderAccount.getAccountNumber(),
                            receiverAccount.getAccountNumber(),
                            req.getTransferType())
            ));

            // ── 14. In-app notifications ──────────────────────────────────────
            Customer receiverCustomer = receiverAccount.getCustomer();
            sendTransferNotifications(senderCustomer, receiverCustomer, transaction, amount, req.getTransferType());

            log.info("Transfer SUCCESS | Ref: {} | {} → {} | ₹{}", referenceNumber,
                    senderAccount.getAccountNumber(), receiverAccount.getAccountNumber(), amount);

            return buildTransferResponse(transaction, false);

        } catch (Exception ex) {
            // Mark the transaction as FAILED in case of any mid-flight error
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            auditFailure(user, senderAccount, "TRANSFER_FAILED", clientIp, ex.getMessage());
            log.error("Transfer FAILED | Ref: {} | Error: {}", referenceNumber, ex.getMessage(), ex);
            throw ex;
        }
    }

    // ─── TRANSACTION HISTORY (Paginated) ─────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TransactionHistoryDTO> getTransactionHistory(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found."));

        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        if (accounts.isEmpty()) {
            return Page.empty();
        }

        Long accountId = accounts.get(0).getId();
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "initiatedAt"));

        return transactionRepository.findByAccountId(accountId, pageable)
                .map(tx -> mapToHistoryDTO(tx, accountId));
    }

    // ─── GET SINGLE TRANSACTION ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TransactionHistoryDTO getTransactionByReference(String username, String referenceNumber) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found."));

        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        if (accounts.isEmpty()) {
            throw new ResourceNotFoundException("No account found for this user.");
        }
        Long accountId = accounts.get(0).getId();

        Transaction tx = transactionRepository.findByReferenceNumber(referenceNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transaction not found: " + referenceNumber));

        // Security: ensure this transaction belongs to the requesting user
        boolean isSender   = tx.getSenderAccount().getId().equals(accountId);
        boolean isReceiver = tx.getReceiverAccount().getId().equals(accountId);
        if (!isSender && !isReceiver) {
            throw new AccountRestrictedException("UNAUTHORIZED_TX",
                    "You do not have permission to view this transaction.");
        }

        return mapToHistoryDTO(tx, accountId);
    }

    // ─── ACCOUNT STATEMENTS & CSV EXPORT ─────────────────────────────────────

    @Transactional(readOnly = true)
    public StatementSummaryDTO getStatement(String username, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (startDate == null) {
            startDate = java.time.LocalDate.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = java.time.LocalDate.now();
        }
        if (startDate.isAfter(endDate)) {
            throw new BadRequestException("Start date cannot be after end date.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found."));
        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        if (accounts.isEmpty()) {
            throw new ResourceNotFoundException("No account found for this user.");
        }
        Account account = accounts.get(0);
        Long accountId = account.getId();

        LocalDateTime startDt = startDate.atStartOfDay();
        LocalDateTime endDt = endDate.atTime(23, 59, 59);

        List<Transaction> txList = transactionRepository.findByAccountIdAndDateRange(accountId, startDt, endDt);

        BigDecimal totalDebits = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;
        List<TransactionHistoryDTO> dtoList = new ArrayList<>();

        for (Transaction tx : txList) {
            TransactionHistoryDTO dto = mapToHistoryDTO(tx, accountId);
            dtoList.add(dto);
            if ("DEBIT".equalsIgnoreCase(dto.getEntryType())) {
                totalDebits = totalDebits.add(tx.getAmount());
            } else {
                totalCredits = totalCredits.add(tx.getAmount());
            }
        }

        BigDecimal closingBalance = account.getBalance();
        BigDecimal openingBalance = closingBalance.subtract(totalCredits).add(totalDebits);
        if (openingBalance.compareTo(BigDecimal.ZERO) < 0) {
            openingBalance = BigDecimal.ZERO;
        }

        StatementSummaryDTO statement = new StatementSummaryDTO();
        statement.setAccountNumber(account.getAccountNumber());
        statement.setCustomerName(customer.getFullName());
        statement.setStartDate(startDate);
        statement.setEndDate(endDate);
        statement.setOpeningBalance(openingBalance);
        statement.setTotalDebits(totalDebits);
        statement.setTotalCredits(totalCredits);
        statement.setClosingBalance(closingBalance);
        statement.setTransactionCount(dtoList.size());
        statement.setTransactions(dtoList);

        return statement;
    }

    @Transactional(readOnly = true)
    public String exportStatementCsv(String username, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        StatementSummaryDTO summary = getStatement(username, startDate, endDate);
        StringBuilder sb = new StringBuilder();
        sb.append("SecureBank - Account Statement\n");
        sb.append("Account Number,").append(summary.getAccountNumber()).append("\n");
        sb.append("Customer Name,").append(summary.getCustomerName()).append("\n");
        sb.append("Period,").append(summary.getStartDate()).append(" to ").append(summary.getEndDate()).append("\n");
        sb.append("Opening Balance,INR ").append(summary.getOpeningBalance()).append("\n");
        sb.append("Closing Balance,INR ").append(summary.getClosingBalance()).append("\n");
        sb.append("Total Debits,INR ").append(summary.getTotalDebits()).append("\n");
        sb.append("Total Credits,INR ").append(summary.getTotalCredits()).append("\n\n");

        sb.append("Date,Reference Number,Type,Description,Debit,Credit,Counterparty,Status\n");
        for (TransactionHistoryDTO t : summary.getTransactions()) {
            sb.append(t.getInitiatedAt()).append(",");
            sb.append(t.getReferenceNumber()).append(",");
            sb.append(t.getTransferType()).append(",");
            sb.append("\"").append(t.getDescription() != null ? t.getDescription().replace("\"", "\"\"") : "").append("\",");
            if ("DEBIT".equalsIgnoreCase(t.getEntryType())) {
                sb.append(t.getAmount()).append(",,");
            } else {
                sb.append(",").append(t.getAmount()).append(",");
            }
            sb.append("\"").append(t.getCounterpartyName() != null ? t.getCounterpartyName().replace("\"", "\"\"") : "").append("\",");
            sb.append(t.getStatus()).append("\n");
        }
        return sb.toString();
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private void validateAccountForTransfer(Account account, String role, BigDecimal amount, String clientIp, String username) {
        if (account.getStatus() == AccountStatus.FROZEN) {
            throw new AccountRestrictedException("ACCOUNT_FROZEN",
                    role + " account is frozen. Transfers are not permitted.");
        }
        if (account.getStatus() == AccountStatus.CLOSED) {
            throw new AccountRestrictedException("ACCOUNT_CLOSED",
                    role + " account is closed and cannot participate in transfers.");
        }
        if (account.getStatus() == AccountStatus.DORMANT) {
            dormantScamService.recordDormantScamAttempt(account, "Transfer (" + role + ")", amount, clientIp, username);
            throw new AccountRestrictedException("ACCOUNT_DORMANT",
                    role + " account is dormant. Dormant Account Anti-Scam Shield prevented transfer. Complete KYC re-verification to reactivate.");
        }
    }

    private TransferResponseDTO buildTransferResponse(Transaction tx, boolean idempotent) {
        TransferResponseDTO response = new TransferResponseDTO();
        response.setReferenceNumber(tx.getReferenceNumber());
        response.setStatus(tx.getStatus().name());
        response.setAmount(tx.getAmount());
        response.setSenderAccountMasked(AccountResponseDTO.maskAccountNumber(tx.getSenderAccount().getAccountNumber()));
        response.setReceiverAccountMasked(AccountResponseDTO.maskAccountNumber(tx.getReceiverAccount().getAccountNumber()));
        response.setReceiverName(tx.getReceiverAccount().getCustomer().getFullName());
        response.setTransferType(tx.getTransactionType().name());
        response.setDescription(tx.getDescription());
        response.setInitiatedAt(tx.getInitiatedAt());
        response.setCompletedAt(tx.getCompletedAt());
        response.setSenderBalanceAfter(tx.getSenderAccount().getBalance());
        response.setIdempotent(idempotent);
        return response;
    }

    private TransactionHistoryDTO mapToHistoryDTO(Transaction tx, Long myAccountId) {
        TransactionHistoryDTO dto = new TransactionHistoryDTO();
        dto.setId(tx.getId());
        dto.setReferenceNumber(tx.getReferenceNumber());
        dto.setAmount(tx.getAmount());
        dto.setStatus(tx.getStatus().name());
        dto.setTransferType(tx.getTransactionType().name());
        dto.setDescription(tx.getDescription());
        dto.setInitiatedAt(tx.getInitiatedAt());
        dto.setCompletedAt(tx.getCompletedAt());

        boolean isSender = tx.getSenderAccount().getId().equals(myAccountId);
        boolean isSelf   = tx.getSenderAccount().getId().equals(tx.getReceiverAccount().getId());

        if (isSelf) {
            dto.setEntryType("CREDIT");
            dto.setCounterpartyName("SecureBank (Initial Deposit)");
            dto.setCounterpartyAccountMasked(tx.getSenderAccount().getAccountNumber());
        } else if (isSender) {
            dto.setEntryType("DEBIT");
            dto.setCounterpartyName(tx.getReceiverAccount().getCustomer().getFullName());
            dto.setCounterpartyAccountMasked(tx.getReceiverAccount().getAccountNumber());
        } else {
            dto.setEntryType("CREDIT");
            dto.setCounterpartyName(tx.getSenderAccount().getCustomer().getFullName());
            dto.setCounterpartyAccountMasked(tx.getSenderAccount().getAccountNumber());
        }

        return dto;
    }

    private String generateReferenceNumber(String transferType) {
        String prefix = switch (transferType.toUpperCase()) {
            case "NEFT" -> "NEFT";
            case "RTGS" -> "RTGS";
            case "IMPS" -> "IMPS";
            case "UPI"  -> "UPI";
            default     -> "TXN";
        };
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"));
        String uniquePart = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return prefix + datePart + uniquePart;
    }

    private String buildDefaultDescription(String transferType, String senderName) {
        return transferType.toUpperCase() + " transfer by " + senderName;
    }

    private void auditFailure(User user, Account account, String action, String ip, String detail) {
        try {
            auditLogRepository.save(new AuditLog(user, action, "Account", account.getAccountNumber(), ip, "FAILURE", detail));
        } catch (Exception e) {
            log.warn("Failed to write audit log for action {}: {}", action, e.getMessage());
        }
    }

    private void sendTransferNotifications(Customer sender, Customer receiver, Transaction tx, BigDecimal amount, String type) {
        try {
            // Sender: debit alert
            notificationRepository.save(new Notification(
                    sender,
                    "💸 Amount Debited",
                    String.format("₹%.2f debited from your account via %s. Ref: %s. New Balance: ₹%.2f",
                            amount, type, tx.getReferenceNumber(), tx.getSenderAccount().getBalance()),
                    "TRANSACTION"
            ));

            // Receiver: credit alert
            notificationRepository.save(new Notification(
                    receiver,
                    "💰 Amount Credited",
                    String.format("₹%.2f credited to your account via %s from %s. Ref: %s.",
                            amount, type, sender.getFullName(), tx.getReferenceNumber()),
                    "TRANSACTION"
            ));
        } catch (Exception e) {
            log.warn("Failed to create transfer notifications: {}", e.getMessage());
        }
    }
}
