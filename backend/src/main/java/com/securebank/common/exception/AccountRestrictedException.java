package com.securebank.common.exception;

public class AccountRestrictedException extends RuntimeException {
    private final String errorCode;

    public AccountRestrictedException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
