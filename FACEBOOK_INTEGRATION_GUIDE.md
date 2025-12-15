# Guía de Integración: Facebook Conversions API

## ✅ Cambios Implementados

### 1. Archivo Modificado: `api/soporte.js`

#### Función Nueva: `enviarEventoFacebook()`
- **Ubicación**: Líneas 24-70
- **Función**: Envía eventos de conversión a Facebook Graph API
- **Características**:
  - Maneja errores sin romper el flujo de redirección
  - Valida que el pixel esté configurado antes de enviar
  - Incluye cookies `_fbp` y `_fbc` para mejorar el tracking
  - Usa Facebook Graph API v21.0

#### Modificaciones en la Sección GET:
- **Línea 160**: Ahora incluye `email` en la consulta del link
- **Líneas 173-180**: Extracción de cookies `_fbp` y `_fbc`
- **Líneas 192-210**: Consulta de configuración de Facebook y envío de evento

### 2. Base de Datos: Nuevas Columnas en Supabase

```sql
-- Ejecutar en Supabase SQL Editor
ALTER TABLE usuarios
ADD COLUMN facebook_pixel_id TEXT NULL,
ADD COLUMN facebook_access_token TEXT NULL,
ADD COLUMN facebook_event_name TEXT DEFAULT 'Lead';
```

## 📋 Pasos para Implementar

### Paso 1: Actualizar Base de Datos
1. Abre tu panel de Supabase
2. Ve a **SQL Editor**
3. Ejecuta el contenido de `SUPABASE_MIGRATION.sql`
4. Verifica que las columnas se crearon correctamente

### Paso 2: Obtener Credenciales de Facebook

