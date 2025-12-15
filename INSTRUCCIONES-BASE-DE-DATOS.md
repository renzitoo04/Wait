# 📋 Instrucciones para Vincular la Base de Datos

## ✅ Pasos para configurar tu base de datos en Supabase

### 1. Verificar variables de entorno
Ya tienes configurado tu archivo [.env](.env) con:
```
SUPABASE_URL=https://nuhxzshvwluaqgpvljwh.supabase.co
SUPABASE_KEY=tu-clave-aquí
```

### 2. Crear las tablas en Supabase

1. Ve a tu proyecto de Supabase: https://app.supabase.com/
2. Selecciona tu proyecto: **nuhxzshvwluaqgpvljwh**
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **New Query**
5. Copia todo el contenido del archivo [setup-database.sql](setup-database.sql)
6. Pégalo en el editor SQL
7. Haz clic en **Run** o presiona `Ctrl + Enter`

### 3. Verificar que las tablas se crearon correctamente

En el menú lateral de Supabase, ve a **Table Editor** y deberías ver:

- ✅ **usuarios** - Para autenticación y gestión de suscripciones
- ✅ **link** - Para los links dinámicos de WhatsApp
- ✅ **clicks** - Para tracking de visitas

### 4. Probar la conexión

Puedes probar el registro de un usuario ejecutando:

```bash
node probarRegistro.js
```

O hacer una prueba manual desde tu aplicación web.

---

## 📊 Estructura de las tablas

### Tabla: `usuarios`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL | ID autoincremental |
| email | TEXT | Email único del usuario |
| password | TEXT | Contraseña (⚠️ considera usar bcrypt) |
| telefono | TEXT | Teléfono del usuario |
| limiteNumeros | INTEGER | Límite de números permitidos |
| suscripcion_valida_hasta | DATE | Fecha de vencimiento de la suscripción |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Fecha de última actualización |

### Tabla: `link`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | TEXT | ID único del link |
| email | TEXT | Email del usuario propietario |
| numeros | TEXT[] | Array de números de WhatsApp |
| mensaje | TEXT | Mensaje predefinido para WhatsApp |
| link | TEXT | URL del link dinámico |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Fecha de última actualización |

### Tabla: `clicks`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL | ID autoincremental |
| link_id | TEXT | Referencia al link |
| ip | TEXT | IP del visitante |
| ua | TEXT | User Agent del navegador |
| referer | TEXT | Página de referencia |
| clicked_at | TIMESTAMPTZ | Fecha y hora del click |

---

## 🔒 Seguridad (Opcional)

Si necesitas activar Row Level Security (RLS) para mayor seguridad:

1. Ve al **SQL Editor** en Supabase
2. Descomenta las líneas de RLS en el archivo SQL
3. Crea políticas personalizadas según tus necesidades

---

## ⚠️ Nota de Seguridad

**IMPORTANTE**: Tu código actual guarda las contraseñas en texto plano. Considera:

1. Usar bcrypt para hashear contraseñas (ya tienes la dependencia instalada)
2. Modificar [api/registro.js](api/registro.js) y [api/login.js](api/login.js)
3. Implementar validaciones adicionales

---

## 🚀 Próximos pasos

Una vez creadas las tablas:

1. ✅ Prueba el registro de usuarios
2. ✅ Prueba el login
3. ✅ Genera un link de prueba
4. ✅ Verifica el tracking de clicks

---

## 📞 Variables de entorno adicionales

Si vas a usar Mercado Pago, asegúrate de agregar en tu [.env](.env):

```
MERCADO_PAGO_TOKEN=tu-token-aquí
```
