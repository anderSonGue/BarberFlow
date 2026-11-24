package com.barberflow.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "servicio_insumo")
public class ServicioInsumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_servicio", nullable = false)
    private Servicio servicio;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_insumo", nullable = false)
    private Insumo insumo;

    @Column(name = "cantidad_requerida", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadRequerida;

    public ServicioInsumo() {}

    public ServicioInsumo(Servicio servicio, Insumo insumo, BigDecimal cantidadRequerida) {
        this.servicio = servicio;
        this.insumo = insumo;
        this.cantidadRequerida = cantidadRequerida;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Servicio getServicio() { return servicio; }
    public void setServicio(Servicio servicio) { this.servicio = servicio; }

    public Insumo getInsumo() { return insumo; }
    public void setInsumo(Insumo insumo) { this.insumo = insumo; }

    public BigDecimal getCantidadRequerida() { return cantidadRequerida; }
    public void setCantidadRequerida(BigDecimal cantidadRequerida) { this.cantidadRequerida = cantidadRequerida; }
}
