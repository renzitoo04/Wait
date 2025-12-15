import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  console.log('📧 Intentando login...');
  console.log('Body recibido:', req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    console.log('❌ Faltan datos:', { email: !!email, password: !!password });
    return res.status(400).json({ error: 'Faltan datos de inicio de sesión' });
  }

  try {
    const emailLimpio = email.trim().toLowerCase();
    const passwordLimpio = password.trim();
    
    console.log('🔍 Buscando usuario:', emailLimpio);
    
    // Verificar usuario en Supabase
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('email, password, limiteNumeros')
      .eq('email', emailLimpio)
      .single();

    console.log('Resultado búsqueda usuario:', { 
      encontrado: !!usuario, 
      error: error?.message 
    });

    if (error || !usuario) {
      console.log('❌ Usuario no encontrado para:', emailLimpio);
      
      // Si no existe, intentar crear uno automáticamente para pruebas
      if (emailLimpio === 'test@test.com' && passwordLimpio === '123456') {
        console.log('🔧 Creando usuario de prueba automáticamente...');
        
        const hashedPassword = await bcrypt.hash(passwordLimpio, 10);
        const { data: nuevoUsuario, error: errorCreacion } = await supabase
          .from('usuarios')
          .insert([{
            email: emailLimpio,
            password: hashedPassword,
            limiteNumeros: 5
          }])
          .select()
          .single();
          
        if (!errorCreacion && nuevoUsuario) {
          console.log('✅ Usuario de prueba creado exitosamente');
          return res.status(200).json({
            email: nuevoUsuario.email,
            limiteNumeros: nuevoUsuario.limiteNumeros,
            mensaje: 'Usuario creado automáticamente'
          });
        }
      }
      
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    console.log('🔐 Verificando contraseña...');
    
    // Comparar contraseñas usando bcrypt
    let passwordMatch = false;
    
    try {
      passwordMatch = await bcrypt.compare(passwordLimpio, usuario.password);
    } catch (bcryptError) {
      console.log('⚠️ Error en bcrypt, intentando comparación directa:', bcryptError.message);
      // Si bcrypt falla, podría ser que la contraseña no esté hasheada
      passwordMatch = (passwordLimpio === usuario.password);
    }
    
    console.log('Resultado verificación contraseña:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('❌ Contraseña incorrecta para:', emailLimpio);
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    console.log('✅ Login exitoso para:', emailLimpio);
    
    return res.status(200).json({
      email: usuario.email,
      limiteNumeros: usuario.limiteNumeros,
    });
  } catch (err) {
    console.error('💥 Error en login:', err);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      detalles: err.message 
    });
  }
}
