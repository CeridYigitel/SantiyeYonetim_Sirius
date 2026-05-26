package com.cerid.operation_service.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "financial_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate transactionDate; // İşlem Tarihi

    @Column(nullable = false)
    private Long userId; // İşlemi Yapan Kullanıcı ID (Combobox)

    @Column(nullable = false)
    private String description; // Açıklama

    @Column(nullable = false)
    private Long siteId; // İlgili Şantiye ID (Combobox)

    @Column(nullable = false)
    private Double income; // Giriş (Tenge)

    @Column(nullable = false)
    private Double expense; // Çıkış (Tenge)

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt; // Sisteme kayıt anı

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}