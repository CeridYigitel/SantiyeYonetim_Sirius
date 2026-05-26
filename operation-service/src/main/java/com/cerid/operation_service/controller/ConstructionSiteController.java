package com.cerid.operation_service.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cerid.operation_service.entity.ConstructionSite;
import com.cerid.operation_service.repository.ConstructionSiteRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/operation/sites")
@RequiredArgsConstructor
public class ConstructionSiteController {

    private final ConstructionSiteRepository siteRepository;

    @GetMapping
    public ResponseEntity<List<ConstructionSite>> getAllSites() {
        return ResponseEntity.ok(siteRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<ConstructionSite> createSite(@RequestBody ConstructionSite site, @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) throw new RuntimeException("Yetkisiz işlem!");
        return ResponseEntity.ok(siteRepository.save(site));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConstructionSite> updateSite(@PathVariable Long id, @RequestBody ConstructionSite updatedSite, @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) throw new RuntimeException("Yetkisiz işlem!");
        
        ConstructionSite existing = siteRepository.findById(id).orElseThrow(() -> new RuntimeException("Şantiye bulunamadı"));
        existing.setName(updatedSite.getName());
        existing.setStartDate(updatedSite.getStartDate());
        existing.setPlannedEndDate(updatedSite.getPlannedEndDate());
        existing.setWorkerIds(updatedSite.getWorkerIds()); // İşçi listesini günceller
        
        return ResponseEntity.ok(siteRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSite(@PathVariable Long id, @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) throw new RuntimeException("Yetkisiz işlem!");
        siteRepository.deleteById(id);
        return ResponseEntity.ok("Şantiye silindi.");
    }
}