package com.group.mock.repository;

import com.group.mock.entity.Booking;
import com.group.mock.entity.enums.BookingStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @Query(
            "SELECT DISTINCT b FROM Booking b "
                    + "LEFT JOIN FETCH b.customer c "
                    + "LEFT JOIN FETCH b.worker w "
                    + "LEFT JOIN FETCH b.voucherUsage vu "
                    + "LEFT JOIN FETCH vu.voucher "
                    + "WHERE b.id = :id")
    Optional<Booking> findDetailById(@Param("id") UUID id);

    @Query(
            "SELECT DISTINCT b FROM Booking b "
                    + "LEFT JOIN FETCH b.customer "
                    + "LEFT JOIN FETCH b.worker "
                    + "LEFT JOIN FETCH b.voucherUsage vu "
                    + "LEFT JOIN FETCH vu.voucher "
                    + "WHERE b.customer.id = :customerId "
                    + "ORDER BY b.createdAt DESC")
    List<Booking> findByCustomer_IdOrderByCreatedAtDesc(@Param("customerId") UUID customerId);

    @Query(
            "SELECT DISTINCT b FROM Booking b "
                    + "LEFT JOIN FETCH b.customer "
                    + "LEFT JOIN FETCH b.worker "
                    + "LEFT JOIN FETCH b.voucherUsage vu "
                    + "LEFT JOIN FETCH vu.voucher "
                    + "WHERE b.customer.id = :customerId AND b.status IN :statuses "
                    + "ORDER BY b.createdAt DESC")
    List<Booking> findByCustomer_IdAndStatusInOrderByCreatedAtDesc(
            @Param("customerId") UUID customerId,
            @Param("statuses") Collection<BookingStatus> statuses);

    @Query(
            "SELECT DISTINCT b FROM Booking b "
                    + "LEFT JOIN FETCH b.customer "
                    + "LEFT JOIN FETCH b.worker "
                    + "LEFT JOIN FETCH b.voucherUsage vu "
                    + "LEFT JOIN FETCH vu.voucher "
                    + "WHERE b.worker.id = :workerId "
                    + "ORDER BY b.createdAt DESC")
    List<Booking> findByWorker_IdOrderByCreatedAtDesc(@Param("workerId") UUID workerId);

    @Query(
            "SELECT DISTINCT b FROM Booking b "
                    + "LEFT JOIN FETCH b.customer "
                    + "LEFT JOIN FETCH b.worker "
                    + "LEFT JOIN FETCH b.voucherUsage vu "
                    + "LEFT JOIN FETCH vu.voucher "
                    + "WHERE b.worker.id = :workerId AND b.status IN :statuses "
                    + "ORDER BY b.createdAt DESC")
    List<Booking> findByWorker_IdAndStatusInOrderByCreatedAtDesc(
            @Param("workerId") UUID workerId, @Param("statuses") Collection<BookingStatus> statuses);

    boolean existsByWorker_IdAndStatusIn(UUID workerId, Collection<BookingStatus> statuses);

    @Query(
            "SELECT DISTINCT b FROM Booking b "
                    + "LEFT JOIN FETCH b.customer "
                    + "LEFT JOIN FETCH b.worker "
                    + "WHERE b.status = com.group.mock.entity.enums.BookingStatus.PENDING "
                    + "AND b.bookingDate < :now")
    List<Booking> findPendingExpired(@Param("now") LocalDateTime now);
}
