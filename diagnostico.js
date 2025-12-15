import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS\n');
console.log('='.repeat(50));

async function diagnostico() {
  try {
    // 1. Verificar tabla usuarios
    console.log('\n1️⃣  Verificando tabla "usuarios"...');
    const { data: usuarios, error: errorUsuarios, count } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact' });

    if (errorUsuarios) {
      console.log('❌ ERROR:', errorUsuarios.message);
      console.log('\n⚠️  La tabla "usuarios" no existe o no es accesible.');
      console.log('📝 Solución: Ejecuta el archivo setup-database.sql en Supabase');
      console.log('   1. Ve a https://app.supabase.com/');
      console.log('   2. Abre SQL Editor');
      console.log('   3. Copia el contenido de setup-database.sql');
      console.log('   4. Ejecuta el script');
      return;
    }

    console.log('✅ Tabla "usuarios" existe');
    console.log(`📊 Total de usuarios: ${usuarios?.length || 0}`);

    if (usuarios && usuarios.length > 0) {
      console.log('\n👥 Usuarios registrados:');
      usuarios.forEach((u, i) => {
        console.log(`   ${i + 1}. Email: ${u.email}`);
        console.log(`      - Teléfono: ${u.telefono || 'No especificado'}`);
        console.log(`      - Límite números: ${u.limiteNumeros}`);
        console.log(`      - Suscripción válida hasta: ${u.suscripcion_valida_hasta || 'No definida'}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No hay usuarios registrados en la base de datos.');
      console.log('\n💡 Opciones:');
      console.log('   A) Registrar un usuario desde la aplicación web');
      console.log('   B) Crear un usuario de prueba manualmente');

      console.log('\n¿Quieres crear un usuario de prueba? (y/n)');
      console.log('📝 Para crear manualmente, ejecuta este SQL en Supabase:');
      console.log('\n   INSERT INTO usuarios (email, password, telefono, limiteNumeros)');
      console.log('   VALUES (\'test@ejemplo.com\', \'123456\', \'+5491234567890\', 5);');
      console.log('');
    }

    // 2. Verificar tabla link
    console.log('\n2️⃣  Verificando tabla "link"...');
    const { data: links, error: errorLinks } = await supabase
      .from('link')
      .select('*');

    if (errorLinks) {
      console.log('❌ ERROR:', errorLinks.message);
    } else {
      console.log('✅ Tabla "link" existe');
      console.log(`📊 Total de links: ${links?.length || 0}`);
    }

    // 3. Verificar tabla clicks
    console.log('\n3️⃣  Verificando tabla "clicks"...');
    const { data: clicks, error: errorClicks } = await supabase
      .from('clicks')
      .select('*');

    if (errorClicks) {
      console.log('❌ ERROR:', errorClicks.message);
    } else {
      console.log('✅ Tabla "clicks" existe');
      console.log(`📊 Total de clicks: ${clicks?.length || 0}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Diagnóstico completado');

  } catch (error) {
    console.error('\n❌ Error crítico:', error.message);
  }
}

diagnostico();
