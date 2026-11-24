package com.barberflow.controller;

import com.barberflow.domain.entity.Cliente;
import com.barberflow.service.ClienteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getClientes(@RequestParam(required = false) String buscar) {
        List<Cliente> lista = clienteService.getClientes(buscar);
        return ResponseEntity.ok(Map.of("ok", true, "data", lista));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crearCliente(@RequestBody Cliente cliente) {
        Cliente nuevo = clienteService.crearCliente(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "data", nuevo));
    }
}
