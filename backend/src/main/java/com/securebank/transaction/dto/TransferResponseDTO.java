package com.securebank.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransferResponseDTO {

    private String referenceNumber;
    private String status;
    private BigDecimal amount;
    private String senderAccountMasked;
    private String receiverAccountMasked;
    private String receiverName;
    private String transferType;
    private String description;
    private LocalDateTime initiatedAt;
    private LocalDateTime completedAt;
    private BigDecimal senderBalanceAfter;
    private boolean idempotent; // true if this was a duplicate request and we returned the existing tx

    public TransferResponseDTO() {
    }

    // Getters and Setters
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getSenderAccountMasked() { return senderAccountMasked; }
    public void setSenderAccountMasked(String senderAccountMasked) { this.senderAccountMasked = senderAccountMasked; }

    public String getReceiverAccountMasked() { return receiverAccountMasked; }
    public void setReceiverAccountMasked(String receiverAccountMasked) { this.receiverAccountMasked = receiverAccountMasked; }

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }

    public String getTransferType() { return transferType; }
    public void setTransferType(String transferType) { this.transferType = transferType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getInitiatedAt() { return initiatedAt; }
    public void setInitiatedAt(LocalDateTime initiatedAt) { this.initiatedAt = initiatedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public BigDecimal getSenderBalanceAfter() { return senderBalanceAfter; }
    public void setSenderBalanceAfter(BigDecimal senderBalanceAfter) { this.senderBalanceAfter = senderBalanceAfter; }

    public boolean isIdempotent() { return idempotent; }
    public void setIdempotent(boolean idempotent) { this.idempotent = idempotent; }
}
