package com.securebank.auth.dto;

import com.securebank.account.entity.AccountType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RegistrationSuccessDTO {

    private String customerName;
    private String username;
    private String accountNumber;
    private String maskedAccountNumber;
    private String ifscCode;
    private AccountType accountType;
    private BigDecimal balance;
    private String status;
    private LocalDateTime createdAt;
    private String message;

    public RegistrationSuccessDTO() {
    }

    public RegistrationSuccessDTO(String customerName, String username, String accountNumber, String ifscCode,
                                  AccountType accountType, BigDecimal balance, String status, LocalDateTime createdAt) {
        this.customerName = customerName;
        this.username = username;
        this.accountNumber = accountNumber;
        this.maskedAccountNumber = maskAccountNumber(accountNumber);
        this.ifscCode = ifscCode;
        this.accountType = accountType;
        this.balance = balance;
        this.status = status;
        this.createdAt = createdAt;
        this.message = "Account created successfully. Welcome to SecureBank!";
    }

    private static String maskAccountNumber(String acc) {
        if (acc == null || acc.length() < 4) {
            return "****";
        }
        String last4 = acc.substring(acc.length() - 4);
        return "XXXX XXXX " + last4;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
        this.maskedAccountNumber = maskAccountNumber(accountNumber);
    }

    public String getMaskedAccountNumber() {
        return maskedAccountNumber;
    }

    public void setMaskedAccountNumber(String maskedAccountNumber) {
        this.maskedAccountNumber = maskedAccountNumber;
    }

    public String getIfscCode() {
        return ifscCode;
    }

    public void setIfscCode(String ifscCode) {
        this.ifscCode = ifscCode;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
