package com.cerid.operation_service.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cerid.operation_service.entity.ProgressBilling;

public interface ProgressBillingRepository extends JpaRepository<ProgressBilling, Long> {
    
    // Şantiye Hepsi seçildiğinde
    List<ProgressBilling> findByRecordDateBetweenOrderByRecordDateDesc(LocalDate startDate, LocalDate endDate);
    
    // Şantiye ID verildiğinde
    List<ProgressBilling> findBySiteIdAndRecordDateBetweenOrderByRecordDateDesc(Long siteId, LocalDate startDate, LocalDate endDate);
}