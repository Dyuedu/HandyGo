package com.group.mock.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.group.mock.entity.enums.VoucherUsageStatus;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "voucher_usage")
@Data
public class VoucherUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private VoucherUsageStatus status;

    @Column(name = "applied_discount_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal appliedDiscountAmount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "redeemed_at")
    private LocalDateTime redeemedAt;
}
