package com.barberflow.service;

import com.barberflow.domain.entity.*;
import com.barberflow.domain.enums.EstadoCita;
import com.barberflow.dto.request.CrearCitaRequest;
import com.barberflow.exception.BusinessException;
import com.barberflow.exception.ResourceNotFoundException;
import com.barberflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class CitaService {

    private final CitaRepository citaRepository;
    private final ClienteRepository clienteRepository;
    private final ProfesionalRepository profesionalRepository;
    private final ServicioRepository servicioRepository;

    public CitaService(CitaRepository citaRepository,
                       ClienteRepository clienteRepository,
                       ProfesionalRepository profesionalRepository,
                       ServicioRepository servicioRepository) {
        this.citaRepository = citaRepository;
        this.clienteRepository = clienteRepository;
        this.profesionalRepository = profesionalRepository;
        this.servicioRepository = servicioRepository;
    }

    @Transactional(readOnly = true)
    public List<Cita> getCitas(String fecha, Integer profesionalId, String estado) {
        if (fecha != null && !fecha.isBlank()) {
            LocalDate d = LocalDate.parse(fecha);
            LocalDateTime inicio = d.atStartOfDay();
            LocalDateTime fin = d.plusDays(1).atStartOfDay();
            List<Cita> lista = citaRepository.findByRangoFechas(inicio, fin);
            return filtrar(lista, profesionalId, estado);
        }
        return filtrar(citaRepository.findAllByOrderByFechaHoraInicioAsc(), profesionalId, estado);
    }

    private List<Cita> filtrar(List<Cita> citas, Integer profesionalId, String estado) {
        return citas.stream()
                .filter(c -> profesionalId == null || c.getProfesional().getId().equals(profesionalId))
                .filter(c -> estado == null || estado.equals("TODOS") || c.getEstado().name().equalsIgnoreCase(estado))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getDisponibilidad(Integer profesionalId, String fechaStr, Integer duracionMin) {
        LocalDate fecha = (fechaStr != null && !fechaStr.isBlank()) ? LocalDate.parse(fechaStr) : LocalDate.now();
        int duracion = (duracionMin != null && duracionMin > 0) ? duracionMin : 30;

        LocalTime inicioJornada = LocalTime.of(8, 0);
        LocalTime finJornada = LocalTime.of(19, 0);
        LocalTime descansoInicio = LocalTime.of(13, 0);
        LocalTime descansoFin = LocalTime.of(14, 0);

        LocalDateTime inicioDia = fecha.atStartOfDay();
        LocalDateTime finDia = fecha.plusDays(1).atStartOfDay();

        List<Cita> ocupadas = citaRepository.findOcupadasProfesionalFecha(profesionalId, inicioDia, finDia);

        LocalDateTime ahora = LocalDateTime.now();
        List<String> disponibles = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");

        for (LocalTime t = inicioJornada; !t.plusMinutes(duracion).isAfter(finJornada); t = t.plusMinutes(30)) {
            LocalDateTime franjaInicio = fecha.atTime(t);
            LocalDateTime franjaFin = franjaInicio.plusMinutes(duracion);

            if (fecha.equals(LocalDate.now()) && !franjaInicio.isAfter(ahora)) {
                continue;
            }

            // Descanso
            if (t.isBefore(descansoFin) && t.plusMinutes(duracion).isAfter(descansoInicio)) {
                continue;
            }

            // Solapamiento con citas existentes
            boolean solapa = ocupadas.stream().anyMatch(c ->
                    franjaInicio.isBefore(c.getFechaHoraFin()) && franjaFin.isAfter(c.getFechaHoraInicio())
            );

            if (!solapa) {
                disponibles.add(t.format(fmt));
            }
        }

        return disponibles;
    }

    @Transactional
    public Cita crearCita(CrearCitaRequest req) {
        Profesional profesional = profesionalRepository.findById(req.getProfesionalId())
                .orElseThrow(() -> new ResourceNotFoundException("Profesional no encontrado"));

        List<Servicio> servicios = servicioRepository.findAllById(req.getServicioIds());
        if (servicios.isEmpty()) {
            throw new BusinessException("Debe seleccionar al menos un servicio válido");
        }

        int duracionTotal = servicios.stream().mapToInt(Servicio::getDuracionMin).sum();
        BigDecimal valorEstimado = servicios.stream()
                .map(Servicio::getPrecio)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDate fecha = LocalDate.parse(req.getFecha());
        LocalTime hora = LocalTime.parse(req.getHora());
        LocalDateTime fechaHoraInicio = fecha.atTime(hora);
        LocalDateTime fechaHoraFin = fechaHoraInicio.plusMinutes(duracionTotal);

        // Control de concurrencia y solapamiento
        List<Cita> solapadas = citaRepository.findSolapadas(profesional.getId(), fechaHoraInicio, fechaHoraFin);
        if (!solapadas.isEmpty()) {
            throw new BusinessException("La franja horaria ya está ocupada por otra cita para este profesional.");
        }

        // Cliente
        Cliente cliente = clienteRepository.findByNombreIgnoreCase(req.getClienteNombre().trim())
                .orElseGet(() -> {
                    Cliente nuevo = new Cliente(
                            req.getClienteNombre().trim(),
                            req.getClienteTelefono() != null ? req.getClienteTelefono().trim() : "",
                            req.getClienteEmail() != null ? req.getClienteEmail().trim() : null,
                            req.getNotas()
                    );
                    return clienteRepository.save(nuevo);
                });

        if (req.getClienteTelefono() != null && !req.getClienteTelefono().isBlank()) {
            cliente.setTelefono(req.getClienteTelefono().trim());
            clienteRepository.save(cliente);
        }

        Cita cita = new Cita();
        cita.setCliente(cliente);
        cita.setProfesional(profesional);
        cita.setFechaHoraInicio(fechaHoraInicio);
        cita.setFechaHoraFin(fechaHoraFin);
        cita.setDuracionMin(duracionTotal);
        cita.setEstado(EstadoCita.PROGRAMADA);
        cita.setValorEstimado(valorEstimado);
        cita.setNotas(req.getNotas());

        Cita guardada = citaRepository.save(cita);

        for (Servicio s : servicios) {
            CitaServicio cs = new CitaServicio(guardada, s, s.getPrecio());
            guardada.getServicios().add(cs);
        }

        return citaRepository.save(guardada);
    }

    @Transactional
    public Cita cambiarEstado(Integer id, String nuevoEstado) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada con id: " + id));

        EstadoCita estado = EstadoCita.valueOf(nuevoEstado.toUpperCase());
        cita.setEstado(estado);
        return citaRepository.save(cita);
    }

    @Transactional
    public void eliminarCita(Integer id) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada con id: " + id));

        if (cita.getPago() != null) {
            throw new BusinessException("No se puede eliminar una cita que ya cuenta con un pago liquidado.");
        }

        citaRepository.delete(cita);
    }
}
