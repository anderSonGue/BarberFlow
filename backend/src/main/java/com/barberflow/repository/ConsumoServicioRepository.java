package com.barberflow.repository;

import com.barberflow.domain.entity.ConsumoServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConsumoServicioRepository extends JpaRepository<ConsumoServicio, Integer> {
    List<ConsumoServicio> findAllByOrderByFechaDesc();
    List<ConsumoServicio> findByClienteIdOrderByFechaDesc(Integer clienteId);
    List<ConsumoServicio> findByInsumoIdOrderByFechaDesc(Integer insumoId);
}
