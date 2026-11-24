package com.barberflow.repository;

import com.barberflow.domain.entity.Comision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComisionRepository extends JpaRepository<Comision, Integer> {
    List<Comision> findAllByOrderByFechaDesc();
    List<Comision> findByProfesionalIdOrderByFechaDesc(Integer profesionalId);
}
