package com.cerid.operation_service.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cerid.operation_service.client.PersonnelServiceClient;
import com.cerid.operation_service.entity.ConstructionSite;
import com.cerid.operation_service.entity.FinancialRecord;
import com.cerid.operation_service.repository.ConstructionSiteRepository;
import com.cerid.operation_service.repository.FinancialRecordRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/operation/finance")
@RequiredArgsConstructor
public class FinancialRecordController {

    private final FinancialRecordRepository financeRepository;
    private final ConstructionSiteRepository siteRepository;
    private final PersonnelServiceClient personnelServiceClient;

    @GetMapping
    public ResponseEntity<List<FinancialRecord>> getAllRecords() {
        return ResponseEntity.ok(financeRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createRecord(
            @RequestBody FinancialRecord record, 
            @RequestHeader("X-User-Role") String role) {
        
        // İşçiler finansal kayıt giremez!
        if ("WORKER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Yetki Hatası: İşçiler finansal kayıt ekleyemez.");
        }
        
        return ResponseEntity.ok(financeRepository.save(record));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecord(
            @PathVariable Long id, 
            @RequestHeader("X-User-Role") String role) {
        
        // Finansal kayıtları sadece ADMIN silebilir
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Yetki Hatası: Sadece yöneticiler finansal kayıt silebilir.");
        }
        
        financeRepository.deleteById(id);
        return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Kayıt silindi"));
    }

@GetMapping("/export")
    public void exportToExcel(
            @RequestParam(name = "siteId", required = false) Long siteId,
            @RequestParam(name = "startDate", required = false) String startDateStr,
            @RequestParam(name = "endDate", required = false) String endDateStr,
            jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Finans Raporu");
            
            // 1. PERFORMANS SİHRETTİ: Tüm Şantiyeleri çekip Hafızada Map'liyoruz (ID -> İsim)
            Map<Long, String> siteMap = siteRepository.findAll().stream()
                    .collect(Collectors.toMap(ConstructionSite::getId, ConstructionSiteRepository -> ConstructionSiteRepository.getName(), (a, b) -> a));

            // 2. PERFORMANS SİHRETTİ: personnel-service'ten tüm kullanıcıları tek seferde çekip Map'liyoruz (ID -> Username)
            Map<Long, String> userMap = new HashMap<>();
            try {
                // personnel-service'teki admin/all ucumuzu çağırıyoruz
                List<Map<String, Object>> users = personnelServiceClient.getAllUsersForAdmin();
                for (Map<String, Object> u : users) {
                    Long id = Long.valueOf(u.get("id").toString());
                    String username = u.get("username").toString();
                    userMap.put(id, username);
                }
            } catch (Exception e) {
                System.out.println("⚠️ [Excel Export] Personel isimleri personnel-service'ten çekilemedi: " + e.getMessage());
            }

            // Tarih filtrelerini çözme
            java.time.LocalDate start = (startDateStr != null && !startDateStr.isEmpty()) ? java.time.LocalDate.parse(startDateStr) : java.time.LocalDate.of(2000, 1, 1);
            java.time.LocalDate end = (endDateStr != null && !endDateStr.isEmpty()) ? java.time.LocalDate.parse(endDateStr) : java.time.LocalDate.of(2100, 1, 1);

            List<FinancialRecord> records;
            if (siteId == null) {
                records = financeRepository.findByTransactionDateBetweenOrderByTransactionDateDesc(start, end);
            } else {
                records = financeRepository.findBySiteIdAndTransactionDateBetweenOrderByTransactionDateDesc(siteId, start, end);
            }

            // Tablo Başlık Stili
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            org.apache.poi.ss.usermodel.CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);

            // Başlık Satırı (Sütun isimlerini insan okuyacak şekilde güncelledik kanka)
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] columns = {"Kayıt ID", "İşlem Tarihi", "Açıklama", "Şantiye Adı", "İşlemi Yapan Personel", "Giriş (Tenge)", "Çıkış (Tenge)"};
            
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Verileri Excel Satırlarına Basma
            int rowNum = 1;
            for (FinancialRecord r : records) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
                
                // İsimleri Map'ten jilet gibi çekiyoruz, bulamazsak ID'yi fallback olarak yazıyoruz
                String siteName = siteMap.getOrDefault(r.getSiteId(), "Bilinmeyen Şantiye (ID: " + r.getSiteId() + ")");
                String userName = userMap.getOrDefault(r.getUserId(), "Bilinmeyen Kullanıcı (ID: " + r.getUserId() + ")");

                row.createCell(0).setCellValue(r.getId());
                row.createCell(1).setCellValue(r.getTransactionDate() != null ? r.getTransactionDate().toString() : "");
                row.createCell(2).setCellValue(r.getDescription() != null ? r.getDescription() : "");
                row.createCell(3).setCellValue(siteName); // ID yerine Şantiye Adı yazıldı!
                row.createCell(4).setCellValue(userName); // ID yerine Kullanıcı Adı yazıldı!
                row.createCell(5).setCellValue(r.getIncome() != null ? r.getIncome() : 0.0);
                row.createCell(6).setCellValue(r.getExpense() != null ? r.getExpense() : 0.0);
            }

            // Sütun Genişliklerini Otomatik Ayarlama
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // HTTP Response Ayarları
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=finans_raporu.xlsx");

            workbook.write(response.getOutputStream());
            response.getOutputStream().flush();
            
        } catch (Exception e) {
            System.out.println("❌ Excel Export Hatası: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(500);
            response.getWriter().write("Excel raporu oluşturulurken hata çıktı: " + e.getMessage());
        }
    }
}