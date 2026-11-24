package com.barberflow.repository;

import com.barberflow.domain.entity.Profesional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProfesionalRepository extends JpaRepository<Profesional, Integer> {
    List<Profesional> findByActivoTrue();
}
