package com.securebank.common.exception;

public class InsufficientFundsException extends RuntimeException {
    private final String accountNumber;

    public InsufficientFundsException(String accountNumber, String message) {
        super(message);
        this.accountNumber = accountNumber;
    }

    public String getAccountNumber() {
        return accountNumber;
    }
}
