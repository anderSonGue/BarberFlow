package com.barberflow.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CrearCitaRequest {
    @NotNull(message = "El nombre del cliente es obligatorio")
    private String clienteNombre;

    private String clienteTelefono;
    private String clienteEmail;

    @NotNull(message = "El profesional es obligatorio")
    private Integer profesionalId;

    @NotEmpty(message = "Debe seleccionar al menos un servicio")
    private List<Integer> servicioIds;

    @NotNull(message = "La fecha es obligatoria (YYYY-MM-DD)")
    private String fecha;

    @NotNull(message = "La hora es obligatoria (HH:mm)")
    private String hora;

    private String notas;

    public CrearCitaRequest() {}

    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }

    public String getClienteTelefono() { return clienteTelefono; }
    public void setClienteTelefono(String clienteTelefono) { this.clienteTelefono = clienteTelefono; }

    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }

    public Integer getProfesionalId() { return profesionalId; }
    public void setProfesionalId(Integer profesionalId) { this.profesionalId = profesionalId; }

    public List<Integer> getServicioIds() { return servicioIds; }
    public void setServicioIds(List<Integer> servicioIds) { this.servicioIds = servicioIds; }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }

    public String getHora() { return hora; }
    public void setHora(String hora) { this.hora = hora; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
}
