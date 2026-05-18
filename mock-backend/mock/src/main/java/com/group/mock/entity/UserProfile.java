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
@Table(name = "user_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {

    @Id
    private UUID id; // Không dùng @GeneratedValue, ID trùng khít với Account ID

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(unique = true, length = 20)
    private String phone;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Liên kết 1:1 bảo mật với Account
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // Khóa chính 'id' sẽ đóng vai trò là Khóa ngoại tham chiếu sang account(id)
    @JoinColumn(name = "id")
    private Account account;
}
