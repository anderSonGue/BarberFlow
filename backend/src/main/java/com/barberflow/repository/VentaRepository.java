package com.barberflow.repository;

import com.barberflow.domain.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Integer> {
    List<Venta> findAllByOrderByFechaDesc();
    List<Venta> findByProfesionalIdOrderByFechaDesc(Integer profesionalId);
}
