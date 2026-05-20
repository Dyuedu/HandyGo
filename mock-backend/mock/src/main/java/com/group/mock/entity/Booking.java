package com.group.mock.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.group.mock.entity.enums.BookingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "bookings")
@Data
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserProfile customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private WorkerProfile worker;

    /** Placeholder until a dedicated services/catalog table exists. */
    @Column(name = "service_code", length = 100)
    private String serviceCode;

    @Column(name = "booking_date")
    private LocalDateTime bookingDate;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private BookingStatus status;

    @Column(name = "total_amount", precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Column(name = "discount_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", precision = 19, scale = 4)
    private BigDecimal finalAmount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "booking", fetch = FetchType.LAZY)
    private VoucherUsage voucherUsage;

    @JsonIgnore
    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY)
    private List<BookingStatusHistory> statusHistory = new ArrayList<>();
}
