import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function crearUsuario() {
    console.log('🔧 CREANDO USUARIO DE PRUEBA');
    console.log('============================\n');

    try {
        // 1. Verificar conexión
        console.log('1. Verificando conexión a Supabase...');
        console.log('URL:', process.env.SUPABASE_URL);
        console.log('Key:', process.env.SUPABASE_KEY ? 'Configurada ✓' : 'NO configurada ✗');

        // 2. Generar contraseña hasheada
        const email = 'test@ejemplo.com';
        const password = '123456';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('\n2. Contraseña generada:');
        console.log('Password original:', password);
        console.log('Password hasheada:', hashedPassword);

        // 3. Verificar si el usuario ya existe
        console.log('\n3. Verificando si el usuario existe...');
        const { data: usuarioExistente, error: errorBusqueda } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
            console.log('❌ Error al buscar usuario:', errorBusqueda);
            return;
        }

        if (usuarioExistente) {
            console.log('⚠️  Usuario ya existe, actualizando...');

            // Actualizar usuario
            const { error: errorUpdate } = await supabase
                .from('usuarios')
                .update({
                    password: hashedPassword,
                    limiteNumeros: 5,
                    telefono: '+5491234567890',
                    suscripcion_valida_hasta: '2025-12-31'
                })
                .eq('email', email);

            if (errorUpdate) {
                console.log('❌ Error actualizando:', errorUpdate);
                return;
            }

            console.log('✅ Usuario actualizado exitosamente');
        } else {
            console.log('📝 Creando nuevo usuario...');

            // Crear usuario
            const { data: nuevoUsuario, error: errorCreacion } = await supabase
                .from('usuarios')
                .insert([{
                    email: email,
                    password: hashedPassword,
                    telefono: '+5491234567890',
                    limiteNumeros: 5,
                    suscripcion_valida_hasta: '2025-12-31'
                }])
                .select();

            if (errorCreacion) {
                console.log('❌ Error creando usuario:', errorCreacion);
                console.log('Detalles:', JSON.stringify(errorCreacion, null, 2));
                return;
            }

            console.log('✅ Usuario creado exitosamente:', nuevoUsuario);
        }

        // 4. Verificar que funciona
        console.log('\n4. Probando login...');
        const { data: usuario, error: errorLogin } = await supabase
            .from('usuarios')
            .select('email, password, limiteNumeros')
            .eq('email', email)
            .single();

        if (errorLogin) {
            console.log('❌ Error en login:', errorLogin);
            return;
        }

        console.log('✅ Usuario encontrado:', usuario.email);

        const passwordMatch = await bcrypt.compare(password, usuario.password);

        if (passwordMatch) {
            console.log('✅ ¡Contraseña verificada correctamente!\n');
            console.log('═══════════════════════════════════');
            console.log('Credenciales para login:');
            console.log('Email:', email);
            console.log('Password:', password);
            console.log('═══════════════════════════════════');
        } else {
            console.log('❌ La contraseña no coincide');
        }

    } catch (error) {
        console.log('❌ Error general:', error);
        console.log('Detalles:', JSON.stringify(error, null, 2));
    }
}

crearUsuario().then(() => {
    console.log('\n🏁 Proceso completado');
    process.exit(0);
}).catch(err => {
    console.log('💥 Error fatal:', err);
    process.exit(1);
});
