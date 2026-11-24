package com.barberflow.domain.entity;

import com.barberflow.domain.enums.TipoItem;
import com.barberflow.domain.enums.TipoMovimiento;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimiento_inventario")
public class MovimientoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_item", nullable = false, length = 20)
    private TipoItem tipoItem;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "insumo_id")
    private Insumo insumo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movimiento", nullable = false, length = 30)
    private TipoMovimiento tipoMovimiento;

    @Column(name = "cantidad_anterior", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadAnterior;

    @Column(name = "cantidad_movimiento", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadMovimiento;

    @Column(name = "cantidad_resultante", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadResultante;

    @Column(nullable = false, length = 255)
    private String motivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cita_id")
    private Cita cita;

    @Column(name = "compra_id")
    private Integer compraId;

    @Column(name = "venta_id")
    private Integer ventaId;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    public MovimientoInventario() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public TipoItem getTipoItem() { return tipoItem; }
    public void setTipoItem(TipoItem tipoItem) { this.tipoItem = tipoItem; }

    public Insumo getInsumo() { return insumo; }
    public void setInsumo(Insumo insumo) { this.insumo = insumo; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public TipoMovimiento getTipoMovimiento() { return tipoMovimiento; }
    public void setTipoMovimiento(TipoMovimiento tipoMovimiento) { this.tipoMovimiento = tipoMovimiento; }

    public BigDecimal getCantidadAnterior() { return cantidadAnterior; }
    public void setCantidadAnterior(BigDecimal cantidadAnterior) { this.cantidadAnterior = cantidadAnterior; }

    public BigDecimal getCantidadMovimiento() { return cantidadMovimiento; }
    public void setCantidadMovimiento(BigDecimal cantidadMovimiento) { this.cantidadMovimiento = cantidadMovimiento; }

    public BigDecimal getCantidadResultante() { return cantidadResultante; }
    public void setCantidadResultante(BigDecimal cantidadResultante) { this.cantidadResultante = cantidadResultante; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    public Cita getCita() { return cita; }
    public void setCita(Cita cita) { this.cita = cita; }

    public Integer getCompraId() { return compraId; }
    public void setCompraId(Integer compraId) { this.compraId = compraId; }

    public Integer getVentaId() { return ventaId; }
    public void setVentaId(Integer ventaId) { this.ventaId = ventaId; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
