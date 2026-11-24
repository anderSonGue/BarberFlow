package com.barberflow.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pago")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_cita", nullable = false, unique = true)
    private Cita cita;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_profesional", nullable = false)
    private Profesional profesional;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 30)
    private String metodo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 12, scale = 2)
    private BigDecimal descuento = BigDecimal.ZERO;

    @Column(name = "valor_cobrado", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorCobrado;

    @Column(name = "costo_insumos", precision = 12, scale = 2)
    private BigDecimal costoInsumos = BigDecimal.ZERO;

    @Column(name = "base_comisionable", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseComisionable;

    @Column(name = "porcentaje_comision", nullable = false, precision = 5, scale = 2)
    private BigDecimal porcentajeComision;

    @Column(name = "valor_profesional", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorProfesional;

    @Column(name = "valor_establecimiento", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorEstablecimiento;

    @Column(name = "puntos_ganados")
    private Integer puntosGanados = 0;

    @Column(name = "puntos_canjeados")
    private Integer puntosCanjeados = 0;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDateTime fechaPago = LocalDateTime.now();

    public Pago() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Cita getCita() { return cita; }
    public void setCita(Cita cita) { this.cita = cita; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    public Profesional getProfesional() { return profesional; }
    public void setProfesional(Profesional profesional) { this.profesional = profesional; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDescuento() { return descuento; }
    public void setDescuento(BigDecimal descuento) { this.descuento = descuento; }

    public BigDecimal getValorCobrado() { return valorCobrado; }
    public void setValorCobrado(BigDecimal valorCobrado) { this.valorCobrado = valorCobrado; }

    public BigDecimal getCostoInsumos() { return costoInsumos; }
    public void setCostoInsumos(BigDecimal costoInsumos) { this.costoInsumos = costoInsumos; }

    public BigDecimal getBaseComisionable() { return baseComisionable; }
    public void setBaseComisionable(BigDecimal baseComisionable) { this.baseComisionable = baseComisionable; }

    public BigDecimal getPorcentajeComision() { return porcentajeComision; }
    public void setPorcentajeComision(BigDecimal porcentajeComision) { this.porcentajeComision = porcentajeComision; }

    public BigDecimal getValorProfesional() { return valorProfesional; }
    public void setValorProfesional(BigDecimal valorProfesional) { this.valorProfesional = valorProfesional; }

    public BigDecimal getValorEstablecimiento() { return valorEstablecimiento; }
    public void setValorEstablecimiento(BigDecimal valorEstablecimiento) { this.valorEstablecimiento = valorEstablecimiento; }

    public Integer getPuntosGanados() { return puntosGanados; }
    public void setPuntosGanados(Integer puntosGanados) { this.puntosGanados = puntosGanados; }

    public Integer getPuntosCanjeados() { return puntosCanjeados; }
    public void setPuntosCanjeados(Integer puntosCanjeados) { this.puntosCanjeados = puntosCanjeados; }

    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }
}
