package com.securebank.account.service;

import com.securebank.account.repository.AccountRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class AccountNumberGenerator {

    private final AccountRepository accountRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public AccountNumberGenerator(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public synchronized String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            // Generate a 12-digit account number starting with standard branch prefix '1001'
            long suffix = 10000000L + secureRandom.nextInt(90000000);
            accountNumber = "1001" + suffix;
        } while (accountRepository.existsByAccountNumber(accountNumber));

        return accountNumber;
    }
}
