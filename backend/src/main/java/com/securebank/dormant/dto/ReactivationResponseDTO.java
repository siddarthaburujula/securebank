package com.securebank.dormant.dto;

import com.securebank.dormant.entity.ReactivationRequest;
import java.time.LocalDateTime;

public class ReactivationResponseDTO {

    private Long id;
    private String requestReference;
    private String accountNumber;
    private String customerName;
    private String status;
    private String verificationDetails;
    private String reason;
    private String aadhaar;
    private String pan;
    private String kycMode;
    private String branch;
    private String reviewNotes;
    private String reviewedBy;
    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;

    public ReactivationResponseDTO() {}

    public static ReactivationResponseDTO fromEntity(ReactivationRequest req) {
        ReactivationResponseDTO dto = new ReactivationResponseDTO();
        dto.setId(req.getId());
        dto.setRequestReference(req.getRequestReference());
        dto.setAccountNumber(req.getAccount().getAccountNumber());
        dto.setCustomerName(req.getAccount().getCustomer().getFullName());
        dto.setStatus(req.getStatus().name());
        dto.setVerificationDetails(req.getVerificationDetails());
        dto.setReviewNotes(req.getReviewNotes());
        if (req.getReviewedBy() != null) {
            dto.setReviewedBy(req.getReviewedBy().getUsername());
        }
        dto.setRequestedAt(req.getRequestedAt());
        dto.setReviewedAt(req.getReviewedAt());

        // Parse key details from JSON verificationDetails
        String details = req.getVerificationDetails();
        if (details != null) {
            dto.setReason(extractJsonField(details, "reason"));
            dto.setAadhaar(extractJsonField(details, "aadhaar"));
            dto.setPan(extractJsonField(details, "pan"));
            dto.setKycMode(extractJsonField(details, "kycMode"));
            dto.setBranch(extractJsonField(details, "branch"));
            dto.setOldAadhaar(extractJsonField(details, "oldAadhaar"));
            dto.setNewEmail(extractJsonField(details, "newEmail"));
            dto.setNewPhone(extractJsonField(details, "newPhone"));
            dto.setNewAddress(extractJsonField(details, "newAddress"));
            dto.setHasDetailChanges("true".equalsIgnoreCase(extractJsonField(details, "hasDetailChanges")));
        }

        return dto;
    }

    private String oldAadhaar;
    private String newEmail;
    private String newPhone;
    private String newAddress;
    private Boolean hasDetailChanges = false;

    public String getOldAadhaar() { return oldAadhaar; }
    public void setOldAadhaar(String oldAadhaar) { this.oldAadhaar = oldAadhaar; }

    public String getNewEmail() { return newEmail; }
    public void setNewEmail(String newEmail) { this.newEmail = newEmail; }

    public String getNewPhone() { return newPhone; }
    public void setNewPhone(String newPhone) { this.newPhone = newPhone; }

    public String getNewAddress() { return newAddress; }
    public void setNewAddress(String newAddress) { this.newAddress = newAddress; }

    public Boolean getHasDetailChanges() { return hasDetailChanges; }
    public void setHasDetailChanges(Boolean hasDetailChanges) { this.hasDetailChanges = hasDetailChanges; }

    private static String extractJsonField(String json, String field) {
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]*)\"").matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception ignored) {}
        return null;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRequestReference() { return requestReference; }
    public void setRequestReference(String requestReference) { this.requestReference = requestReference; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getVerificationDetails() { return verificationDetails; }
    public void setVerificationDetails(String verificationDetails) { this.verificationDetails = verificationDetails; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getAadhaar() { return aadhaar; }
    public void setAadhaar(String aadhaar) { this.aadhaar = aadhaar; }

    public String getPan() { return pan; }
    public void setPan(String pan) { this.pan = pan; }

    public String getKycMode() { return kycMode; }
    public void setKycMode(String kycMode) { this.kycMode = kycMode; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
