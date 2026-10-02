package com.securebank.mail.controller;

import com.securebank.common.ApiResponse;
import com.securebank.mail.entity.MailAccount;
import com.securebank.mail.entity.MailMessage;
import com.securebank.mail.service.MailService;
import com.securebank.mail.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mail")
public class MailController {

    private final MailService mailService;
    private final OtpService otpService;

    public MailController(MailService mailService, OtpService otpService) {
        this.mailService = mailService;
        this.otpService = otpService;
    }

    /**
     * GET /api/mail/inbox?email=...
     * Fetches all mail messages for the given recipient email or entire bank dispatch log if "ALL" or empty.
     */
    @GetMapping("/inbox")
    public ResponseEntity<ApiResponse<List<MailMessage>>> getInbox(
            @RequestParam(required = false, defaultValue = "ALL") String email) {
        List<MailMessage> messages = mailService.getInbox(email);
        return ResponseEntity.ok(ApiResponse.success("Inbox messages retrieved.", messages));
    }

    /**
     * GET /api/mail/accounts
     * Lists all registered email accounts in the SecureMail portal with unread badge counts.
     */
    @GetMapping("/accounts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAccounts() {
        List<Map<String, Object>> accounts = mailService.getAccounts();
        return ResponseEntity.ok(ApiResponse.success("Mail accounts retrieved.", accounts));
    }

    /**
     * POST /api/mail/accounts
     * Manually provision a new email account into the Webmail portal.
     */
    @PostMapping("/accounts")
    public ResponseEntity<ApiResponse<MailAccount>> createAccount(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String displayName = body.getOrDefault("displayName", email != null ? email.split("@")[0] : "New User");
        String type = body.getOrDefault("accountType", "CUSTOMER");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email address is required."));
        }

        MailAccount account = mailService.createAccount(email, displayName, type);
        return ResponseEntity.ok(ApiResponse.success("Mail account registered.", account));
    }

    /**
     * POST /api/mail/send-otp
     * Dispatches a fresh dynamic 6-digit OTP to the requested email with real-time email delivery.
     */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String purpose = body.getOrDefault("purpose", "VERIFICATION");
        String name = body.getOrDefault("name", "Customer");
        String action = body.getOrDefault("action", "Account security verification request.");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Recipient email is required."));
        }

        String otp = otpService.generateAndSendOtp(
                email.trim(),
                body.get("phone"),
                name,
                purpose,
                "🔐 One-Time Password for " + purpose.replace("_", " "),
                action
        );

        return ResponseEntity.ok(ApiResponse.success("Dynamic OTP dispatched to " + email, Map.of(
                "email", email,
                "purpose", purpose,
                "otp", otp,
                "status", "DISPATCHED"
        )));
    }

    /**
     * POST /api/mail/mark-read/{id}
     */
    @PostMapping("/mark-read/{id}")
    public ResponseEntity<ApiResponse<String>> markRead(@PathVariable Long id) {
        mailService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read."));
    }

    /**
     * DELETE /api/mail/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteMessage(@PathVariable Long id) {
        mailService.deleteMessage(id);
        return ResponseEntity.ok(ApiResponse.success("Message deleted."));
    }

    /**
     * DELETE /api/mail/clear
     */
    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<String>> clearInbox(@RequestParam String email) {
        mailService.clearInbox(email);
        return ResponseEntity.ok(ApiResponse.success("Inbox cleared for " + email));
    }
}
