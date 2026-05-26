package com.cerid.operation_service.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cerid.operation_service.entity.FinancialRecord;

public interface FinancialRecordRepository extends JpaRepository<FinancialRecord, Long> {

    // 1. Şantiye seçilmediğinde (Hepsi dendiğinde) sadece tarihe göre süz ve sırala
    List<FinancialRecord> findByTransactionDateBetweenOrderByTransactionDateDesc(LocalDate startDate, LocalDate endDate);

    // 2. Belirli bir şantiye seçildiğinde hem şantiyeye hem tarihe göre süz ve sırala
    List<FinancialRecord> findBySiteIdAndTransactionDateBetweenOrderByTransactionDateDesc(Long siteId, LocalDate startDate, LocalDate endDate);
}