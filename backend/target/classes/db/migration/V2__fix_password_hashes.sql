-- BarberFlow V2 — Corrección de hashes BCrypt de contraseñas de usuarios semilla
-- Hashes generados con BCryptPasswordEncoder(strength=10) de Spring Security 6.3.4
-- admin123   -> $2a$10$MvtQ8Hvwk5mJw/vtKolMVO72qxNyF9qUYdpUHaOEfxF2FlIAkGP2m
-- barbero123 -> $2a$10$wOYdhnpgy3YRRyOo2CrOBOlyq0aa1rjSt.eJdaMEOqZ2TkqujvYnK

UPDATE usuario
SET password_hash = '$2a$10$MvtQ8Hvwk5mJw/vtKolMVO72qxNyF9qUYdpUHaOEfxF2FlIAkGP2m'
WHERE email = 'admin@barberflow.com';

UPDATE usuario
SET password_hash = '$2a$10$wOYdhnpgy3YRRyOo2CrOBOlyq0aa1rjSt.eJdaMEOqZ2TkqujvYnK'
WHERE email IN ('andres@barberflow.com', 'camilo@barberflow.com', 'sara@barberflow.com');
