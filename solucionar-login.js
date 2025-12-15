import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

console.log('🔧 SOLUCIONADOR DE PROBLEMA DE LOGIN\n');
console.log('='.repeat(60));

async function solucionarLogin() {
  try {
    // 1. Verificar conexión
    console.log('\n1️⃣  Verificando conexión a Supabase...');
    console.log('   URL:', process.env.SUPABASE_URL);
    console.log('   KEY:', process.env.SUPABASE_KEY ? '✓ Configurada' : '✗ NO configurada');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.log('\n❌ ERROR: Variables de entorno no configuradas');
      console.log('   Verifica tu archivo .env');
      return;
    }

    // 2. Verificar tabla usuarios
    console.log('\n2️⃣  Verificando tabla "usuarios"...');
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('*');

    if (errorUsuarios) {
      console.log('❌ ERROR:', errorUsuarios.message);
      console.log('\n⚠️  PROBLEMA: La tabla "usuarios" no existe');
      console.log('\n📝 SOLUCIÓN:');
      console.log('   1. Ve a: https://app.supabase.com/project/nuhxzshvwluaqgpvljwh/editor');
      console.log('   2. Abre el SQL Editor');
      console.log('   3. Ejecuta este comando:\n');
      console.log('   CREATE TABLE IF NOT EXISTS usuarios (');
      console.log('     id BIGSERIAL PRIMARY KEY,');
      console.log('     email TEXT UNIQUE NOT NULL,');
      console.log('     password TEXT NOT NULL,');
      console.log('     telefono TEXT,');
      console.log('     limiteNumeros INTEGER DEFAULT 1,');
      console.log('     suscripcion_valida_hasta DATE,');
      console.log('     created_at TIMESTAMPTZ DEFAULT NOW(),');
      console.log('     updated_at TIMESTAMPTZ DEFAULT NOW()');
      console.log('   );\n');
      return;
    }

    console.log('✅ Tabla "usuarios" existe');
    console.log(`📊 Usuarios encontrados: ${usuarios?.length || 0}`);

    // 3. Listar usuarios existentes
    if (usuarios && usuarios.length > 0) {
      console.log('\n👥 USUARIOS REGISTRADOS:');
      usuarios.forEach((u, i) => {
        console.log(`\n   ${i + 1}. Email: ${u.email}`);
        console.log(`      Password: ${u.password}`);
        console.log(`      Teléfono: ${u.telefono || 'No especificado'}`);
        console.log(`      Límite números: ${u.limiteNumeros}`);
      });

      console.log('\n✅ HAY USUARIOS EN LA BASE DE DATOS');
      console.log('\n🔑 Intenta iniciar sesión con alguno de estos emails');
      console.log('   y su contraseña correspondiente.');
      return;
    }

    // 4. No hay usuarios - Crear uno automáticamente
    console.log('\n⚠️  NO HAY USUARIOS EN LA BASE DE DATOS');
    console.log('\n3️⃣  Creando usuario de prueba automáticamente...');

    const usuarioNuevo = {
      email: 'admin@test.com',
      password: 'admin123',
      telefono: '+5491234567890',
      limiteNumeros: 10,
      suscripcion_valida_hasta: '2026-12-31'
    };

    const { data: nuevoUsuario, error: errorCrear } = await supabase
      .from('usuarios')
      .insert([usuarioNuevo])
      .select();

    if (errorCrear) {
      console.log('❌ ERROR al crear usuario:', errorCrear.message);
      console.log('\n📝 Crea el usuario manualmente en Supabase:');
      console.log('   1. Ve a: https://app.supabase.com/project/nuhxzshvwluaqgpvljwh/editor');
      console.log('   2. Ejecuta este SQL:\n');
      console.log(`   INSERT INTO usuarios (email, password, telefono, limiteNumeros, suscripcion_valida_hasta)`);
      console.log(`   VALUES ('${usuarioNuevo.email}', '${usuarioNuevo.password}', '${usuarioNuevo.telefono}', ${usuarioNuevo.limiteNumeros}, '${usuarioNuevo.suscripcion_valida_hasta}');\n`);
      return;
    }

    console.log('✅ ¡USUARIO CREADO EXITOSAMENTE!\n');
    console.log('='.repeat(60));
    console.log('🔑 CREDENCIALES PARA INICIAR SESIÓN:');
    console.log('='.repeat(60));
    console.log(`   📧 Email:    ${usuarioNuevo.email}`);
    console.log(`   🔒 Password: ${usuarioNuevo.password}`);
    console.log('='.repeat(60));
    console.log('\n✅ Ahora ve a tu aplicación e inicia sesión con estas credenciales');

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    console.log('\n💡 Posibles causas:');
    console.log('   1. Las variables de entorno están mal configuradas');
    console.log('   2. No tienes permisos en Supabase');
    console.log('   3. La tabla no existe');
  }
}

solucionarLogin();
