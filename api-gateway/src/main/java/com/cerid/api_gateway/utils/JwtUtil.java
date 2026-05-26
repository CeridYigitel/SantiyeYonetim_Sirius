package com.cerid.api_gateway.utils;


import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private static final String SECRET = "CeridSantiyePersonelSistemiÇokGizliAnahtar12345!";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isInvalid(String token) {
        try {
            extractAllClaims(token);
            return false; // Hata fırlatmıyorsa token geçerlidir
        } catch (Exception e) {
            return true; // Token süresi geçmiş veya sahte
        }
    }
}