package com.cerid.operation_service.entity;

import java.time.LocalDate;

import com.cerid.operation_service.entity.enums.EquipmentStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String itemName; // YENİ: Demirbaş Adı (Bunu eklememiz şarttı kanka!)

    @Column(nullable = false)
    private LocalDate registrationDate; // Kayıt Tarihi

    @Column(nullable = false)
    private Long siteId; // İlgili Şantiye

    @Column(nullable = false)
    private Integer quantity; // Adet

    @Column(nullable = false)
    private Long assignedUserId; // Zimmetli Kişi

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EquipmentStatus status; // Durum (Kırık, Sağlam, Hurda)

    @Column(length = 500)
    private String notes; // Not
}