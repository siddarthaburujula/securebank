package com.securebank.dormant.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReviewReactivationDTO {

    @NotNull(message = "Decision (APPROVED or REJECTED) is required.")
    private Boolean approved;

    @Size(max = 500, message = "Review notes cannot exceed 500 characters.")
    private String reviewNotes;

    // 2-Step verification on officer side: dynamic OTP from admin@securebank.com
    private String officer2faOtp;

    public ReviewReactivationDTO() {}

    public Boolean getApproved() { return approved; }
    public void setApproved(Boolean approved) { this.approved = approved; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }

    public String getOfficer2faOtp() { return officer2faOtp; }
    public void setOfficer2faOtp(String officer2faOtp) { this.officer2faOtp = officer2faOtp; }
}
