package com.barberflow.dto.response;

import java.math.BigDecimal;
import java.util.List;

public class ReporteFinancieroResponse {
    private BigDecimal totalIngresos;
    private BigDecimal totalComisiones;
    private BigDecimal totalUtilidad;
    private BigDecimal totalCostoInsumos;
    private int cantidadVentas;
    private List<RendimientoProfesional> porProfesional;

    public ReporteFinancieroResponse() {}

    public ReporteFinancieroResponse(BigDecimal totalIngresos, BigDecimal totalComisiones, BigDecimal totalUtilidad, BigDecimal totalCostoInsumos, int cantidadVentas, List<RendimientoProfesional> porProfesional) {
        this.totalIngresos = totalIngresos;
        this.totalComisiones = totalComisiones;
        this.totalUtilidad = totalUtilidad;
        this.totalCostoInsumos = totalCostoInsumos;
        this.cantidadVentas = cantidadVentas;
        this.porProfesional = porProfesional;
    }

    public BigDecimal getTotalIngresos() { return totalIngresos; }
    public void setTotalIngresos(BigDecimal totalIngresos) { this.totalIngresos = totalIngresos; }

    public BigDecimal getTotalComisiones() { return totalComisiones; }
    public void setTotalComisiones(BigDecimal totalComisiones) { this.totalComisiones = totalComisiones; }

    public BigDecimal getTotalUtilidad() { return totalUtilidad; }
    public void setTotalUtilidad(BigDecimal totalUtilidad) { this.totalUtilidad = totalUtilidad; }

    public BigDecimal getTotalCostoInsumos() { return totalCostoInsumos; }
    public void setTotalCostoInsumos(BigDecimal totalCostoInsumos) { this.totalCostoInsumos = totalCostoInsumos; }

    public int getCantidadVentas() { return cantidadVentas; }
    public void setCantidadVentas(int cantidadVentas) { this.cantidadVentas = cantidadVentas; }

    public List<RendimientoProfesional> getPorProfesional() { return porProfesional; }
    public void setPorProfesional(List<RendimientoProfesional> porProfesional) { this.porProfesional = porProfesional; }

    public static class RendimientoProfesional {
        private Integer id;
        private String nombre;
        private BigDecimal totalVentas;
        private BigDecimal totalComision;
        private int serviciosRealizados;

        public RendimientoProfesional() {}

        public RendimientoProfesional(Integer id, String nombre, BigDecimal totalVentas, BigDecimal totalComision, int serviciosRealizados) {
            this.id = id;
            this.nombre = nombre;
            this.totalVentas = totalVentas;
            this.totalComision = totalComision;
            this.serviciosRealizados = serviciosRealizados;
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }

        public BigDecimal getTotalVentas() { return totalVentas; }
        public void setTotalVentas(BigDecimal totalVentas) { this.totalVentas = totalVentas; }

        public BigDecimal getTotalComision() { return totalComision; }
        public void setTotalComision(BigDecimal totalComision) { this.totalComision = totalComision; }

        public int getServiciosRealizados() { return serviciosRealizados; }
        public void setServiciosRealizados(int serviciosRealizados) { this.serviciosRealizados = serviciosRealizados; }
    }
}
