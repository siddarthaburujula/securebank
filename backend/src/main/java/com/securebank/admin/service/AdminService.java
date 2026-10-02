package com.securebank.admin.service;

import com.securebank.account.entity.Account;
import com.securebank.account.entity.AccountStatus;
import com.securebank.account.repository.AccountRepository;
import com.securebank.account.service.AccountNumberGenerator;
import com.securebank.admin.dto.*;
import com.securebank.audit.dto.AuditLogDTO;
import com.securebank.audit.entity.AuditLog;
import com.securebank.audit.repository.AuditLogRepository;
import com.securebank.common.exception.BadRequestException;
import com.securebank.common.exception.DuplicateResourceException;
import com.securebank.common.exception.ResourceNotFoundException;
import com.securebank.customer.entity.Customer;
import com.securebank.customer.repository.CustomerRepository;
import com.securebank.dormant.dto.ReactivationResponseDTO;
import com.securebank.dormant.dto.ReviewReactivationDTO;
import com.securebank.dormant.service.DormantScamService;
import com.securebank.dormant.service.DormantService;
import com.securebank.ledger.entity.EntryType;
import com.securebank.ledger.entity.LedgerEntry;
import com.securebank.ledger.repository.LedgerRepository;
import com.securebank.notification.entity.Notification;
import com.securebank.notification.repository.NotificationRepository;
import com.securebank.securityevent.dto.SecurityEventDTO;
import com.securebank.transaction.entity.Transaction;
import com.securebank.transaction.entity.TransactionStatus;
import com.securebank.transaction.entity.TransactionType;
import com.securebank.transaction.repository.TransactionRepository;
import com.securebank.user.entity.Role;
import com.securebank.user.entity.User;
import com.securebank.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerRepository ledgerRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final DormantService dormantService;
    private final DormantScamService dormantScamService;
    private final PasswordEncoder passwordEncoder;
    private final AccountNumberGenerator accountNumberGenerator;
    private final EntityManager entityManager;

    public AdminService(AccountRepository accountRepository,
                        CustomerRepository customerRepository,
                        UserRepository userRepository,
                        TransactionRepository transactionRepository,
                        LedgerRepository ledgerRepository,
                        AuditLogRepository auditLogRepository,
                        NotificationRepository notificationRepository,
                        DormantService dormantService,
                        DormantScamService dormantScamService,
                        PasswordEncoder passwordEncoder,
                        AccountNumberGenerator accountNumberGenerator,
                        EntityManager entityManager) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerRepository = ledgerRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationRepository = notificationRepository;
        this.dormantService = dormantService;
        this.dormantScamService = dormantScamService;
        this.passwordEncoder = passwordEncoder;
        this.accountNumberGenerator = accountNumberGenerator;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<AdminAccountDTO> getAllAccounts() {
        return accountRepository.findAll()
                .stream()
                .map(AdminAccountDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Admin manually onboards a new customer and provisions their initial bank account.
     */
    @Transactional
    public AdminAccountDTO createCustomer(AdminCreateCustomerDTO dto, String adminUsername, String clientIp) {
        User admin = userRepository.findByUsername(adminUsername).orElse(null);

        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new DuplicateResourceException("Username '" + dto.getUsername() + "' is already registered.");
        }
        if (customerRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Email '" + dto.getEmail() + "' is already registered.");
        }
        if (customerRepository.existsByPhoneNumber(dto.getPhoneNumber())) {
            throw new DuplicateResourceException("Phone number '" + dto.getPhoneNumber() + "' is already registered.");
        }

        // 1. Create User
        String encodedPassword = passwordEncoder.encode(dto.getPassword());
        User user = new User(dto.getUsername(), encodedPassword, Role.ROLE_CUSTOMER);
        user = userRepository.save(user);

        // 2. Create Customer Profile
        Customer customer = new Customer(
                user,
                dto.getFullName(),
                dto.getEmail(),
                dto.getPhoneNumber(),
                dto.getDateOfBirth(),
                dto.getAddress()
        );
        customer = customerRepository.save(customer);

        // 3. Generate Unique Account
        String generatedAccountNumber = accountNumberGenerator.generateUniqueAccountNumber();
        Account account = new Account(
                customer,
                generatedAccountNumber,
                "SECURE000001",
                dto.getAccountType(),
                dto.getInitialDeposit()
        );
        account = accountRepository.save(account);

        // 4. Initial Funding Transaction & Ledger
        String refNo = "TXN-ADMIN-INIT-" + generatedAccountNumber;
        String idempKey = "ADMIN-INIT-" + generatedAccountNumber;
        Transaction initialTx = new Transaction(
                refNo,
                idempKey,
                account,
                account,
                dto.getInitialDeposit(),
                TransactionType.INITIAL_DEPOSIT,
                TransactionStatus.SUCCESS,
                "Administrative Onboarding Initial Deposit"
        );
        initialTx = transactionRepository.save(initialTx);

        LedgerEntry ledgerEntry = new LedgerEntry(
                initialTx,
                account,
                EntryType.CREDIT,
                dto.getInitialDeposit(),
                account.getBalance()
        );
        ledgerRepository.save(ledgerEntry);

        // 5. Audit Log
        auditLogRepository.save(new AuditLog(
                admin,
                "ADMIN_CUSTOMER_ONBOARDED",
                "Customer",
                customer.getId().toString(),
                clientIp,
                "SUCCESS",
                String.format("Admin created customer [%s] with account [%s] and initial deposit ₹%.2f",
                        dto.getFullName(), generatedAccountNumber, dto.getInitialDeposit())
        ));

        // 6. Welcome Notification
        notificationRepository.save(new Notification(
                customer,
                "🏦 Welcome to SecureBank",
                "Your new " + dto.getAccountType() + " account " + generatedAccountNumber + " has been established with ₹" + dto.getInitialDeposit() + " opening balance.",
                "ACCOUNT"
        ));

        return AdminAccountDTO.fromEntity(account);
    }

    /**
     * Admin updates customer profile details.
     */
    @Transactional
    public AdminAccountDTO updateCustomer(Long customerId, AdminUpdateCustomerDTO dto, String adminUsername, String clientIp) {
        User admin = userRepository.findByUsername(adminUsername).orElse(null);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        // 1. Immutable Dormant Account Check: Prevent insider theft / rogue employee scam
        List<Account> customerAccounts = accountRepository.findByCustomerId(customerId);
        boolean hasDormant = customerAccounts.stream()
                .anyMatch(a -> a.getStatus() == AccountStatus.DORMANT);
        if (hasDormant) {
            throw new BadRequestException("Access Denied: Dormant accounts cannot be altered by bank employees. To prevent internal fraud or unauthorized employee takeover, the customer must personally log in and complete Aadhaar/PAN Re-KYC verification.");
        }

        // 2. Customer Consent OTP Authentication (Anti-Employee Scam Protocol)
        String customerOtp = dto.getCustomerOtp();
        if (customerOtp == null || customerOtp.trim().isEmpty()) {
            throw new BadRequestException("Customer Consent OTP required: A 6-digit verification code has been dispatched to the customer's phone (" + customer.getPhoneNumber() + ") to prevent unauthorized employee tampering. Please obtain and enter the OTP provided by the customer (Demo OTP: 654321).");
        }
        if (!"654321".equals(customerOtp.trim())) {
            throw new BadRequestException("Invalid Customer Consent OTP. Update aborted for customer protection. (Demo OTP: 654321)");
        }

        if (customerRepository.existsByEmailAndIdNot(dto.getEmail(), customerId)) {
            throw new DuplicateResourceException("Email '" + dto.getEmail() + "' is already in use by another customer.");
        }
        if (customerRepository.existsByPhoneNumberAndIdNot(dto.getPhoneNumber(), customerId)) {
            throw new DuplicateResourceException("Phone number '" + dto.getPhoneNumber() + "' is already in use by another customer.");
        }

        customer.setFullName(dto.getFullName());
        customer.setEmail(dto.getEmail());
        customer.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getDateOfBirth() != null) {
            customer.setDateOfBirth(dto.getDateOfBirth());
        }
        customer.setAddress(dto.getAddress());
        customer = customerRepository.save(customer);

        // Security notification to the customer
        notificationRepository.save(new Notification(
                customer,
                "⚠️ Profile Changes Authorized via OTP",
                "Your account details were updated by bank personnel [" + adminUsername + "] verified with your Customer Consent OTP. If you did not authorize this, contact fraud support immediately.",
                "SECURITY"
        ));

        auditLogRepository.save(new AuditLog(
                admin,
                "ADMIN_CUSTOMER_UPDATED",
                "Customer",
                customerId.toString(),
                clientIp,
                "SUCCESS",
                "Admin updated personal / contact details for customer: " + dto.getFullName()
        ));

        List<Account> accounts = accountRepository.findByCustomerId(customerId);
        if (!accounts.isEmpty()) {
            return AdminAccountDTO.fromEntity(accounts.get(0));
        }

        AdminAccountDTO emptyDto = new AdminAccountDTO();
        emptyDto.setCustomerId(customerId);
        emptyDto.setCustomerName(customer.getFullName());
        emptyDto.setEmail(customer.getEmail());
        emptyDto.setPhoneNumber(customer.getPhoneNumber());
        emptyDto.setAddress(customer.getAddress());
        return emptyDto;
    }

    /**
     * Admin safely deletes / removes a customer and their linked records from the system.
     */
    @Transactional
    public void deleteCustomer(Long customerId, String adminUsername, String clientIp) {
        User admin = userRepository.findByUsername(adminUsername).orElse(null);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        User user = customer.getUser();
        Long userId = (user != null) ? user.getId() : null;
        List<Account> accounts = accountRepository.findByCustomerId(customerId);
        List<Long> accountIds = accounts.stream().map(Account::getId).collect(Collectors.toList());

        String customerName = customer.getFullName();

        if (!accountIds.isEmpty()) {
            // Delete dependent records in child tables
            entityManager.createNativeQuery("DELETE FROM bill_payments WHERE account_id IN (:accountIds)")
                    .setParameter("accountIds", accountIds).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM reactivation_requests WHERE account_id IN (:accountIds)")
                    .setParameter("accountIds", accountIds).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM ledger_entries WHERE account_id IN (:accountIds)")
                    .setParameter("accountIds", accountIds).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM transactions WHERE sender_account_id IN (:accountIds) OR receiver_account_id IN (:accountIds)")
                    .setParameter("accountIds", accountIds).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM accounts WHERE customer_id = :customerId")
                    .setParameter("customerId", customerId).executeUpdate();
        }

        entityManager.createNativeQuery("DELETE FROM beneficiaries WHERE customer_id = :customerId")
                .setParameter("customerId", customerId).executeUpdate();

        entityManager.createNativeQuery("DELETE FROM notifications WHERE customer_id = :customerId")
                .setParameter("customerId", customerId).executeUpdate();

        if (userId != null) {
            entityManager.createNativeQuery("DELETE FROM otp_verifications WHERE user_id = :userId")
                    .setParameter("userId", userId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM security_events WHERE user_id = :userId")
                    .setParameter("userId", userId).executeUpdate();
        }

        entityManager.createNativeQuery("DELETE FROM customers WHERE id = :customerId")
                .setParameter("customerId", customerId).executeUpdate();

        if (userId != null) {
            entityManager.createNativeQuery("DELETE FROM users WHERE id = :userId")
                    .setParameter("userId", userId).executeUpdate();
        }

        auditLogRepository.save(new AuditLog(
                admin,
                "ADMIN_CUSTOMER_DELETED",
                "Customer",
                customerId.toString(),
                clientIp,
                "SUCCESS",
                "Customer [" + customerName + "] and all associated accounts were permanently deleted by administrator."
        ));
    }

    /**
     * Admin manually marks an account as DORMANT to enforce Anti-Scam protection.
     */
    @Transactional
    public AdminAccountDTO markAccountDormant(Long accountId, String adminUsername, String reason, String clientIp) {
        User admin = userRepository.findByUsername(adminUsername).orElse(null);

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        account.setStatus(AccountStatus.DORMANT);
        account.setDormantSince(java.time.LocalDateTime.now());
        Account updated = accountRepository.save(account);

        String msg = (reason != null && !reason.isBlank()) ? reason : "Proactive Anti-Scam Dormancy Hold";

        auditLogRepository.save(new AuditLog(
                admin,
                "ADMIN_DORMANCY_ENFORCED",
                "Account",
                account.getAccountNumber(),
                clientIp,
                "SUCCESS",
                "Admin placed account into Dormant Protection Mode. Reason: " + msg
        ));

        if (account.getCustomer() != null) {
            notificationRepository.save(new Notification(
                    account.getCustomer(),
                    "🛡️ Dormant Account Scam Shield Enforced",
                    "Your account " + account.getAccountNumber() + " has been placed into Dormant Protection Mode to safeguard your balance. Reason: " + msg,
                    "SECURITY"
            ));
        }

        return AdminAccountDTO.fromEntity(updated);
    }

    @Transactional
    public AdminAccountDTO freezeAccount(Long accountId, String adminUsername, String reason, String clientIp) {
        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found."));

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        account.setStatus(AccountStatus.FROZEN);
        Account updated = accountRepository.save(account);

        auditLogRepository.save(new AuditLog(
                admin,
                "ACCOUNT_FREEZE",
                "Account",
                account.getAccountNumber(),
                clientIp,
                "SUCCESS",
                "Account frozen by admin. Reason: " + reason
        ));

        notificationRepository.save(new Notification(
                account.getCustomer(),
                "⚠️ Account Frozen",
                "Your SecureBank account " + account.getAccountNumber() + " has been temporarily frozen by bank administration. Reason: " + reason,
                "SECURITY"
        ));

        return AdminAccountDTO.fromEntity(updated);
    }

    @Transactional
    public AdminAccountDTO unfreezeAccount(Long accountId, String adminUsername, String clientIp) {
        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found."));

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        if (account.getStatus() == AccountStatus.DORMANT) {
            throw new BadRequestException("Dormant accounts cannot be directly activated or unfrozen. The account holder must submit a verified Re-KYC reactivation request first, which an officer can review under Dormant Approvals.");
        }

        account.setStatus(AccountStatus.ACTIVE);
        Account updated = accountRepository.save(account);

        auditLogRepository.save(new AuditLog(
                admin,
                "ACCOUNT_UNFREEZE",
                "Account",
                account.getAccountNumber(),
                clientIp,
                "SUCCESS",
                "Account un-frozen by admin."
        ));

        notificationRepository.save(new Notification(
                account.getCustomer(),
                "✅ Account Unfrozen",
                "Your SecureBank account " + account.getAccountNumber() + " has been unfrozen. Normal operations are restored.",
                "SECURITY"
        ));

        return AdminAccountDTO.fromEntity(updated);
    }

    public List<ReactivationResponseDTO> getPendingReactivations() {
        return dormantService.getPendingRequests();
    }

    public List<ReactivationResponseDTO> getAllReactivations() {
        return dormantService.getAllRequests();
    }

    public ReactivationResponseDTO reviewReactivation(Long requestId, String adminUsername, ReviewReactivationDTO review, String clientIp) {
        return dormantService.reviewRequest(requestId, adminUsername, review, clientIp);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDTO> getAuditLogs(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable).map(AuditLogDTO::fromEntity);
    }

    // ─── Dormant Scam Shield Delegates ───────────────────────────────────────

    public ScamShieldStatsDTO getScamShieldStats() {
        return dormantScamService.getScamShieldStats();
    }

    public List<SecurityEventDTO> getSecurityEvents() {
        return dormantScamService.getAllSecurityEvents();
    }

    public SecurityEventDTO resolveSecurityEvent(Long eventId, String adminUsername, String notes, String clientIp) {
        return dormantScamService.resolveSecurityEvent(eventId, adminUsername, notes, clientIp);
    }

    public Map<String, Object> runScamScan(String adminUsername, String clientIp) {
        return dormantScamService.scanAndEnforceDormancy(adminUsername, clientIp);
    }
}
