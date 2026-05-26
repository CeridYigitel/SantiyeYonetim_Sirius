package com.cerid.operation_service.controller;

import java.util.List;
import java.util.Map;

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

import com.cerid.operation_service.client.PersonnelServiceClient;
import com.cerid.operation_service.dto.WorkLogRequest;
import com.cerid.operation_service.entity.WorkLog;
import com.cerid.operation_service.entity.enums.WorkType;
import com.cerid.operation_service.repository.ConstructionSiteRepository;
import com.cerid.operation_service.repository.WorkLogRepository;
import com.cerid.operation_service.service.WorkLogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/operation/work-logs")
@RequiredArgsConstructor
public class WorkLogController {

    private final WorkLogService workLogService;
    
    // YENİ EKLENEN BAĞIMLILIKLAR (Hataları çözen kısım burası)
    private final WorkLogRepository workLogRepository;
    private final ConstructionSiteRepository siteRepository;
    private final PersonnelServiceClient personnelServiceClient;

    @PostMapping
    public ResponseEntity<?> createWorkLog(
            @RequestHeader("X-User-Id") Long loggedInUserId,
            @RequestHeader("X-User-Role") String role,
            @RequestBody WorkLogRequest request) {
                
        // YENİ GÜVENLİK KİLİDİ: İşçi (WORKER) kayıt ekleyemez!
        // DİKKAT: Hata mesajı dönebilmek için metodun dönüş tipini ResponseEntity<?> yaptık.
        if ("WORKER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Güvenlik İhlali: İşçiler sisteme kendi iş kayıtlarını giremezler. Bu işlem Usta veya Yönetici tarafından yapılmalıdır.");
        }
        
        WorkLog savedLog = workLogService.addWorkLog(loggedInUserId, role, request);
        return ResponseEntity.ok(savedLog);
    }

    @GetMapping
    public ResponseEntity<?> getWorkLogs(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        
        // 1. ZIRH: Frontend'den ID veya Rol gelmezse sistemi çökertme, uyar.
        if (userId == null || role == null) {
            return ResponseEntity.badRequest().body("Güvenlik Hatası: X-User-Id veya X-User-Role header'ı eksik!");
        }
        
        try {
            List<WorkLog> logs = workLogService.getWorkLogs(userId, role);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            System.out.println("❌ [WorkLogController] Hata oluştu: " + e.getMessage());
            e.printStackTrace();
            // 2. ZIRH: 400 dönmek yerine 500 dönüyoruz ki içeride bir kod hatası olduğunu bilelim
            return ResponseEntity.status(500).body("Sunucu Hatası: " + e.getMessage());
        }
    }

    @GetMapping("/types")
    public ResponseEntity<WorkType[]> getWorkTypes() {
        // WorkType enum'ındaki tüm değerleri dizi olarak döner
        return ResponseEntity.ok(WorkType.values());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateWorkLog(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long loggedInUserId,
            @RequestHeader("X-User-Role") String role,
            @RequestBody WorkLogRequest request) {
        try {
            WorkLog updatedLog = workLogService.updateWorkLog(id, loggedInUserId, role, request);
            return ResponseEntity.ok(updatedLog);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorkLog(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long loggedInUserId,
            @RequestHeader("X-User-Role") String role) {
        try {
            workLogService.deleteWorkLog(id, loggedInUserId, role);
            return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Kayıt başarıyla silindi."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/export")
    public void exportToExcel(
            @RequestParam(name = "siteId", required = false) Long siteId,
            @RequestParam(name = "startDate", required = false) String startDateStr,
            @RequestParam(name = "endDate", required = false) String endDateStr,
            jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("İş Kayıtları Raporu");
            
            // 1. Şantiyeleri hafızada Map'liyoruz (HATA ÇÖZÜLDÜ: Direkt siteRepository kullanıyoruz)
            Map<Long, String> siteMap = siteRepository.findAll().stream()
                    .collect(java.util.stream.Collectors.toMap(
                            com.cerid.operation_service.entity.ConstructionSite::getId, 
                            com.cerid.operation_service.entity.ConstructionSite::getName, 
                            (a, b) -> a
                    ));

            // 2. Personelleri personnel-service'ten çekip Map'liyoruz (HATA ÇÖZÜLDÜ: Direkt personnelServiceClient kullanıyoruz)
            Map<Long, String> userMap = new java.util.HashMap<>();
            try {
                List<Map<String, Object>> users = personnelServiceClient.getAllUsersForAdmin();
                for (Map<String, Object> u : users) {
                    Long id = Long.valueOf(u.get("id").toString());
                    String userName = (u.get("username") != null) ? u.get("username").toString() : 
                                      (u.get("name") != null) ? u.get("name").toString() : "Personel (ID: " + id + ")";
                    userMap.put(id, userName);
                }
            } catch (Exception e) {
                System.out.println("⚠️ [WorkLog Excel Export] Personel isimleri çekilemedi: " + e.getMessage());
            }

            // Tarih filtrelerini süzme
            java.time.LocalDate start = (startDateStr != null && !startDateStr.isEmpty()) ? java.time.LocalDate.parse(startDateStr) : java.time.LocalDate.of(2000, 1, 1);
            java.time.LocalDate end = (endDateStr != null && !endDateStr.isEmpty()) ? java.time.LocalDate.parse(endDateStr) : java.time.LocalDate.of(2100, 1, 1);

            List<WorkLog> records;
            // HATA ÇÖZÜLDÜ: Direkt workLogRepository kullanıyoruz
            if (siteId == null) {
                records = workLogRepository.findByWorkDateBetweenOrderByWorkDateDesc(start, end);
            } else {
                records = workLogRepository.findBySiteIdAndWorkDateBetweenOrderByWorkDateDesc(siteId, start, end);
            }

            // Tablo Başlık Stili
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            org.apache.poi.ss.usermodel.CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);

            // Başlık Satırını İnşa Etme
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] columns = {"Kayıt ID", "Tarih", "Şantiye Adı", "Çalışan Personel", "Çalışılan Süre (Saat)", "Yapılan İş Tipi", "Üretim / Metraj", "Not / Açıklama"};
            
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Verileri Excel Satırlarına Dökme
            int rowNum = 1;
            for (WorkLog wl : records) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
                
                String siteName = siteMap.getOrDefault(wl.getSiteId(), "Bilinmeyen Şantiye (ID: " + wl.getSiteId() + ")");
                String userName = userMap.getOrDefault(wl.getUserId(), "Bilinmeyen Kullanıcı (ID: " + wl.getUserId() + ")");

                row.createCell(0).setCellValue(wl.getId());
                row.createCell(1).setCellValue(wl.getWorkDate() != null ? wl.getWorkDate().toString() : "");
                row.createCell(2).setCellValue(siteName);
                row.createCell(3).setCellValue(userName);
                row.createCell(4).setCellValue(wl.getHours() != null ? wl.getHours() : 0.0);
                row.createCell(5).setCellValue(wl.getWorkType() != null ? wl.getWorkType().name() : "");
                row.createCell(6).setCellValue(wl.getAmount() != null ? wl.getAmount() : 0.0);
                row.createCell(7).setCellValue(wl.getNotes() != null ? wl.getNotes() : "");
            }

            // Sütunları otomatik hizala
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Excel formatında fırlatma
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=is_kayitlari_raporu.xlsx");

            workbook.write(response.getOutputStream());
            response.getOutputStream().flush();
            
        } catch (Exception e) {
            response.setStatus(500);
            response.getWriter().write("Excel raporu oluşturulurken sunucu hatası çıktı: " + e.getMessage());
        }
    }
}