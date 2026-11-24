package com.barberflow.dto.response;

import java.util.Map;

public class LoginResponse {
    private boolean ok;
    private String token;
    private Map<String, Object> usuario;

    public LoginResponse() {}

    public LoginResponse(boolean ok, String token, Map<String, Object> usuario) {
        this.ok = ok;
        this.token = token;
        this.usuario = usuario;
    }

    public boolean isOk() { return ok; }
    public void setOk(boolean ok) { this.ok = ok; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Map<String, Object> getUsuario() { return usuario; }
    public void setUsuario(Map<String, Object> usuario) { this.usuario = usuario; }
}
