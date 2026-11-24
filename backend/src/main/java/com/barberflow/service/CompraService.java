package com.barberflow.service;

import com.barberflow.domain.entity.*;
import com.barberflow.domain.enums.TipoItem;
import com.barberflow.domain.enums.TipoMovimiento;
import com.barberflow.dto.request.CrearCompraRequest;
import com.barberflow.exception.BusinessException;
import com.barberflow.exception.ResourceNotFoundException;
import com.barberflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CompraService {

    private final CompraRepository compraRepository;
    private final ProveedorRepository proveedorRepository;
    private final InsumoRepository insumoRepository;
    private final ProductoRepository productoRepository;
    private final MovimientoInventarioRepository movimientoRepository;

    public CompraService(CompraRepository compraRepository,
                         ProveedorRepository proveedorRepository,
                         InsumoRepository insumoRepository,
                         ProductoRepository productoRepository,
                         MovimientoInventarioRepository movimientoRepository) {
        this.compraRepository = compraRepository;
        this.proveedorRepository = proveedorRepository;
        this.insumoRepository = insumoRepository;
        this.productoRepository = productoRepository;
        this.movimientoRepository = movimientoRepository;
    }

    @Transactional(readOnly = true)
    public List<Compra> getCompras() {
        return compraRepository.findAllByOrderByFechaDesc();
    }

    @Transactional
    public Compra registrarCompra(CrearCompraRequest req, Usuario usuario) {
        Proveedor proveedor = proveedorRepository.findById(req.getProveedorId())
                .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado con id: " + req.getProveedorId()));

        Compra compra = new Compra();
        compra.setProveedor(proveedor);
        compra.setUsuario(usuario);
        compra.setNumeroFactura(req.getNumeroFactura().trim());
        compra.setFecha(LocalDateTime.now());
        compra.setObservaciones(req.getObservaciones());

        BigDecimal totalCompra = BigDecimal.ZERO;

        for (CrearCompraRequest.ItemCompraRequest item : req.getItems()) {
            BigDecimal subtotal = item.getCantidad().multiply(item.getCostoUnitario());
            totalCompra = totalCompra.add(subtotal);

            DetalleCompra detalle = new DetalleCompra();
            detalle.setCompra(compra);
            detalle.setCantidad(item.getCantidad());
            detalle.setCostoUnitario(item.getCostoUnitario());
            detalle.setSubtotal(subtotal);

            if ("INSUMO".equalsIgnoreCase(item.getTipoItem())) {
                Insumo insumo = insumoRepository.findById(item.getItemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Insumo no encontrado: " + item.getItemId()));

                BigDecimal ant = insumo.getExistencias();
                BigDecimal res = ant.add(item.getCantidad());
                insumo.setExistencias(res);
                insumo.setCostoUnitario(item.getCostoUnitario());
                insumoRepository.save(insumo);

                detalle.setTipoItem(TipoItem.INSUMO);
                detalle.setInsumo(insumo);

                // Movimiento
                MovimientoInventario mov = new MovimientoInventario();
                mov.setTipoItem(TipoItem.INSUMO);
                mov.setInsumo(insumo);
                mov.setTipoMovimiento(TipoMovimiento.ENTRADA_COMPRA);
                mov.setCantidadAnterior(ant);
                mov.setCantidadMovimiento(item.getCantidad());
                mov.setCantidadResultante(res);
                mov.setMotivo("Compra factura #" + req.getNumeroFactura() + " - Prov: " + proveedor.getNombre());
                mov.setUsuario(usuario);
                movimientoRepository.save(mov);

            } else if ("PRODUCTO".equalsIgnoreCase(item.getTipoItem())) {
                Producto prod = productoRepository.findById(item.getItemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + item.getItemId()));

                int cantInt = item.getCantidad().intValue();
                int ant = prod.getExistencias();
                int res = ant + cantInt;
                prod.setExistencias(res);
                prod.setCostoUnitario(item.getCostoUnitario());
                productoRepository.save(prod);

                detalle.setTipoItem(TipoItem.PRODUCTO);
                detalle.setProducto(prod);

                // Movimiento
                MovimientoInventario mov = new MovimientoInventario();
                mov.setTipoItem(TipoItem.PRODUCTO);
                mov.setProducto(prod);
                mov.setTipoMovimiento(TipoMovimiento.ENTRADA_COMPRA);
                mov.setCantidadAnterior(new BigDecimal(ant));
                mov.setCantidadMovimiento(item.getCantidad());
                mov.setCantidadResultante(new BigDecimal(res));
                mov.setMotivo("Compra factura #" + req.getNumeroFactura() + " - Prov: " + proveedor.getNombre());
                mov.setUsuario(usuario);
                movimientoRepository.save(mov);
            } else {
                throw new BusinessException("Tipo de ítem desconocido: " + item.getTipoItem());
            }

            compra.getDetalles().add(detalle);
        }

        compra.setTotal(totalCompra);
        return compraRepository.save(compra);
    }
}
