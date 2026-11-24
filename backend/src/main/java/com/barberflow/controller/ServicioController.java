package com.barberflow.controller;

import com.barberflow.domain.entity.Servicio;
import com.barberflow.service.ServicioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

    private final ServicioService servicioService;

    public ServicioController(ServicioService servicioService) {
        this.servicioService = servicioService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getServicios() {
        List<Servicio> lista = servicioService.getServicios();
        return ResponseEntity.ok(Map.of("ok", true, "data", lista));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crearServicio(@RequestBody Servicio servicio) {
        Servicio nuevo = servicioService.crearServicio(servicio);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "data", nuevo));
    }
}
