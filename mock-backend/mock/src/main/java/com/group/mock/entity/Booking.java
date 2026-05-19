package com.group.mock.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "bookings")
@Data
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private UserProfile customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id")
    private WorkerProfile worker;

    @Column(name = "booking_date")
    private LocalDateTime bookingDate;

    @Column(name = "address")
    private String address;

    @Column(name = "status")
    private String status; // PENDING, ACCEPTED, DECLINED, PROCESSING, FINISHED, CANCELLED

    @Column(name = "total_amount")
    private BigDecimal totalAmount; // Giá gốc

    @Column(name = "discount_amount")
    private BigDecimal discountAmount; // Số tiền được giảm từ voucher

    @Column(name  ="final_amount")
    private BigDecimal finalAmount; // Tiền mặt khách trả thợ

    @Column(name = "created_at")
    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt = LocalDateTime.now();
}
