/*UPDATE profesional
SET nombre = CONVERT(CAST(CONVERT(nombre USING latin1) AS BINARY) USING utf8mb4),
    especialidad = CONVERT(CAST(CONVERT(especialidad USING latin1) AS BINARY) USING utf8mb4)
WHERE nombre LIKE '%Ã%' OR especialidad LIKE '%Ã%';

UPDATE usuario
SET nombre = CONVERT(CAST(CONVERT(nombre USING latin1) AS BINARY) USING utf8mb4)
WHERE nombre LIKE '%Ã%';

UPDATE cliente
SET nombre = CONVERT(CAST(CONVERT(nombre USING latin1) AS BINARY) USING utf8mb4),
    notas = CONVERT(CAST(CONVERT(notas USING latin1) AS BINARY) USING utf8mb4)
WHERE nombre LIKE '%Ã%' OR notas LIKE '%Ã%';

UPDATE servicio
SET nombre = CONVERT(CAST(CONVERT(nombre USING latin1) AS BINARY) USING utf8mb4),
    categoria = CONVERT(CAST(CONVERT(categoria USING latin1) AS BINARY) USING utf8mb4)
WHERE nombre LIKE '%Ã%' OR categoria LIKE '%Ã%';
