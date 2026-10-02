package com.securebank.notification.repository;

import com.securebank.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Notification> findByCustomerIdAndReadFalseOrderByCreatedAtDesc(Long customerId);
}
