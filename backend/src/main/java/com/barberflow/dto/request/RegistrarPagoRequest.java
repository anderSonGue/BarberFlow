package com.barberflow.dto.request;

import jakarta.validation.constraints.NotNull;

public class RegistrarPagoRequest {
    @NotNull(message = "El identificador de cita es obligatorio")
    private Integer citaId;

    private String metodo;
    private String codigoPromo;
    private Boolean canjearPuntos;

    public RegistrarPagoRequest() {}

    public Integer getCitaId() { return citaId; }
    public void setCitaId(Integer citaId) { this.citaId = citaId; }

    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }

    public String getCodigoPromo() { return codigoPromo; }
    public void setCodigoPromo(String codigoPromo) { this.codigoPromo = codigoPromo; }

    public Boolean getCanjearPuntos() { return canjearPuntos; }
    public void setCanjearPuntos(Boolean canjearPuntos) { this.canjearPuntos = canjearPuntos; }
}
