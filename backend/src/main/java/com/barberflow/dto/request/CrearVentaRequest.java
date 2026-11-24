package com.barberflow.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class CrearVentaRequest {
    private Integer clienteId;
    private Integer profesionalId;
    private String metodoPago;
    private BigDecimal descuento;

    @NotEmpty(message = "Debe incluir al menos un producto a vender")
    private List<ItemVentaRequest> items;

    public CrearVentaRequest() {}

    public Integer getClienteId() { return clienteId; }
    public void setClienteId(Integer clienteId) { this.clienteId = clienteId; }

    public Integer getProfesionalId() { return profesionalId; }
    public void setProfesionalId(Integer profesionalId) { this.profesionalId = profesionalId; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public BigDecimal getDescuento() { return descuento; }
    public void setDescuento(BigDecimal descuento) { this.descuento = descuento; }

    public List<ItemVentaRequest> getItems() { return items; }
    public void setItems(List<ItemVentaRequest> items) { this.items = items; }

    public static class ItemVentaRequest {
        @NotNull(message = "El producto es obligatorio")
        private Integer productoId;

        @NotNull(message = "La cantidad es obligatoria")
        private Integer cantidad;

        public ItemVentaRequest() {}

        public Integer getProductoId() { return productoId; }
        public void setProductoId(Integer productoId) { this.productoId = productoId; }

        public Integer getCantidad() { return cantidad; }
        public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    }
}
