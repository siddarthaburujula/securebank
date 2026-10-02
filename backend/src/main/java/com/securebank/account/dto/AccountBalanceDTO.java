package com.securebank.account.dto;

import java.math.BigDecimal;

public class AccountBalanceDTO {

    private String accountNumber;
    private String maskedAccountNumber;
    private BigDecimal balance;
    private String currency = "INR";
    private String status;

    public AccountBalanceDTO() {
    }

    public AccountBalanceDTO(String accountNumber, BigDecimal balance, String status) {
        this.accountNumber = accountNumber;
        this.maskedAccountNumber = AccountResponseDTO.maskAccountNumber(accountNumber);
        this.balance = balance;
        this.status = status;
    }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
        this.maskedAccountNumber = AccountResponseDTO.maskAccountNumber(accountNumber);
    }

    public String getMaskedAccountNumber() { return maskedAccountNumber; }
    public void setMaskedAccountNumber(String maskedAccountNumber) { this.maskedAccountNumber = maskedAccountNumber; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
