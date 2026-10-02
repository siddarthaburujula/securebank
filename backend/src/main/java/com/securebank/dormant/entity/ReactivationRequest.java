package com.securebank.dormant.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.securebank.account.entity.Account;
import com.securebank.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reactivation_requests")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReactivationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Account account;

    @Column(name = "request_reference", nullable = false, unique = true, length = 36)
    private String requestReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReactivationStatus status = ReactivationStatus.PENDING;

    @Column(name = "verification_details", columnDefinition = "JSON")
    private String verificationDetails;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    public ReactivationRequest() {}

    public ReactivationRequest(Account account, String requestReference, String verificationDetails) {
        this.account = account;
        this.requestReference = requestReference;
        this.verificationDetails = verificationDetails;
        this.status = ReactivationStatus.PENDING;
        this.requestedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }

    public String getRequestReference() { return requestReference; }
    public void setRequestReference(String requestReference) { this.requestReference = requestReference; }

    public ReactivationStatus getStatus() { return status; }
    public void setStatus(ReactivationStatus status) { this.status = status; }

    public String getVerificationDetails() { return verificationDetails; }
    public void setVerificationDetails(String verificationDetails) { this.verificationDetails = verificationDetails; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
