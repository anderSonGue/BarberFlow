package com.barberflow.service;

import com.barberflow.domain.entity.Servicio;
import com.barberflow.exception.BusinessException;
import com.barberflow.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ServicioService {

    private final ServicioRepository servicioRepository;

    public ServicioService(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    @Transactional(readOnly = true)
    public List<Servicio> getServicios() {
        return servicioRepository.findByActivoTrue();
    }

    @Transactional
    public Servicio crearServicio(Servicio servicio) {
        if (servicio.getNombre() == null || servicio.getNombre().isBlank()) {
            throw new BusinessException("El nombre del servicio es obligatorio");
        }
        if (servicio.getPrecio() == null) {
            throw new BusinessException("El precio del servicio es obligatorio");
        }
        return servicioRepository.save(servicio);
    }
}
