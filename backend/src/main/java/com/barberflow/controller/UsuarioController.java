package com.barberflow.controller;

import com.barberflow.domain.entity.Profesional;
import com.barberflow.domain.entity.Usuario;
import com.barberflow.domain.enums.Rol;
import com.barberflow.exception.BusinessException;
import com.barberflow.repository.ProfesionalRepository;
import com.barberflow.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final ProfesionalRepository profesionalRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioController(UsuarioRepository usuarioRepository,
                             ProfesionalRepository profesionalRepository,
                             PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.profesionalRepository = profesionalRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/profesionales")
    public ResponseEntity<Map<String, Object>> getProfesionales() {
        List<Profesional> lista = profesionalRepository.findByActivoTrue();
        return ResponseEntity.ok(Map.of("ok", true, "data", lista));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getUsuarios() {
        List<Usuario> lista = usuarioRepository.findByActivoTrue();
        List<Map<String, Object>> dtos = lista.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("nombre", u.getNombre());
            m.put("email", u.getEmail());
            m.put("rol", u.getRol().name());
            m.put("activo", u.getActivo());
            if (u.getProfesional() != null) {
                m.put("profesional", Map.of(
                        "id", u.getProfesional().getId(),
                        "nombre", u.getProfesional().getNombre()
                ));
            }
            return m;
        }).toList();
        return ResponseEntity.ok(Map.of("ok", true, "data", dtos));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crearUsuario(@RequestBody Map<String, String> body) {
        String nombre = body.get("nombre");
        String email = body.get("email");
        String password = body.get("password");
        String rolStr = body.get("rol");
        String profIdStr = body.get("profesionalId");

        if (nombre == null || email == null || password == null || rolStr == null) {
            throw new BusinessException("Nombre, correo, contraseña y rol son requeridos");
        }

        if (usuarioRepository.existsByEmail(email.trim().toLowerCase())) {
            throw new BusinessException("Ya existe una cuenta registrada con este correo");
        }

        Profesional prof = null;
        if (profIdStr != null && !profIdStr.isBlank()) {
            prof = profesionalRepository.findById(Integer.parseInt(profIdStr)).orElse(null);
        }

        Usuario nuevo = new Usuario(
                nombre.trim(),
                email.trim().toLowerCase(),
                passwordEncoder.encode(password),
                Rol.valueOf(rolStr.toUpperCase()),
                prof
        );

        Usuario guardado = usuarioRepository.save(nuevo);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "ok", true,
                "data", Map.of("id", guardado.getId(), "nombre", guardado.getNombre(), "email", guardado.getEmail(), "rol", guardado.getRol().name())
        ));
    }
}
