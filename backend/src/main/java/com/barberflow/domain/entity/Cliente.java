package com.barberflow.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cliente")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 20)
    private String telefono;

    @Column(length = 120)
    private String email;

    @Column(nullable = false)
    private Integer visitas = 1;

    @Column(nullable = false)
    private Integer puntos = 0;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private LocalDateTime creadoEn;

    public Cliente() {}

    public Cliente(String nombre, String telefono, String email, String notas) {
        this.nombre = nombre;
        this.telefono = telefono;
        this.email = email;
        this.notas = notas;
        this.visitas = 1;
        this.puntos = 0;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getVisitas() { return visitas; }
    public void setVisitas(Integer visitas) { this.visitas = visitas; }

    public Integer getPuntos() { return puntos; }
    public void setPuntos(Integer puntos) { this.puntos = puntos; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }

    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }
}
