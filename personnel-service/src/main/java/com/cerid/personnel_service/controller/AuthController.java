package com.cerid.personnel_service.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cerid.personnel_service.dto.LoginRequest;
import com.cerid.personnel_service.entity.User;
import com.cerid.personnel_service.repository.UserRepository;
import com.cerid.personnel_service.utils.JwtUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/personnel/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        // 1. Kullanıcıyı DB'den bul
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı!"));

        // 2. Şifreyi kontrol et 
        if (!user.getPasswordHash().equals(request.password())) {
            throw new RuntimeException("Hatalı şifre!");
        }

        // 3. Token üret ve dön
        String token = jwtUtil.generateToken(user.getId(), user.getRole().name());
        return ResponseEntity.ok(token);
    }
}