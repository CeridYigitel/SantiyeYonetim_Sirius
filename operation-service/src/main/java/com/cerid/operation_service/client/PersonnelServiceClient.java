package com.cerid.operation_service.client;

import java.util.List;
import java.util.Map;

// operation-service/.../client/PersonnelServiceClient.java
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

// url kısmında doğrudan Personnel Service'in adresini veriyoruz (Gateway'i de aradan çıkarıp doğrudan servise gidiyoruz)
@FeignClient(name = "personnel-service", url = "http://localhost:8081/api/personnel")
public interface PersonnelServiceClient {

    @GetMapping("/users/check-subordinate")
    boolean isSubordinate(@RequestParam("workerId") Long workerId, @RequestParam("supervisorId") Long supervisorId);

    // operation-service/.../client/PersonnelServiceClient.java içine eklenecek:
    @GetMapping("/users/subordinates-ids")
    java.util.List<Long> getSubordinateIds(@RequestParam("supervisorId") Long supervisorId);


    // EKLENECEK YENİ METOT: Tüm kullanıcıları Excel raporunda isim eşleştirmesi yapmak için çeker
    @GetMapping("/users/admin/all")
    List<Map<String, Object>> getAllUsersForAdmin();
}