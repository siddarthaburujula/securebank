package com.securebank.admin.controller;

import com.securebank.admin.dto.*;
import com.securebank.admin.service.AdminService;
import com.securebank.audit.dto.AuditLogDTO;
import com.securebank.common.ApiResponse;
import com.securebank.dormant.dto.ReactivationResponseDTO;
import com.securebank.dormant.dto.ReviewReactivationDTO;
import com.securebank.security.UserPrincipal;
import com.securebank.securityevent.dto.SecurityEventDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * GET /api/admin/accounts
     * Returns list of all customer accounts in the bank.
     */
    @GetMapping("/accounts")
    public ResponseEntity<ApiResponse<List<AdminAccountDTO>>> getAllAccounts() {
        List<AdminAccountDTO> accounts = adminService.getAllAccounts();
        return ResponseEntity.ok(ApiResponse.success("All bank accounts retrieved.", accounts));
    }

    /**
     * POST /api/admin/customers
     * Admin manually onboards a customer and provisions an account.
     */
    @PostMapping("/customers")
    public ResponseEntity<ApiResponse<AdminAccountDTO>> createCustomer(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AdminCreateCustomerDTO request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        AdminAccountDTO account = adminService.createCustomer(request, userPrincipal.getUsername(), clientIp);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Customer successfully created and onboarded.", account));
    }

    /**
     * PUT /api/admin/customers/{customerId}
     * Admin updates customer personal details.
     */
    @PutMapping("/customers/{customerId}")
    public ResponseEntity<ApiResponse<AdminAccountDTO>> updateCustomer(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long customerId,
            @Valid @RequestBody AdminUpdateCustomerDTO request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        AdminAccountDTO account = adminService.updateCustomer(customerId, request, userPrincipal.getUsername(), clientIp);
        return ResponseEntity.ok(ApiResponse.success("Customer details successfully updated.", account));
    }

    /**
     * DELETE /api/admin/customers/{customerId}
     * Admin removes a customer and their accounts from the bank.
     */
    @DeleteMapping("/customers/{customerId}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long customerId,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        adminService.deleteCustomer(customerId, userPrincipal.getUsername(), clientIp);
        return ResponseEntity.ok(ApiResponse.success("Customer and linked records successfully removed.", null));
    }

    /**
     * POST /api/admin/accounts/{id}/mark-dormant
     * Admin manually enforces Dormancy Lock on an account for anti-scam protection.
     */
    @PostMapping("/accounts/{id}/mark-dormant")
    public ResponseEntity<ApiResponse<AdminAccountDTO>> markAccountDormant(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpRequest) {

        String reason = (body != null && body.containsKey("reason"))
                ? body.get("reason")
                : "Administrative Dormancy Hold to prevent takeover scam";
        String clientIp = resolveClientIp(httpRequest);

        AdminAccountDTO account = adminService.markAccountDormant(id, userPrincipal.getUsername(), reason, clientIp);
        return ResponseEntity.ok(ApiResponse.success("Account successfully placed under Dormant Scam Shield.", account));
    }

    /**
     * POST /api/admin/accounts/{id}/freeze
     * Freezes a suspicious or compromised account.
     */
    @PostMapping("/accounts/{id}/freeze")
    public ResponseEntity<ApiResponse<AdminAccountDTO>> freezeAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpRequest) {

        String reason = (body != null && body.containsKey("reason"))
                ? body.get("reason")
                : "Administrative security hold";
        String clientIp = resolveClientIp(httpRequest);

        AdminAccountDTO account = adminService.freezeAccount(id, userPrincipal.getUsername(), reason, clientIp);
        return ResponseEntity.ok(ApiResponse.success("Account successfully frozen.", account));
    }

    /**
     * POST /api/admin/accounts/{id}/unfreeze
     * Restores a frozen account to ACTIVE status.
     */
    @PostMapping("/accounts/{id}/unfreeze")
    public ResponseEntity<ApiResponse<AdminAccountDTO>> unfreezeAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        AdminAccountDTO account = adminService.unfreezeAccount(id, userPrincipal.getUsername(), clientIp);
        return ResponseEntity.ok(ApiResponse.success("Account successfully unfrozen.", account));
    }

    /**
     * GET /api/admin/reactivations
     * Returns all PENDING dormant account reactivation requests.
     */
    @GetMapping("/reactivations")
    public ResponseEntity<ApiResponse<List<ReactivationResponseDTO>>> getPendingReactivations() {
        List<ReactivationResponseDTO> list = adminService.getPendingReactivations();
        return ResponseEntity.ok(ApiResponse.success("Pending reactivation requests.", list));
    }

    /**
     * GET /api/admin/reactivations/all
     * Returns ALL reactivation requests (PENDING + APPROVED + REJECTED) for full audit history.
     */
    @GetMapping("/reactivations/all")
    public ResponseEntity<ApiResponse<List<ReactivationResponseDTO>>> getAllReactivations() {
        List<ReactivationResponseDTO> list = adminService.getAllReactivations();
        return ResponseEntity.ok(ApiResponse.success("All reactivation requests.", list));
    }

    /**
     * POST /api/admin/reactivations/{id}/review
     * Approves or rejects a dormant account reactivation request.
     */
    @PostMapping("/reactivations/{id}/review")
    public ResponseEntity<ApiResponse<ReactivationResponseDTO>> reviewReactivation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @Valid @RequestBody ReviewReactivationDTO review,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        ReactivationResponseDTO dto = adminService.reviewReactivation(id, userPrincipal.getUsername(), review, clientIp);
        String actionMsg = Boolean.TRUE.equals(review.getApproved())
                ? "Reactivation request approved. Account is now ACTIVE."
                : "Reactivation request rejected.";
        return ResponseEntity.ok(ApiResponse.success(actionMsg, dto));
    }

    /**
     * GET /api/admin/audits?page=0&size=20
     * Returns immutable audit logs for compliance monitoring (using safe DTOs).
     */
    @GetMapping("/audits")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AuditLogDTO> audits = adminService.getAuditLogs(page, size);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved.", audits));
    }

    // ─── Anti-Scam & Fraud Shield Endpoints ───────────────────────────────────

    /**
     * GET /api/admin/scam-shield/stats
     * Returns overview metrics for dormant accounts and scam threats.
     */
    @GetMapping("/scam-shield/stats")
    public ResponseEntity<ApiResponse<ScamShieldStatsDTO>> getScamShieldStats() {
        ScamShieldStatsDTO stats = adminService.getScamShieldStats();
        return ResponseEntity.ok(ApiResponse.success("Anti-Scam Shield statistics retrieved.", stats));
    }

    /**
     * GET /api/admin/scam-shield/alerts
     * Returns list of security threat alerts and intercepted scam attempts.
     */
    @GetMapping("/scam-shield/alerts")
    public ResponseEntity<ApiResponse<List<SecurityEventDTO>>> getSecurityAlerts() {
        List<SecurityEventDTO> alerts = adminService.getSecurityEvents();
        return ResponseEntity.ok(ApiResponse.success("Security alerts retrieved.", alerts));
    }

    /**
     * POST /api/admin/scam-shield/alerts/{id}/resolve
     * Marks an open threat alert as resolved with audit logging.
     */
    @PostMapping("/scam-shield/alerts/{id}/resolve")
    public ResponseEntity<ApiResponse<SecurityEventDTO>> resolveAlert(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpRequest) {

        String notes = (body != null) ? body.get("notes") : null;
        String clientIp = resolveClientIp(httpRequest);
        SecurityEventDTO resolved = adminService.resolveSecurityEvent(id, userPrincipal.getUsername(), notes, clientIp);
        return ResponseEntity.ok(ApiResponse.success("Security alert marked as resolved.", resolved));
    }

    /**
     * POST /api/admin/scam-shield/scan
     * Triggers proactive dormancy detection scan to stop dormant account scams.
     */
    @PostMapping("/scam-shield/scan")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runScamScan(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        Map<String, Object> result = adminService.runScamScan(userPrincipal.getUsername(), clientIp);
        return ResponseEntity.ok(ApiResponse.success("Dormant account scam scan completed successfully.", result));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
