package com.securebank.beneficiary.repository;

import com.securebank.beneficiary.entity.Beneficiary;
import com.securebank.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BeneficiaryRepository extends JpaRepository<Beneficiary, Long> {

    List<Beneficiary> findByCustomerAndActiveTrueOrderByCreatedAtDesc(Customer customer);

    Optional<Beneficiary> findByCustomerAndAccountNumberAndIfscCode(Customer customer, String accountNumber, String ifscCode);

    boolean existsByCustomerAndAccountNumberAndIfscCode(Customer customer, String accountNumber, String ifscCode);

    Optional<Beneficiary> findByIdAndCustomer(Long id, Customer customer);
}
