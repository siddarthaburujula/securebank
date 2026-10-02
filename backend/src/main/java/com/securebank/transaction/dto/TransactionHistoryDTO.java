package com.securebank.transaction.dto;

import com.securebank.account.dto.AccountResponseDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionHistoryDTO {

    private Long id;
    private String referenceNumber;
    private String entryType;       // CREDIT or DEBIT from this account's perspective
    private BigDecimal amount;
    private String status;
    private String transferType;
    private String description;
    private String counterpartyName;
    private String counterpartyAccountMasked;
    private LocalDateTime initiatedAt;
    private LocalDateTime completedAt;

    public TransactionHistoryDTO() {
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public String getEntryType() { return entryType; }
    public void setEntryType(String entryType) { this.entryType = entryType; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTransferType() { return transferType; }
    public void setTransferType(String transferType) { this.transferType = transferType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCounterpartyName() { return counterpartyName; }
    public void setCounterpartyName(String counterpartyName) { this.counterpartyName = counterpartyName; }

    public String getCounterpartyAccountMasked() { return counterpartyAccountMasked; }
    public void setCounterpartyAccountMasked(String counterpartyAccountMasked) {
        this.counterpartyAccountMasked = AccountResponseDTO.maskAccountNumber(counterpartyAccountMasked);
    }

    public LocalDateTime getInitiatedAt() { return initiatedAt; }
    public void setInitiatedAt(LocalDateTime initiatedAt) { this.initiatedAt = initiatedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
