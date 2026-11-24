package com.barberflow.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Rutas públicas
                .requestMatchers("/api/auth/login", "/api/health").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Módulos protegidos con RBAC estricto
                // 1. Inventario, Compras y Trazabilidad: Solo ADMINISTRADOR
                .requestMatchers("/api/inventario/**").hasRole("ADMINISTRADOR")
                .requestMatchers("/api/compras/**").hasRole("ADMINISTRADOR")
                .requestMatchers("/api/historial/**").hasRole("ADMINISTRADOR")
                .requestMatchers("/api/pagos/reporte").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.POST, "/api/servicios/**").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.PUT, "/api/servicios/**").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.DELETE, "/api/citas/**").hasRole("ADMINISTRADOR")
                .requestMatchers("/api/usuarios/**").hasRole("ADMINISTRADOR")

                // 2. Operaciones compartidas (ADMINISTRADOR y TRABAJADOR)
                .requestMatchers("/api/citas/**").hasAnyRole("ADMINISTRADOR", "TRABAJADOR")
                .requestMatchers("/api/clientes/**").hasAnyRole("ADMINISTRADOR", "TRABAJADOR")
                .requestMatchers("/api/servicios/**").hasAnyRole("ADMINISTRADOR", "TRABAJADOR")
                .requestMatchers("/api/pagos/**").hasAnyRole("ADMINISTRADOR", "TRABAJADOR")
                .requestMatchers("/api/ventas/**").hasAnyRole("ADMINISTRADOR", "TRABAJADOR")
                .requestMatchers("/api/auth/me").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
