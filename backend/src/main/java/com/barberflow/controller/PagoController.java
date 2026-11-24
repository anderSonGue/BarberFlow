package com.barberflow.controller;

import com.barberflow.domain.entity.Pago;
import com.barberflow.domain.entity.Usuario;
import com.barberflow.domain.enums.Rol;
import com.barberflow.dto.request.RegistrarPagoRequest;
import com.barberflow.dto.response.ReporteFinancieroResponse;
import com.barberflow.service.AuthService;
import com.barberflow.service.PagoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;
    private final AuthService authService;

    public PagoController(PagoService pagoService, AuthService authService) {
        this.pagoService = pagoService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> registrarPago(
            @Valid @RequestBody RegistrarPagoRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = authService.obtenerUsuarioPorEmail(userDetails.getUsername());
        Pago pago = pagoService.registrarPago(req, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "data", toDto(pago)));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPagos(
            @RequestParam(required = false) Integer profesionalId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = authService.obtenerUsuarioPorEmail(userDetails.getUsername());

        // Si es TRABAJADOR, obligatoriamente se filtra por su profesionalId vinculado
        Integer filtroProf = profesionalId;
        if (usuario.getRol() == Rol.TRABAJADOR) {
            if (usuario.getProfesional() == null) {
                return ResponseEntity.ok(Map.of("ok", true, "data", Collections.emptyList()));
            }
            filtroProf = usuario.getProfesional().getId();
        }

        List<Pago> pagos = pagoService.getPagos(filtroProf);
        List<Map<String, Object>> dto = pagos.stream().map(this::toDto).toList();
        return ResponseEntity.ok(Map.of("ok", true, "data", dto));
    }

    @GetMapping("/reporte")
    public ResponseEntity<Map<String, Object>> getReporteFinanciero() {
        ReporteFinancieroResponse rep = pagoService.getReporteFinanciero();
        return ResponseEntity.ok(Map.of("ok", true, "data", rep));
    }

    private Map<String, Object> toDto(Pago p) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.getId());
        m.put("citaId", p.getCita().getId());
        m.put("metodo", p.getMetodo());
        m.put("subtotal", p.getSubtotal());
        m.put("descuento", p.getDescuento());
        m.put("valorCobrado", p.getValorCobrado());
        m.put("costoInsumos", p.getCostoInsumos());
        m.put("baseComisionable", p.getBaseComisionable());
        m.put("porcentajeComision", p.getPorcentajeComision());
        m.put("comisionProfesional", p.getValorProfesional());
        m.put("utilidadNegocio", p.getValorEstablecimiento());
        m.put("puntosGanados", p.getPuntosGanados());
        m.put("puntosCanjeados", p.getPuntosCanjeados());
        m.put("fecha", p.getFechaPago().toString());

        if (p.getCliente() != null) {
            m.put("cliente", Map.of(
                    "id", p.getCliente().getId(),
                    "nombre", p.getCliente().getNombre(),
                    "telefono", p.getCliente().getTelefono() != null ? p.getCliente().getTelefono() : ""
            ));
            m.put("clienteNombre", p.getCliente().getNombre());
        }

        if (p.getProfesional() != null) {
            m.put("profesional", Map.of(
                    "id", p.getProfesional().getId(),
                    "nombre", p.getProfesional().getNombre(),
                    "porcentaje", p.getProfesional().getPorcentajeComision()
            ));
            m.put("profesionalNombre", p.getProfesional().getNombre());
        }

        return m;
    }
}
