package com.securebank.dormant.dto;

import com.securebank.account.entity.AccountStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AccountDormancyStatusDTO {
    private String accountNumber;
    private AccountStatus status;
    private boolean isDormant;
    private LocalDateTime dormantSince;
    private LocalDateTime lastActivityAt;
    private long inactivityDays;
    private BigDecimal balance;
    private String customerName;
    private boolean hasPendingReactivation;
    private String pendingRequestReference;

    public AccountDormancyStatusDTO() {
    }

    public AccountDormancyStatusDTO(String accountNumber, AccountStatus status, boolean isDormant,
                                    LocalDateTime dormantSince, LocalDateTime lastActivityAt,
                                    long inactivityDays, BigDecimal balance, String customerName,
                                    boolean hasPendingReactivation, String pendingRequestReference) {
        this.accountNumber = accountNumber;
        this.status = status;
        this.isDormant = isDormant;
        this.dormantSince = dormantSince;
        this.lastActivityAt = lastActivityAt;
        this.inactivityDays = inactivityDays;
        this.balance = balance;
        this.customerName = customerName;
        this.hasPendingReactivation = hasPendingReactivation;
        this.pendingRequestReference = pendingRequestReference;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public boolean isDormant() {
        return isDormant;
    }

    public void setDormant(boolean dormant) {
        isDormant = dormant;
    }

    public LocalDateTime getDormantSince() {
        return dormantSince;
    }

    public void setDormantSince(LocalDateTime dormantSince) {
        this.dormantSince = dormantSince;
    }

    public LocalDateTime getLastActivityAt() {
        return lastActivityAt;
    }

    public void setLastActivityAt(LocalDateTime lastActivityAt) {
        this.lastActivityAt = lastActivityAt;
    }

    public long getInactivityDays() {
        return inactivityDays;
    }

    public void setInactivityDays(long inactivityDays) {
        this.inactivityDays = inactivityDays;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public boolean isHasPendingReactivation() {
        return hasPendingReactivation;
    }

    public void setHasPendingReactivation(boolean hasPendingReactivation) {
        this.hasPendingReactivation = hasPendingReactivation;
    }

    public String getPendingRequestReference() {
        return pendingRequestReference;
    }

    public void setPendingRequestReference(String pendingRequestReference) {
        this.pendingRequestReference = pendingRequestReference;
    }
}
