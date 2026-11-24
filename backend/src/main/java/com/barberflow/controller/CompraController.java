package com.barberflow.controller;

import com.barberflow.domain.entity.Compra;
import com.barberflow.domain.entity.Proveedor;
import com.barberflow.domain.entity.Usuario;
import com.barberflow.dto.request.CrearCompraRequest;
import com.barberflow.repository.ProveedorRepository;
import com.barberflow.service.AuthService;
import com.barberflow.service.CompraService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compras")
public class CompraController {

    private final CompraService compraService;
    private final ProveedorRepository proveedorRepository;
    private final AuthService authService;

    public CompraController(CompraService compraService,
                            ProveedorRepository proveedorRepository,
                            AuthService authService) {
        this.compraService = compraService;
        this.proveedorRepository = proveedorRepository;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCompras() {
        return ResponseEntity.ok(Map.of("ok", true, "data", compraService.getCompras()));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> registrarCompra(
            @Valid @RequestBody CrearCompraRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = authService.obtenerUsuarioPorEmail(userDetails.getUsername());
        Compra guardada = compraService.registrarCompra(req, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "data", guardada));
    }

    @GetMapping("/proveedores")
    public ResponseEntity<Map<String, Object>> getProveedores() {
        List<Proveedor> lista = proveedorRepository.findByActivoTrueOrderByNombreAsc();
        return ResponseEntity.ok(Map.of("ok", true, "data", lista));
    }

    @PostMapping("/proveedores")
    public ResponseEntity<Map<String, Object>> crearProveedor(@RequestBody Proveedor proveedor) {
        Proveedor nuevo = proveedorRepository.save(proveedor);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "data", nuevo));
    }
}
