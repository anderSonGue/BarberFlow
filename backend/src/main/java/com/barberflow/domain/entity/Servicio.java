package com.barberflow.domain.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "servicio")
public class Servicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(nullable = false, length = 60)
    private String categoria;

    @Column(name = "duracion_min", nullable = false)
    private Integer duracionMin;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "servicio", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ServicioInsumo> receta = new ArrayList<>();

    @Column(name = "creado_en", insertable = false, updatable = false)
    private LocalDateTime creadoEn;

    public Servicio() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public Integer getDuracionMin() { return duracionMin; }
    public void setDuracionMin(Integer duracionMin) { this.duracionMin = duracionMin; }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public List<ServicioInsumo> getReceta() { return receta; }
    public void setReceta(List<ServicioInsumo> receta) { this.receta = receta; }

    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }
}
