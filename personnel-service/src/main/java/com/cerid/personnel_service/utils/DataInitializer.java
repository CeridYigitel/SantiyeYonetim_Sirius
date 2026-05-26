package com.cerid.personnel_service.utils;


import java.util.ArrayList;
import java.util.List;

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
                    .username("admin")
                    .passwordHash("1234") // Gerçekte BCrypt olacak
                    .role(Role.ADMIN).hasPurchasingAuthority(true)
                    .build();
            userRepository.save(admin);

            // 2. Usta Ekle
            User usta = User.builder()
                    .username("usta_ahmet")
                    .passwordHash("1234")
                    .role(Role.FOREMAN).hasPurchasingAuthority(false)
                    .build();
            userRepository.save(usta);

            List<User> ustalar = new ArrayList<>();
            ustalar.add(usta);



            // 3. İşçi Ekle (Ustası "usta_ahmet" olacak şekilde)
            User isci = User.builder()
                    .username("isci_mehmet")
                    .passwordHash("1234")
                    .role(Role.WORKER).hasPurchasingAuthority(false)
                    .supervisors(ustalar) // Hiyerarşiyi burada kuruyoruz!
                    .build();
            userRepository.save(isci);

            System.out.println("Test verileri (Admin, Usta, İşçi) başarıyla oluşturuldu!");
        }
    }
}