package com.barberflow.repository;

import com.barberflow.domain.entity.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InsumoRepository extends JpaRepository<Insumo, Integer> {
    List<Insumo> findByActivoTrueOrderByNombreAsc();
    Optional<Insumo> findByCodigo(String codigo);
}
