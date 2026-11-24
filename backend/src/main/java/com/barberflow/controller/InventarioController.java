package com.barberflow.controller;

import com.barberflow.domain.entity.*;
import com.barberflow.service.AuthService;
import com.barberflow.service.InventarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventario")
public class InventarioController {

    private final InventarioService inventarioService;
    private final AuthService authService;

    public InventarioController(InventarioService inventarioService, AuthService authService) {
        this.inventarioService = inventarioService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getInsumos() {
        return ResponseEntity.ok(Map.of("ok", true, "data", inventarioService.getInsumos()));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crearInsumo(
            @RequestBody Insumo insumo,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = authService.obtenerUsuarioPorEmail(userDetails.getUsername());
        Insumo creado = inventarioService.crearInsumo(insumo, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "data", creado));
    }

    @PostMapping("/{id}/entrada")
    public ResponseEntity<Map<String, Object>> registrarEntrada(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = authService.obtenerUsuarioPorEmail(userDetails.getUsername());
        BigDecimal cantidad = new BigDecimal(body.get("cantidad").toString());
        String motivo = body.get("motivo") != null ? body.get("motivo").toString() : null;

        Insumo actualizado = inventarioService.registrarEntradaInsumo(id, cantidad, motivo, usuario);
        return ResponseEntity.ok(Map.of("ok", true, "data", actualizado));
    }

    @GetMapping("/productos")
    public ResponseEntity<Map<String, Object>> getProductos() {
        return ResponseEntity.ok(Map.of("ok", true, "data", inventarioService.getProductos()));
    }

    @PostMapping("/productos")
    public ResponseEntity<Map<String, Object>> crearProducto(
            @RequestBody Producto producto,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = authService.obtenerUsuarioPorEmail(userDetails.getUsername());
        Producto creado = inventarioService.crearProducto(producto, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "data", creado));
    }

    @GetMapping("/movimientos")
    public ResponseEntity<Map<String, Object>> getMovimientos(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Integer insumoId,
            @RequestParam(required = false) Integer productoId) {
        List<MovimientoInventario> lista = inventarioService.getMovimientos(tipo, insumoId, productoId);
        return ResponseEntity.ok(Map.of("ok", true, "data", lista));
    }

    @GetMapping("/consumos/cliente/{clienteId}")
    public ResponseEntity<Map<String, Object>> getConsumosPorCliente(@PathVariable Integer clienteId) {
        return ResponseEntity.ok(Map.of("ok", true, "data", inventarioService.getConsumosPorCliente(clienteId)));
    }

    @GetMapping("/consumos/producto/{insumoId}")
    public ResponseEntity<Map<String, Object>> getConsumosPorInsumo(@PathVariable Integer insumoId) {
        return ResponseEntity.ok(Map.of("ok", true, "data", inventarioService.getConsumosPorInsumo(insumoId)));
    }
}
