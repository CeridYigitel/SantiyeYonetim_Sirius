package com.cerid.operation_service.dto;

import java.time.LocalDate;

public record InventoryRequest(
        String itemName,
        Long assignedUserId,
        String status,
        Long siteId,
        Integer quantity,
        LocalDate registrationDate,
        String notes
) {
}