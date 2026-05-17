package com.group.mock.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_history", indexes = {
    @Index(name = "idx_vnp_txn_ref", columnList = "vnp_txn_ref"),
    @Index(name = "idx_vnp_trans_no", columnList = "vnp_transaction_no")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    // --- THÔNG TIN GỬI SANG VNPAY ---
    
    @Column(name = "vnp_txn_ref", nullable = false, unique = true, length = 100)
    private String vnpTxnRef; // vnp_TxnRef (Mã tham chiếu duy nhất của merchant)

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount; // Lưu giá trị thực (ví dụ 10000.0000), không lưu đơn vị xu

    @Column(name = "vnp_order_info", nullable = false)
    private String vnpOrderInfo; // vnp_OrderInfo

    @Column(name = "vnp_order_type", length = 100)
    private String vnpOrderType; // vnp_OrderType

    @Column(name = "vnp_ip_addr", length = 45)
    private String vnpIpAddr; // vnp_IpAddr

    @Column(name = "vnp_create_date", length = 14)
    private String vnpCreateDate; // Định dạng yyyyMMddHHmmss

    @Column(name = "vnp_expire_date", length = 14)
    private String vnpExpireDate; // Định dạng yyyyMMddHHmmss

    // --- THÔNG TIN NHẬN VỀ TỪ VNPAY (Sau khi thanh toán) ---

    @Column(name = "vnp_transaction_no", length = 50)
    private String vnpTransactionNo; // vnp_TransactionNo (Mã GD trên hệ thống VNPay)

    @Column(name = "vnp_bank_code", length = 20)
    private String vnpBankCode; // vnp_BankCode (Ví dụ: NCB, VIETCOMBANK)

    @Column(name = "vnp_bank_tran_no", length = 50)
    private String vnpBankTranNo; // vnp_BankTranNo (Mã GD tại Ngân hàng)

    @Column(name = "vnp_card_type", length = 20)
    private String vnpCardType; // vnp_CardType (ATM, INTCARD)

    @Column(name = "vnp_pay_date", length = 14)
    private String vnpPayDate; // Thời gian thanh toán từ VNPay báo về

    @Column(name = "vnp_response_code", length = 5)
    private String vnpResponseCode; // vnp_ResponseCode (Mã phản hồi kết quả)

    // --- TRẠNG THÁI VÀ BIẾN ĐỘNG SỐ DƯ NỘI BỘ ---

    @Column(name = "status", nullable = false, length = 20)
    private String status; // PENDING, SUCCESS, FAILED

    @Column(name = "balance_before", precision = 19, scale = 4)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", precision = 19, scale = 4)
    private BigDecimal balanceAfter;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING"; // Mặc định là đang chờ
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}