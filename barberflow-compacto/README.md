# BarberFlow - Sistema Integral de Registros de Barbería

Sistema web completo para la gestión y registro operativo de barberías (React + Vite + MockAPI / Base de datos local resiliente).
Implementa el ciclo operativo completo: **Reserva de turnos → Agenda de barberos → Cobro y comisiones → Control de inventario → Fidelización de clientes → Panel administrativo**.

---

## 🚀 Cómo ejecutar el proyecto

Puedes ejecutar el proyecto desde la raíz del espacio de trabajo o dentro de la carpeta `barberflow`:

```bash
# Iniciar en modo desarrollo
npm run dev

# Compilar para producción
npm run build
```

El servidor local se abrirá en `http://localhost:5173`.

---

## 🔗 Integración con MockAPI

El sistema está configurado y conectado al proyecto MockAPI:
- **Proyecto MockAPI:** `https://mockapi.io/projects/6aae920c606bd915d110eac1`
- **Endpoint Base:** `https://6aae920c606bd915d110eac1.mockapi.io/citas`

### Características de Conexión:
- **Sincronización bidireccional:** Intenta registrar y sincronizar citas directamente con MockAPI vía llamadas REST (`POST`, `PUT`, `DELETE`, `GET`).
- **Modo Resiliente / Offline-first:** Si la API remota aún no tiene el recurso creado (error 404) o no hay conexión a internet, la aplicación conmuta automáticamente a almacenamiento local persistente (`localStorage`), garantizando que la barbería nunca se quede sin registrar clientes.
- **Herramienta de Diagnóstico en Panel:** En la pestaña **Panel y Base de Datos** dispones de un botón para probar la conectividad en tiempo real y sincronizar registros.

---

## 📋 Módulos del Sistema de Barbería

1. **Reservar cita (Registro de Citas):**
   - Selección múltiple de servicios con cálculo dinámico de precio y tiempo.
   - Selección de barbero y especialidad.
   - Selección de fecha y franjas horarias libres según disponibilidad real anti-solapamiento.
   - Registro de datos del cliente (nombre, teléfono de contacto y notas del corte).
   - Acumulación estimada de puntos de fidelización.

2. **Agenda y Registros Diarios:**
   - Vista por barbero individual o vista general de todos los barberos.
   - Filtros rápidos por estado (`PROGRAMADA`, `CONFIRMADA`, `EN_ATENCION`, `FINALIZADA`, `CANCELADA`).
   - Búsqueda en tiempo real por nombre de cliente, teléfono o servicio.
   - Enlace directo a llamada telefónica del cliente.
   - Transiciones rápidas de estado y acceso directo al cobro.

3. **Caja y Facturación:**
   - Cobro de citas en atención.
   - Medios de pago: Efectivo, Tarjeta, Transferencia, Nequi / Daviplata.
   - Cupones promocionales (`BARBA10`, `FLOW20`, `CLIENTE_VIP`).
   - Canje de puntos de fidelización por descuento monetario directo.
   - Descuento automático de existencias de insumos según la receta del servicio.
   - Liquidación automática de comisiones para barberos e ingreso neto para la barbería.
   - Comprobante / recibo digital detallado.

4. **Inventario:**
   - Monitoreo de stock actual, stock mínimo y costo unitario.
   - Alertas visuales de stock bajo y agotado.
   - Registro rápido de entradas de reabastecimiento.
   - Formulario para agregar nuevos insumos/productos.

5. **Panel y Base de Datos:**
   - Indicadores clave (KPIs) en tiempo real: citas hoy, ingresos brutos, utilidad barbería, alertas de insumos.
   - Diagnóstico y estado de la conexión a MockAPI (`https://mockapi.io/projects/6aae920c606bd915d110eac1`).
   - Distribución gráfica de comisiones y rendimiento por barbero.
   - Padrón de clientes fidelizados.
   - Respaldo / Exportación completa de base de datos a formato JSON.
