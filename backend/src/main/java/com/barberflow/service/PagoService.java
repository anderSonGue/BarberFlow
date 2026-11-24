package com.barberflow.service;

import com.barberflow.domain.entity.*;
import com.barberflow.domain.enums.EstadoCita;
import com.barberflow.domain.enums.TipoItem;
import com.barberflow.domain.enums.TipoMovimiento;
import com.barberflow.dto.request.RegistrarPagoRequest;
import com.barberflow.dto.response.ReporteFinancieroResponse;
import com.barberflow.exception.BusinessException;
import com.barberflow.exception.InsufficientStockException;
import com.barberflow.exception.ResourceNotFoundException;
import com.barberflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PagoService {

    private final PagoRepository pagoRepository;
    private final CitaRepository citaRepository;
    private final InsumoRepository insumoRepository;
    private final ComisionRepository comisionRepository;
    private final MovimientoInventarioRepository movimientoRepository;
    private final ConsumoServicioRepository consumoRepository;
    private final ClienteRepository clienteRepository;

    public PagoService(PagoRepository pagoRepository,
                       CitaRepository citaRepository,
                       InsumoRepository insumoRepository,
                       ComisionRepository comisionRepository,
                       MovimientoInventarioRepository movimientoRepository,
                       ConsumoServicioRepository consumoRepository,
                       ClienteRepository clienteRepository) {
        this.pagoRepository = pagoRepository;
        this.citaRepository = citaRepository;
        this.insumoRepository = insumoRepository;
        this.comisionRepository = comisionRepository;
        this.movimientoRepository = movimientoRepository;
        this.consumoRepository = consumoRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional
    public Pago registrarPago(RegistrarPagoRequest req, Usuario usuarioResponsable) {
        Cita cita = citaRepository.findById(req.getCitaId())
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada con id: " + req.getCitaId()));

        if (cita.getEstado() != EstadoCita.EN_ATENCION) {
            throw new BusinessException("Solo se pueden cobrar citas en estado 'EN_ATENCION'. Estado actual: " + cita.getEstado());
        }

        if (pagoRepository.findByCitaId(cita.getId()).isPresent()) {
            throw new BusinessException("Esta cita ya cuenta con un pago registrado.");
        }

        // 1. Consolidar insumos requeridos por las recetas de los servicios de la cita
        Map<Integer, BigDecimal> insumosRequeridos = new HashMap<>();
        Map<Integer, Servicio> servicioPorInsumo = new HashMap<>();

        for (CitaServicio cs : cita.getServicios()) {
            Servicio serv = cs.getServicio();
            if (serv.getReceta() != null) {
                for (ServicioInsumo si : serv.getReceta()) {
                    Integer insumoId = si.getInsumo().getId();
                    insumosRequeridos.merge(insumoId, si.getCantidadRequerida(), BigDecimal::add);
                    servicioPorInsumo.put(insumoId, serv);
                }
            }
        }

        // 2. REGLA INQUEBRANTABLE: Validar existencias atómicamente antes de descontar
        for (Map.Entry<Integer, BigDecimal> entry : insumosRequeridos.entrySet()) {
            Insumo insumo = insumoRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Insumo con id " + entry.getKey() + " no encontrado"));

            if (insumo.getExistencias().compareTo(entry.getValue()) < 0) {
                throw new InsufficientStockException(
                        "Se requieren " + entry.getValue() + " " + insumo.getUnidad() +
                        " de '" + insumo.getNombre() + "', pero solamente existen " +
                        insumo.getExistencias() + " " + insumo.getUnidad() + " en stock. Operación bloqueada."
                );
            }
        }

        // 3. Cálculos monetarios
        BigDecimal subtotal = cita.getServicios().stream()
                .map(CitaServicio::getPrecio)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal descuento = BigDecimal.ZERO;
        if (req.getCodigoPromo() != null && !req.getCodigoPromo().isBlank()) {
            String promo = req.getCodigoPromo().trim().toUpperCase();
            if (promo.equals("BARBA10")) {
                descuento = subtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
            } else if (promo.equals("FLOW20")) {
                descuento = subtotal.multiply(new BigDecimal("0.20")).setScale(2, RoundingMode.HALF_UP);
            } else if (promo.equals("CLIENTE_VIP")) {
                descuento = subtotal.min(new BigDecimal("5000.00"));
            }
        }

        int puntosCanjeados = 0;
        Cliente cliente = cita.getCliente();
        if (Boolean.TRUE.equals(req.getCanjearPuntos()) && cliente != null && cliente.getPuntos() > 0) {
            BigDecimal maxCanjeable = subtotal.subtract(descuento).max(BigDecimal.ZERO);
            int puntosMax = maxCanjeable.divide(new BigDecimal("20"), 0, RoundingMode.FLOOR).intValue();
            puntosCanjeados = Math.min(cliente.getPuntos(), puntosMax);
            descuento = descuento.add(new BigDecimal(puntosCanjeados * 20));
        }

        BigDecimal valorCobrado = subtotal.subtract(descuento).max(BigDecimal.ZERO);

        // 4. Descontar existencias de insumos y registrar movimientos y consumos
        BigDecimal costoTotalInsumos = BigDecimal.ZERO;
        List<ConsumoServicio> consumosParaGuardar = new ArrayList<>();

        for (Map.Entry<Integer, BigDecimal> entry : insumosRequeridos.entrySet()) {
            Insumo insumo = insumoRepository.findById(entry.getKey()).orElseThrow();
            BigDecimal cantAnterior = insumo.getExistencias();
            BigDecimal cantDescontar = entry.getValue();
            BigDecimal cantResultante = cantAnterior.subtract(cantDescontar);
            BigDecimal costoInsumo = cantDescontar.multiply(insumo.getCostoUnitario());

            costoTotalInsumos = costoTotalInsumos.add(costoInsumo);

            // Actualizar stock
            insumo.setExistencias(cantResultante);
            insumoRepository.save(insumo);

            // Movimiento de inventario
            MovimientoInventario mov = new MovimientoInventario();
            mov.setTipoItem(TipoItem.INSUMO);
            mov.setInsumo(insumo);
            mov.setTipoMovimiento(TipoMovimiento.SALIDA_SERVICIO);
            mov.setCantidadAnterior(cantAnterior);
            mov.setCantidadMovimiento(cantDescontar);
            mov.setCantidadResultante(cantResultante);
            mov.setMotivo("Consumo en cita #" + cita.getId());
            mov.setUsuario(usuarioResponsable);
            mov.setCliente(cliente);
            mov.setCita(cita);
            movimientoRepository.save(mov);

            // Detalle de consumo
            ConsumoServicio consumo = new ConsumoServicio();
            consumo.setCita(cita);
            consumo.setServicio(servicioPorInsumo.get(insumo.getId()));
            consumo.setInsumo(insumo);
            consumo.setCantidadConsumida(cantDescontar);
            consumo.setCostoUnitario(insumo.getCostoUnitario());
            consumo.setCostoTotal(costoInsumo);
            consumo.setCliente(cliente);
            consumo.setProfesional(cita.getProfesional());
            consumosParaGuardar.add(consumo);
        }

        // 5. Liquidación de Comisiones
        // Base de comisión = Valor cobrado - Costo de insumos
        BigDecimal baseComisionable = valorCobrado.subtract(costoTotalInsumos).max(BigDecimal.ZERO);
        BigDecimal porcentajeComision = cita.getProfesional().getPorcentajeComision();
        BigDecimal valorProfesional = baseComisionable.multiply(porcentajeComision).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal valorEstablecimiento = valorCobrado.subtract(valorProfesional);

        int puntosGanados = valorCobrado.divide(new BigDecimal("1000"), 0, RoundingMode.FLOOR).intValue();

        // 6. Guardar Pago
        Pago pago = new Pago();
        pago.setCita(cita);
        pago.setCliente(cliente);
        pago.setProfesional(cita.getProfesional());
        pago.setUsuario(usuarioResponsable);
        pago.setMetodo(req.getMetodo() != null ? req.getMetodo() : "EFECTIVO");
        pago.setSubtotal(subtotal);
        pago.setDescuento(descuento);
        pago.setValorCobrado(valorCobrado);
        pago.setCostoInsumos(costoTotalInsumos);
        pago.setBaseComisionable(baseComisionable);
        pago.setPorcentajeComision(porcentajeComision);
        pago.setValorProfesional(valorProfesional);
        pago.setValorEstablecimiento(valorEstablecimiento);
        pago.setPuntosGanados(puntosGanados);
        pago.setPuntosCanjeados(puntosCanjeados);
        pago.setFechaPago(LocalDateTime.now());

        Pago pagoGuardado = pagoRepository.save(pago);

        // Guardar consumos vinculados al pago
        for (ConsumoServicio cs : consumosParaGuardar) {
            cs.setPago(pagoGuardado);
            consumoRepository.save(cs);
        }

        // 7. Guardar Comisión histórica
        Comision comision = new Comision();
        comision.setPago(pagoGuardado);
        comision.setProfesional(cita.getProfesional());
        comision.setBaseComisionable(baseComisionable);
        comision.setPorcentajeAplicado(porcentajeComision);
        comision.setValorComision(valorProfesional);
        comision.setFecha(LocalDateTime.now());
        comision.setPagada(false);
        comisionRepository.save(comision);

        // 8. Actualizar cita a FINALIZADA
        cita.setEstado(EstadoCita.FINALIZADA);
        citaRepository.save(cita);

        // 9. Actualizar fidelización de cliente
        if (cliente != null) {
            cliente.setVisitas(cliente.getVisitas() + 1);
            int nuevoSaldo = Math.max(0, cliente.getPuntos() - puntosCanjeados + puntosGanados);
            cliente.setPuntos(nuevoSaldo);
            clienteRepository.save(cliente);
        }

        return pagoGuardado;
    }

    @Transactional(readOnly = true)
    public List<Pago> getPagos(Integer profesionalId) {
        if (profesionalId != null) {
            return pagoRepository.findByProfesionalIdOrderByFechaPagoDesc(profesionalId);
        }
        return pagoRepository.findAllByOrderByFechaPagoDesc();
    }

    @Transactional(readOnly = true)
    public ReporteFinancieroResponse getReporteFinanciero() {
        List<Pago> pagos = pagoRepository.findAll();

        BigDecimal totalIngresos = pagos.stream().map(Pago::getValorCobrado).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalComisiones = pagos.stream().map(Pago::getValorProfesional).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalUtilidad = pagos.stream().map(Pago::getValorEstablecimiento).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalInsumos = pagos.stream().map(Pago::getCostoInsumos).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<Integer, ReporteFinancieroResponse.RendimientoProfesional> porProf = new HashMap<>();

        for (Pago p : pagos) {
            Profesional prof = p.getProfesional();
            ReporteFinancieroResponse.RendimientoProfesional rp = porProf.computeIfAbsent(
                    prof.getId(),
                    id -> new ReporteFinancieroResponse.RendimientoProfesional(id, prof.getNombre(), BigDecimal.ZERO, BigDecimal.ZERO, 0)
            );
            rp.setTotalVentas(rp.getTotalVentas().add(p.getValorCobrado()));
            rp.setTotalComision(rp.getTotalComision().add(p.getValorProfesional()));
            rp.setServiciosRealizados(rp.getServiciosRealizados() + 1);
        }

        return new ReporteFinancieroResponse(
                totalIngresos,
                totalComisiones,
                totalUtilidad,
                totalInsumos,
                pagos.size(),
                new ArrayList<>(porProf.values())
        );
    }
}
