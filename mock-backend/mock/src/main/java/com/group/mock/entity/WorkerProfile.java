package com.group.mock.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "worker_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkerProfile {

    @Id
    private UUID id; // Khóa chính ăn theo Account ID

    @Column(name = "job_type", nullable = false, length = 50)
    private String jobType; // DIEN, NUOC, DIEU_HOA...

    @Column(name = "professional_certificate_url")
    private String professionalCertificateUrl;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false; // Mặc định chờ Admin duyệt GPKD

    @Column(name = "tier_type", nullable = false, length = 20)
    private String tierType = "FREE"; // FREE, BASIC, PRO

    @Column(name = "tier_expired_at")
    private LocalDateTime tierExpiredAt;

    @Column(name = "avg_rating")
    private Double avgRating = 0.0;

    // Liên kết 1:1 bảo mật với Account
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    private Account account;
}
