UPDATE usuario SET password_hash='$2a$10$MEJ36zVuKeoOdz86OEu2SuB/3C0Nr8ou2zgBOy5SF1Xmh83mhbM2.' WHERE email='admin@barberflow.com';
UPDATE usuario SET password_hash='$2a$10$wiFizh3Ois6xpLD7NbaJLeyVS5Rs8FKhxpiNE9SlgdB6/0f88.3W6' WHERE email IN ('andres@barberflow.com','camilo@barberflow.com','sara@barberflow.com');
SELECT id, email, LEFT(password_hash,25) as hash_preview, rol FROM usuario;
