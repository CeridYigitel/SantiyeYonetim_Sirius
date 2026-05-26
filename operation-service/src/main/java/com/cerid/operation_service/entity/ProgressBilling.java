package com.cerid.operation_service.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "progress_billing")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressBilling {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate recordDate; // Excel filtrelemesi için gerekli

    @Column(nullable = false)
    private Long siteId; // Şantiye

    @Column(nullable = false)
    private String description; // İşin Tanımı

    @Column(nullable = false)
    private String unit; // Birim (Adet, m2, m3, Ton vs.)

    @Column(nullable = false)
    private Double materialQuantity; // Malzeme Metraj

    @Column(nullable = false)
    private Double materialUnitPrice; // Malzeme Birim Fiyatı

    @Column(nullable = false)
    private Double totalMaterialPrice; // OTOMATİK HESAPLANAN

    @Column(nullable = false)
    private Double laborQuantity; // İşçilik Metraj

    @Column(nullable = false)
    private Double laborUnitPrice; // İşçilik Birim Fiyatı

    @Column(nullable = false)
    private Double totalLaborPrice; // OTOMATİK HESAPLANAN

    @Column(nullable = false)
    private Double grandTotal; // OTOMATİK HESAPLANAN (Malzeme + İşçilik)

    // Veritabanına kaydetmeden önce hesaplamaları sağlama alıyoruz
    @PrePersist
    @PreUpdate
    public void calculateTotals() {
        this.totalMaterialPrice = (this.materialQuantity != null ? this.materialQuantity : 0.0) * (this.materialUnitPrice != null ? this.materialUnitPrice : 0.0);
                                  
        this.totalLaborPrice = (this.laborQuantity != null ? this.laborQuantity : 0.0) * (this.laborUnitPrice != null ? this.laborUnitPrice : 0.0);
                               
        this.grandTotal = this.totalMaterialPrice + this.totalLaborPrice;
    }
}