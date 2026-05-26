package com.group.mock.repository;

import com.group.mock.entity.WithdrawalRequest;
import com.group.mock.entity.enums.WithdrawalStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {

    List<WithdrawalRequest> findByWorkerIdOrderByCreatedAtDesc(UUID workerId);

    List<WithdrawalRequest> findAllByOrderByCreatedAtDesc();

    List<WithdrawalRequest> findByStatusOrderByCreatedAtDesc(WithdrawalStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select wr from WithdrawalRequest wr where wr.id = :id")
    Optional<WithdrawalRequest> findByIdForUpdate(@Param("id") Long id);
}
