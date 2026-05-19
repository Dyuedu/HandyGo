package com.group.mock.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Entity
@Table(name = "messages")
@Data
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_id")
    private UUID senderId;

    @Column(name = "receiver_id")
    private UUID receiverId;

    @Column(name = "content",columnDefinition = "TEXT")
    private String content; // Nội dung chữ (có thể để trống nếu chỉ gửi ảnh)

    @Column(name  ="message_type")
    private String messageType; // TEXT, IMAGE, VIDEO, FILE

    @Column(name = "send_at")
    private LocalDateTime sentAt = LocalDateTime.now();

    // Quan hệ 1-nhiều với bảng Attachment
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL)
    private List<MessageAttachment> attachments;
}