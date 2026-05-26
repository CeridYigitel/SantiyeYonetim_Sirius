package com.cerid.operation_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cerid.operation_service.entity.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    
    // Frontend'den gelen çoklu sorgular için
    List<Inventory> findByAssignedUserIdIn(List<Long> userIds);
    
    // SENİN ALDIĞIN HATAYI ÇÖZEN METOT (Tekil sorgu)
    List<Inventory> findByAssignedUserId(Long userId); 
}