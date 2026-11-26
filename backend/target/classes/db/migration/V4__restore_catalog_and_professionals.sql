-- Restaura el catálogo básico y vincula los trabajadores a sus perfiles profesionales.
INSERT INTO profesional (id, nombre, especialidad, calificacion, porcentaje_comision, telefono, activo)
VALUES
(1, 'Andrés Rojas', 'Cortes clásicos y barbería', 5.00, 50.00, NULL, TRUE),
(2, 'Camilo Pérez', 'Diseños y degradados', 5.00, 50.00, NULL, TRUE),
(3, 'Sara Molina', 'Barba y estilismo', 5.00, 50.00, NULL, TRUE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    especialidad = VALUES(especialidad),
    activo = TRUE;

UPDATE usuario SET profesional_id = 1
WHERE email = 'andres@barberflow.com';

UPDATE usuario SET profesional_id = 2
WHERE email = 'camilo@barberflow.com';

UPDATE usuario SET profesional_id = 3
WHERE email = 'sara@barberflow.com';

INSERT INTO servicio (id, nombre, categoria, duracion_min, precio, activo)
VALUES
(1, 'Corte clásico', 'Corte', 45, 25000.00, TRUE),
(2, 'Corte degradado', 'Corte', 60, 30000.00, TRUE),
(3, 'Arreglo de barba', 'Barba', 30, 18000.00, TRUE),
(4, 'Corte + barba', 'Combo', 75, 40000.00, TRUE),
(5, 'Corte infantil', 'Corte', 40, 22000.00, TRUE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    categoria = VALUES(categoria),
    duracion_min = VALUES(duracion_min),
    precio = VALUES(precio),
    activo = TRUE;
