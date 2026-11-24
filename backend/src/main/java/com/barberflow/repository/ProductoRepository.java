package com.barberflow.repository;

import com.barberflow.domain.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    List<Producto> findByActivoTrueOrderByNombreAsc();
    Optional<Producto> findByCodigo(String codigo);
}
