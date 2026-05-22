package com.group.mock.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "subscriptions")
@Data
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_name", nullable = false)
    private String planName; // BASIC (49k), PRO (199k)

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays; // Number of days this subscription lasts

    @Column(name = "created_at")
    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;

    @Column(name = "status", nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE
}
