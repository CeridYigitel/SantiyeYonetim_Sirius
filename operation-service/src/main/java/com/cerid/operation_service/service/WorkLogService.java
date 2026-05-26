package com.cerid.operation_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

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
        
        // DTO'dan gelen işçi ID'si (Eğer 'record' kullanıyorsan request.workerId() yapabilirsin)
        Long targetWorkerId = request.getWorkerId();

        // 1. KURAL: İŞÇİ HİÇBİR ŞEKİLDE KAYIT GİREMEZ! (Güvenlik kilidini buraya da koyduk)
        if ("WORKER".equals(role)) {
            throw new RuntimeException("Güvenlik İhlali: İşçiler sisteme iş kaydı giremez!");
        } 
        // 2. KURAL: USTA KENDİSİNE VEYA ALTINDAKİ İŞÇİYE GİREBİLİR
        else if ("FOREMAN".equals(role)) {
            if (!loggedInUserId.equals(targetWorkerId)) {
                // Eğer başkasına girmeye çalışıyorsa, Feign ile Personnel Service'e sor:
                boolean isSubordinate = personnelServiceClient.isSubordinate(targetWorkerId, loggedInUserId);
                if (!isSubordinate) {
                    throw new RuntimeException("Yetki Hatası: Bu işçi sana bağlı değil veya sistemde yok!");
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
                .siteId(request.getSiteId()) // YENİ
                .notes(request.getNotes())   // YENİ
                .build();

        return workLogRepository.save(log);
    }

    // --- GÜNCELLEME İŞLEMİ ---
    public WorkLog updateWorkLog(Long id, Long loggedInUserId, String role, WorkLogRequest request) {
        if ("WORKER".equals(role)) {
            throw new RuntimeException("Güvenlik İhlali: İşçiler iş kaydı güncelleyemez!");
        }

        WorkLog existingLog = workLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kayıt bulunamadı"));

        // Yeni verileri setle
        existingLog.setUserId(request.getWorkerId());
        existingLog.setWorkType(WorkType.valueOf(request.getWorkType()));
        existingLog.setAmount(request.getAmount());
        existingLog.setHours(request.getHours());
        existingLog.setWorkDate(request.getWorkDate());
        existingLog.setSiteId(request.getSiteId()); // YENİ
        existingLog.setNotes(request.getNotes());   // YENİ

        return workLogRepository.save(existingLog);
    }

    // --- SİLME İŞLEMİ ---
    public void deleteWorkLog(Long id, Long loggedInUserId, String role) {
        if ("WORKER".equals(role)) {
            throw new RuntimeException("Güvenlik İhlali: İşçiler iş kaydı silemez!");
        }
        workLogRepository.deleteById(id);
    }

    public List<WorkLog> getWorkLogs(Long userId, String role) {
        if ("ADMIN".equals(role)) {
            return workLogRepository.findAll();
        } 
        else if ("FOREMAN".equals(role)) {
            List<Long> targetIds = new java.util.ArrayList<>();
            targetIds.add(userId); // Ustanın kendi ID'sini mutlaka ekle
            
            try {
                // Ustanın kendisine bağlı işçileri personnel-service'ten çekiyoruz
                // NOT: Senin FeignClient'ındaki metodun adı neyse onu kullanmalısın (Örn: getSubordinateIdsList)
                List<Long> subIds = personnelServiceClient.getSubordinateIds(userId); 
                
                if (subIds != null && !subIds.isEmpty()) {
                    targetIds.addAll(subIds);
                }
            } catch (Exception e) {
                // 3. ZIRH: Eğer mikroservisler arası iletişim koparsa sistem 400 hatası verip ÇÖKMEYECEK!
                System.out.println("⚠️ [WorkLogService] Personnel Service'e ulaşılamadı veya yetki hatası: " + e.getMessage());
            }
            
            return workLogRepository.findByUserIdIn(targetIds); // Kendi ID'si ve (bulabildiyse) ekibinin ID'leri ile sorgula
        } 
        else {
            // WORKER (İşçi)
            return workLogRepository.findByUserId(userId);
        }
    }
}