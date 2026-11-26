package com.barberflow;

import com.barberflow.domain.entity.*;
import com.barberflow.domain.enums.EstadoCita;
import com.barberflow.domain.enums.Rol;
import com.barberflow.dto.request.CrearCitaRequest;
import com.barberflow.dto.request.LoginRequest;
import com.barberflow.dto.request.RegistrarPagoRequest;
import com.barberflow.dto.response.LoginResponse;
import com.barberflow.exception.BusinessException;
import com.barberflow.exception.InsufficientStockException;
import com.barberflow.repository.*;
import com.barberflow.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BarberflowApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private CitaService citaService;

    @Autowired
    private PagoService pagoService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProfesionalRepository profesionalRepository;

    @Autowired
    private ServicioRepository servicioRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Usuario adminUser;
    private Usuario trabajadorUser;
    private Profesional profesional;
    private Servicio servicio;
    private Insumo insumo;

    @BeforeEach
    void setUp() {
        profesional = new Profesional();
        profesional.setNombre("Barbero Test");
        profesional.setEspecialidad("Cortes");
        profesional.setPorcentajeComision(new BigDecimal("50.00"));
        profesional.setTelefono("3001234567");
        profesional.setActivo(true);
        profesional = profesionalRepository.save(profesional);

        adminUser = new Usuario("Admin Test", "admintest@barberflow.com", passwordEncoder.encode("admin123"),
                Rol.ADMINISTRADOR, null);
        adminUser = usuarioRepository.save(adminUser);

        trabajadorUser = new Usuario("Trabajador Test", "trabajadortest@barberflow.com",
                passwordEncoder.encode("barbero123"), Rol.TRABAJADOR, profesional);
        trabajadorUser = usuarioRepository.save(trabajadorUser);

        insumo = new Insumo();
        insumo.setCodigo("INS-TEST-1");
        insumo.setNombre("Gel Test");
        insumo.setUnidad("ml");
        insumo.setExistencias(new BigDecimal("50.00"));
        insumo.setStockMinimo(new BigDecimal("10.00"));
        insumo.setCostoUnitario(new BigDecimal("100.00"));
        insumo.setActivo(true);
        insumo = insumoRepository.save(insumo);

        servicio = new Servicio();
        servicio.setNombre("Corte Test");
        servicio.setCategoria("Cabello");
        servicio.setDuracionMin(30);
        servicio.setPrecio(new BigDecimal("20000.00"));
        servicio.setActivo(true);

        ServicioInsumo si = new ServicioInsumo(servicio, insumo, new BigDecimal("10.00"));
        servicio.getReceta().add(si);
        servicio = servicioRepository.save(servicio);
    }

    @Test
    @DisplayName("1. Autenticación exitosa genera JWT con rol correspondiente")
    void testLoginExitoso() {
        LoginRequest req = new LoginRequest("admintest@barberflow.com", "admin123");
        LoginResponse resp = authService.login(req);

        assertTrue(resp.isOk());
        assertNotNull(resp.getToken());
        assertEquals("ADMINISTRADOR", resp.getUsuario().get("rol"));
    }

    @Test
    @DisplayName("2. Autenticación con contraseña errónea lanza excepción de negocio")
    void testLoginPasswordInvalido() {
        LoginRequest req = new LoginRequest("admintest@barberflow.com", "clave_invalida");
        assertThrows(BadCredentialsException.class, () -> authService.login(req));
    }

    @Test
    @DisplayName("3. Agendamiento y validación anti-solapamiento de citas")
    void testSolapamientoCitas() {
        String hoy = LocalDate.now().plusDays(2).toString();

        CrearCitaRequest r1 = new CrearCitaRequest();
        r1.setClienteNombre("Cliente A");
        r1.setProfesionalId(profesional.getId());
        r1.setServicioIds(List.of(servicio.getId()));
        r1.setFecha(hoy);
        r1.setHora("10:00");
        citaService.crearCita(r1);

        // Intento de cita que solapa en el mismo horario con el mismo profesional
        CrearCitaRequest r2 = new CrearCitaRequest();
        r2.setClienteNombre("Cliente B");
        r2.setProfesionalId(profesional.getId());
        r2.setServicioIds(List.of(servicio.getId()));
        r2.setFecha(hoy);
        r2.setHora("10:15"); // Cita anterior dura de 10:00 a 10:30

        assertThrows(BusinessException.class, () -> citaService.crearCita(r2));
    }

    @Test
    @DisplayName("4. Regla Inquebrantable: Bloqueo de cobro por stock insuficiente")
    void testBloqueoCobroStockInsuficiente() {
        // Reducimos existencias del insumo a 5 ml cuando la receta exige 10 ml
        insumo.setExistencias(new BigDecimal("5.00"));
        insumoRepository.save(insumo);

        String hoy = LocalDate.now().plusDays(3).toString();
        CrearCitaRequest r = new CrearCitaRequest();
        r.setClienteNombre("Cliente C");
        r.setProfesionalId(profesional.getId());
        r.setServicioIds(List.of(servicio.getId()));
        r.setFecha(hoy);
        r.setHora("11:00");

        Cita cita = citaService.crearCita(r);
        cita = citaService.cambiarEstado(cita.getId(), "EN_ATENCION");

        RegistrarPagoRequest pagoReq = new RegistrarPagoRequest();
        pagoReq.setCitaId(cita.getId());
        pagoReq.setMetodo("EFECTIVO");

        assertThrows(InsufficientStockException.class, () -> pagoService.registrarPago(pagoReq, adminUser));
    }

    @Test
    @DisplayName("5. Liquidación transaccional: Descuento de stock y cálculo matemático de comisiones")
    void testCobroYCalculoComisiones() {
        String hoy = LocalDate.now().plusDays(4).toString();
        CrearCitaRequest r = new CrearCitaRequest();
        r.setClienteNombre("Cliente D");
        r.setProfesionalId(profesional.getId());
        r.setServicioIds(List.of(servicio.getId()));
        r.setFecha(hoy);
        r.setHora("15:00");

        Cita cita = citaService.crearCita(r);
        cita = citaService.cambiarEstado(cita.getId(), "EN_ATENCION");

        BigDecimal stockAntes = insumo.getExistencias(); // 50 ml

        RegistrarPagoRequest pagoReq = new RegistrarPagoRequest();
        pagoReq.setCitaId(cita.getId());
        pagoReq.setMetodo("EFECTIVO");

        Pago pago = pagoService.registrarPago(pagoReq, adminUser);

        // Verificaciones
        assertNotNull(pago);
        assertEquals(EstadoCita.FINALIZADA, pago.getCita().getEstado());

        // Stock descontado: 50 - 10 = 40
        Insumo insumoActual = insumoRepository.findById(insumo.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("40.00").compareTo(insumoActual.getExistencias()));

        // Costo insumos = 10 * 100 = 1000
        assertEquals(0, new BigDecimal("1000.00").compareTo(pago.getCostoInsumos()));

        // Valor cobrado = 20000
        assertEquals(0, new BigDecimal("20000.00").compareTo(pago.getValorCobrado()));

        // Base comisionable = 20000 - 1000 = 19000
        assertEquals(0, new BigDecimal("19000.00").compareTo(pago.getBaseComisionable()));

        // Comisión profesional 50% de 19000 = 9500
        assertEquals(0, new BigDecimal("9500.00").compareTo(pago.getValorProfesional()));

        // Margen establecimiento = 20000 - 9500 = 10500
        assertEquals(0, new BigDecimal("10500.00").compareTo(pago.getValorEstablecimiento()));
    }

    @Test
    @WithMockUser(username = "andres@barberflow.com", roles = {"TRABAJADOR"})
    @DisplayName("6. RBAC Trabajador: Acceso permitido a profesionales, productos para venta y citas")
    void testPermisosTrabajadorModulosPermitidos() throws Exception {
        // Profesionales para Reservar y Ventas
        mockMvc.perform(get("/api/usuarios/profesionales"))
                .andExpect(status().isOk());

        // Catálogo de productos para el módulo de Ventas
        mockMvc.perform(get("/api/inventario/productos"))
                .andExpect(status().isOk());

        // Consulta de citas
        mockMvc.perform(get("/api/citas"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "andres@barberflow.com", roles = {"TRABAJADOR"})
    @DisplayName("7. RBAC Trabajador: Acceso restringido (403 Forbidden) a compras, inventario admin y auditoría")
    void testPermisosTrabajadorModulosRestringidos() throws Exception {
        // Inventario de insumos (Solo Admin)
        mockMvc.perform(get("/api/inventario"))
                .andExpect(status().isForbidden());

        // Compras y proveedores (Solo Admin)
        mockMvc.perform(get("/api/compras"))
                .andExpect(status().isForbidden());

        // Auditoría general (Solo Admin)
        mockMvc.perform(get("/api/historial"))
                .andExpect(status().isForbidden());
    }
}
