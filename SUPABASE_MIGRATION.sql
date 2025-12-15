-- ============================================
-- MIGRACIÓN: Facebook Conversions API
-- ============================================
-- Este script agrega las columnas necesarias para
-- trackear conversiones de Facebook Ads
-- ============================================

-- Agregar columnas a la tabla 'usuarios'
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT NULL,
ADD COLUMN IF NOT EXISTS facebook_access_token TEXT NULL,
ADD COLUMN IF NOT EXISTS facebook_event_name TEXT DEFAULT 'Lead';

-- Comentarios para documentación
COMMENT ON COLUMN usuarios.facebook_pixel_id IS 'ID del Pixel de Facebook para enviar eventos de conversión';
COMMENT ON COLUMN usuarios.facebook_access_token IS 'Token de acceso de la API de Facebook para autenticar eventos';
COMMENT ON COLUMN usuarios.facebook_event_name IS 'Nombre del evento a enviar (Lead, ViewContent, Purchase, etc.)';

-- ============================================
-- INSTRUCCIONES DE USO:
-- ============================================
-- 1. Ve a tu panel de Supabase
-- 2. Navega a SQL Editor
-- 3. Crea una nueva query
-- 4. Copia y pega este SQL
-- 5. Ejecuta la query
-- 6. Verifica que las columnas se hayan creado correctamente
--    ejecutando: SELECT * FROM usuarios LIMIT 1;
-- ============================================

-- ============================================
-- CONFIGURACIÓN POR USUARIO:
-- ============================================
-- Para que un usuario trackee conversiones, debe configurar:
--
-- 1. facebook_pixel_id: El ID de su Pixel de Facebook
--    - Se encuentra en Business Manager > Eventos > Pixels
--    - Formato: número de 15-16 dígitos (ej: 1234567890123456)
--
-- 2. facebook_access_token: Token de acceso de Conversions API
--    - Se genera en: Business Manager > Configuración de eventos
--    - Ir a la sección "Conversions API"
--    - Generar token de acceso
--    - IMPORTANTE: Este token debe tener permisos de "ads_management"
--
-- 3. facebook_event_name: (Opcional, default: 'Lead')
--    - Eventos estándar de Facebook:
--      - Lead: Cuando alguien muestra interés (recomendado para WhatsApp)
--      - ViewContent: Visualización de contenido
--      - InitiateCheckout: Inicio de proceso de compra
--      - Purchase: Compra completada
--      - Contact: Contacto iniciado
--
-- Ejemplo de UPDATE para configurar un usuario:
-- UPDATE usuarios
-- SET
--   facebook_pixel_id = '1234567890123456',
--   facebook_access_token = 'EAAxxxxxxxxxxxxxxxxxxxxxxxx',
--   facebook_event_name = 'Lead'
-- WHERE email = 'usuario@ejemplo.com';
-- ============================================
