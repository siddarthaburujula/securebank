package com.securebank.transaction.controller;

import com.securebank.common.ApiResponse;
import com.securebank.security.UserPrincipal;
import com.securebank.transaction.dto.TransactionHistoryDTO;
import com.securebank.transaction.dto.TransferRequestDTO;
import com.securebank.transaction.dto.TransferResponseDTO;
import com.securebank.transaction.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * POST /api/transactions/transfer
     * Initiates an atomic fund transfer. Idempotent — safe to retry with same key.
     */
    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransferResponseDTO>> initiateTransfer(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody TransferRequestDTO request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        TransferResponseDTO response = transactionService.initiateTransfer(
                userPrincipal.getUsername(), request, clientIp);

        String message = response.isIdempotent()
                ? "Transaction already processed (idempotent response)."
                : "Transfer completed successfully.";

        return ResponseEntity.ok(ApiResponse.success(message, response));
    }

    /**
     * GET /api/transactions/history?page=0&size=10
     * Returns paginated transaction history for the authenticated customer.
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<TransactionHistoryDTO>>> getTransactionHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {

        Page<TransactionHistoryDTO> history = transactionService
                .getTransactionHistory(userPrincipal.getUsername(), page, size);

        return ResponseEntity.ok(ApiResponse.success(
                "Transaction history retrieved successfully.", history));
    }

    /**
     * GET /api/transactions/{referenceNumber}
     * Returns details of a single transaction by reference number.
     * Only accessible to participants (sender or receiver) of that transaction.
     */
    @GetMapping("/{referenceNumber}")
    public ResponseEntity<ApiResponse<TransactionHistoryDTO>> getTransaction(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String referenceNumber) {

        TransactionHistoryDTO dto = transactionService
                .getTransactionByReference(userPrincipal.getUsername(), referenceNumber);

        return ResponseEntity.ok(ApiResponse.success("Transaction details retrieved.", dto));
    }

    /**
     * GET /api/transactions/statement?startDate=2026-01-01&endDate=2026-03-31
     * Returns structured statement summary with opening/closing balances.
     */
    @GetMapping("/statement")
    public ResponseEntity<ApiResponse<com.securebank.transaction.dto.StatementSummaryDTO>> getStatement(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {

        com.securebank.transaction.dto.StatementSummaryDTO statement = transactionService.getStatement(
                userPrincipal.getUsername(), startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Statement generated successfully.", statement));
    }

    /**
     * GET /api/transactions/statement/csv?startDate=...&endDate=...
     * Exports account statement as downloadable CSV file.
     */
    @GetMapping(value = "/statement/csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportStatementCsv(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {

        String csvData = transactionService.exportStatementCsv(userPrincipal.getUsername(), startDate, endDate);
        byte[] output = csvData.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=statement_" + userPrincipal.getUsername() + ".csv")
                .body(output);
    }

    // ─── Resolve real client IP (handles X-Forwarded-For from proxies) ──────

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
