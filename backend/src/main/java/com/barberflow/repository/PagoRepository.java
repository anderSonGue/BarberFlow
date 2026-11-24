package com.barberflow.repository;

import com.barberflow.domain.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Integer> {
    List<Pago> findAllByOrderByFechaPagoDesc();
    List<Pago> findByProfesionalIdOrderByFechaPagoDesc(Integer profesionalId);
    Optional<Pago> findByCitaId(Integer citaId);
}
