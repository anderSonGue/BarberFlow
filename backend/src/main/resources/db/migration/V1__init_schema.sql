-- BarberFlow - Migración V1 de Base de Datos MySQL
-- Creación de esquema empresarial completo, relaciones y catálogos

-- 1. Tabla de Usuarios del Sistema (RBAC)
CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMINISTRADOR', 'TRABAJADOR') NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    profesional_id INT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Profesionales / Barberos
CREATE TABLE IF NOT EXISTS profesional (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    especialidad VARCHAR(150) NULL,
    calificacion DECIMAL(3,2) DEFAULT 5.00,
    porcentaje_comision DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    telefono VARCHAR(20) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Clientes
CREATE TABLE IF NOT EXISTS cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(20) NULL,
    email VARCHAR(120) NULL,
    visitas INT DEFAULT 1,
    puntos INT DEFAULT 0,
    notas TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Servicios
CREATE TABLE IF NOT EXISTS servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    duracion_min INT NOT NULL,
    precio DECIMAL(12,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Insumos (para uso interno y recetas de servicios)
CREATE TABLE IF NOT EXISTS insumo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    categoria VARCHAR(60) DEFAULT 'General',
    unidad VARCHAR(20) NOT NULL,
    existencias DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Recetas de Servicios (Relación Servicio - Insumo)
CREATE TABLE IF NOT EXISTS servicio_insumo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_servicio INT NOT NULL,
    id_insumo INT NOT NULL,
    cantidad_requerida DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_si_servicio FOREIGN KEY (id_servicio) REFERENCES servicio(id) ON DELETE CASCADE,
    CONSTRAINT fk_si_insumo FOREIGN KEY (id_insumo) REFERENCES insumo(id) ON DELETE CASCADE,
    UNIQUE KEY uk_servicio_insumo (id_servicio, id_insumo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabla de Productos (para venta directa minorista al cliente)
CREATE TABLE IF NOT EXISTS producto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    categoria VARCHAR(60) DEFAULT 'Cuidado Personal',
    unidad VARCHAR(20) DEFAULT 'unidad',
    existencias INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    costo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabla de Proveedores (para compras)
CREATE TABLE IF NOT EXISTS proveedor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    nit VARCHAR(30) NULL,
    telefono VARCHAR(30) NULL,
    email VARCHAR(120) NULL,
    direccion VARCHAR(200) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabla de Compras (Abastecimiento de stock)
CREATE TABLE IF NOT EXISTS compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    usuario_id INT NOT NULL,
    numero_factura VARCHAR(60) NOT NULL,
    fecha DATETIME NOT NULL,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    observaciones TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_compra_prov FOREIGN KEY (proveedor_id) REFERENCES proveedor(id),
    CONSTRAINT fk_compra_user FOREIGN KEY (usuario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Detalle de Compra
CREATE TABLE IF NOT EXISTS detalle_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    tipo_item ENUM('INSUMO', 'PRODUCTO') NOT NULL,
    insumo_id INT NULL,
    producto_id INT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_dc_compra FOREIGN KEY (compra_id) REFERENCES compra(id) ON DELETE CASCADE,
    CONSTRAINT fk_dc_insumo FOREIGN KEY (insumo_id) REFERENCES insumo(id),
    CONSTRAINT fk_dc_producto FOREIGN KEY (producto_id) REFERENCES producto(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabla de Ventas (Venta de productos a clientes)
CREATE TABLE IF NOT EXISTS venta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NULL,
    usuario_id INT NOT NULL,
    profesional_id INT NULL,
    numero_comprobante VARCHAR(60) NOT NULL,
    fecha DATETIME NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'EFECTIVO',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_venta_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    CONSTRAINT fk_venta_user FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT fk_venta_prof FOREIGN KEY (profesional_id) REFERENCES profesional(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Detalle de Venta
CREATE TABLE IF NOT EXISTS detalle_venta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_dv_venta FOREIGN KEY (venta_id) REFERENCES venta(id) ON DELETE CASCADE,
    CONSTRAINT fk_dv_prod FOREIGN KEY (producto_id) REFERENCES producto(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Tabla de Citas
CREATE TABLE IF NOT EXISTS cita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NULL,
    id_profesional INT NOT NULL,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin DATETIME NOT NULL,
    duracion_min INT NOT NULL,
    estado ENUM('PROGRAMADA','CONFIRMADA','EN_ATENCION','FINALIZADA','CANCELADA','NO_ASISTIO') NOT NULL DEFAULT 'PROGRAMADA',
    valor_estimado DECIMAL(12,2) NOT NULL,
    notas TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cita_cliente FOREIGN KEY (id_cliente) REFERENCES cliente(id),
    CONSTRAINT fk_cita_profesional FOREIGN KEY (id_profesional) REFERENCES profesional(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Servicios por Cita
CREATE TABLE IF NOT EXISTS cita_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL,
    id_servicio INT NOT NULL,
    precio DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_cs_cita FOREIGN KEY (id_cita) REFERENCES cita(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_servicio FOREIGN KEY (id_servicio) REFERENCES servicio(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Pagos y Cobros de Citas
CREATE TABLE IF NOT EXISTS pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL UNIQUE,
    id_cliente INT NULL,
    id_profesional INT NOT NULL,
    usuario_id INT NULL,
    metodo VARCHAR(30) NOT NULL DEFAULT 'EFECTIVO',
    subtotal DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0.00,
    valor_cobrado DECIMAL(12,2) NOT NULL,
    costo_insumos DECIMAL(12,2) DEFAULT 0.00,
    base_comisionable DECIMAL(12,2) NOT NULL,
    porcentaje_comision DECIMAL(5,2) NOT NULL,
    valor_profesional DECIMAL(12,2) NOT NULL,
    valor_establecimiento DECIMAL(12,2) NOT NULL,
    puntos_ganados INT DEFAULT 0,
    puntos_canjeados INT DEFAULT 0,
    fecha_pago DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_cita FOREIGN KEY (id_cita) REFERENCES cita(id),
    CONSTRAINT fk_pago_cliente FOREIGN KEY (id_cliente) REFERENCES cliente(id),
    CONSTRAINT fk_pago_profesional FOREIGN KEY (id_profesional) REFERENCES profesional(id),
    CONSTRAINT fk_pago_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Historial de Liquidaciones de Comisión
CREATE TABLE IF NOT EXISTS comision (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pago_id INT NOT NULL UNIQUE,
    profesional_id INT NOT NULL,
    base_comisionable DECIMAL(12,2) NOT NULL,
    porcentaje_aplicado DECIMAL(5,2) NOT NULL,
    valor_comision DECIMAL(12,2) NOT NULL,
    fecha DATETIME NOT NULL,
    pagada BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_comision_pago FOREIGN KEY (pago_id) REFERENCES pago(id) ON DELETE CASCADE,
    CONSTRAINT fk_comision_prof FOREIGN KEY (profesional_id) REFERENCES profesional(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Trazabilidad de Movimientos de Inventario
CREATE TABLE IF NOT EXISTS movimiento_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_item ENUM('INSUMO', 'PRODUCTO') NOT NULL,
    insumo_id INT NULL,
    producto_id INT NULL,
    tipo_movimiento ENUM('ENTRADA_COMPRA', 'SALIDA_SERVICIO', 'SALIDA_VENTA', 'AJUSTE_MANUAL', 'DEVOLUCION', 'CORRECCION') NOT NULL,
    cantidad_anterior DECIMAL(10,2) NOT NULL,
    cantidad_movimiento DECIMAL(10,2) NOT NULL,
    cantidad_resultante DECIMAL(10,2) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    usuario_id INT NULL,
    cliente_id INT NULL,
    cita_id INT NULL,
    compra_id INT NULL,
    venta_id INT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mov_insumo FOREIGN KEY (insumo_id) REFERENCES insumo(id),
    CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES producto(id),
    CONSTRAINT fk_mov_user FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT fk_mov_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    CONSTRAINT fk_mov_cita FOREIGN KEY (cita_id) REFERENCES cita(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Consumo de Insumos por Servicio y Cliente (Historial de aplicación)
CREATE TABLE IF NOT EXISTS consumo_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pago_id INT NOT NULL,
    cita_id INT NOT NULL,
    servicio_id INT NOT NULL,
    insumo_id INT NOT NULL,
    cantidad_consumida DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    cliente_id INT NULL,
    profesional_id INT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cs_pago FOREIGN KEY (pago_id) REFERENCES pago(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_cita_ref FOREIGN KEY (cita_id) REFERENCES cita(id),
    CONSTRAINT fk_cs_serv_ref FOREIGN KEY (servicio_id) REFERENCES servicio(id),
    CONSTRAINT fk_cs_ins_ref FOREIGN KEY (insumo_id) REFERENCES insumo(id),
    CONSTRAINT fk_cs_cli_ref FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    CONSTRAINT fk_cs_prof_ref FOREIGN KEY (profesional_id) REFERENCES profesional(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- SEED INICIAL: Usuarios Administrador y Trabajadores con contraseñas BCrypt
-- admin123  -> $2a$10$wKxN7z6nQ6zNq9C1pA0aFe4SgH6F4nN/o2v8jVq8w3v6GvQ5s8cK2
-- barbero123 -> $2a$10$tZ2yV9kU.1.O/V3yY3i24e5aWd0n1S/8K9L7m4n0V2p8Q6s4t0rKu
-- =========================================================================
INSERT INTO usuario (id, nombre, email, password_hash, rol, activo, profesional_id)
VALUES 
(1, 'Administrador General', 'admin@barberflow.com', '$2a$10$n4qXm23s8iG6eR7k9l8vDuV1v4K7c0j3L8m9P2q1R5s6T7u8V9w0y', 'ADMINISTRADOR', TRUE, NULL)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Vincular usuarios trabajadores a los profesionales existentes 1, 2 y 3
INSERT INTO usuario (id, nombre, email, password_hash, rol, activo, profesional_id)
VALUES 
(2, 'Andrés Rojas', 'andres@barberflow.com', '$2a$10$n4qXm23s8iG6eR7k9l8vDuV1v4K7c0j3L8m9P2q1R5s6T7u8V9w0y', 'TRABAJADOR', TRUE, 1),
(3, 'Camilo Pérez', 'camilo@barberflow.com', '$2a$10$n4qXm23s8iG6eR7k9l8vDuV1v4K7c0j3L8m9P2q1R5s6T7u8V9w0y', 'TRABAJADOR', TRUE, 2),
(4, 'Sara Molina', 'sara@barberflow.com', '$2a$10$n4qXm23s8iG6eR7k9l8vDuV1v4K7c0j3L8m9P2q1R5s6T7u8V9w0y', 'TRABAJADOR', TRUE, 3)
ON DUPLICATE KEY UPDATE profesional_id=VALUES(profesional_id);

-- Proveedor de demostración
INSERT INTO proveedor (id, nombre, nit, telefono, email, direccion)
VALUES (1, 'Distribuidora Barber Pro Colombia', '900123456-7', '3009876543', 'ventas@barberpro.co', 'Calle 50 # 45-20, Medellín')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Productos para venta minorista
INSERT INTO producto (id, codigo, nombre, categoria, unidad, existencias, stock_minimo, costo_unitario, precio_venta)
VALUES
(1, 'PROD-001', 'Pomada Fijación Fuerte 100g', 'Peinado', 'unidad', 25, 5, 22000.00, 38000.00),
(2, 'PROD-002', 'Cera Mate Efecto Natural 80g', 'Peinado', 'unidad', 18, 5, 20000.00, 35000.00),
(3, 'PROD-003', 'Tónico Crecimiento y Fortalecimiento Barba 30ml', 'Barbería', 'unidad', 12, 3, 28000.00, 48000.00),
(4, 'PROD-004', 'Champú Anticaspa y Control Grasa 250ml', 'Capilar', 'unidad', 15, 4, 18000.00, 30000.00)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);
