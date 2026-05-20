package com.group.mock.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Entity
@Table(name = "vouchers")
@Data
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, length = 100, unique = true)
    private String code;

    @Column(name = "value", precision = 19, scale = 4, nullable = false)
    private BigDecimal value;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @Column(name = "is_used", nullable = false)
    private boolean isUsed = false;

    @JsonIgnore
    @OneToMany(mappedBy = "voucher", fetch = FetchType.LAZY)
    private List<VoucherUsage> usages = new ArrayList<>();
}
