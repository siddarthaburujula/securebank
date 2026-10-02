package com.securebank.mail.repository;

import com.securebank.mail.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByRecipientEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(String recipientEmail, String purpose);
    Optional<OtpVerification> findTopByPurposeAndUsedFalseOrderByCreatedAtDesc(String purpose);
}
