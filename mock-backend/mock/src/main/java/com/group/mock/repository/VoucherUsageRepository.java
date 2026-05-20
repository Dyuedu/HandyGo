package com.group.mock.repository;

import com.group.mock.entity.VoucherUsage;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {

    Optional<VoucherUsage> findByBooking_Id(UUID bookingId);

    long countByVoucher_Id(Long voucherId);
}
