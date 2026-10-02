package com.securebank.dormant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SubmitReactivationDTO {

    @NotBlank(message = "Reason for inactivity is required.")
    @Size(min = 10, max = 500, message = "Reason must be between 10 and 500 characters.")
    private String reason;

    private String simulatedOtp;
    private String otp;

    // Legacy / General fields
    private String aadhaarNumber;
    private String panNumber;
    private String aadhaarOtp;
    private String kycMode = "ONLINE_AADHAAR_PAN";
    private String branchName;

    // ─── 2-Step Verification for Dormant KYC & Detail Changes ───
    // Step 1: Existing (Old) details verification
    private String oldAadhaarNumber;
    private String oldOtp;

    // Step 2: New details (if changing phone/email/pan/aadhaar/address)
    private Boolean hasDetailChanges = false;
    private String newAadhaarNumber;
    private String newPanNumber;
    private String newEmail;
    private String newPhoneNumber;
    private String newAddress;
    private String newOtp;

    public SubmitReactivationDTO() {}

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getSimulatedOtp() { 
        return simulatedOtp != null ? simulatedOtp : otp; 
    }
    public void setSimulatedOtp(String simulatedOtp) { this.simulatedOtp = simulatedOtp; }

    public String getOtp() { return otp != null ? otp : simulatedOtp; }
    public void setOtp(String otp) { this.otp = otp; }

    public String getAadhaarNumber() { 
        return (newAadhaarNumber != null && !newAadhaarNumber.isBlank()) ? newAadhaarNumber : aadhaarNumber; 
    }
    public void setAadhaarNumber(String aadhaarNumber) { this.aadhaarNumber = aadhaarNumber; }

    public String getPanNumber() { 
        return (newPanNumber != null && !newPanNumber.isBlank()) ? newPanNumber : panNumber; 
    }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public String getAadhaarOtp() { 
        return (oldOtp != null && !oldOtp.isBlank()) ? oldOtp : aadhaarOtp; 
    }
    public void setAadhaarOtp(String aadhaarOtp) { this.aadhaarOtp = aadhaarOtp; }

    public String getKycMode() { return kycMode; }
    public void setKycMode(String kycMode) { this.kycMode = kycMode; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public String getOldAadhaarNumber() { return oldAadhaarNumber; }
    public void setOldAadhaarNumber(String oldAadhaarNumber) { this.oldAadhaarNumber = oldAadhaarNumber; }

    public String getOldOtp() { return oldOtp; }
    public void setOldOtp(String oldOtp) { this.oldOtp = oldOtp; }

    public Boolean getHasDetailChanges() { return hasDetailChanges != null && hasDetailChanges; }
    public void setHasDetailChanges(Boolean hasDetailChanges) { this.hasDetailChanges = hasDetailChanges; }

    public String getNewAadhaarNumber() { return newAadhaarNumber; }
    public void setNewAadhaarNumber(String newAadhaarNumber) { this.newAadhaarNumber = newAadhaarNumber; }

    public String getNewPanNumber() { return newPanNumber; }
    public void setNewPanNumber(String newPanNumber) { this.newPanNumber = newPanNumber; }

    public String getNewEmail() { return newEmail; }
    public void setNewEmail(String newEmail) { this.newEmail = newEmail; }

    public String getNewPhoneNumber() { return newPhoneNumber; }
    public void setNewPhoneNumber(String newPhoneNumber) { this.newPhoneNumber = newPhoneNumber; }

    public String getNewAddress() { return newAddress; }
    public void setNewAddress(String newAddress) { this.newAddress = newAddress; }

    public String getNewOtp() { return newOtp; }
    public void setNewOtp(String newOtp) { this.newOtp = newOtp; }
}
