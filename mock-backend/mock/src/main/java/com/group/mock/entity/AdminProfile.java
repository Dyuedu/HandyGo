package com.group.mock.entity;

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
@Table(name = "admin_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminProfile {

    @Id
    private UUID id; // Khóa chính ăn theo Account ID

    @Column(name = "employee_code", unique = true, length = 50)
    private String employeeCode; // Mã nhân viên admin

    @Column(name = "department", length = 100)
    private String department; // Bộ phận: FINANCE, SUPPORT, SYSTEM

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    // Liên kết 1:1 bảo mật với Account
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    private Account account;
}