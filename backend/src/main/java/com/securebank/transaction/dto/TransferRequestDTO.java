package com.securebank.transaction.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public class TransferRequestDTO {

    @NotBlank(message = "Receiver account number is required")
    private String receiverAccountNumber;

    @com.fasterxml.jackson.annotation.JsonAlias({"receiverIfsc", "receiverIfscCode"})
    @NotBlank(message = "Receiver IFSC code is required")
    private String receiverIfscCode;

    @NotNull(message = "Transfer amount is required")
    @DecimalMin(value = "1.00", message = "Minimum transfer amount is ₹1.00")
    @DecimalMax(value = "500000.00", message = "Maximum transfer per transaction is ₹5,00,000")
    @Digits(integer = 8, fraction = 2, message = "Amount must be a valid monetary value")
    private BigDecimal amount;

    @NotBlank(message = "Transfer type is required")
    @Pattern(regexp = "NEFT|RTGS|IMPS|UPI", message = "Transfer type must be one of: NEFT, RTGS, IMPS, UPI")
    private String transferType;

    @Size(max = 255, message = "Description must be under 255 characters")
    private String description;

    // Idempotency key supplied by the client to prevent duplicate submissions
    @NotBlank(message = "Idempotency key is required")
    @Size(min = 16, max = 64, message = "Idempotency key must be between 16 and 64 characters")
    private String idempotencyKey;

    // Getters and Setters
    public String getReceiverAccountNumber() { return receiverAccountNumber; }
    public void setReceiverAccountNumber(String receiverAccountNumber) { this.receiverAccountNumber = receiverAccountNumber; }

    public String getReceiverIfscCode() { return receiverIfscCode; }
    public void setReceiverIfscCode(String receiverIfscCode) { this.receiverIfscCode = receiverIfscCode; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getTransferType() { return transferType; }
    public void setTransferType(String transferType) { this.transferType = transferType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
