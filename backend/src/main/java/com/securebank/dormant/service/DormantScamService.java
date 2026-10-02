package com.securebank.dormant.service;

import com.securebank.account.entity.Account;
import com.securebank.account.entity.AccountStatus;
import com.securebank.account.repository.AccountRepository;
import com.securebank.admin.dto.ScamShieldStatsDTO;
import com.securebank.audit.entity.AuditLog;
import com.securebank.audit.repository.AuditLogRepository;
import com.securebank.dormant.entity.ReactivationStatus;
import com.securebank.dormant.repository.ReactivationRequestRepository;
import com.securebank.notification.entity.Notification;
import com.securebank.notification.repository.NotificationRepository;
import com.securebank.securityevent.dto.SecurityEventDTO;
import com.securebank.securityevent.entity.SecurityEvent;
import com.securebank.securityevent.entity.SecurityEventStatus;
import com.securebank.securityevent.entity.SecuritySeverity;
import com.securebank.securityevent.repository.SecurityEventRepository;
import com.securebank.user.entity.User;
import com.securebank.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DormantScamService {

    private static final Logger log = LoggerFactory.getLogger(DormantScamService.class);

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final SecurityEventRepository securityEventRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final ReactivationRequestRepository reactivationRequestRepository;

    public DormantScamService(AccountRepository accountRepository,
                              UserRepository userRepository,
                              SecurityEventRepository securityEventRepository,
                              AuditLogRepository auditLogRepository,
                              NotificationRepository notificationRepository,
                              ReactivationRequestRepository reactivationRequestRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.securityEventRepository = securityEventRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationRepository = notificationRepository;
        this.reactivationRequestRepository = reactivationRequestRepository;
    }

    /**
     * Intercepts and records an unauthorized transaction or operation attempted on a dormant account.
     * Prevents dormant account takeover scam and logs to security_events and audit_logs in an independent transaction.
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void recordDormantScamAttempt(Account account, String attemptedAction, BigDecimal amount, String clientIp, String username) {
        User user = (username != null) ? userRepository.findByUsername(username).orElse(null) : null;
        BigDecimal safeAmount = (amount != null) ? amount : BigDecimal.ZERO;

        String description = String.format(
                "🚨 SCAM ATTEMPT INTERCEPTED: Unauthorized %s of ₹%.2f blocked on dormant account #%s by actor [%s] from IP: %s. Dormant Account Anti-Scam Shield prevented balance siphon.",
                attemptedAction, safeAmount, account.getAccountNumber(), (username != null ? username : "ANONYMOUS"), clientIp
        );

        SecurityEvent event = new SecurityEvent(user, "DORMANT_TAKEOVER_ATTEMPT", SecuritySeverity.CRITICAL, description);
        securityEventRepository.save(event);

        auditLogRepository.save(new AuditLog(
                user,
                "DORMANT_SCAM_BLOCKED",
                "Account",
                account.getAccountNumber(),
                clientIp,
                "FAILURE",
                description
        ));

        if (account.getCustomer() != null) {
            notificationRepository.save(new Notification(
                    account.getCustomer(),
                    "🚨 Anti-Scam Alert: Unauthorized Transfer Blocked",
                    String.format("An unauthorized %s of ₹%.2f was blocked on your dormant account %s. Your account is protected by the Dormant Account Scam Shield.",
                            attemptedAction, safeAmount, account.getAccountNumber()),
                    "SECURITY"
            ));
        }

        log.warn("DORMANT SCAM INTERCEPTED: Account={}, Actor={}, Amount={}, IP={}",
                account.getAccountNumber(), username, safeAmount, clientIp);
    }

    /**
     * Scans all accounts in the core banking system:
     * 1. Marks accounts inactive for >90 days as DORMANT to prevent takeover scams.
     * 2. Identifies high-risk dormant balances (>₹10,000) and registers security events if needed.
     */
    @Transactional
    public Map<String, Object> scanAndEnforceDormancy(String adminUsername, String clientIp) {
        User admin = (adminUsername != null) ? userRepository.findByUsername(adminUsername).orElse(null) : null;
        List<Account> allAccounts = accountRepository.findAll();

        LocalDateTime threshold = LocalDateTime.now().minusDays(90);
        int newlyDormantCount = 0;
        int highRiskCount = 0;
        BigDecimal highRiskBalance = BigDecimal.ZERO;

        for (Account account : allAccounts) {
            if (account.getStatus() == AccountStatus.CLOSED) {
                continue;
            }

            LocalDateTime lastAct = account.getLastActivityAt() != null ? account.getLastActivityAt() : account.getCreatedAt();
            boolean isInactive90 = lastAct != null && lastAct.isBefore(threshold);

            if (account.getStatus() == AccountStatus.ACTIVE && isInactive90) {
                account.setStatus(AccountStatus.DORMANT);
                account.setDormantSince(LocalDateTime.now());
                accountRepository.save(account);
                newlyDormantCount++;

                auditLogRepository.save(new AuditLog(
                        admin,
                        "AUTO_DORMANCY_ENFORCED",
                        "Account",
                        account.getAccountNumber(),
                        clientIp,
                        "SUCCESS",
                        "Account placed into Dormant Protection Mode (inactive > 90 days) to prevent scam exploitation."
                ));

                if (account.getCustomer() != null) {
                    notificationRepository.save(new Notification(
                            account.getCustomer(),
                            "🛡️ Dormant Account Scam Shield Activated",
                            "Your account " + account.getAccountNumber() + " has been marked DORMANT after 90+ days of inactivity to protect your funds against unauthorized transactions. Complete KYC re-verification to reactivate.",
                            "ACCOUNT"
                    ));
                }
            }

            if (account.getStatus() == AccountStatus.DORMANT) {
                if (account.getBalance().compareTo(new BigDecimal("10000.00")) >= 0) {
                    highRiskCount++;
                    highRiskBalance = highRiskBalance.add(account.getBalance());
                }
            }
        }

        // If high risk dormant balances detected, log a protective security event
        if (highRiskCount > 0) {
            String alertDesc = String.format(
                    "🛡️ DORMANT SCAN COMPLETE: Detected %d dormant accounts holding ₹%.2f vulnerable to dormant account takeover and insider scams. Enhanced 2FA and admin KYC verification enforced.",
                    highRiskCount, highRiskBalance
            );
            securityEventRepository.save(new SecurityEvent(admin, "DORMANT_RISK_AUDIT", SecuritySeverity.HIGH, alertDesc));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("scannedAccounts", allAccounts.size());
        result.put("newlyDormantAccounts", newlyDormantCount);
        result.put("highRiskDormantTargets", highRiskCount);
        result.put("protectedVulnerableFunds", highRiskBalance);
        result.put("message", String.format("Scan complete. %d accounts placed under Dormant Scam Shield protection.", newlyDormantCount));
        return result;
    }

    /**
     * Aggregates real-time Anti-Scam Shield statistics.
     */
    @Transactional(readOnly = true)
    public ScamShieldStatsDTO getScamShieldStats() {
        ScamShieldStatsDTO stats = new ScamShieldStatsDTO();
        List<Account> accounts = accountRepository.findAll();

        stats.setTotalAccounts(accounts.size());

        long dormantCount = 0;
        BigDecimal dormantFunds = BigDecimal.ZERO;
        for (Account a : accounts) {
            if (a.getStatus() == AccountStatus.DORMANT) {
                dormantCount++;
                dormantFunds = dormantFunds.add(a.getBalance());
            }
        }

        stats.setTotalDormantAccounts(dormantCount);
        stats.setHighRiskDormantFunds(dormantFunds);
        stats.setScamAttemptsBlocked(securityEventRepository.count());
        stats.setActiveThreatAlerts(securityEventRepository.countByStatus(SecurityEventStatus.OPEN));
        stats.setPendingReactivations(reactivationRequestRepository.countByStatus(ReactivationStatus.PENDING));

        return stats;
    }

    /**
     * Retrieves all security threat events and intercepted scam attempts.
     */
    @Transactional(readOnly = true)
    public List<SecurityEventDTO> getAllSecurityEvents() {
        return securityEventRepository.findAllByOrderByDetectedAtDesc()
                .stream()
                .map(SecurityEventDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Resolves an open security threat alert.
     */
    @Transactional
    public SecurityEventDTO resolveSecurityEvent(Long eventId, String adminUsername, String resolutionNotes, String clientIp) {
        User admin = userRepository.findByUsername(adminUsername).orElse(null);
        SecurityEvent event = securityEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Security event not found: " + eventId));

        event.setStatus(SecurityEventStatus.RESOLVED);
        SecurityEvent updated = securityEventRepository.save(event);

        auditLogRepository.save(new AuditLog(
                admin,
                "SECURITY_EVENT_RESOLVED",
                "SecurityEvent",
                String.valueOf(eventId),
                clientIp,
                "SUCCESS",
                "Resolved alert [" + event.getEventType() + "]. Officer Notes: " + (resolutionNotes != null ? resolutionNotes : "Verified by security team")
        ));

        return SecurityEventDTO.fromEntity(updated);
    }
}
