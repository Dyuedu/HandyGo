package com.group.mock.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "message_attachments")
@Data
public class MessageAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "message_id")
    private Message message;


    @Column(name = "file_url")
    private String fileUrl; // Đường dẫn URL từ Cloudinary/S3

    @Column(name = "public_id")
    private String publicId;

    @Column(name = "file_type")
    private String fileType; // image/png, video/mp4, v.v.

    @Column(name = "file_size")
    private Long fileSize;
}
