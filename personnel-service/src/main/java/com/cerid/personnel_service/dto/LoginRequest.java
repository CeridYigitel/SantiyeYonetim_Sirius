package com.cerid.personnel_service.dto;


public record LoginRequest(
        String username,
        String password
) {}
