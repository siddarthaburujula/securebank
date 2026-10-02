package com.securebank.mail.repository;

import com.securebank.mail.entity.MailAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MailAccountRepository extends JpaRepository<MailAccount, Long> {
    Optional<MailAccount> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}
