const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkUsers() {
  try {
    console.log('Verificando usuarios en la base de datos...\n');
    
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('email, password, limiteNumeros');

    if (error) {
      console.error('Error al consultar usuarios:', error.message);
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('❌ No hay usuarios registrados en la base de datos.');
      console.log('💡 Necesitas registrar un usuario primero.');
    } else {
      console.log('✅ Usuarios encontrados:');
      usuarios.forEach((usuario, index) => {
        console.log(`${index + 1}. Email: ${usuario.email}`);
        console.log(`   Password: ${usuario.password}`);
        console.log(`   Límite números: ${usuario.limiteNumeros}\n`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();