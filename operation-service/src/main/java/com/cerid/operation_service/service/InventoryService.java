package com.cerid.operation_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.cerid.operation_service.client.PersonnelServiceClient;
import com.cerid.operation_service.dto.InventoryRequest;
import com.cerid.operation_service.entity.Inventory;
import com.cerid.operation_service.entity.enums.EquipmentStatus;
import com.cerid.operation_service.repository.InventoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final PersonnelServiceClient personnelServiceClient;

    // DEMİRBAŞ ATAMA / EKLEME
    public Inventory assignInventory(Long loggedInUserId, String role, InventoryRequest request) {
        
        // KURAL: SADECE ADMIN DEMİRBAŞ EKLİYEBİLİR
        if (!"ADMIN".equals(role)) {
            throw new RuntimeException("Yetki Hatası: Sadece Admin demirbaş ataması veya güncellemesi yapabilir!");
        }

        Inventory inventory = Inventory.builder()
                .itemName(request.itemName())
                .assignedUserId(request.assignedUserId())
                .status(EquipmentStatus.valueOf(request.status())) // Gelen String'i Enum'a çeviriyoruz
                .siteId(request.siteId()) // YENİ EKLENENLER
                .quantity(request.quantity())
                .registrationDate(request.registrationDate())
                .notes(request.notes())
                .build();

        return inventoryRepository.save(inventory);
    }

    // DEMİRBAŞ GÖRÜNTÜLEME
    public List<Inventory> getInventory(Long loggedInUserId, String role, Long targetUserId) {
        
        // İşçi sadece kendini görebilir
        if ("WORKER".equals(role)) {
            if (!loggedInUserId.equals(targetUserId)) {
                throw new RuntimeException("Yetki Hatası: Sadece kendi üzerine zimmetli demirbaşları görebilirsin!");
            }
        } 
        // Usta sadece kendini ve ekibini görebilir
        else if ("FOREMAN".equals(role)) {
            if (!loggedInUserId.equals(targetUserId)) {
                boolean isSubordinate = personnelServiceClient.isSubordinate(targetUserId, loggedInUserId);
                if (!isSubordinate) {
                    throw new RuntimeException("Yetki Hatası: Sadece kendine ve ekibine ait demirbaşları görebilirsin!");
                }
            }
        }

        // ARTIK HATA VERMEYECEK
        return inventoryRepository.findByAssignedUserId(targetUserId);
    }
}