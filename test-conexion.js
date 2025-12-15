import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

console.log('🔍 Probando conexión a Supabase...\n');

async function testConexion() {
  try {
    // 1. Verificar variables de entorno
    console.log('✅ Variables de entorno:');
    console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Configurada' : '✗ No configurada');
    console.log('   SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✓ Configurada' : '✗ No configurada');
    console.log('');

    // 2. Probar conexión a la tabla usuarios
    console.log('🔍 Probando tabla "usuarios"...');
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);

    if (errorUsuarios) {
      console.log('   ✗ Error:', errorUsuarios.message);
      console.log('   💡 Tip: Ejecuta el archivo setup-database.sql en Supabase');
    } else {
      console.log('   ✅ Tabla "usuarios" existe y está accesible');
      console.log('   📊 Registros encontrados:', usuarios?.length || 0);
    }
    console.log('');

    // 3. Probar conexión a la tabla link
    console.log('🔍 Probando tabla "link"...');
    const { data: links, error: errorLinks } = await supabase
      .from('link')
      .select('*')
      .limit(1);

    if (errorLinks) {
      console.log('   ✗ Error:', errorLinks.message);
      console.log('   💡 Tip: Ejecuta el archivo setup-database.sql en Supabase');
    } else {
      console.log('   ✅ Tabla "link" existe y está accesible');
      console.log('   📊 Registros encontrados:', links?.length || 0);
    }
    console.log('');

    // 4. Probar conexión a la tabla clicks
    console.log('🔍 Probando tabla "clicks"...');
    const { data: clicks, error: errorClicks } = await supabase
      .from('clicks')
      .select('*')
      .limit(1);

    if (errorClicks) {
      console.log('   ✗ Error:', errorClicks.message);
      console.log('   💡 Tip: Ejecuta el archivo setup-database.sql en Supabase');
    } else {
      console.log('   ✅ Tabla "clicks" existe y está accesible');
      console.log('   📊 Registros encontrados:', clicks?.length || 0);
    }
    console.log('');

    // Resumen
    const errores = [errorUsuarios, errorLinks, errorClicks].filter(e => e !== null);

    if (errores.length === 0) {
      console.log('🎉 ¡Todas las tablas están configuradas correctamente!');
      console.log('✅ Tu base de datos está lista para usar.');
    } else {
      console.log('⚠️  Hay', errores.length, 'tabla(s) con problemas.');
      console.log('📝 Revisa las instrucciones en INSTRUCCIONES-BASE-DE-DATOS.md');
    }

  } catch (error) {
    console.error('❌ Error al probar la conexión:', error.message);
  }
}

testConexion();
