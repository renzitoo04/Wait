-- ========================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- Ejecuta este script en el SQL Editor de Supabase
-- ========================================

-- 1. Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
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
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- 2. Tabla de links
CREATE TABLE IF NOT EXISTS link (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  numeros TEXT[] NOT NULL,  -- Array de números de WhatsApp
  mensaje TEXT,
  link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_link_email ON link(email);

-- 3. Tabla de clicks (para tracking)
CREATE TABLE IF NOT EXISTS clicks (
  id BIGSERIAL PRIMARY KEY,
  link_id TEXT NOT NULL REFERENCES link(id) ON DELETE CASCADE,
  ip TEXT,
  ua TEXT,  -- User Agent
  referer TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por link_id y fecha
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_link_date ON clicks(link_id, clicked_at);

-- ========================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- ========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para usuarios
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para link
DROP TRIGGER IF EXISTS update_link_updated_at ON link;
CREATE TRIGGER update_link_updated_at
  BEFORE UPDATE ON link
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- POLÍTICAS RLS (Row Level Security)
-- Opcional: Descomenta si necesitas seguridad a nivel de fila
-- ========================================

-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE link ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- ========================================
-- DATOS DE PRUEBA (OPCIONAL)
-- Descomenta si quieres crear un usuario de prueba
-- ========================================

-- INSERT INTO usuarios (email, password, telefono, limiteNumeros, suscripcion_valida_hasta)
-- VALUES ('test@ejemplo.com', 'password123', '+5491234567890', 5, '2025-12-31')
-- ON CONFLICT (email) DO NOTHING;
