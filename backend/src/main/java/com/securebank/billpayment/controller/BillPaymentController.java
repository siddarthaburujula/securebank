package com.securebank.billpayment.controller;

import com.securebank.billpayment.dto.BillPaymentResponseDTO;
import com.securebank.billpayment.dto.PayBillRequestDTO;
import com.securebank.billpayment.service.BillPaymentService;
import com.securebank.common.ApiResponse;
import com.securebank.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
public class BillPaymentController {

    private final BillPaymentService billPaymentService;

    public BillPaymentController(BillPaymentService billPaymentService) {
        this.billPaymentService = billPaymentService;
    }

    /**
     * POST /api/bills/pay
     * Pay electricity, water, mobile, internet, or DTH bill.
     */
    @PostMapping("/pay")
    public ResponseEntity<ApiResponse<BillPaymentResponseDTO>> payBill(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody PayBillRequestDTO request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        BillPaymentResponseDTO dto = billPaymentService.payBill(userPrincipal.getUsername(), request, clientIp);
        return ResponseEntity.ok(ApiResponse.success("Bill paid successfully.", dto));
    }

    /**
     * GET /api/bills/history
     * Returns history of paid utility bills.
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<BillPaymentResponseDTO>>> getBillHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<BillPaymentResponseDTO> history = billPaymentService.getBillPaymentHistory(userPrincipal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Bill payment history retrieved.", history));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
