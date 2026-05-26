package com.cerid.operation_service.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

import com.cerid.operation_service.entity.ProgressBilling;
import com.cerid.operation_service.repository.ConstructionSiteRepository;
import com.cerid.operation_service.repository.ProgressBillingRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/operation/hakedis")
@RequiredArgsConstructor
public class ProgressBillingController {

    private final ProgressBillingRepository repository;
    private final ConstructionSiteRepository siteRepository;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Sadece Admin yetkilidir.");
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader("X-User-Role") String role, @RequestBody ProgressBilling record) {
        if (!"ADMIN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(repository.save(record));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@RequestHeader("X-User-Role") String role, @PathVariable Long id, @RequestBody ProgressBilling request) {
        if (!"ADMIN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        ProgressBilling existing = repository.findById(id).orElseThrow(() -> new RuntimeException("Bulunamadı"));
        
        existing.setRecordDate(request.getRecordDate());
        existing.setSiteId(request.getSiteId());
        existing.setDescription(request.getDescription());
        existing.setUnit(request.getUnit());
        existing.setMaterialQuantity(request.getMaterialQuantity());
        existing.setMaterialUnitPrice(request.getMaterialUnitPrice());
        existing.setLaborQuantity(request.getLaborQuantity());
        existing.setLaborUnitPrice(request.getLaborUnitPrice());
        
        return ResponseEntity.ok(repository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        if (!"ADMIN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/export")
    public void exportToExcel(
            @RequestParam(name = "siteId", required = false) Long siteId,
            @RequestParam(name = "startDate", required = false) String startDateStr,
            @RequestParam(name = "endDate", required = false) String endDateStr,
            jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Hakediş Raporu");
            
            Map<Long, String> siteMap = siteRepository.findAll().stream()
                    .collect(Collectors.toMap(s -> s.getId(), s -> s.getName(), (a, b) -> a));

            java.time.LocalDate start = (startDateStr != null && !startDateStr.isEmpty()) ? java.time.LocalDate.parse(startDateStr) : java.time.LocalDate.of(2000, 1, 1);
            java.time.LocalDate end = (endDateStr != null && !endDateStr.isEmpty()) ? java.time.LocalDate.parse(endDateStr) : java.time.LocalDate.of(2100, 1, 1);

            List<ProgressBilling> records = (siteId == null) ? 
                repository.findByRecordDateBetweenOrderByRecordDateDesc(start, end) : 
                repository.findBySiteIdAndRecordDateBetweenOrderByRecordDateDesc(siteId, start, end);

            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            org.apache.poi.ss.usermodel.CellStyle style = workbook.createCellStyle();
            style.setFont(font);

            org.apache.poi.ss.usermodel.Row header = sheet.createRow(0);
            String[] cols = {"Tarih", "Şantiye", "İşin Tanımı", "Birim", "Malzeme Metraj", "Malzeme B.F. (₸)", "Malzeme Toplam (₸)", "İşçilik Metraj", "İşçilik B.F. (₸)", "İşçilik Toplam (₸)", "Genel Toplam (₸)"};
            for (int i = 0; i < cols.length; i++) {
                org.apache.poi.ss.usermodel.Cell c = header.createCell(i);
                c.setCellValue(cols[i]);
                c.setCellStyle(style);
            }

            int rowNum = 1;
            for (ProgressBilling r : records) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(r.getRecordDate().toString());
                row.createCell(1).setCellValue(siteMap.getOrDefault(r.getSiteId(), "Bilinmeyen Şantiye"));
                row.createCell(2).setCellValue(r.getDescription());
                row.createCell(3).setCellValue(r.getUnit());
                row.createCell(4).setCellValue(r.getMaterialQuantity());
                row.createCell(5).setCellValue(r.getMaterialUnitPrice());
                row.createCell(6).setCellValue(r.getTotalMaterialPrice());
                row.createCell(7).setCellValue(r.getLaborQuantity());
                row.createCell(8).setCellValue(r.getLaborUnitPrice());
                row.createCell(9).setCellValue(r.getTotalLaborPrice());
                row.createCell(10).setCellValue(r.getGrandTotal());
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=hakedis_raporu.xlsx");
            workbook.write(response.getOutputStream());
            response.getOutputStream().flush();
        } catch (Exception e) {
            response.setStatus(500);
        }
    }
}