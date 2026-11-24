package com.barberflow.controller;

import com.barberflow.domain.entity.Usuario;
import com.barberflow.domain.entity.Venta;
import com.barberflow.domain.enums.Rol;
import com.barberflow.dto.request.CrearVentaRequest;
import com.barberflow.service.AuthService;
import com.barberflow.service.VentaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaService ventaService;
    private final AuthService authService;

    public VentaController(VentaService ventaService, AuthService authService) {
        this.ventaService = ventaService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getVentas(
            @RequestParam(required = false) Integer profesionalId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = authService.obtenerUsuarioPorEmail(userDetails.getUsername());

        Integer filtroProf = profesionalId;
        if (usuario.getRol() == Rol.TRABAJADOR) {
            if (usuario.getProfesional() == null) {
                return ResponseEntity.ok(Map.of("ok", true, "data", Collections.emptyList()));
            }
            filtroProf = usuario.getProfesional().getId();
        }

        List<Venta> lista = ventaService.getVentas(filtroProf);
        return ResponseEntity.ok(Map.of("ok", true, "data", lista));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> registrarVenta(
            @Valid @RequestBody CrearVentaRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = authService.obtenerUsuarioPorEmail(userDetails.getUsername());
        Venta guardada = ventaService.registrarVenta(req, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "data", guardada));
    }
}
