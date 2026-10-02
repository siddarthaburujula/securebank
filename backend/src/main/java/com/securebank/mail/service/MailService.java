package com.securebank.mail.service;

import com.securebank.mail.entity.MailAccount;
import com.securebank.mail.entity.MailMessage;
import com.securebank.mail.repository.MailAccountRepository;
import com.securebank.mail.repository.MailMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class MailService {

    private final MailMessageRepository mailMessageRepository;
    private final MailAccountRepository mailAccountRepository;

    public MailService(MailMessageRepository mailMessageRepository, MailAccountRepository mailAccountRepository) {
        this.mailMessageRepository = mailMessageRepository;
        this.mailAccountRepository = mailAccountRepository;
    }

    @Transactional(readOnly = true)
    public List<MailMessage> getInbox(String email) {
        if (email != null && !email.isBlank() && !"ALL".equalsIgnoreCase(email)) {
            return mailMessageRepository.findByRecipientEmailOrderByCreatedAtDesc(email.trim().toLowerCase());
        }
        return mailMessageRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAccounts() {
        List<MailAccount> accounts = mailAccountRepository.findAll();
        List<Map<String, Object>> res = new ArrayList<>();
        for (MailAccount acc : accounts) {
            long unread = mailMessageRepository.countByRecipientEmailAndIsReadFalse(acc.getEmail());
            Map<String, Object> map = new HashMap<>();
            map.put("id", acc.getId());
            map.put("email", acc.getEmail());
            map.put("displayName", acc.getDisplayName());
            map.put("accountType", acc.getAccountType());
            map.put("unreadCount", unread);
            res.add(map);
        }
        return res;
    }

    @Transactional
    public MailAccount createAccount(String email, String displayName, String accountType) {
        String cleanEmail = email.trim().toLowerCase();
        Optional<MailAccount> existing = mailAccountRepository.findByEmailIgnoreCase(cleanEmail);
        if (existing.isPresent()) {
            return existing.get();
        }
        MailAccount account = new MailAccount(cleanEmail, displayName.trim(), accountType != null ? accountType : "CUSTOMER");
        return mailAccountRepository.save(account);
    }

    @Transactional
    public void markAsRead(Long messageId) {
        mailMessageRepository.findById(messageId).ifPresent(m -> {
            m.setIsRead(true);
            mailMessageRepository.save(m);
        });
    }

    @Transactional
    public void deleteMessage(Long messageId) {
        mailMessageRepository.deleteById(messageId);
    }

    @Transactional
    public void clearInbox(String email) {
        if (email != null && !email.isBlank()) {
            mailMessageRepository.deleteByRecipientEmail(email.trim().toLowerCase());
        }
    }
}
