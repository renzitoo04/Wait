import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function arreglarLogin() {
    console.log('🔧 ARREGLANDO LOGIN');
    console.log('===================');
    
    try {
        // 1. Verificar usuarios existentes
        console.log('\n1. Verificando usuarios existentes...');
        const { data: usuarios, error: errorUsuarios } = await supabase
            .from('usuarios')
            .select('*');
            
        if (errorUsuarios) {
            console.log('❌ Error:', errorUsuarios);
            return;
        }
        
        console.log(`Usuarios encontrados: ${usuarios.length}`);
        
        // 2. Crear o actualizar usuario de prueba con contraseña correcta
        console.log('\n2. Creando/actualizando usuario de prueba...');
        
        const testEmail = 'test@test.com';
        const testPassword = '123456';
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        
        // Verificar si el usuario ya existe
        const { data: usuarioExistente } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', testEmail)
            .single();
            
        if (usuarioExistente) {
            // Actualizar contraseña
            const { error: errorUpdate } = await supabase
                .from('usuarios')
                .update({ password: hashedPassword })
                .eq('email', testEmail);
                
            if (errorUpdate) {
                console.log('❌ Error actualizando usuario:', errorUpdate);
                return;
            }
            
            console.log('✅ Usuario actualizado con nueva contraseña hasheada');
        } else {
            // Crear nuevo usuario
            const { error: errorCreate } = await supabase
                .from('usuarios')
                .insert([{
                    email: testEmail,
                    password: hashedPassword,
                    limiteNumeros: 5
                }]);
                
            if (errorCreate) {
                console.log('❌ Error creando usuario:', errorCreate);
                return;
            }
            
            console.log('✅ Usuario creado con contraseña hasheada');
        }
        
        // 3. Probar login
        console.log('\n3. Probando login...');
        
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('email, password, limiteNumeros')
            .eq('email', testEmail)
            .single();
            
        if (error) {
            console.log('❌ Error buscando usuario:', error);
            return;
        }
        
        console.log(`Usuario encontrado: ${usuario.email}`);
        
        const passwordMatch = await bcrypt.compare(testPassword, usuario.password);
        
        if (passwordMatch) {
            console.log('✅ ¡LOGIN FUNCIONA CORRECTAMENTE!');
            console.log('Credenciales de prueba:');
            console.log(`Email: ${testEmail}`);
            console.log(`Password: ${testPassword}`);
        } else {
            console.log('❌ La contraseña no coincide');
        }
        
    } catch (error) {
        console.log('❌ Error general:', error);
    }
}

arreglarLogin();