package com.securebank.securityevent.repository;

import com.securebank.securityevent.entity.SecurityEvent;
import com.securebank.securityevent.entity.SecurityEventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    List<SecurityEvent> findAllByOrderByDetectedAtDesc();
    long countByStatus(SecurityEventStatus status);
    List<SecurityEvent> findByStatusOrderByDetectedAtDesc(SecurityEventStatus status);
}
