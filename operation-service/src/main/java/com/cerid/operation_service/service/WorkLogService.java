package com.cerid.operation_service.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.cerid.operation_service.client.PersonnelServiceClient;
import com.cerid.operation_service.dto.WorkLogRequest;
import com.cerid.operation_service.entity.WorkLog;
import com.cerid.operation_service.entity.enums.WorkType;
import com.cerid.operation_service.repository.WorkLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkLogService {

    private final WorkLogRepository workLogRepository;
    private final PersonnelServiceClient personnelServiceClient;

    public WorkLog addWorkLog(Long loggedInUserId, String role, WorkLogRequest request) {
        
        Long targetWorkerId = request.getWorkerId();

        // 1. KURAL: İŞÇİ HİÇBİR ŞEKİLDE KAYIT GİREMEZ!
        if ("WORKER".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Güvenlik İhlali: İşçiler sisteme iş kaydı giremez!");
        } 
       // 2. KURAL: USTA KENDİSİNE VEYA ALTINDAKİ İŞÇİYE GİREBİLİR
        else if ("FOREMAN".equals(role)) {
            if (!loggedInUserId.equals(targetWorkerId)) {
                try {
                    // YENİ VE GARANTİ YÖNTEM: Zaten çalıştığını bildiğimiz metodu kullanıyoruz!
                    List<Long> subordinateIds = personnelServiceClient.getSubordinateIds(loggedInUserId);
                    
                    // İşçinin ID'si, ustanın altındaki işçilerin ID listesinde (subordinateIds) yoksa tokadı bas:
                    if (subordinateIds == null || !subordinateIds.contains(targetWorkerId)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Yetki Hatası: Bu işçi sana bağlı değil veya sistemde yok!");
                    }
                } catch (ResponseStatusException e) {
                    throw e; 
                } catch (Exception e) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Yetki doğrulaması yapılamadı! Lütfen tekrar deneyin.");
                }
            }
        }
        // 3. KURAL: ADMIN (else durumunda) HERKESE GİREBİLİR, KONTROLE GEREK YOK.

        WorkLog log = WorkLog.builder()
            .userId(targetWorkerId)
            .recordedById(loggedInUserId)
            .recordedByRole(role)
            .workType(WorkType.valueOf(request.getWorkType())) 
            .amount(request.getAmount())
            .hours(request.getHours())
            .workDate(request.getWorkDate())
            .siteId(request.getSiteId())
            .notes(request.getNotes())
            .build();

        return workLogRepository.save(log);
    }

    // --- GÜNCELLEME İŞLEMİ ---
    public WorkLog updateWorkLog(Long id, Long loggedInUserId, String role, WorkLogRequest request) {
        if ("WORKER".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Güvenlik İhlali: İşçiler iş kaydı güncelleyemez!");
        }

        WorkLog existingLog = workLogRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kayıt bulunamadı"));

        existingLog.setUserId(request.getWorkerId());
        existingLog.setWorkType(WorkType.valueOf(request.getWorkType()));
        existingLog.setAmount(request.getAmount());
        existingLog.setHours(request.getHours());
        existingLog.setWorkDate(request.getWorkDate());
        existingLog.setSiteId(request.getSiteId());
        existingLog.setNotes(request.getNotes());

        return workLogRepository.save(existingLog);
    }

    // --- SİLME İŞLEMİ ---
    public void deleteWorkLog(Long id, Long loggedInUserId, String role) {
        if ("WORKER".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Güvenlik İhlali: İşçiler iş kaydı silemez!");
        }
        workLogRepository.deleteById(id);
    }

    public List<WorkLog> getWorkLogs(Long userId, String role) {
        if ("ADMIN".equals(role)) {
            return workLogRepository.findAll();
        } 
        else if ("FOREMAN".equals(role)) {
            List<Long> targetIds = new java.util.ArrayList<>();
            targetIds.add(userId); 
            
            try {
                List<Long> subIds = personnelServiceClient.getSubordinateIds(userId); 
                if (subIds != null && !subIds.isEmpty()) {
                    targetIds.addAll(subIds);
                }
            } catch (Exception e) {
                System.out.println("⚠️ [WorkLogService] Personnel Service'e ulaşılamadı veya yetki hatası: " + e.getMessage());
            }
            
            return workLogRepository.findByUserIdIn(targetIds);
        } 
        else {
            // WORKER (İşçi)
            return workLogRepository.findByUserId(userId);
        }
    }
}