import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const indicesRotacion = {}; // Control de índices de rotación por ID

// ✅ Función para limpiar números (solo dígitos)
function limpiarNumero(numero) {
  if (!numero) return '';
  return String(numero).replace(/\D/g, '');
}

// ✅ Función para acortar links (placeholder)
async function acortarLink(linkOriginal) {
  try {
    return linkOriginal;
  } catch (error) {
    console.error('Error en la función acortarLink:', error);
    return linkOriginal;
  }
}

// ✅ Función para enviar evento a Facebook Conversions API
async function enviarEventoFacebook({ pixelId, accessToken, eventName, ip, userAgent, referer, fbp, fbc }) {
  try {
    if (!pixelId || !accessToken) {
      console.log('Facebook Pixel no configurado, omitiendo evento');
      return;
    }

    const eventData = {
      data: [{
        event_name: eventName || 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: referer || '',
        user_data: {
          client_ip_address: ip,
          client_user_agent: userAgent
        }
      }]
    };

    // Agregar cookies de Facebook si existen
    if (fbp) eventData.data[0].user_data.fbp = fbp;
    if (fbc) eventData.data[0].user_data.fbc = fbc;

    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Evento enviado a Facebook:', result);
    } else {
      console.error('❌ Error al enviar evento a Facebook:', result);
    }
  } catch (error) {
    console.error('❌ Error en enviarEventoFacebook:', error);
    // No lanzar error para no romper el flujo de redirección
  }
}

export default async function handler(req, res) {
  // 🔹 Crear nuevo link
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos. Asegúrate de enviar el email, números y mensaje.' });
    }

    // Validar la suscripción
    try {
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('suscripcion_valida_hasta')
        .eq('email', email)
        .single();

      if (errorUsuario || !usuario) {
        console.error('Error al verificar la suscripción:', errorUsuario);
        return res.status(500).json({ error: 'Error al verificar la suscripción.' });
      }

      const hoy = new Date().toISOString().split('T')[0];
      if (!usuario.suscripcion_valida_hasta || usuario.suscripcion_valida_hasta < hoy) {
        return res.status(403).json({
          error: 'Tu suscripción ha vencido. Por favor, renovala para continuar.',
        });
      }
    } catch (error) {
      console.error('Error al verificar la suscripción:', error);
      return res.status(500).json({ error: 'Error interno al verificar la suscripción.' });
    }

    // Filtrar y limpiar números válidos
    const numerosValidos = numeros
      .filter(num => num && num !== '+549')
      .map(limpiarNumero)
      .filter(n => n.length > 5);

    if (numerosValidos.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos.' });
    }

    try {
      // Verificar si el usuario ya tiene un link
      const { data: linkExistente } = await supabase
        .from('link')
        .select('id')
        .eq('email', email)
        .single();

      if (linkExistente) {
        return res.status(400).json({ error: 'Ya tienes un link generado. No puedes crear más de uno.' });
      }

      // Generar ID único
      const id = Math.random().toString(36).substring(2, 8);

      // Crear link dinámico
      const linkDinamico = `${req.headers.origin || 'http://localhost:3000'}/api/soporte?id=${id}`;

      // Guardar en Supabase
      const { error } = await supabase
        .from('link')
        .insert([{ id, email, numeros: numerosValidos, mensaje, link: linkDinamico }]);

      if (error) {
        console.error('Error al guardar en Supabase:', error);
        return res.status(500).json({ error: 'Error al guardar la configuración.' });
      }

      return res.status(200).json({ id, link: linkDinamico });
    } catch (error) {
      console.error('Error generando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  // 🔹 Redirección al número de WhatsApp
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id) return res.status(400).json({ error: 'Falta el ID del link.' });

    try {
      // Obtener datos del link incluyendo el email del dueño
      const { data: linkData, error } = await supabase
        .from('link')
        .select('numeros, mensaje, email')
        .eq('id', id)
        .single();

      if (error || !linkData) {
        return res.status(404).json({ error: 'No se encontró el link.' });
      }

      // Extraer datos del request para tracking
      const ip = String((req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')).split(',')[0].trim();
      const userAgent = req.headers['user-agent'] || '';
      const referer = req.headers['referer'] || req.headers['referrer'] || '';

      // Extraer cookies _fbp y _fbc
      const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {}) || {};
      const fbp = cookies._fbp;
      const fbc = cookies._fbc;

      // Registrar el click (asincrónicamente)
      (async () => {
        try {
          await supabase.from('clicks').insert([{ link_id: id, ip, ua: userAgent, referer }]);
        } catch (e) {
          console.error('No se pudo registrar el click:', e);
        }
      })();

      // Obtener configuración de Facebook del usuario dueño del link
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('facebook_pixel_id, facebook_access_token, facebook_event_name')
        .eq('email', linkData.email)
        .single();

      // Enviar evento a Facebook si está configurado (sin bloquear la redirección)
      if (usuario && usuario.facebook_pixel_id && usuario.facebook_access_token) {
        enviarEventoFacebook({
          pixelId: usuario.facebook_pixel_id,
          accessToken: usuario.facebook_access_token,
          eventName: usuario.facebook_event_name || 'Lead',
          ip,
          userAgent,
          referer,
          fbp,
          fbc
        }).catch(err => console.error('Error enviando evento a Facebook:', err));
      }

      // Rotación entre números
      if (!indicesRotacion[id]) indicesRotacion[id] = 0;
      const numeroSeleccionado = limpiarNumero(linkData.numeros[indicesRotacion[id]]);
      indicesRotacion[id] = (indicesRotacion[id] + 1) % linkData.numeros.length;

      const mensajeCodificado = encodeURIComponent(linkData.mensaje || '');
      const whatsappLink = `https://wa.me/${numeroSeleccionado}?text=${mensajeCodificado}`;

      // ✅ Validar formato antes de redirigir
      try {
        new URL(whatsappLink);
        return res.redirect(302, whatsappLink);
      } catch (err) {
        console.error('Error: link inválido generado →', whatsappLink);
        return res.status(400).json({ error: 'Link de WhatsApp inválido.' });
      }
    } catch (error) {
      console.error('Error al redirigir:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  // 🔹 Actualizar link existente
  if (req.method === 'PATCH') {
    const { email, id, numeros, mensaje } = req.body;

    if (!email || !id || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos. Asegúrate de enviar el email, ID, números y mensaje.' });
    }

    const numerosValidos = numeros
      .filter(num => num && num !== '+549')
      .map(limpiarNumero)
      .filter(n => n.length > 5);

    if (numerosValidos.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos.' });
    }

    try {
      const { error } = await supabase
        .from('link')
        .update({ numeros: numerosValidos, mensaje })
        .eq('id', id)
        .eq('email', email);

      if (error) {
        console.error('Error al actualizar el link en Supabase:', error);
        return res.status(500).json({ error: 'No se pudo actualizar el link.' });
      }

      return res.status(200).json({ message: 'Link actualizado correctamente.' });
    } catch (error) {
      console.error('Error actualizando link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  // 🔹 Método no permitido
  return res.status(405).json({ error: 'Método no permitido.' });
}
