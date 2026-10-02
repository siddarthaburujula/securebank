package com.securebank.dormant.repository;

import com.securebank.dormant.entity.ReactivationRequest;
import com.securebank.dormant.entity.ReactivationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactivationRequestRepository extends JpaRepository<ReactivationRequest, Long> {

    List<ReactivationRequest> findByAccountIdOrderByRequestedAtDesc(Long accountId);

    List<ReactivationRequest> findByStatusOrderByRequestedAtAsc(ReactivationStatus status);

    List<ReactivationRequest> findAllByOrderByRequestedAtDesc();

    Optional<ReactivationRequest> findByRequestReference(String requestReference);

    boolean existsByAccountIdAndStatus(Long accountId, ReactivationStatus status);

    long countByStatus(ReactivationStatus status);
}
