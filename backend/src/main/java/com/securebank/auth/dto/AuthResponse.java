package com.securebank.auth.dto;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private long expiresIn;
    private Long userId;
    private String username;
    private String role;
    private String fullName;
    private String accountNumber;
    private String maskedAccountNumber;
    private String accountStatus;

    public AuthResponse() {
    }

    public AuthResponse(String token, long expiresIn, Long userId, String username, String role,
                        String fullName, String accountNumber, String accountStatus) {
        this.token = token;
        this.tokenType = "Bearer";
        this.expiresIn = expiresIn;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
        this.accountNumber = accountNumber;
        this.maskedAccountNumber = maskAccountNumber(accountNumber);
        this.accountStatus = accountStatus;
    }

    private static String maskAccountNumber(String acc) {
        if (acc == null || acc.length() < 4) {
            return "N/A";
        }
        String last4 = acc.substring(acc.length() - 4);
        return "XXXX XXXX " + last4;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }
}
