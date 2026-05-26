package com.cerid.operation_service.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.cerid.operation_service.entity.enums.WorkType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "work_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId; // İşçinin ID'si

    @Column(nullable = false)
    private String recordedByRole; // Kaydı giren kişinin rolü (FOREMAN, ADMIN)

    @Column(nullable = false)
    private Long recordedById; // Kaydı giren kişinin ID'si

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkType workType;

    @Column(nullable = false)
    private Double amount; // Üretim Miktarı (Metraj vs.)

    @Column(nullable = false)
    private Double hours; // YENİ: Çalışılan Saat (Örn: 8.0)

    @Column(nullable = false)
    private LocalDate workDate; // İşin yapıldığı tarih

    @Column(nullable = false, updatable = false)
    private LocalDateTime entryDate; // Sisteme girildiği an (Otomatik)

    @Column(nullable = false)
    private Long siteId; // YENİ: İlgili Şantiye ID

    @Column(length = 500)
    private String notes; // YENİ: İsteğe bağlı açıklama/not

    @PrePersist
    protected void onCreate() {
        this.entryDate = LocalDateTime.now();
    }
}