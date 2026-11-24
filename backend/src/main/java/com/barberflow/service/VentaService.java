package com.barberflow.service;

import com.barberflow.domain.entity.*;
import com.barberflow.domain.enums.TipoItem;
import com.barberflow.domain.enums.TipoMovimiento;
import com.barberflow.dto.request.CrearVentaRequest;
import com.barberflow.exception.BusinessException;
import com.barberflow.exception.InsufficientStockException;
import com.barberflow.exception.ResourceNotFoundException;
import com.barberflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class VentaService {

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;
    private final ProfesionalRepository profesionalRepository;
    private final MovimientoInventarioRepository movimientoRepository;

    public VentaService(VentaRepository ventaRepository,
                        ProductoRepository productoRepository,
                        ClienteRepository clienteRepository,
                        ProfesionalRepository profesionalRepository,
                        MovimientoInventarioRepository movimientoRepository) {
        this.ventaRepository = ventaRepository;
        this.productoRepository = productoRepository;
        this.clienteRepository = clienteRepository;
        this.profesionalRepository = profesionalRepository;
        this.movimientoRepository = movimientoRepository;
    }

    @Transactional(readOnly = true)
    public List<Venta> getVentas(Integer profesionalId) {
        if (profesionalId != null) {
            return ventaRepository.findByProfesionalIdOrderByFechaDesc(profesionalId);
        }
        return ventaRepository.findAllByOrderByFechaDesc();
    }

    @Transactional
    public Venta registrarVenta(CrearVentaRequest req, Usuario usuario) {
        Cliente cliente = null;
        if (req.getClienteId() != null) {
            cliente = clienteRepository.findById(req.getClienteId()).orElse(null);
        }

        Profesional profesional = null;
        if (req.getProfesionalId() != null) {
            profesional = profesionalRepository.findById(req.getProfesionalId()).orElse(null);
        }

        // 1. Validar existencias de todos los productos antes de descontar
        for (CrearVentaRequest.ItemVentaRequest item : req.getItems()) {
            Producto prod = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + item.getProductoId()));

            if (prod.getExistencias() < item.getCantidad()) {
                throw new InsufficientStockException(
                        "Stock insuficiente para el producto '" + prod.getNombre() +
                        "'. Solicitado: " + item.getCantidad() + ", Disponible: " + prod.getExistencias()
                );
            }
        }

        // 2. Crear Venta
        Venta venta = new Venta();
        venta.setCliente(cliente);
        venta.setUsuario(usuario);
        venta.setProfesional(profesional);
        venta.setNumeroComprobante("VNT-" + System.currentTimeMillis() % 1000000);
        venta.setFecha(LocalDateTime.now());
        venta.setMetodoPago(req.getMetodoPago() != null ? req.getMetodoPago() : "EFECTIVO");

        BigDecimal subtotal = BigDecimal.ZERO;

        for (CrearVentaRequest.ItemVentaRequest item : req.getItems()) {
            Producto prod = productoRepository.findById(item.getProductoId()).orElseThrow();
            BigDecimal precio = prod.getPrecioVenta();
            BigDecimal sub = precio.multiply(new BigDecimal(item.getCantidad()));
            subtotal = subtotal.add(sub);

            // Descontar existencias
            int ant = prod.getExistencias();
            int res = ant - item.getCantidad();
            prod.setExistencias(res);
            productoRepository.save(prod);

            // Detalle de venta
            DetalleVenta det = new DetalleVenta(venta, prod, item.getCantidad(), precio, sub);
            venta.getDetalles().add(det);

            // Movimiento de inventario
            MovimientoInventario mov = new MovimientoInventario();
            mov.setTipoItem(TipoItem.PRODUCTO);
            mov.setProducto(prod);
            mov.setTipoMovimiento(TipoMovimiento.SALIDA_VENTA);
            mov.setCantidadAnterior(new BigDecimal(ant));
            mov.setCantidadMovimiento(new BigDecimal(item.getCantidad()));
            mov.setCantidadResultante(new BigDecimal(res));
            mov.setMotivo("Venta minorista #" + venta.getNumeroComprobante());
            mov.setUsuario(usuario);
            mov.setCliente(cliente);
            movimientoRepository.save(mov);
        }

        BigDecimal descuento = req.getDescuento() != null ? req.getDescuento() : BigDecimal.ZERO;
        BigDecimal total = subtotal.subtract(descuento).max(BigDecimal.ZERO);

        venta.setSubtotal(subtotal);
        venta.setDescuento(descuento);
        venta.setTotal(total);

        return ventaRepository.save(venta);
    }
}
