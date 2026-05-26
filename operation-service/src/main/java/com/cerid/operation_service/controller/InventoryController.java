package com.cerid.operation_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cerid.operation_service.entity.Inventory;
import com.cerid.operation_service.repository.InventoryRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/operation/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryRepository inventoryRepository;

    // SADECE ADMIN TÜM LİSTEYİ ÇEKEBİLİR
    @GetMapping
    public ResponseEntity<?> getAllInventories(@RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Yetkisiz Erişim");
        }
        return ResponseEntity.ok(inventoryRepository.findAll());
    }

    // İŞÇİ VE USTA SADECE KENDİSİNE İZİN VERİLEN ID'LERİ ÇEKEBİLİR
    @GetMapping("/by-users")
    public ResponseEntity<List<Inventory>> getInventoriesByUsers(@RequestParam List<Long> userIds) {
        return ResponseEntity.ok(inventoryRepository.findByAssignedUserIdIn(userIds));
    }

    @PostMapping
    public ResponseEntity<?> createInventory(@RequestHeader("X-User-Role") String role, @RequestBody Inventory inventory) {
        if (!"ADMIN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Sadece Admin demirbaş ekleyebilir!");
        return ResponseEntity.ok(inventoryRepository.save(inventory));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInventory(@RequestHeader("X-User-Role") String role, @PathVariable Long id, @RequestBody Inventory request) {
        if (!"ADMIN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Sadece Admin demirbaş güncelleyebilir!");
        
        Inventory existing = inventoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Bulunamadı"));
        existing.setItemName(request.getItemName());
        existing.setRegistrationDate(request.getRegistrationDate());
        existing.setSiteId(request.getSiteId());
        existing.setQuantity(request.getQuantity());
        existing.setAssignedUserId(request.getAssignedUserId());
        existing.setStatus(request.getStatus());
        existing.setNotes(request.getNotes());
        
        return ResponseEntity.ok(inventoryRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInventory(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        if (!"ADMIN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Sadece Admin demirbaş silebilir!");
        inventoryRepository.deleteById(id);
        return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Silindi"));
    }
    
}