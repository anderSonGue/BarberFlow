package com.barberflow.service;

import com.barberflow.domain.entity.*;
import com.barberflow.domain.enums.TipoItem;
import com.barberflow.domain.enums.TipoMovimiento;
import com.barberflow.exception.BusinessException;
import com.barberflow.exception.ResourceNotFoundException;
import com.barberflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class InventarioService {

    private final InsumoRepository insumoRepository;
    private final ProductoRepository productoRepository;
    private final MovimientoInventarioRepository movimientoRepository;
    private final ConsumoServicioRepository consumoRepository;

    public InventarioService(InsumoRepository insumoRepository,
                             ProductoRepository productoRepository,
                             MovimientoInventarioRepository movimientoRepository,
                             ConsumoServicioRepository consumoRepository) {
        this.insumoRepository = insumoRepository;
        this.productoRepository = productoRepository;
        this.movimientoRepository = movimientoRepository;
        this.consumoRepository = consumoRepository;
    }

    @Transactional(readOnly = true)
    public List<Insumo> getInsumos() {
        return insumoRepository.findByActivoTrueOrderByNombreAsc();
    }

    @Transactional
    public Insumo crearInsumo(Insumo insumo, Usuario usuario) {
        if (insumo.getNombre() == null || insumo.getNombre().isBlank()) {
            throw new BusinessException("El nombre del insumo es obligatorio");
        }
        if (insumo.getCodigo() == null || insumo.getCodigo().isBlank()) {
            insumo.setCodigo("INS-" + System.currentTimeMillis() % 100000);
        }

        Insumo guardado = insumoRepository.save(insumo);

        if (guardado.getExistencias().compareTo(BigDecimal.ZERO) > 0) {
            MovimientoInventario mov = new MovimientoInventario();
            mov.setTipoItem(TipoItem.INSUMO);
            mov.setInsumo(guardado);
            mov.setTipoMovimiento(TipoMovimiento.AJUSTE_MANUAL);
            mov.setCantidadAnterior(BigDecimal.ZERO);
            mov.setCantidadMovimiento(guardado.getExistencias());
            mov.setCantidadResultante(guardado.getExistencias());
            mov.setMotivo("Inventario inicial al crear insumo");
            mov.setUsuario(usuario);
            movimientoRepository.save(mov);
        }

        return guardado;
    }

    @Transactional
    public Insumo registrarEntradaInsumo(Integer id, BigDecimal cantidad, String motivo, Usuario usuario) {
        if (cantidad == null || cantidad.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("La cantidad debe ser mayor a cero");
        }

        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Insumo no encontrado con id: " + id));

        BigDecimal anterior = insumo.getExistencias();
        BigDecimal resultante = anterior.add(cantidad);

        insumo.setExistencias(resultante);
        Insumo actualizado = insumoRepository.save(insumo);

        MovimientoInventario mov = new MovimientoInventario();
        mov.setTipoItem(TipoItem.INSUMO);
        mov.setInsumo(insumo);
        mov.setTipoMovimiento(TipoMovimiento.AJUSTE_MANUAL);
        mov.setCantidadAnterior(anterior);
        mov.setCantidadMovimiento(cantidad);
        mov.setCantidadResultante(resultante);
        mov.setMotivo(motivo != null && !motivo.isBlank() ? motivo : "Entrada manual de insumos");
        mov.setUsuario(usuario);
        movimientoRepository.save(mov);

        return actualizado;
    }

    @Transactional(readOnly = true)
    public List<Producto> getProductos() {
        return productoRepository.findByActivoTrueOrderByNombreAsc();
    }

    @Transactional
    public Producto crearProducto(Producto producto, Usuario usuario) {
        if (producto.getNombre() == null || producto.getNombre().isBlank()) {
            throw new BusinessException("El nombre del producto es obligatorio");
        }
        if (producto.getCodigo() == null || producto.getCodigo().isBlank()) {
            producto.setCodigo("PROD-" + System.currentTimeMillis() % 100000);
        }

        Producto guardado = productoRepository.save(producto);

        if (guardado.getExistencias() > 0) {
            MovimientoInventario mov = new MovimientoInventario();
            mov.setTipoItem(TipoItem.PRODUCTO);
            mov.setProducto(guardado);
            mov.setTipoMovimiento(TipoMovimiento.AJUSTE_MANUAL);
            mov.setCantidadAnterior(BigDecimal.ZERO);
            mov.setCantidadMovimiento(new BigDecimal(guardado.getExistencias()));
            mov.setCantidadResultante(new BigDecimal(guardado.getExistencias()));
            mov.setMotivo("Inventario inicial al crear producto");
            mov.setUsuario(usuario);
            movimientoRepository.save(mov);
        }

        return guardado;
    }

    @Transactional(readOnly = true)
    public List<MovimientoInventario> getMovimientos(String tipo, Integer insumoId, Integer productoId) {
        if (insumoId != null) {
            return movimientoRepository.findByInsumoIdOrderByFechaDesc(insumoId);
        }
        if (productoId != null) {
            return movimientoRepository.findByProductoIdOrderByFechaDesc(productoId);
        }
        if (tipo != null && !tipo.equals("TODOS")) {
            TipoMovimiento tm = TipoMovimiento.valueOf(tipo.toUpperCase());
            return movimientoRepository.findByTipoMovimientoOrderByFechaDesc(tm);
        }
        return movimientoRepository.findAllByOrderByFechaDesc();
    }

    @Transactional(readOnly = true)
    public List<ConsumoServicio> getConsumosPorCliente(Integer clienteId) {
        return consumoRepository.findByClienteIdOrderByFechaDesc(clienteId);
    }

    @Transactional(readOnly = true)
    public List<ConsumoServicio> getConsumosPorInsumo(Integer insumoId) {
        return consumoRepository.findByInsumoIdOrderByFechaDesc(insumoId);
    }
}
