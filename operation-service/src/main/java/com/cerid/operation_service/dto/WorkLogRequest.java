package com.cerid.operation_service.dto;

import java.time.LocalDate;

// public record WorkLogRequest(
//         Long workerId, // Hangi işçi için bu kayıt giriliyor?
//         WorkType workType, // SAAT veya DUVAR_METRESI
//         BigDecimal amount, // 8.5 veya 15.2 gibi miktar
//         java.time.LocalDate workDate,
//         java.time.LocalDateTime createdAt
// ) {}



import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkLogRequest {
    private Long workerId;
    private String workType;
    private Double amount;
    private Double hours; // YENİ: Çalışılan Saat
    private LocalDate workDate;
    private Long siteId; // YENİ
    private String notes; // YENİ
}

