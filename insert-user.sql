-- Insertar usuario de prueba
INSERT INTO usuarios (email, password, telefono, limiteNumeros, suscripcion_valida_hasta)
VALUES ('test@ejemplo.com', '123456', '+5491234567890', 5, '2025-12-31')
ON CONFLICT (email) DO NOTHING;

-- Verificar que se creó
SELECT * FROM usuarios;