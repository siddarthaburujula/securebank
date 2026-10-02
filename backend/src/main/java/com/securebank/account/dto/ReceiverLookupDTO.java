package com.securebank.account.dto;

public class ReceiverLookupDTO {

    private String accountNumber;
    private String maskedAccountNumber;
    private String receiverName;
    private String ifscCode;
    private String bankName;
    private String accountType;

    public ReceiverLookupDTO() {
    }

    public ReceiverLookupDTO(String accountNumber, String receiverName, String ifscCode, String accountType) {
        this.accountNumber = accountNumber;
        this.maskedAccountNumber = AccountResponseDTO.maskAccountNumber(accountNumber);
        this.receiverName = receiverName;
        this.ifscCode = ifscCode;
        this.bankName = "SecureBank";
        this.accountType = accountType;
    }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
        this.maskedAccountNumber = AccountResponseDTO.maskAccountNumber(accountNumber);
    }

    public String getMaskedAccountNumber() { return maskedAccountNumber; }
    public void setMaskedAccountNumber(String maskedAccountNumber) { this.maskedAccountNumber = maskedAccountNumber; }

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }
}
