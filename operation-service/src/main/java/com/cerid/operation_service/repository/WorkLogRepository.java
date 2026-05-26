package com.cerid.operation_service.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cerid.operation_service.entity.WorkLog;

public interface WorkLogRepository extends JpaRepository<WorkLog, Long> {
    
    // Şantiye seçilmediğinde (Hepsi dendiğinde) tarihe göre listele
    List<WorkLog> findByWorkDateBetweenOrderByWorkDateDesc(LocalDate startDate, LocalDate endDate);

    // Belirli bir şantiye seçildiğinde hem şantiyeye hem tarihe göre listele
    List<WorkLog> findBySiteIdAndWorkDateBetweenOrderByWorkDateDesc(Long siteId, LocalDate startDate, LocalDate endDate);

    // Mevcut diğer findBy... metotların aşağıda kalmaya devam etsin
    List<WorkLog> findByUserId(Long userId);
    List<WorkLog> findByUserIdIn(List<Long> userIds);
}