package com.cerid.personnel_service.utils;


import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.cerid.personnel_service.entity.User;
import com.cerid.personnel_service.entity.enums.Role;
import com.cerid.personnel_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        // Eğer veritabanı boşsa test verilerini ekle
        if (userRepository.count() == 0) {
            
            // 1. Admin Ekle
            User admin = User.builder()
                    .username("Hasan Berat Şahin")
                    .passwordHash("Shn9Hsn10Brt15") // Gerçekte BCrypt olacak
                    .role(Role.ADMIN).hasPurchasingAuthority(true).hourlyWage(2000d)
                    .build();
            userRepository.save(admin);

            System.out.println("Test verileri (Admin, Usta, İşçi) başarıyla oluşturuldu!");
        }
    }
}