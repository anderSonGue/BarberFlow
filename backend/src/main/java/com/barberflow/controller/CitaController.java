package com.barberflow.controller;

import com.barberflow.domain.entity.Cita;
import com.barberflow.domain.entity.Usuario;
import com.barberflow.domain.enums.Rol;
import com.barberflow.dto.request.CrearCitaRequest;
import com.barberflow.service.AuthService;
import com.barberflow.service.CitaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaService citaService;
    private final AuthService authService;

    public CitaController(CitaService citaService, AuthService authService) {
        this.citaService = citaService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCitas(
            @RequestParam(required = false) String fecha,
            @RequestParam(required = false) Integer profesionalId,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String buscar,
            @AuthenticationPrincipal UserDetails userDetails) {

        Usuario usuario = authService.obtenerUsuarioPorEmail(userDetails.getUsername());

        // Regla estricta de negocio: Un trabajador solo puede consultar su propia agenda y citas
        Integer filtroProf = profesionalId;
        if (usuario.getRol() == Rol.TRABAJADOR) {
            if (usuario.getProfesional() == null) {
                return ResponseEntity.ok(Map.of("ok", true, "data", Collections.emptyList()));
            }
            filtroProf = usuario.getProfesional().getId();
        }

        List<Cita> lista = citaService.getCitas(fecha, filtroProf, estado);

        if (buscar != null && !buscar.isBlank()) {
            String q = buscar.toLowerCase().trim();
            lista = lista.stream().filter(c ->
                    (c.getCliente() != null && c.getCliente().getNombre().toLowerCase().contains(q)) ||
                    (c.getCliente() != null && c.getCliente().getTelefono() != null && c.getCliente().getTelefono().contains(q)) ||
                    (c.getNotas() != null && c.getNotas().toLowerCase().contains(q))
            ).toList();
        }

        List<Map<String, Object>> dto = lista.stream().map(this::toDto).toList();
        return ResponseEntity.ok(Map.of("ok", true, "data", dto));
    }

    @GetMapping("/disponibilidad")
    public ResponseEntity<Map<String, Object>> getDisponibilidad(
            @RequestParam Integer profesionalId,
            @RequestParam String fecha,
            @RequestParam(defaultValue = "30") Integer duracionMin) {
        List<String> franjas = citaService.getDisponibilidad(profesionalId, fecha, duracionMin);
        return ResponseEntity.ok(Map.of("ok", true, "data", franjas));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crearCita(@Valid @RequestBody CrearCitaRequest req) {
        Cita creada = citaService.crearCita(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "data", toDto(creada)));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Map<String, Object>> cambiarEstado(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        String nuevoEstado = body.get("estado");
        Cita actualizada = citaService.cambiarEstado(id, nuevoEstado);
        return ResponseEntity.ok(Map.of("ok", true, "data", toDto(actualizada)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminarCita(@PathVariable Integer id) {
        citaService.eliminarCita(id);
        return ResponseEntity.ok(Map.of("ok", true, "mensaje", "Cita eliminada correctamente."));
    }

    private Map<String, Object> toDto(Cita c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("fecha", c.getFechaHoraInicio().toLocalDate().toString());
        m.put("hora", c.getFechaHoraInicio().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")));
        m.put("duracionMin", c.getDuracionMin());
        m.put("estado", c.getEstado().name());
        m.put("valorEstimado", c.getValorEstimado());
        m.put("notas", c.getNotas());

        if (c.getCliente() != null) {
            m.put("cliente", Map.of(
                    "id", c.getCliente().getId(),
                    "nombre", c.getCliente().getNombre(),
                    "telefono", c.getCliente().getTelefono() != null ? c.getCliente().getTelefono() : "",
                    "puntos", c.getCliente().getPuntos()
            ));
        }

        if (c.getProfesional() != null) {
            m.put("profesional", Map.of(
                    "id", c.getProfesional().getId(),
                    "nombre", c.getProfesional().getNombre(),
                    "especialidad", c.getProfesional().getEspecialidad() != null ? c.getProfesional().getEspecialidad() : ""
            ));
        }

        List<Map<String, Object>> serviciosDto = c.getServicios().stream().map(cs -> {
            Map<String, Object> sm = new HashMap<>();
            sm.put("id", cs.getId());
            sm.put("servicio", Map.of(
                    "id", cs.getServicio().getId(),
                    "nombre", cs.getServicio().getNombre(),
                    "precio", cs.getPrecio()
            ));
            return sm;
        }).toList();

        m.put("servicios", serviciosDto);
        return m;
    }
}
