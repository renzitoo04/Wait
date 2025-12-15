// Script simple para crear usuario de prueba
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nuhxzshvwluaqgpvljwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aHh6c2h2d2x1YXFncHZsandoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1NzAyNywiZXhwIjoyMDgxMjMzMDI3fQ.JfdZ0R-BxZdbC--8wUqFuy6vcQnaHMb1Zlo_3uL0nlA'
);

async function crearUsuario() {
  console.log('🔧 Creando usuario de prueba...\n');

  try {
    // Primero verificar si ya existe un usuario
    const { data: usuariosExistentes, error: errorBuscar } = await supabase
      .from('usuarios')
      .select('email');

    if (errorBuscar) {
      console.log('❌ Error al verificar usuarios:', errorBuscar.message);
      console.log('\n🔧 SOLUCIÓN: Necesitas crear la tabla primero.');
      console.log('   Ve a Supabase y ejecuta este SQL:\n');
      console.log('CREATE TABLE IF NOT EXISTS usuarios (');
      console.log('  id BIGSERIAL PRIMARY KEY,');
      console.log('  email TEXT UNIQUE NOT NULL,');
      console.log('  password TEXT NOT NULL,');
      console.log('  telefono TEXT,');
      console.log('  limiteNumeros INTEGER DEFAULT 1,');
      console.log('  suscripcion_valida_hasta DATE,');
      console.log('  created_at TIMESTAMPTZ DEFAULT NOW()');
      console.log(');');
      return;
    }

    if (usuariosExistentes && usuariosExistentes.length > 0) {
      console.log('✅ Ya existen usuarios:');
      usuariosExistentes.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email}`);
      });
      console.log('\n🔑 Usa alguno de estos emails para hacer login.');
      return;
    }

    // Crear usuario nuevo
    const usuarioNuevo = {
      email: 'test@test.com',
      password: '123456',
      telefono: '+5491234567890',
      limiteNumeros: 5
    };

    const { data, error } = await supabase
      .from('usuarios')
      .insert([usuarioNuevo])
      .select();

    if (error) {
      console.log('❌ Error al crear usuario:', error.message);
      return;
    }

    console.log('✅ ¡Usuario creado exitosamente!');
    console.log('\n='.repeat(50));
    console.log('🔑 CREDENCIALES PARA LOGIN:');
    console.log('='.repeat(50));
    console.log(`📧 Email:    ${usuarioNuevo.email}`);
    console.log(`🔒 Password: ${usuarioNuevo.password}`);
    console.log('='.repeat(50));
    console.log('\n✅ Ahora puedes hacer login con estas credenciales');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

crearUsuario();