package com.barberflow.controller;

import com.barberflow.domain.entity.Usuario;
import com.barberflow.dto.request.LoginRequest;
import com.barberflow.dto.response.LoginResponse;
import com.barberflow.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> perfilActual(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = authService.obtenerUsuarioPorEmail(userDetails.getUsername());

        Map<String, Object> u = new HashMap<>();
        u.put("id", usuario.getId());
        u.put("nombre", usuario.getNombre());
        u.put("email", usuario.getEmail());
        u.put("rol", usuario.getRol().name());
        if (usuario.getProfesional() != null) {
            u.put("profesionalId", usuario.getProfesional().getId());
            u.put("profesionalNombre", usuario.getProfesional().getNombre());
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("usuario", u);
        return ResponseEntity.ok(resp);
    }
}
