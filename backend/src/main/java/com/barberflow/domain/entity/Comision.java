package com.barberflow.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "comision")
public class Comision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pago_id", nullable = false, unique = true)
    private Pago pago;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "profesional_id", nullable = false)
    private Profesional profesional;

    @Column(name = "base_comisionable", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseComisionable;

    @Column(name = "porcentaje_aplicado", nullable = false, precision = 5, scale = 2)
    private BigDecimal porcentajeAplicado;

    @Column(name = "valor_comision", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorComision;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean pagada = false;

    public Comision() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Pago getPago() { return pago; }
    public void setPago(Pago pago) { this.pago = pago; }

    public Profesional getProfesional() { return profesional; }
    public void setProfesional(Profesional profesional) { this.profesional = profesional; }

    public BigDecimal getBaseComisionable() { return baseComisionable; }
    public void setBaseComisionable(BigDecimal baseComisionable) { this.baseComisionable = baseComisionable; }

    public BigDecimal getPorcentajeAplicado() { return porcentajeAplicado; }
    public void setPorcentajeAplicado(BigDecimal porcentajeAplicado) { this.porcentajeAplicado = porcentajeAplicado; }

    public BigDecimal getValorComision() { return valorComision; }
    public void setValorComision(BigDecimal valorComision) { this.valorComision = valorComision; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public Boolean getPagada() { return pagada; }
    public void setPagada(Boolean pagada) { this.pagada = pagada; }
}
