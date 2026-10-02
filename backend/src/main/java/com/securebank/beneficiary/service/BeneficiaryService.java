package com.securebank.beneficiary.service;

import com.securebank.account.entity.Account;
import com.securebank.account.repository.AccountRepository;
import com.securebank.beneficiary.dto.AddBeneficiaryRequestDTO;
import com.securebank.beneficiary.dto.BeneficiaryResponseDTO;
import com.securebank.beneficiary.entity.Beneficiary;
import com.securebank.beneficiary.repository.BeneficiaryRepository;
import com.securebank.common.exception.BadRequestException;
import com.securebank.common.exception.DuplicateResourceException;
import com.securebank.common.exception.ResourceNotFoundException;
import com.securebank.customer.entity.Customer;
import com.securebank.customer.repository.CustomerRepository;
import com.securebank.user.entity.User;
import com.securebank.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    public BeneficiaryService(BeneficiaryRepository beneficiaryRepository,
                              CustomerRepository customerRepository,
                              UserRepository userRepository,
                              AccountRepository accountRepository) {
        this.beneficiaryRepository = beneficiaryRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public BeneficiaryResponseDTO addBeneficiary(String username, AddBeneficiaryRequestDTO request) {
        Customer customer = getCustomerByUsername(username);

        // Prevent adding own account as a beneficiary
        List<Account> ownAccounts = accountRepository.findByCustomerId(customer.getId());
        boolean isOwnAccount = ownAccounts.stream()
                .anyMatch(acc -> acc.getAccountNumber().equals(request.getAccountNumber().trim()));
        if (isOwnAccount) {
            throw new BadRequestException("You cannot add your own account as a beneficiary.");
        }

        // Validate receiver account exists in SecureBank if IFSC is SECURE000001
        String cleanIfsc = request.getIfscCode().trim().toUpperCase();
        String cleanAccNo = request.getAccountNumber().trim();

        if (cleanIfsc.startsWith("SECURE")) {
            boolean accountExists = accountRepository.existsByAccountNumberAndIfscCode(cleanAccNo, cleanIfsc);
            if (!accountExists) {
                throw new ResourceNotFoundException("Destination account not found with the specified Account Number and IFSC Code.");
            }
        }

        // Duplicate check
        if (beneficiaryRepository.existsByCustomerAndAccountNumberAndIfscCode(customer, cleanAccNo, cleanIfsc)) {
            throw new DuplicateResourceException("Beneficiary with this Account Number and IFSC is already registered.");
        }

        // Realistic banking practice: 30-minute cooling off period
        LocalDateTime coolingOffUntil = LocalDateTime.now().plusMinutes(30);

        String bankName = (request.getBankName() != null && !request.getBankName().isBlank())
                ? request.getBankName().trim()
                : "SecureBank";

        Beneficiary beneficiary = new Beneficiary(
                customer,
                request.getBeneficiaryName().trim(),
                cleanAccNo,
                cleanIfsc,
                bankName,
                request.getNickname() != null ? request.getNickname().trim() : null,
                coolingOffUntil
        );

        Beneficiary saved = beneficiaryRepository.save(beneficiary);
        return BeneficiaryResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<BeneficiaryResponseDTO> getBeneficiaries(String username) {
        Customer customer = getCustomerByUsername(username);
        return beneficiaryRepository.findByCustomerAndActiveTrueOrderByCreatedAtDesc(customer)
                .stream()
                .map(BeneficiaryResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteBeneficiary(String username, Long beneficiaryId) {
        Customer customer = getCustomerByUsername(username);
        Beneficiary beneficiary = beneficiaryRepository.findByIdAndCustomer(beneficiaryId, customer)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found or unauthorized access."));

        beneficiary.setActive(false);
        beneficiaryRepository.save(beneficiary);
    }

    private Customer getCustomerByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user: " + username));
    }
}
