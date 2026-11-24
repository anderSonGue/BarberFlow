package com.barberflow.repository;

import com.barberflow.domain.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
    Optional<Cliente> findByNombreIgnoreCase(String nombre);
    List<Cliente> findByNombreContainingIgnoreCaseOrTelefonoContaining(String nombre, String telefono);
    List<Cliente> findAllByOrderByVisitasDesc();
}
