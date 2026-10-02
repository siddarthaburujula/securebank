package com.securebank.common.exception;

public class DuplicateTransactionException extends RuntimeException {
    private final String idempotencyKey;

    public DuplicateTransactionException(String idempotencyKey) {
        super("A transaction with idempotency key '" + idempotencyKey + "' was already processed.");
        this.idempotencyKey = idempotencyKey;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }
}
