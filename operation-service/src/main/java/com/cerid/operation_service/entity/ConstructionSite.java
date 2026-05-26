package com.cerid.operation_service.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "construction_sites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConstructionSite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate plannedEndDate;

    // MİKROSERVİS RACONU: Başka veritabanındaki objeyi bağlayamayız.
    // O yüzden sadece işçilerin ID'lerini tutan bir liste (ara tablo) oluşturuyoruz.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "site_workers", joinColumns = @JoinColumn(name = "site_id"))
    @Column(name = "worker_id")
    private List<Long> workerIds = new ArrayList<>();
}