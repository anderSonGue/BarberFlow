# BarberFlow — Sistema Profesional de Gestión de Barberías

Software profesional de gestión operativa y administrativa para barberías. Desarrollado bajo una arquitectura robusta cliente-servidor con persistencia relacional, control de acceso basado en roles (RBAC), control estricto de existencias con bloqueo atómico y trazabilidad completa de inventario.

---

##  Arquitectura del Sistema

* **Frontend:** React 18 + Vite 5 (SPA moderna, componentes modulares, diseño minimalista sin emojis ni elementos decorativos innecesarios).
* **Backend:** Node.js + Express (API RESTful estructurada en controladores, rutas y middlewares de autorización).
* **Base de Datos Relacional:** SQLite local nativo (`server/prisma/dev.db`) con **Prisma ORM**, 100% compatible y listo para conectar en **DBeaver** o migrar a **PostgreSQL**.
* **Seguridad:** Cifrado de contraseñas con **Bcrypt**, autenticación sin estado mediante **JSON Web Tokens (JWT)** y control de acceso por roles (**RBAC**) verificado en cada endpoint del backend.

---

##  Credenciales de Acceso y Roles

El sistema implementa dos roles principales con segregación estricta de permisos:

| Rol | Usuario / Correo | Contraseña | Permisos y Restricciones |
| :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** | `admin@barberflow.com` | `admin123` | **Acceso Total:** Citas, gestión de trabajadores, inventario, entradas de insumos, historial de movimientos y auditoría por cliente, reportes financieros y comisiones globales. |
| **TRABAJADOR** | `andres@barberflow.com` | `barbero123` | **Acceso Operativo:** Agendar citas, agenda del día, iniciar atención y cobro en caja, **solo consulta sus propias ventas y comisiones**. *Restricción estricta en frontend y backend (403 Forbidden) para inventario y finanzas ajenas.* |
| **TRABAJADOR** | `camilo@barberflow.com` | `barbero123` | Perfil vinculado a Camilo Pérez (Barba y afeitado tradicional). |
| **TRABAJADOR** | `sara@barberflow.com` | `barbero123` | Perfil vinculado a Sara Molina (Diseños y estilos modernos). |

---

##  Puesta en Marcha

### 1. Iniciar el Backend (Servidor API REST)
En una terminal en la raíz del proyecto:
```bash
npm run server
```
El servidor backend iniciará en `http://localhost:4000`.

### 2. Iniciar el Frontend (Interfaz Web)
En otra terminal en la raíz del proyecto:
```bash
npm run dev
```
La aplicación web se abrirá en `http://localhost:5173`.

### 3. Ejecutar la Suite de Pruebas Automatizadas
Verifica los 8 puntos críticos de seguridad, RBAC, bloqueo atómico por stock insuficiente y liquidación de comisiones:
```bash
npm --prefix server test
```

---

##  Conexión con DBeaver

Puedes inspeccionar y consultar toda la base de datos relacional directamente desde **DBeaver**:

1. Abre **DBeaver**.
2. Haz clic en **Nueva conexión** y selecciona **SQLite**.
3. En la ruta del archivo de base de datos, navega y selecciona:
   `server/prisma/dev.db`
4. Haz clic en **Probar conexión** y luego en **Finalizar**.
5. Podrás visualizar todas las tablas relacionales (`User`, `Profesional`, `Cliente`, `Servicio`, `Insumo`, `Cita`, `Pago`, `MovimientoInventario`, `ConsumoServicio`), sus claves foráneas, datos y ejecutar consultas SQL directamente.

---

##  Sistema de Inventario y Regla Inquebrantable

1. **Relación Operativa:**
   `Cliente ➔ Cita ➔ Servicio ➔ Consumo de insumos según Receta ➔ Movimiento de Inventario.`
2. **Regla de Bloqueo Atómico:**
   Si un servicio requiere insumos y las existencias actuales son inferiores a lo solicitado, la transacción de base de datos se cancela automáticamente en el backend, impidiendo registrar el cobro y evitando que el stock se torne negativo.
3. **Trazabilidad Permanente:**
   En la pestaña **Trazabilidad Insumos** (exclusiva del Administrador) es posible:
   - Auditar cada movimiento de entrada, salida por servicio o ajuste.
   - Consultar el **Historial de Consumo por Cliente** (qué productos se usaron, cantidad, costo, fecha y qué barbero los aplicó).
   - Consultar el **Uso por Insumo** (en qué clientes y servicios fue consumido un producto específico).
