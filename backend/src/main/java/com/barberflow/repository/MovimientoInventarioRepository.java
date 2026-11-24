package com.barberflow.repository;

import com.barberflow.domain.entity.MovimientoInventario;
import com.barberflow.domain.enums.TipoMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Integer> {
    List<MovimientoInventario> findAllByOrderByFechaDesc();
    List<MovimientoInventario> findByTipoMovimientoOrderByFechaDesc(TipoMovimiento tipoMovimiento);
    List<MovimientoInventario> findByInsumoIdOrderByFechaDesc(Integer insumoId);
    List<MovimientoInventario> findByProductoIdOrderByFechaDesc(Integer productoId);
}
