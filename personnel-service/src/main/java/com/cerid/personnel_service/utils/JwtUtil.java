package com.cerid.personnel_service.utils;


import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    // Gerçek projede bu secret key application.yml'den gelir ve çok daha karmaşık olur.
    // JWT için en az 256-bit (32 karakter) uzunluğunda bir anahtar şarttır.
    private static final String SECRET = "CeridSantiyePersonelSistemiÇokGizliAnahtar12345!"; 
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    public String generateToken(Long userId, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // 10 saat geçerli
                .signWith(key)
                .compact();
    }
}
