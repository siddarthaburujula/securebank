package com.securebank.mail.service;

import com.securebank.mail.entity.MailAccount;
import com.securebank.mail.entity.MailMessage;
import com.securebank.mail.entity.OtpVerification;
import com.securebank.mail.repository.MailAccountRepository;
import com.securebank.mail.repository.MailMessageRepository;
import com.securebank.mail.repository.OtpVerificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    private final OtpVerificationRepository otpVerificationRepository;
    private final MailMessageRepository mailMessageRepository;
    private final MailAccountRepository mailAccountRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(OtpVerificationRepository otpVerificationRepository,
                      MailMessageRepository mailMessageRepository,
                      MailAccountRepository mailAccountRepository) {
        this.otpVerificationRepository = otpVerificationRepository;
        this.mailMessageRepository = mailMessageRepository;
        this.mailAccountRepository = mailAccountRepository;
    }

    /**
     * Generates a fresh, dynamic 6-digit OTP, records it in the database with a 10-minute validity,
     * and sends a formal bank email notification to the recipient's SecureMail inbox.
     */
    @Transactional
    public String generateAndSendOtp(String recipientEmail, String recipientPhone, String recipientName,
                                    String purpose, String subject, String actionDescription) {
        // 1. Generate dynamic 6-digit random OTP
        int code = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(code);

        // 2. Save OTP verification record
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);
        OtpVerification verification = new OtpVerification(recipientEmail, recipientPhone, purpose, otp, expiresAt);
        otpVerificationRepository.save(verification);

        // 3. Ensure recipient has a mail account in the SecureMail portal
        ensureMailAccountExists(recipientEmail, recipientName);

        // 4. Construct professional bank email body
        String emailBody = buildOtpEmailHtml(recipientName, otp, purpose, actionDescription, expiresAt);

        // 5. Save email message
        MailMessage message = new MailMessage(
                recipientEmail,
                recipientName != null ? recipientName : "Valued Customer",
                subject,
                emailBody,
                otp,
                "OTP_VERIFICATION"
        );
        mailMessageRepository.save(message);

        return otp;
    }

    /**
     * Sends a security alert notification email without an OTP (e.g. alert to old email address when profile changes).
     */
    @Transactional
    public void sendSecurityAlertEmail(String recipientEmail, String recipientName, String subject, String alertDetails) {
        ensureMailAccountExists(recipientEmail, recipientName);

        String emailBody = buildAlertEmailHtml(recipientName, subject, alertDetails);

        MailMessage message = new MailMessage(
                recipientEmail,
                recipientName != null ? recipientName : "Valued Customer",
                subject,
                emailBody,
                null,
                "SECURITY_ALERT"
        );
        mailMessageRepository.save(message);
    }

    /**
     * Validates that the submitted OTP matches the active unexpired OTP generated for this email & purpose.
     */
    @Transactional
    public boolean verifyOtp(String recipientEmail, String purpose, String submittedOtp) {
        if (submittedOtp == null || submittedOtp.trim().length() != 6) {
            return false;
        }

        OtpVerification verification = otpVerificationRepository
                .findTopByRecipientEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(recipientEmail, purpose)
                .orElse(null);

        if (verification == null) {
            return false;
        }

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }

        if (verification.getOtpCode().equals(submittedOtp.trim())) {
            verification.setUsed(true);
            otpVerificationRepository.save(verification);
            return true;
        } else {
            verification.setAttemptCount(verification.getAttemptCount() + 1);
            otpVerificationRepository.save(verification);
            return false;
        }
    }

    private void ensureMailAccountExists(String email, String name) {
        if (email != null && !mailAccountRepository.existsByEmailIgnoreCase(email)) {
            String displayName = (name != null && !name.isBlank()) ? name : email.split("@")[0];
            String type = email.contains("admin") ? "ADMIN" : "CUSTOMER";
            mailAccountRepository.save(new MailAccount(email.toLowerCase(), displayName, type));
        }
    }

    private String buildOtpEmailHtml(String name, String otp, String purpose, String actionDesc, LocalDateTime expiresAt) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;'>"
                + "<div style='background: #002e6e; color: #ffffff; padding: 20px; text-align: center;'>"
                + "  <h2 style='margin: 0; font-size: 22px; letter-spacing: 0.5px;'>SecureBank NetBanking</h2>"
                + "  <p style='margin: 5px 0 0; font-size: 12px; color: #93c5fd;'>Authorised Authentication Service</p>"
                + "</div>"
                + "<div style='padding: 24px; background: #ffffff; color: #1e293b; line-height: 1.6;'>"
                + "  <p style='font-size: 14px; margin-top: 0;'>Dear <strong>" + (name != null ? name : "Customer") + "</strong>,</p>"
                + "  <p style='font-size: 13px; color: #475569;'>" + actionDesc + "</p>"
                + "  <div style='background: #f8fafc; border: 2px dashed #004c8f; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0;'>"
                + "    <span style='font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 1px;'>Your Dynamic One-Time Password (OTP)</span>"
                + "    <div style='font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #002e6e; margin: 8px 0; font-family: monospace;'>" + otp + "</div>"
                + "    <span style='font-size: 11px; color: #dc2626; font-weight: 600;'>Valid for 10 minutes (Expires: " + expiresAt.toLocalTime().toString().substring(0, 5) + ")</span>"
                + "  </div>"
                + "  <div style='background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin-top: 15px; font-size: 11px; color: #991b1b;'>"
                + "    <strong>🛡️ Anti-Scam Notice:</strong> SecureBank staff will NEVER call or ask for this OTP. Never share this code with bank employees, tellers, or third parties."
                + "  </div>"
                + "</div>"
                + "<div style='background: #f1f5f9; padding: 12px 20px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;'>"
                + "  © 2026 SecureBank Ltd. · Regulatory Compliance & Dormant Account Scam Shield"
                + "</div>"
                + "</div>";
    }

    private String buildAlertEmailHtml(String name, String subject, String alertDetails) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;'>"
                + "<div style='background: #b91c1c; color: #ffffff; padding: 20px; text-align: center;'>"
                + "  <h2 style='margin: 0; font-size: 22px; letter-spacing: 0.5px;'>⚠️ SecureBank Fraud & Security Advisory</h2>"
                + "  <p style='margin: 5px 0 0; font-size: 12px; color: #fecaca;'>Critical Account Security Notification</p>"
                + "</div>"
                + "<div style='padding: 24px; background: #ffffff; color: #1e293b; line-height: 1.6;'>"
                + "  <p style='font-size: 14px; margin-top: 0;'>Dear <strong>" + (name != null ? name : "Customer") + "</strong>,</p>"
                + "  <div style='background: #fff1f2; border-left: 4px solid #e11d48; padding: 14px; margin: 15px 0; font-size: 13px; color: #881337;'>"
                + "    " + alertDetails
                + "  </div>"
                + "  <p style='font-size: 12px; color: #475569;'>If you did not initiate this change, your account may be under an unauthorized takeover attempt. Contact bank fraud management immediately at <strong>1800 202 6161</strong>.</p>"
                + "</div>"
                + "<div style='background: #f1f5f9; padding: 12px 20px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;'>"
                + "  © 2026 SecureBank Ltd. · Regulatory Compliance & Dormant Account Scam Shield"
                + "</div>"
                + "</div>";
    }
}
