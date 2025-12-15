-- ========================================
-- SCRIPT PARA ARREGLAR LA BASE DE DATOS
-- Ejecuta esto en el SQL Editor de Supabase
-- ========================================

-- Eliminar tabla antigua si existe con estructura incorrecta
DROP TABLE IF EXISTS clicks CASCADE;
DROP TABLE IF EXISTS link CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 1. Crear tabla de usuarios con estructura correcta
CREATE TABLE usuarios (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  telefono TEXT,
  limiteNumeros INTEGER DEFAULT 1,
  suscripcion_valida_hasta DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por email
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- 2. Tabla de links
CREATE TABLE link (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  numeros TEXT[] NOT NULL,
  mensaje TEXT,
  link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX idx_link_email ON link(email);

-- 3. Tabla de clicks
CREATE TABLE clicks (
  id BIGSERIAL PRIMARY KEY,
  link_id TEXT NOT NULL REFERENCES link(id) ON DELETE CASCADE,
  ip TEXT,
  ua TEXT,
  referer TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para clicks
CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at);

-- 4. Insertar usuario de prueba con contraseña hasheada
-- Contraseña: 123456 (hasheada con bcrypt)
INSERT INTO usuarios (email, password, telefono, limiteNumeros, suscripcion_valida_hasta)
VALUES (
  'test@ejemplo.com',
  '$2b$10$rQHqFgFKYzB8I8rGvKGTNOeVWKqRqFvN3cUkJxJ3jG8QmZ1K1H1.2',
  '+5491234567890',
  5,
  '2025-12-31'
)
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    limiteNumeros = EXCLUDED.limiteNumeros;

-- 5. Verificar que todo se creó correctamente
SELECT
  'Tabla usuarios creada' as mensaje,
  COUNT(*) as total_usuarios
FROM usuarios;
