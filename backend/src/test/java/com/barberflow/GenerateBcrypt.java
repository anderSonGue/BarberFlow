package com.barberflow;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Clase utilitaria para generar hashes BCrypt de contraseñas.
 * Ejecutar con: mvn exec:java -Dexec.mainClass=com.barberflow.GenerateBcrypt -pl .
 */
public class GenerateBcrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String adminHash   = encoder.encode("admin123");
        String barberoHash = encoder.encode("barbero123");
        System.out.println("--- BCrypt generado ---");
        System.out.println("admin123   -> " + adminHash);
        System.out.println("barbero123 -> " + barberoHash);
        System.out.println("---");
        System.out.println("SQL_UPDATE:");
        System.out.println("UPDATE usuario SET password_hash='" + adminHash   + "' WHERE email='admin@barberflow.com';");
        System.out.println("UPDATE usuario SET password_hash='" + barberoHash + "' WHERE email IN ('andres@barberflow.com','camilo@barberflow.com','sara@barberflow.com');");
    }
}