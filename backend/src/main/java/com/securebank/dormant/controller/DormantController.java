package com.securebank.dormant.controller;

import com.securebank.common.ApiResponse;
import com.securebank.dormant.dto.ReactivationResponseDTO;
import com.securebank.dormant.dto.SubmitReactivationDTO;
import com.securebank.dormant.service.DormantService;
import com.securebank.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dormant")
public class DormantController {

    private final DormantService dormantService;

    public DormantController(DormantService dormantService) {
        this.dormantService = dormantService;
    }

    /**
     * POST /api/dormant/reactivate
     * Allows a customer with a dormant account to submit a step-up reactivation request.
     */
    @PostMapping("/reactivate")
    public ResponseEntity<ApiResponse<ReactivationResponseDTO>> requestReactivation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody SubmitReactivationDTO request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        ReactivationResponseDTO dto = dormantService.requestReactivation(userPrincipal.getUsername(), request, clientIp);
        return ResponseEntity.ok(ApiResponse.success("Reactivation request submitted successfully.", dto));
    }

    /**
     * GET /api/dormant/requests
     * Returns history of reactivation requests submitted by the current user.
     */
    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<List<ReactivationResponseDTO>>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<ReactivationResponseDTO> list = dormantService.getCustomerRequests(userPrincipal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Reactivation requests retrieved.", list));
    }

    /**
     * GET /api/dormant/status
     * Returns the dormancy status, inactivity days, and pending review state for the logged-in user.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<com.securebank.dormant.dto.AccountDormancyStatusDTO>> getDormancyStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        com.securebank.dormant.dto.AccountDormancyStatusDTO status = dormantService.getAccountDormancyStatus(userPrincipal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Account dormancy status retrieved.", status));
    }

    /**
     * POST /api/dormant/simulate-dormant
     * Allows the user to simulate dormancy lock on their own account to demo anti-scam defense.
     */
    @PostMapping("/simulate-dormant")
    public ResponseEntity<ApiResponse<com.securebank.dormant.dto.AccountDormancyStatusDTO>> simulateDormancy(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        com.securebank.dormant.dto.AccountDormancyStatusDTO status = dormantService.simulateDormancy(userPrincipal.getUsername(), clientIp);
        return ResponseEntity.ok(ApiResponse.success("Account placed under Dormant Scam Shield for demo testing.", status));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
