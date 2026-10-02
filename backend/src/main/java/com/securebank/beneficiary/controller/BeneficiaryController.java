package com.securebank.beneficiary.controller;

import com.securebank.beneficiary.dto.AddBeneficiaryRequestDTO;
import com.securebank.beneficiary.dto.BeneficiaryResponseDTO;
import com.securebank.beneficiary.service.BeneficiaryService;
import com.securebank.common.ApiResponse;
import com.securebank.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    public BeneficiaryController(BeneficiaryService beneficiaryService) {
        this.beneficiaryService = beneficiaryService;
    }

    /**
     * POST /api/beneficiaries
     * Add a new payee/beneficiary. Starts a 30-minute cooling-off period.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BeneficiaryResponseDTO>> addBeneficiary(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AddBeneficiaryRequestDTO request) {

        BeneficiaryResponseDTO dto = beneficiaryService.addBeneficiary(userPrincipal.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Beneficiary registered successfully. Cooling-off period active for 30 minutes.", dto));
    }

    /**
     * GET /api/beneficiaries
     * Returns list of saved payees for the logged-in customer.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BeneficiaryResponseDTO>>> getBeneficiaries(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<BeneficiaryResponseDTO> list = beneficiaryService.getBeneficiaries(userPrincipal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Beneficiaries retrieved successfully.", list));
    }

    /**
     * DELETE /api/beneficiaries/{id}
     * Deactivates a saved beneficiary.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBeneficiary(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {

        beneficiaryService.deleteBeneficiary(userPrincipal.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Beneficiary removed successfully.", null));
    }
}
