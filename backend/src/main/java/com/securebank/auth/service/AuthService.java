package com.securebank.auth.service;

import com.securebank.account.entity.Account;
import com.securebank.account.entity.AccountStatus;
import com.securebank.account.repository.AccountRepository;
import com.securebank.account.service.AccountNumberGenerator;
import com.securebank.audit.entity.AuditLog;
import com.securebank.audit.repository.AuditLogRepository;
import com.securebank.auth.dto.AuthResponse;
import com.securebank.auth.dto.LoginRequest;
import com.securebank.auth.dto.RegisterRequest;
import com.securebank.auth.dto.RegistrationSuccessDTO;
import com.securebank.common.exception.BadRequestException;
import com.securebank.common.exception.DuplicateResourceException;
import com.securebank.customer.entity.Customer;
import com.securebank.customer.repository.CustomerRepository;
import com.securebank.ledger.entity.EntryType;
import com.securebank.ledger.entity.LedgerEntry;
import com.securebank.ledger.repository.LedgerRepository;
import com.securebank.notification.entity.Notification;
import com.securebank.notification.repository.NotificationRepository;
import com.securebank.security.JwtTokenProvider;
import com.securebank.security.UserPrincipal;
import com.securebank.transaction.entity.Transaction;
import com.securebank.transaction.entity.TransactionStatus;
import com.securebank.transaction.entity.TransactionType;
import com.securebank.transaction.repository.TransactionRepository;
import com.securebank.user.entity.Role;
import com.securebank.user.entity.User;
import com.securebank.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerRepository ledgerRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountNumberGenerator accountNumberGenerator;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final long jwtExpirationMs;

    public AuthService(UserRepository userRepository,
                       CustomerRepository customerRepository,
                       AccountRepository accountRepository,
                       TransactionRepository transactionRepository,
                       LedgerRepository ledgerRepository,
                       AuditLogRepository auditLogRepository,
                       NotificationRepository notificationRepository,
                       PasswordEncoder passwordEncoder,
                       AccountNumberGenerator accountNumberGenerator,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       @Value("${app.jwt.expiration-ms:86400000}") long jwtExpirationMs) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerRepository = ledgerRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountNumberGenerator = accountNumberGenerator;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.jwtExpirationMs = jwtExpirationMs;
    }

    @Transactional
    public RegistrationSuccessDTO registerCustomer(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Password and Confirm Password do not match.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already registered.");
        }

        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email address '" + request.getEmail() + "' is already registered.");
        }

        if (customerRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new DuplicateResourceException("Phone number '" + request.getPhoneNumber() + "' is already registered.");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getUsername(), hashedPassword, Role.ROLE_CUSTOMER);
        user = userRepository.save(user);

        Customer customer = new Customer(
                user,
                request.getFullName(),
                request.getEmail(),
                request.getPhoneNumber(),
                request.getDateOfBirth(),
                request.getAddress()
        );
        customer = customerRepository.save(customer);

        String generatedAccountNumber = accountNumberGenerator.generateUniqueAccountNumber();
        Account account = new Account(
                customer,
                generatedAccountNumber,
                "SECURE000001",
                request.getAccountType(),
                request.getInitialDeposit()
        );
        account = accountRepository.save(account);

        String refNo = "TXN-INIT-" + generatedAccountNumber;
        String idempKey = "INIT-DEP-" + generatedAccountNumber;
        Transaction initialTx = new Transaction(
                refNo,
                idempKey,
                account,
                account,
                request.getInitialDeposit(),
                TransactionType.INITIAL_DEPOSIT,
                TransactionStatus.SUCCESS,
                "Opening Account Initial Deposit"
        );
        initialTx = transactionRepository.save(initialTx);

        LedgerEntry ledgerEntry = new LedgerEntry(
                initialTx,
                account,
                EntryType.CREDIT,
                request.getInitialDeposit(),
                account.getBalance()
        );
        ledgerRepository.save(ledgerEntry);

        AuditLog auditLog = new AuditLog(
                user,
                "ACCOUNT_CREATED",
                "ACCOUNT",
                account.getAccountNumber(),
                "127.0.0.1",
                "SUCCESS",
                "Account opened with initial deposit of ₹" + request.getInitialDeposit()
        );
        auditLogRepository.save(auditLog);

        Notification notification = new Notification(
                customer,
                "Welcome to SecureBank",
                "Your " + request.getAccountType() + " Account " + account.getAccountNumber() +
                        " has been activated with ₹" + request.getInitialDeposit() + " initial balance.",
                "ACCOUNT"
        );
        notificationRepository.save(notification);

        return new RegistrationSuccessDTO(
                customer.getFullName(),
                user.getUsername(),
                account.getAccountNumber(),
                account.getIfscCode(),
                account.getAccountType(),
                account.getBalance(),
                account.getStatus().name(),
                account.getCreatedAt()
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsernameOrEmail(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            // Record failed login in audit trail
            auditLogRepository.save(new AuditLog(
                    null,
                    "LOGIN_FAILED",
                    "USER",
                    request.getUsernameOrEmail(),
                    "127.0.0.1",
                    "FAILURE",
                    "Invalid credentials attempt for identifier: " + request.getUsernameOrEmail()
            ));
            throw new BadRequestException("Invalid username or password.");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new BadRequestException("User profile not found."));

        // Enrich token with account metadata if customer
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());

        String fullName = user.getUsername();
        String accountNumber = "N/A";
        String accountStatus = "N/A";

        Optional<Customer> customerOpt = customerRepository.findByUserId(user.getId());
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            fullName = customer.getFullName();
            List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
            if (!accounts.isEmpty()) {
                Account primaryAccount = accounts.get(0);
                accountNumber = primaryAccount.getAccountNumber();
                accountStatus = primaryAccount.getStatus().name();
                claims.put("accountNumber", accountNumber);
                claims.put("accountStatus", accountStatus);
            }
        } else if (user.getRole() == Role.ROLE_ADMIN) {
            fullName = "System Administrator";
            accountStatus = "ADMIN";
        }

        String jwt = tokenProvider.generateToken(authentication, claims);

        // Record successful login audit log
        auditLogRepository.save(new AuditLog(
                user,
                "LOGIN_SUCCESS",
                "USER",
                user.getUsername(),
                "127.0.0.1",
                "SUCCESS",
                "User successfully logged in via credentials"
        ));

        return new AuthResponse(
                jwt,
                jwtExpirationMs / 1000,
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                fullName,
                accountNumber,
                accountStatus
        );
    }

    @Transactional
    public void logout(String username) {
        if (username != null) {
            userRepository.findByUsername(username).ifPresent(user -> {
                auditLogRepository.save(new AuditLog(
                        user,
                        "LOGOUT",
                        "USER",
                        username,
                        "127.0.0.1",
                        "SUCCESS",
                        "User logged out successfully"
                ));
            });
        }
    }
}
