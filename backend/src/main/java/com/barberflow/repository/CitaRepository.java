package com.barberflow.repository;

import com.barberflow.domain.entity.Cita;
import com.barberflow.domain.enums.EstadoCita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Integer> {

    List<Cita> findAllByOrderByFechaHoraInicioAsc();

    @Query("SELECT c FROM Cita c WHERE c.fechaHoraInicio >= :inicio AND c.fechaHoraInicio < :fin ORDER BY c.fechaHoraInicio ASC")
    List<Cita> findByRangoFechas(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("SELECT c FROM Cita c WHERE c.profesional.id = :profId AND c.fechaHoraInicio >= :inicio AND c.fechaHoraInicio < :fin AND c.estado NOT IN ('CANCELADA', 'NO_ASISTIO')")
    List<Cita> findOcupadasProfesionalFecha(
            @Param("profId") Integer profId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT c FROM Cita c WHERE c.profesional.id = :profId " +
           "AND c.estado NOT IN ('CANCELADA', 'NO_ASISTIO') " +
           "AND (:inicio < c.fechaHoraFin AND :fin > c.fechaHoraInicio)")
    List<Cita> findSolapadas(
            @Param("profId") Integer profId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    List<Cita> findByEstado(EstadoCita estado);
}
