package com.securebank.account.controller;

import com.securebank.account.dto.AccountBalanceDTO;
import com.securebank.account.dto.AccountResponseDTO;
import com.securebank.account.dto.DashboardDTO;
import com.securebank.account.dto.ReceiverLookupDTO;
import com.securebank.account.service.AccountService;
import com.securebank.common.ApiResponse;
import com.securebank.security.UserPrincipal;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    /**
     * GET /api/accounts/me
     * Returns full account information for the authenticated customer.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AccountResponseDTO>> getMyAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AccountResponseDTO dto = accountService.getMyAccount(userPrincipal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Account details retrieved successfully", dto));
    }

    /**
     * GET /api/accounts/me/balance
     * Returns current balance directly from MySQL for the authenticated customer.
     */
    @GetMapping("/me/balance")
    public ResponseEntity<ApiResponse<AccountBalanceDTO>> getMyBalance(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AccountBalanceDTO dto = accountService.getMyBalance(userPrincipal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Balance retrieved successfully", dto));
    }

    /**
     * GET /api/accounts/dashboard
     * Returns full dashboard metrics including credits, debits, and recent transactions.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardDTO>> getDashboard(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        DashboardDTO dto = accountService.getDashboard(userPrincipal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved successfully", dto));
    }

    /**
     * GET /api/accounts/lookup?accountNumber={acc}&ifscCode={ifsc}
     * Receiver account search — used in Transfer Money step 1.
     * Only returns safe fields (no private data exposed).
     */
    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<ReceiverLookupDTO>> lookupAccount(
            @RequestParam @NotBlank String accountNumber,
            @RequestParam @NotBlank String ifscCode) {
        ReceiverLookupDTO dto = accountService.lookupReceiverAccount(accountNumber, ifscCode);
        return ResponseEntity.ok(ApiResponse.success("Receiver account found", dto));
    }
}
