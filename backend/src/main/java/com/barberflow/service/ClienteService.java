package com.barberflow.service;

import com.barberflow.domain.entity.Cliente;
import com.barberflow.exception.BusinessException;
import com.barberflow.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public List<Cliente> getClientes(String buscar) {
        if (buscar != null && !buscar.isBlank()) {
            return clienteRepository.findByNombreContainingIgnoreCaseOrTelefonoContaining(buscar.trim(), buscar.trim());
        }
        return clienteRepository.findAllByOrderByVisitasDesc();
    }

    @Transactional
    public Cliente crearCliente(Cliente cliente) {
        if (cliente.getNombre() == null || cliente.getNombre().isBlank()) {
            throw new BusinessException("El nombre del cliente es obligatorio");
        }
        return clienteRepository.save(cliente);
    }
}
