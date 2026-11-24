package com.barberflow.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class CrearCompraRequest {
    @NotNull(message = "El proveedor es obligatorio")
    private Integer proveedorId;

    @NotNull(message = "El número de factura es obligatorio")
    private String numeroFactura;

    private String observaciones;

    @NotEmpty(message = "Debe incluir al menos un ítem en la compra")
    private List<ItemCompraRequest> items;

    public CrearCompraRequest() {}

    public Integer getProveedorId() { return proveedorId; }
    public void setProveedorId(Integer proveedorId) { this.proveedorId = proveedorId; }

    public String getNumeroFactura() { return numeroFactura; }
    public void setNumeroFactura(String numeroFactura) { this.numeroFactura = numeroFactura; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public List<ItemCompraRequest> getItems() { return items; }
    public void setItems(List<ItemCompraRequest> items) { this.items = items; }

    public static class ItemCompraRequest {
        private String tipoItem; // "INSUMO" o "PRODUCTO"
        private Integer itemId; // id del insumo o producto
        private BigDecimal cantidad;
        private BigDecimal costoUnitario;

        public ItemCompraRequest() {}

        public String getTipoItem() { return tipoItem; }
        public void setTipoItem(String tipoItem) { this.tipoItem = tipoItem; }

        public Integer getItemId() { return itemId; }
        public void setItemId(Integer itemId) { this.itemId = itemId; }

        public BigDecimal getCantidad() { return cantidad; }
        public void setCantidad(BigDecimal cantidad) { this.cantidad = cantidad; }

        public BigDecimal getCostoUnitario() { return costoUnitario; }
        public void setCostoUnitario(BigDecimal costoUnitario) { this.costoUnitario = costoUnitario; }
    }
}
