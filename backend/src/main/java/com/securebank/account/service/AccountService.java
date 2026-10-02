package com.securebank.account.service;

import com.securebank.account.dto.AccountBalanceDTO;
import com.securebank.account.dto.AccountResponseDTO;
import com.securebank.account.dto.DashboardDTO;
import com.securebank.account.dto.ReceiverLookupDTO;
import com.securebank.account.entity.Account;
import com.securebank.account.repository.AccountRepository;
import com.securebank.common.exception.ResourceNotFoundException;
import com.securebank.customer.entity.Customer;
import com.securebank.customer.repository.CustomerRepository;
import com.securebank.ledger.entity.EntryType;
import com.securebank.ledger.entity.LedgerEntry;
import com.securebank.ledger.repository.LedgerRepository;
import com.securebank.notification.repository.NotificationRepository;
import com.securebank.transaction.entity.Transaction;
import com.securebank.transaction.entity.TransactionStatus;
import com.securebank.transaction.repository.TransactionRepository;
import com.securebank.user.entity.User;
import com.securebank.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerRepository ledgerRepository;
    private final NotificationRepository notificationRepository;

    public AccountService(AccountRepository accountRepository,
                          CustomerRepository customerRepository,
                          UserRepository userRepository,
                          TransactionRepository transactionRepository,
                          LedgerRepository ledgerRepository,
                          NotificationRepository notificationRepository) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerRepository = ledgerRepository;
        this.notificationRepository = notificationRepository;
    }

    // ─── Resolve Account for Authenticated User ──────────────────────────────

    @Transactional(readOnly = true)
    public Account getAccountForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user: " + username));

        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        if (accounts.isEmpty()) {
            throw new ResourceNotFoundException("No account found for customer: " + customer.getFullName());
        }
        return accounts.get(0);
    }

    // ─── GET /api/accounts/me ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AccountResponseDTO getMyAccount(String username) {
        Account account = getAccountForUser(username);
        Customer customer = account.getCustomer();

        AccountResponseDTO dto = new AccountResponseDTO();
        dto.setId(account.getId());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setIfscCode(account.getIfscCode());
        dto.setAccountType(account.getAccountType());
        dto.setBalance(account.getBalance());
        dto.setStatus(account.getStatus());
        dto.setLastActivityAt(account.getLastActivityAt());
        dto.setDormantSince(account.getDormantSince());
        dto.setCreatedAt(account.getCreatedAt());
        dto.setCustomerName(customer.getFullName());
        dto.setCustomerEmail(customer.getEmail());
        dto.setCustomerPhone(customer.getPhoneNumber());

        return dto;
    }

    // ─── GET /api/accounts/me/balance ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public AccountBalanceDTO getMyBalance(String username) {
        Account account = getAccountForUser(username);
        return new AccountBalanceDTO(
                account.getAccountNumber(),
                account.getBalance(),
                account.getStatus().name()
        );
    }

    // ─── GET /api/accounts/dashboard ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardDTO getDashboard(String username) {
        Account account = getAccountForUser(username);
        Customer customer = account.getCustomer();

        // Pull ledger entries for this account to compute aggregate credits/debits
        List<LedgerEntry> entries = ledgerRepository.findByAccountIdOrderByPostedAtDesc(account.getId());

        BigDecimal totalCredits = BigDecimal.ZERO;
        BigDecimal totalDebits = BigDecimal.ZERO;

        for (LedgerEntry entry : entries) {
            if (entry.getEntryType() == EntryType.CREDIT) {
                totalCredits = totalCredits.add(entry.getAmount());
            } else {
                totalDebits = totalDebits.add(entry.getAmount());
            }
        }

        // Fetch 5 most recent transactions for this account
        Page<Transaction> recentTxPage = transactionRepository.findByAccountId(
                account.getId(),
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "initiatedAt"))
        );

        List<DashboardDTO.RecentTransactionDTO> recentList = new ArrayList<>();
        for (Transaction tx : recentTxPage.getContent()) {
            DashboardDTO.RecentTransactionDTO r = new DashboardDTO.RecentTransactionDTO();
            r.setReferenceNumber(tx.getReferenceNumber());
            r.setAmount(tx.getAmount());
            r.setStatus(tx.getStatus().name());
            r.setInitiatedAt(tx.getInitiatedAt());
            r.setDescription(tx.getDescription());

            // Determine if this is a CREDIT or DEBIT from the account's perspective
            boolean isSender = tx.getSenderAccount().getId().equals(account.getId());
            boolean isSelf = tx.getSenderAccount().getId().equals(tx.getReceiverAccount().getId());

            if (isSelf) {
                r.setEntryType("CREDIT"); // Initial deposit
                r.setCounterpartyName("SecureBank");
            } else if (isSender) {
                r.setEntryType("DEBIT");
                r.setCounterpartyName(tx.getReceiverAccount().getCustomer().getFullName());
            } else {
                r.setEntryType("CREDIT");
                r.setCounterpartyName(tx.getSenderAccount().getCustomer().getFullName());
            }

            recentList.add(r);
        }

        // Count unread notifications
        long unreadCount = notificationRepository
                .findByCustomerIdAndReadFalseOrderByCreatedAtDesc(customer.getId())
                .size();

        DashboardDTO dashboard = new DashboardDTO();
        dashboard.setCustomerName(customer.getFullName());
        dashboard.setAccountNumber(account.getAccountNumber());
        dashboard.setMaskedAccountNumber(AccountResponseDTO.maskAccountNumber(account.getAccountNumber()));
        dashboard.setIfscCode(account.getIfscCode());
        dashboard.setAccountType(account.getAccountType().name());
        dashboard.setAccountStatus(account.getStatus().name());
        dashboard.setAvailableBalance(account.getBalance());
        dashboard.setTotalCredits(totalCredits);
        dashboard.setTotalDebits(totalDebits);
        dashboard.setTotalTransactions(entries.size());
        dashboard.setUnreadNotifications(unreadCount);
        dashboard.setLastActivityAt(account.getLastActivityAt());
        dashboard.setRecentTransactions(recentList);

        return dashboard;
    }

    // ─── GET /api/accounts/lookup (Receiver Search) ───────────────────────────

    @Transactional(readOnly = true)
    public ReceiverLookupDTO lookupReceiverAccount(String accountNumber, String ifscCode) {
        Optional<Account> accountOpt = accountRepository.findByAccountNumberAndIfscCode(accountNumber, ifscCode);

        if (accountOpt.isEmpty()) {
            throw new ResourceNotFoundException(
                    "Account not found. Please verify the account number and IFSC code."
            );
        }

        Account receiver = accountOpt.get();
        Customer receiverCustomer = receiver.getCustomer();

        return new ReceiverLookupDTO(
                receiver.getAccountNumber(),
                receiverCustomer.getFullName(),
                receiver.getIfscCode(),
                receiver.getAccountType().name()
        );
    }
}
