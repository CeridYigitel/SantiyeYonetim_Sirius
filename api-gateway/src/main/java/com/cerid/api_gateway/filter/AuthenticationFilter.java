package com.cerid.api_gateway.filter;


import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders; // <- İŞTE BİZİM ADAMIN BURADA OLMASI LAZIM
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import com.cerid.api_gateway.utils.JwtUtil;

import io.jsonwebtoken.Claims;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private final JwtUtil jwtUtil;

    public AuthenticationFilter(JwtUtil jwtUtil) {
        super(Config.class);
        this.jwtUtil = jwtUtil;
    }

   @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            
            // 1. Header'ı doğrudan güvenli bir şekilde al (containsKey derdinden kurtulduk)
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            
            // 2. Token var mı ve "Bearer " ile başlıyor mu kontrolü
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // 3. "Bearer " kelimesini kes, sadece token kalsın
            String token = authHeader.substring(7);

            // 4. Token geçerli mi?
            if (jwtUtil.isInvalid(token)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // 5. Token'ı çöz ve içindeki bilgileri al
            Claims claims = jwtUtil.extractAllClaims(token);
            String userId = claims.getSubject();
            String role = claims.get("role", String.class);

            // 6. İsteği modifiye et: ID ve Rolü Header olarak ekle
            var mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Id", userId)
                    .header("X-User-Role", role)
                    .build();

                    // api-gateway/.../AuthenticationFilter.java içinde olması gereken yapı:

                // Token'dan bilgileri çıkardıktan sonra isteği modifiye et:
                ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                        .header("X-User-Id", String.valueOf(userId)) // Token'dan okuduğun ID
                        .header("X-User-Role", role)                 // Token'dan okuduğun Rol
                        .build();

                // Modifiye edilmiş yeni isteği alt servise (operation-service) yolla
                return chain.filter(exchange.mutate().request(modifiedRequest).build());

        };
    }
    public static class Config {
        // İleride filtreye parametre geçmek istersek diye boş bir config sınıfı
    }
}