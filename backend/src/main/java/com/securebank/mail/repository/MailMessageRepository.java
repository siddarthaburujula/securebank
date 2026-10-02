package com.securebank.mail.repository;

import com.securebank.mail.entity.MailMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MailMessageRepository extends JpaRepository<MailMessage, Long> {
    List<MailMessage> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);
    List<MailMessage> findAllByOrderByCreatedAtDesc();
    long countByRecipientEmailAndIsReadFalse(String recipientEmail);
    long countByIsReadFalse();
    void deleteByRecipientEmail(String recipientEmail);
}
