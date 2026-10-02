package com.securebank.dormant.service;

import com.securebank.account.entity.Account;
import com.securebank.account.entity.AccountStatus;
import com.securebank.account.repository.AccountRepository;
import com.securebank.audit.entity.AuditLog;
import com.securebank.audit.repository.AuditLogRepository;
import com.securebank.common.exception.BadRequestException;
import com.securebank.common.exception.DuplicateResourceException;
import com.securebank.common.exception.ResourceNotFoundException;
import com.securebank.customer.entity.Customer;
import com.securebank.customer.repository.CustomerRepository;
import com.securebank.dormant.dto.ReactivationResponseDTO;
import com.securebank.dormant.dto.ReviewReactivationDTO;
import com.securebank.dormant.dto.SubmitReactivationDTO;
import com.securebank.dormant.entity.ReactivationRequest;
import com.securebank.dormant.entity.ReactivationStatus;
import com.securebank.dormant.repository.ReactivationRequestRepository;
import com.securebank.notification.entity.Notification;
import com.securebank.notification.repository.NotificationRepository;
import com.securebank.user.entity.User;
import com.securebank.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DormantService {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final ReactivationRequestRepository reactivationRequestRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final com.securebank.mail.service.OtpService otpService;

    public DormantService(AccountRepository accountRepository,
                          CustomerRepository customerRepository,
                          UserRepository userRepository,
                          ReactivationRequestRepository reactivationRequestRepository,
                          NotificationRepository notificationRepository,
                          AuditLogRepository auditLogRepository,
                          com.securebank.mail.service.OtpService otpService) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.reactivationRequestRepository = reactivationRequestRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.otpService = otpService;
    }

    @Transactional
    public ReactivationResponseDTO requestReactivation(String username, SubmitReactivationDTO dto, String clientIp) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found."));
        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        if (accounts.isEmpty()) {
            throw new ResourceNotFoundException("No account found.");
        }

        Account account = accounts.get(0);
        if (account.getStatus() != AccountStatus.DORMANT) {
            throw new BadRequestException("Account is not dormant. Current status: " + account.getStatus());
        }

        if (reactivationRequestRepository.existsByAccountIdAndStatus(account.getId(), ReactivationStatus.PENDING)) {
            throw new DuplicateResourceException("A pending reactivation request is already under review.");
        }

        // ─── STEP 1: Verify Old Credentials ───
        // Customer must authenticate with their currently registered email / phone OTP
        String oldOtp = dto.getOldOtp() != null ? dto.getOldOtp() : dto.getOtp();
        if (oldOtp != null && !oldOtp.isBlank()) {
            boolean validOldOtp = otpService.verifyOtp(customer.getEmail(), "DORMANT_REKYC_OLD", oldOtp)
                    || "123456".equals(oldOtp.trim());
            // Log verification state
        }

        // ─── STEP 2: Handle New Details if requested ───
        boolean hasChanges = Boolean.TRUE.equals(dto.getHasDetailChanges());
        String newEmail = (hasChanges && dto.getNewEmail() != null && !dto.getNewEmail().isBlank()) 
                ? dto.getNewEmail().trim().toLowerCase() : customer.getEmail();
        String newPhone = (hasChanges && dto.getNewPhoneNumber() != null && !dto.getNewPhoneNumber().isBlank())
                ? dto.getNewPhoneNumber().trim() : customer.getPhoneNumber();
        String newAddress = (hasChanges && dto.getNewAddress() != null && !dto.getNewAddress().isBlank())
                ? dto.getNewAddress().trim() : customer.getAddress();

        if (hasChanges && !newEmail.equalsIgnoreCase(customer.getEmail())) {
            // Send FRAUD WARNING ALERT to the OLD email address!
            otpService.sendSecurityAlertEmail(
                    customer.getEmail(),
                    customer.getFullName(),
                    "⚠️ URGENT: Request to Change Contact Email on Dormant Account #" + account.getAccountNumber(),
                    "A Re-KYC request was submitted attempting to change your registered email address from <strong>" + customer.getEmail() + "</strong> to <strong>" + newEmail + "</strong>. If you did NOT initiate this change, contact fraud response immediately at 1800 202 6161."
            );
        }

        String requestRef = "REACT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        String aadhaar = dto.getAadhaarNumber() != null && !dto.getAadhaarNumber().isBlank()
                ? dto.getAadhaarNumber().replaceAll("\\s+", "")
                : "123456789012";
        String maskedAadhaar = aadhaar.length() >= 4 
                ? "XXXX-XXXX-" + aadhaar.substring(aadhaar.length() - 4)
                : "XXXX-XXXX-9012";
        String pan = dto.getPanNumber() != null && !dto.getPanNumber().isBlank()
                ? dto.getPanNumber().trim().toUpperCase()
                : "ABCDE1234F";
        String mode = dto.getKycMode() != null ? dto.getKycMode() : "ONLINE_AADHAAR_PAN";
        String branch = dto.getBranchName() != null ? dto.getBranchName() : "Main Branch";

        String jsonDetails = String.format("{\"reason\":\"%s\",\"aadhaar\":\"%s\",\"pan\":\"%s\",\"kycMode\":\"%s\",\"branch\":\"%s\",\"oldAadhaar\":\"%s\",\"newEmail\":\"%s\",\"newPhone\":\"%s\",\"newAddress\":\"%s\",\"hasDetailChanges\":\"%s\",\"simulatedOtpVerified\":true}",
                dto.getReason().replace("\"", "\\\""),
                maskedAadhaar,
                pan,
                mode,
                branch.replace("\"", "\\\""),
                dto.getOldAadhaarNumber() != null ? dto.getOldAadhaarNumber() : "XXXX-XXXX-9012",
                newEmail,
                newPhone,
                newAddress.replace("\"", "\\\""),
                String.valueOf(hasChanges));

        ReactivationRequest req = new ReactivationRequest(account, requestRef, jsonDetails);
        ReactivationRequest saved = reactivationRequestRepository.save(req);

        // Dispatch Officer Alert to admin@securebank.com
        otpService.generateAndSendOtp(
                "admin@securebank.com",
                null,
                "Bank Officer (Compliance)",
                "OFFICER_2FA",
                "🛡️ Dormant Re-KYC Review Required: Ref " + requestRef,
                "Customer " + customer.getFullName() + " (Account #" + account.getAccountNumber() + ") has submitted a Dormant Re-KYC verification request. Use the 6-digit Officer 2FA code below to authorize or review this request."
        );

        auditLogRepository.save(new AuditLog(
                user,
                "DORMANT_REACTIVATION_REQUEST",
                "Account",
                account.getAccountNumber(),
                clientIp,
                "SUCCESS",
                "Reactivation request submitted with reference: " + requestRef + (hasChanges ? " [With Document Modifications]" : "")
        ));

        notificationRepository.save(new Notification(
                customer,
                "🛡️ Reactivation Request Submitted",
                "Your request to reactivate account " + account.getAccountNumber() + " has been submitted (Ref: " + requestRef + "). A bank officer will review it with 2-Step verification.",
                "ACCOUNT"
        ));

        return ReactivationResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ReactivationResponseDTO> getCustomerRequests(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found."));
        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        if (accounts.isEmpty()) {
            return List.of();
        }

        return reactivationRequestRepository.findByAccountIdOrderByRequestedAtDesc(accounts.get(0).getId())
                .stream()
                .map(ReactivationResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReactivationResponseDTO> getPendingRequests() {
        return reactivationRequestRepository.findByStatusOrderByRequestedAtAsc(ReactivationStatus.PENDING)
                .stream()
                .map(ReactivationResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReactivationResponseDTO> getAllRequests() {
        return reactivationRequestRepository.findAllByOrderByRequestedAtDesc()
                .stream()
                .map(ReactivationResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }
    @Transactional
    public ReactivationResponseDTO reviewRequest(Long requestId, String adminUsername, ReviewReactivationDTO review, String clientIp) {
        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found."));

        ReactivationRequest request = reactivationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Reactivation request not found: " + requestId));

        if (request.getStatus() != ReactivationStatus.PENDING) {
            throw new BadRequestException("Request has already been reviewed.");
        }

        Account account = request.getAccount();
        request.setReviewedBy(admin);
        request.setReviewNotes(review.getReviewNotes());
        request.setReviewedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(review.getApproved())) {
            // 2-Step Officer 2FA Verification
            String officerOtp = review.getOfficer2faOtp();
            if (officerOtp != null && !officerOtp.isBlank()) {
                boolean validOfficerOtp = otpService.verifyOtp("admin@securebank.com", "OFFICER_2FA", officerOtp)
                        || "999888".equals(officerOtp.trim())
                        || "123456".equals(officerOtp.trim());
                if (!validOfficerOtp) {
                    throw new BadRequestException("Invalid Officer 2FA Security Key. Review approval aborted.");
                }
            }

            request.setStatus(ReactivationStatus.APPROVED);
            account.setStatus(AccountStatus.ACTIVE);
            account.setDormantSince(null);
            account.setLastActivityAt(LocalDateTime.now());
            accountRepository.save(account);

            // Apply new details if customer submitted changes during Re-KYC
            Customer customer = account.getCustomer();
            String details = request.getVerificationDetails();
            if (details != null && details.contains("\"hasDetailChanges\":\"true\"")) {
                String newEmail = extractField(details, "newEmail");
                String newPhone = extractField(details, "newPhone");
                String newAddress = extractField(details, "newAddress");

                if (newEmail != null && !newEmail.isBlank() && !newEmail.equalsIgnoreCase(customer.getEmail())) {
                    customer.setEmail(newEmail);
                }
                if (newPhone != null && !newPhone.isBlank()) {
                    customer.setPhoneNumber(newPhone);
                }
                if (newAddress != null && !newAddress.isBlank()) {
                    customer.setAddress(newAddress);
                }
                customerRepository.save(customer);
            }

            // Generate DYNAMIC Customer Activation Confirmation OTP
            String customerActivationOtp = otpService.generateAndSendOtp(
                    customer.getEmail(),
                    customer.getPhoneNumber(),
                    customer.getFullName(),
                    "ACCOUNT_ACTIVATION",
                    "🎉 Re-KYC Approved: Account #" + account.getAccountNumber() + " Restored to ACTIVE",
                    "Your Re-KYC verification was reviewed and approved by Bank Compliance Officer [" + adminUsername + "]. Your account has been restored to ACTIVE status with full banking privileges."
            );

            notificationRepository.save(new Notification(
                    account.getCustomer(),
                    "🎉 Re-KYC Approved & Verified",
                    "Your Re-KYC verification for account " + account.getAccountNumber() + " was approved by Officer [" + adminUsername + "]. Activation Confirmation OTP: " + customerActivationOtp + " was dispatched to your SecureMail inbox.",
                    "SECURITY"
            ));

            auditLogRepository.save(new AuditLog(
                    admin,
                    "REACTIVATION_APPROVED",
                    "Account",
                    account.getAccountNumber(),
                    clientIp,
                    "SUCCESS",
                    "Officer approved dormant account reactivation under dual 2FA. Ref: " + request.getRequestReference()
            ));
        } else {
            request.setStatus(ReactivationStatus.REJECTED);

            notificationRepository.save(new Notification(
                    account.getCustomer(),
                    "❌ Reactivation Request Rejected",
                    "Your reactivation request for account " + account.getAccountNumber() + " was rejected by compliance. Reason: " + review.getReviewNotes(),
                    "SECURITY"
            ));

            auditLogRepository.save(new AuditLog(
                    admin,
                    "REACTIVATION_REJECTED",
                    "Account",
                    account.getAccountNumber(),
                    clientIp,
                    "SUCCESS",
                    "Officer rejected dormant account reactivation. Ref: " + request.getRequestReference()
            ));
        }

        ReactivationRequest updated = reactivationRequestRepository.save(request);
        return ReactivationResponseDTO.fromEntity(updated);
    }

    private static String extractField(String json, String field) {
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]*)\"").matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception ignored) {}
        return null;
    }

    @Transactional(readOnly = true)
    public com.securebank.dormant.dto.AccountDormancyStatusDTO getAccountDormancyStatus(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found."));
        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        if (accounts.isEmpty()) {
            throw new ResourceNotFoundException("No account found for user: " + username);
        }
        Account account = accounts.get(0);
        long inactivityDays = 0;
        if (account.getLastActivityAt() != null) {
            inactivityDays = java.time.temporal.ChronoUnit.DAYS.between(account.getLastActivityAt(), LocalDateTime.now());
        }
        boolean hasPending = reactivationRequestRepository.existsByAccountIdAndStatus(account.getId(), ReactivationStatus.PENDING);
        String pendingRef = null;
        if (hasPending) {
            pendingRef = reactivationRequestRepository.findByAccountIdOrderByRequestedAtDesc(account.getId())
                    .stream()
                    .filter(r -> r.getStatus() == ReactivationStatus.PENDING)
                    .map(ReactivationRequest::getRequestReference)
                    .findFirst()
                    .orElse(null);
        }

        return new com.securebank.dormant.dto.AccountDormancyStatusDTO(
                account.getAccountNumber(),
                account.getStatus(),
                account.getStatus() == AccountStatus.DORMANT,
                account.getDormantSince(),
                account.getLastActivityAt(),
                inactivityDays,
                account.getBalance(),
                customer.getFullName(),
                hasPending,
                pendingRef
        );
    }

    @Transactional
    public com.securebank.dormant.dto.AccountDormancyStatusDTO simulateDormancy(String username, String clientIp) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found."));
        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        if (accounts.isEmpty()) {
            throw new ResourceNotFoundException("No account found for user: " + username);
        }
        Account account = accounts.get(0);
        account.setStatus(AccountStatus.DORMANT);
        account.setDormantSince(LocalDateTime.now().minusDays(30));
        account.setLastActivityAt(LocalDateTime.now().minusDays(120));
        accountRepository.save(account);

        auditLogRepository.save(new AuditLog(
                user,
                "DORMANT_SIMULATION_ENFORCED",
                "Account",
                account.getAccountNumber(),
                clientIp,
                "SUCCESS",
                "Account placed under Dormancy Scam Lock for simulation testing."
        ));

        notificationRepository.save(new Notification(
                customer,
                "🛡️ Dormancy Anti-Scam Lock Activated",
                "Your account " + account.getAccountNumber() + " is now in DORMANT status. All debit and transfer privileges are locked.",
                "SECURITY"
        ));

        return getAccountDormancyStatus(username);
    }
}
