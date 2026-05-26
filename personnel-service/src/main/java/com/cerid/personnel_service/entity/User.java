package com.cerid.personnel_service.entity;

import java.util.List;

import com.cerid.personnel_service.entity.enums.Role;

// personnel-service/.../entity/User.java
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // YENİ: Bir işçinin birden fazla ustası (FOREMAN) olabilir
    @jakarta.persistence.ManyToMany(fetch = FetchType.LAZY)
    @jakarta.persistence.JoinTable(
        name = "user_supervisors", // Ara tablonun adı
        joinColumns = @jakarta.persistence.JoinColumn(name = "user_id"), // İşçinin ID'si
        inverseJoinColumns = @jakarta.persistence.JoinColumn(name = "supervisor_id") // Ustanın ID'si
    )
    @com.fasterxml.jackson.annotation.JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<User> supervisors = new java.util.ArrayList<>();

    // YENİ: Bir ustanın birden fazla alt işçisi (WORKER) olabilir
    @jakarta.persistence.ManyToMany(mappedBy = "supervisors", fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<User> subordinates = new java.util.ArrayList<>();

    // YENİ: Satın Alma / Finans Yetkisi
    @Column(nullable = false)
    private Boolean hasPurchasingAuthority = false;
    
}