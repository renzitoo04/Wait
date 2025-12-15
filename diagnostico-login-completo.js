import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

async function diagnosticoCompleto() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL LOGIN');
    console.log('================================');
    
    try {
        // Verificar variables de entorno
        console.log('\n1. Variables de entorno:');
        console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurada' : 'NO configurada');
        console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Configurada' : 'NO configurada');
        
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
            console.log('❌ Variables de entorno faltantes');
            return;
        }
        
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        
        // Verificar conexión y tabla
        console.log('\n2. Verificando tabla usuarios:');
        const { data: usuarios, error: errorUsuarios } = await supabase
            .from('usuarios')
            .select('*');
            
        if (errorUsuarios) {
            console.log('❌ Error al acceder a tabla usuarios:', errorUsuarios);
            return;
        }
        
        console.log('✅ Tabla usuarios accesible');
        console.log(`Usuarios encontrados: ${usuarios.length}`);
        
        if (usuarios.length === 0) {
            console.log('\n3. Creando usuario de prueba...');
            const hashedPassword = await bcrypt.hash('123456', 10);
            
            const { data: nuevoUsuario, error: errorCreacion } = await supabase
                .from('usuarios')
                .insert([
                    {
                        email: 'test@test.com',
                        password: hashedPassword,
                        limiteNumeros: 5
                    }
                ])
                .select();
                
            if (errorCreacion) {
                console.log('❌ Error creando usuario:', errorCreacion);
                return;
            }
            
            console.log('✅ Usuario de prueba creado:', nuevoUsuario);
        }
        
        // Probar login con datos existentes
        console.log('\n4. Probando login...');
        const usuariosPrueba = [
            { email: 'test@test.com', password: '123456' },
            { email: 'renzo@test.com', password: '123456' },
            { email: 'admin@wait.com', password: 'admin123' }
        ];
        
        for (let credenciales of usuariosPrueba) {
            console.log(`\nProbando con: ${credenciales.email}`);
            
            // Buscar usuario
            const { data: usuario, error } = await supabase
                .from('usuarios')
                .select('email, password, limiteNumeros')
                .eq('email', credenciales.email)
                .single();
                
            if (error) {
                console.log(`  ❌ Usuario no encontrado: ${error.message}`);
                continue;
            }
            
            console.log(`  ✅ Usuario encontrado: ${usuario.email}`);
            console.log(`  Hash en BD: ${usuario.password.substring(0, 20)}...`);
            
            // Verificar contraseña
            try {
                const passwordMatch = await bcrypt.compare(credenciales.password, usuario.password);
                if (passwordMatch) {
                    console.log(`  ✅ Contraseña correcta`);
                    console.log(`  ✅ LOGIN EXITOSO para ${credenciales.email}`);
                } else {
                    console.log(`  ❌ Contraseña incorrecta`);
                    
                    // Intentar con contraseña sin hash (en caso de que esté mal guardada)
                    if (credenciales.password === usuario.password) {
                        console.log(`  ⚠️  La contraseña está guardada sin hash!`);
                    }
                }
            } catch (bcryptError) {
                console.log(`  ❌ Error en bcrypt: ${bcryptError.message}`);
                
                // Si bcrypt falla, podría ser que la contraseña no esté hasheada
                if (credenciales.password === usuario.password) {
                    console.log(`  ⚠️  Contraseña coincide sin hash`);
                }
            }
        }
        
        // Mostrar todos los usuarios para referencia
        console.log('\n5. Todos los usuarios en la base de datos:');
        usuarios.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`);
            console.log(`   Password hash: ${user.password.substring(0, 30)}...`);
            console.log(`   Límite: ${user.limiteNumeros}`);
        });
        
    } catch (error) {
        console.log('❌ Error general:', error);
    }
}

// Ejecutar diagnóstico
diagnosticoCompleto().then(() => {
    console.log('\n🏁 Diagnóstico completado');
}).catch(err => {
    console.log('💥 Error fatal:', err);
});