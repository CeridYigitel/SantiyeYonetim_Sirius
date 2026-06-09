package com.cerid.operation_service.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

// URL kısmını gömülü config dosyalarından okuyacak şekilde ayarladık
@FeignClient(name = "personnel-service", url = "${personnel.service.url}")
public interface PersonnelServiceClient {

    @GetMapping("/users/check-subordinate")
    boolean isSubordinate(@RequestParam("workerId") Long workerId, @RequestParam("supervisorId") Long supervisorId);

    @GetMapping("/users/subordinates-ids")
    List<Long> getSubordinateIds(@RequestParam("supervisorId") Long supervisorId);

    @GetMapping("/users/admin/all")
    List<Map<String, Object>> getAllUsersForAdmin();
}