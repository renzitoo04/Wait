import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function crearUsuarioPrueba() {
  try {
    console.log('🔧 Creando usuario de prueba...\n');
    
    // Datos del usuario de prueba
    const usuarioPrueba = {
      email: 'test@ejemplo.com',
      password: '123456',
      telefono: '+5491234567890',
      limiteNumeros: 5,
      suscripcion_valida_hasta: '2025-12-31'
    };

    // Insertar usuario
    const { data, error } = await supabase
      .from('usuarios')
      .insert([usuarioPrueba])
      .select();

    if (error) {
      if (error.code === '23505') {
        console.log('⚠️  El usuario ya existe en la base de datos');
        console.log('📧 Email: test@ejemplo.com');
        console.log('🔑 Password: 123456\n');
      } else {
        console.error('❌ Error al crear usuario:', error.message);
      }
    } else {
      console.log('✅ Usuario de prueba creado exitosamente:');
      console.log('📧 Email: test@ejemplo.com');
      console.log('🔑 Password: 123456');
      console.log('📱 Teléfono: +5491234567890');
      console.log('🔢 Límite de números: 5\n');
    }

    // Verificar usuarios existentes
    console.log('👥 Verificando todos los usuarios...');
    const { data: usuarios, error: errorListar } = await supabase
      .from('usuarios')
      .select('email, telefono, limiteNumeros, created_at');

    if (errorListar) {
      console.error('❌ Error al listar usuarios:', errorListar.message);
    } else {
      console.log(`📊 Total de usuarios: ${usuarios.length}\n`);
      usuarios.forEach((usuario, index) => {
        console.log(`${index + 1}. 📧 ${usuario.email}`);
        console.log(`   📱 ${usuario.telefono || 'No especificado'}`);
        console.log(`   🔢 Límite: ${usuario.limiteNumeros} números`);
        console.log(`   📅 Creado: ${new Date(usuario.created_at).toLocaleDateString()}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

crearUsuarioPrueba();