#### A. Obtener Pixel ID
1. Ve a [Facebook Business Manager](https://business.facebook.com)
2. Navega a **Eventos** > **Fuentes de datos**
3. Selecciona tu Pixel o crea uno nuevo
4. Copia el **ID del Pixel** (número de 15-16 dígitos)

#### B. Generar Access Token
1. En la misma sección de tu Pixel
2. Ve a **Configuración** > **Conversions API**
3. Click en **Generar token de acceso**
4. Copia el token (comienza con `EAA...`)
5. **IMPORTANTE**: Este token tiene permisos de `ads_management`

### Paso 3: Configurar Usuario en Supabase

Ejecuta este SQL para configurar un usuario:

```sql
UPDATE usuarios
SET
  facebook_pixel_id = 'TU_PIXEL_ID_AQUI',
  facebook_access_token = 'TU_TOKEN_AQUI',
  facebook_event_name = 'Lead'
WHERE email = 'email@usuario.com';
```

### Paso 4: Deploy
1. Haz commit de los cambios
2. Push a tu repositorio
3. Vercel detectará automáticamente los cambios
4. Espera a que termine el deploy

## 🧪 Cómo Probar la Integración

### 1. Prueba Manual
1. Configura un usuario con credenciales de Facebook
2. Crea un link rotativo con ese usuario
3. Abre el link en un navegador
4. Verifica en los logs de Vercel que aparezca: `✅ Evento enviado a Facebook`

### 2. Verificar en Facebook
1. Ve a **Facebook Events Manager**
2. Selecciona tu Pixel
3. Ve a **Eventos de prueba**
4. Deberías ver el evento aparecer en tiempo real
5. El evento mostrará:
   - Nombre: `Lead` (o el configurado)
   - Fuente: `Conversions API`
   - Datos de usuario: IP, User-Agent, fbp, fbc

### 3. Ver Logs en Vercel
```bash
# Si tienes Vercel CLI instalado
vercel logs
```

Busca mensajes como:
- `✅ Evento enviado a Facebook: { ... }`
- `❌ Error al enviar evento a Facebook: { ... }` (si hay errores)

## 🔧 Tipos de Eventos de Facebook

Puedes cambiar `facebook_event_name` según tu necesidad:

| Evento | Descripción | Cuándo Usar |
|--------|-------------|-------------|
| `Lead` | Generación de lead | **Recomendado para WhatsApp** |
| `Contact` | Contacto iniciado | Alternativa a Lead |
| `ViewContent` | Visualización de contenido | Si muestras info antes |
| `InitiateCheckout` | Inicio de compra | E-commerce |
| `Purchase` | Compra completada | Ventas confirmadas |
| `CompleteRegistration` | Registro completado | Sign-ups |

## 🛡️ Características de Seguridad

### ✅ Implementado
- **No bloquea redirección**: Si Facebook falla, el usuario sigue siendo redirigido
- **Tracking opcional**: Solo trackea si el usuario tiene pixel configurado
- **Manejo de errores**: Try/catch en todas las operaciones críticas
- **Sin dependencias nuevas**: Usa solo `fetch` nativo

### 🔒 Datos Enviados a Facebook
- IP del visitante (para geo-targeting)
- User-Agent (para device targeting)
- URL de referencia (para source tracking)
- Cookies `_fbp` y `_fbc` (para mejorar matching)
- **NO se envía**: Números de WhatsApp, emails, mensajes

## 📊 Flujo de Datos

```
Usuario hace click en link rotativo
        ↓
api/soporte.js (GET)
        ↓
Consulta tabla 'link' → Obtiene email del dueño
        ↓
Consulta tabla 'usuarios' → Obtiene config de Facebook
        ↓
¿Tiene pixel configurado?
   ↓ NO → Redirección directa a WhatsApp
   ↓ SÍ
        ↓
Extrae cookies _fbp y _fbc
        ↓
Envía evento a Facebook Graph API (async)
        ↓
Redirección a WhatsApp (sin esperar respuesta de Facebook)
```

## ❓ Troubleshooting

### Error: "No se pudo enviar evento a Facebook"
**Posibles causas:**
1. Token de acceso inválido o expirado
2. Pixel ID incorrecto
3. Token sin permisos de `ads_management`

**Solución:**
- Regenera el token en Facebook Business Manager
- Verifica que el Pixel ID sea correcto
- Asegúrate de usar un token con permisos correctos

### No veo eventos en Facebook Events Manager
**Posibles causas:**
1. La configuración del usuario no está guardada en Supabase
2. El token no tiene permisos
3. Hay un error de red

**Solución:**
1. Verifica la configuración con: `SELECT facebook_pixel_id, facebook_event_name FROM usuarios WHERE email = 'tu@email.com';`
2. Revisa los logs de Vercel
3. Usa el Test Events tool de Facebook

### Los eventos llegan pero sin datos de usuario
**Causa:** Las cookies `_fbp` y `_fbc` no están presentes
**Solución:**
- Instala el Facebook Pixel en tu frontend
- Las cookies se generarán automáticamente
- Los eventos subsecuentes incluirán estos datos

## 🚀 Optimizaciones Futuras (Opcionales)

### 1. Agregar más parámetros de usuario
```javascript
// En enviarEventoFacebook(), agregar:
user_data: {
  client_ip_address: ip,
  client_user_agent: userAgent,
  fbp: fbp,
  fbc: fbc,
  // Nuevos:
  em: hashSHA256(email), // Email hasheado
  ph: hashSHA256(phone), // Teléfono hasheado
}
```

### 2. Eventos personalizados
```javascript
// Crear eventos para diferentes acciones:
- 'WhatsAppRedirect' cuando hacen click
- 'WhatsAppMessage' si confirman envío
- 'WhatsAppConversion' si completan acción
```

### 3. Test Events
```javascript
// Agregar parámetro test_event_code para testing:
const eventData = {
  data: [{ /* ... */ }],
  test_event_code: 'TEST12345' // Solo en desarrollo
};
```

## 📝 Resumen de Archivos

| Archivo | Descripción |
|---------|-------------|
| `api/soporte.js` | ✅ Modificado con integración de Facebook |
| `SUPABASE_MIGRATION.sql` | SQL para crear columnas en BD |
| `FACEBOOK_INTEGRATION_GUIDE.md` | Esta guía |

## ✅ Checklist de Implementación

- [ ] Ejecutar migration SQL en Supabase
- [ ] Verificar que las columnas se crearon
- [ ] Obtener Pixel ID de Facebook
- [ ] Generar Access Token de Conversions API
- [ ] Configurar al menos un usuario de prueba
- [ ] Deploy a Vercel
- [ ] Hacer prueba con link rotativo
- [ ] Verificar evento en Facebook Events Manager
- [ ] Revisar logs en Vercel
- [ ] Configurar usuarios productivos

## 🆘 Soporte

Si necesitas ayuda:
1. Revisa los logs de Vercel
2. Usa el Test Events tool de Facebook
3. Verifica la configuración en Supabase
4. Consulta la documentación oficial: [Facebook Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
