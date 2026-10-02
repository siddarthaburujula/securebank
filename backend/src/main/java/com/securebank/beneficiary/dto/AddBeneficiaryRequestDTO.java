package com.securebank.beneficiary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AddBeneficiaryRequestDTO {

    @NotBlank(message = "Beneficiary name is required.")
    @Size(min = 2, max = 100, message = "Beneficiary name must be between 2 and 100 characters.")
    private String beneficiaryName;

    @NotBlank(message = "Account number is required.")
    @Pattern(regexp = "^[0-9]{10,16}$", message = "Account number must be 10 to 16 digits.")
    private String accountNumber;

    @NotBlank(message = "IFSC code is required.")
    @Pattern(regexp = "^[A-Z0-9]{8,16}$", message = "Invalid IFSC code format.")
    private String ifscCode;

    private String bankName;

    @Size(max = 50, message = "Nickname cannot exceed 50 characters.")
    private String nickname;

    public AddBeneficiaryRequestDTO() {}

    public String getBeneficiaryName() { return beneficiaryName; }
    public void setBeneficiaryName(String beneficiaryName) { this.beneficiaryName = beneficiaryName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
}
