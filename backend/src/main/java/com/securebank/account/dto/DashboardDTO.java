package com.securebank.account.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class DashboardDTO {

    private String customerName;
    private String accountNumber;
    private String maskedAccountNumber;
    private String ifscCode;
    private String accountType;
    private String accountStatus;
    private BigDecimal availableBalance;
    private BigDecimal totalCredits;
    private BigDecimal totalDebits;
    private long totalTransactions;
    private long unreadNotifications;
    private LocalDateTime lastActivityAt;
    private List<RecentTransactionDTO> recentTransactions;

    public DashboardDTO() {
    }

    // Getters and Setters
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getMaskedAccountNumber() { return maskedAccountNumber; }
    public void setMaskedAccountNumber(String maskedAccountNumber) { this.maskedAccountNumber = maskedAccountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public BigDecimal getAvailableBalance() { return availableBalance; }
    public void setAvailableBalance(BigDecimal availableBalance) { this.availableBalance = availableBalance; }

    public BigDecimal getTotalCredits() { return totalCredits; }
    public void setTotalCredits(BigDecimal totalCredits) { this.totalCredits = totalCredits; }

    public BigDecimal getTotalDebits() { return totalDebits; }
    public void setTotalDebits(BigDecimal totalDebits) { this.totalDebits = totalDebits; }

    public long getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(long totalTransactions) { this.totalTransactions = totalTransactions; }

    public long getUnreadNotifications() { return unreadNotifications; }
    public void setUnreadNotifications(long unreadNotifications) { this.unreadNotifications = unreadNotifications; }

    public LocalDateTime getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(LocalDateTime lastActivityAt) { this.lastActivityAt = lastActivityAt; }

    public List<RecentTransactionDTO> getRecentTransactions() { return recentTransactions; }
    public void setRecentTransactions(List<RecentTransactionDTO> recentTransactions) { this.recentTransactions = recentTransactions; }

    // Inner DTO for recent transaction summary
    public static class RecentTransactionDTO {
        private String referenceNumber;
        private String description;
        private String entryType;  // CREDIT or DEBIT (from account's perspective)
        private BigDecimal amount;
        private String status;
        private LocalDateTime initiatedAt;
        private String counterpartyName;

        public RecentTransactionDTO() {
        }

        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getEntryType() { return entryType; }
        public void setEntryType(String entryType) { this.entryType = entryType; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public LocalDateTime getInitiatedAt() { return initiatedAt; }
        public void setInitiatedAt(LocalDateTime initiatedAt) { this.initiatedAt = initiatedAt; }

        public String getCounterpartyName() { return counterpartyName; }
        public void setCounterpartyName(String counterpartyName) { this.counterpartyName = counterpartyName; }
    }
}
