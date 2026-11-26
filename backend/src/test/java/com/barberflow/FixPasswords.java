package com.barberflow;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

/**
 * Actualiza los password_hash en MySQL directamente usando JDBC.
 * Genera hashes frescos con BCrypt y los aplica en la tabla usuario.
 */
public class FixPasswords {
    public static void main(String[] args) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String adminHash   = encoder.encode("admin123");
        String barberoHash = encoder.encode("barbero123");

        System.out.println("Hashes generados:");
        System.out.println("  admin123   -> " + adminHash);
        System.out.println("  barbero123 -> " + barberoHash);

        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection con = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/barberflow?allowPublicKeyRetrieval=true&useSSL=false", "root", "");
             Statement st = con.createStatement()) {

            int r1 = st.executeUpdate(
                "UPDATE usuario SET password_hash='" + adminHash + "' WHERE email='admin@barberflow.com'");
            int r2 = st.executeUpdate(
                "UPDATE usuario SET password_hash='" + barberoHash +
                "' WHERE email IN ('andres@barberflow.com','camilo@barberflow.com','sara@barberflow.com')");

            System.out.println("Filas actualizadas (admin): " + r1);
            System.out.println("Filas actualizadas (trabajadores): " + r2);
            System.out.println("EXITO: Contrasenas actualizadas en MySQL.");
        }
    }
}
