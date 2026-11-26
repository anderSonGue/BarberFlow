package com.barberflow.service;

import com.barberflow.domain.entity.Usuario;
import com.barberflow.dto.request.LoginRequest;
import com.barberflow.dto.response.LoginResponse;
import com.barberflow.exception.BusinessException;
import com.barberflow.repository.UsuarioRepository;
import com.barberflow.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas."));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new BusinessException("Su cuenta ha sido desactivada. Comuníquese con el administrador.");
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
            throw new BadCredentialsException("Credenciales inválidas.");
        }

        String token = tokenProvider.generarToken(usuario.getEmail(), usuario.getRol().name(), usuario.getId());

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", usuario.getId());
        userInfo.put("nombre", usuario.getNombre());
        userInfo.put("email", usuario.getEmail());
        userInfo.put("rol", usuario.getRol().name());
        if (usuario.getProfesional() != null) {
            userInfo.put("profesionalId", usuario.getProfesional().getId());
            userInfo.put("profesionalNombre", usuario.getProfesional().getNombre());
        }

        return new LoginResponse(true, token, userInfo);
    }

    @Transactional(readOnly = true)
    public Usuario obtenerUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado: " + email));
    }
}
