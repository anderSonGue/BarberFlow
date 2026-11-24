package com.barberflow.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationMillis;

    public JwtTokenProvider(
            @Value("${jwt.secret:barberflow_super_secure_jwt_secret_key_spring_boot_mysql_2026_enterprise}") String secret,
            @Value("${jwt.expiration-hours:8}") long expirationHours) {
        // Asegurar que la clave tenga al menos 256 bits (32 bytes)
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            keyBytes = padded;
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMillis = expirationHours * 3600 * 1000;
    }

    public String generarToken(String email, String rol, Integer id) {
        Date ahora = new Date();
        Date fechaExpiracion = new Date(ahora.getTime() + expirationMillis);

        return Jwts.builder()
                .subject(email)
                .claim("id", id)
                .claim("rol", rol)
                .issuedAt(ahora)
                .expiration(fechaExpiracion)
                .signWith(key)
                .compact();
    }

    public String obtenerEmailDelToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validarToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
