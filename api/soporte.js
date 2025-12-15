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
    const { email, numeros, mensaje, facebookPixelId, facebookAccessToken, facebookEventName } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos. Asegúrate de enviar el email, números y mensaje.' });
    }

    // Guardar datos de Facebook Pixel en tabla usuarios (si se proporcionaron)
    if (facebookPixelId || facebookAccessToken || facebookEventName) {
      try {
        const updateData = {};
        if (facebookPixelId) updateData.facebook_pixel_id = facebookPixelId;
        if (facebookAccessToken) updateData.facebook_access_token = facebookAccessToken;
        if (facebookEventName) updateData.facebook_event_name = facebookEventName;

        await supabase
          .from('usuarios')
          .update(updateData)
          .eq('email', email);

        console.log('✅ Datos de Facebook Pixel actualizados para:', email);
      } catch (error) {
        console.error('❌ Error actualizando Facebook Pixel:', error);
        // No fallar la creación del link si falla el update de Facebook
      }
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

      // ✅ Validar formato
      try {
        new URL(whatsappLink);
      } catch (err) {
        console.error('Error: link inválido generado →', whatsappLink);
        return res.status(400).json({ error: 'Link de WhatsApp inválido.' });
      }

      // 🔹 Página intermedia con diseño Linky Ads (Naranja + Negro)
      const htmlPage = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Linky Ads - Conectando...</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0a0a0a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: hidden;
      position: relative;
    }

    /* Animated background */
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        radial-gradient(circle at 20% 50%, rgba(255, 107, 0, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 50%, rgba(255, 145, 0, 0.12) 0%, transparent 50%);
      animation: pulse 4s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }

    .container {
      background: linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%);
      border: 3px solid transparent;
      background-clip: padding-box;
      position: relative;
      border-radius: 30px;
      padding: 50px 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      animation: slideUp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      box-shadow:
        0 25px 50px rgba(255, 107, 0, 0.3),
        0 0 100px rgba(255, 107, 0, 0.1),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    .container::before {
      content: '';
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      background: linear-gradient(45deg, #ff6b00, #ff9100, #ff6b00);
      border-radius: 30px;
      z-index: -1;
      opacity: 0.8;
      animation: borderGlow 3s linear infinite;
    }

    @keyframes borderGlow {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .logo {
      font-size: 48px;
      font-weight: 900;
      background: linear-gradient(135deg, #ff6b00 0%, #ff9100 50%, #ffb800 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 3px;
      text-shadow: 0 0 30px rgba(255, 107, 0, 0.5);
      animation: logoGlow 2s ease-in-out infinite;
    }

    @keyframes logoGlow {
      0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 107, 0, 0.6)); }
      50% { filter: drop-shadow(0 0 20px rgba(255, 107, 0, 0.9)); }
    }

    .icon-container {
      width: 120px;
      height: 120px;
      margin: 20px auto 30px;
      background: linear-gradient(135deg, #ff6b00 0%, #ff9100 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      animation: iconPulse 2s ease-in-out infinite;
      box-shadow:
        0 0 40px rgba(255, 107, 0, 0.6),
        0 0 80px rgba(255, 107, 0, 0.3),
        inset 0 -10px 20px rgba(0, 0, 0, 0.3);
    }

    @keyframes iconPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .icon-container::before {
      content: '';
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      background: linear-gradient(45deg, transparent, rgba(255, 107, 0, 0.3), transparent);
      border-radius: 50%;
      animation: rotate 3s linear infinite;
    }

    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .icon-container svg {
      width: 70px;
      height: 70px;
      fill: #0a0a0a;
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4));
      z-index: 1;
      position: relative;
    }

    h1 {
      color: #ffffff;
      font-size: 32px;
      margin-bottom: 15px;
      font-weight: 700;
      text-shadow: 0 2px 10px rgba(255, 107, 0, 0.3);
    }

    p {
      color: #b0b0b0;
      font-size: 16px;
      margin-bottom: 35px;
      line-height: 1.6;
    }

    .btn {
      background: linear-gradient(135deg, #ff6b00 0%, #ff9100 100%);
      color: #0a0a0a;
      border: none;
      padding: 18px 45px;
      font-size: 20px;
      font-weight: 900;
      border-radius: 50px;
      cursor: pointer;
      width: 100%;
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      box-shadow:
        0 10px 30px rgba(255, 107, 0, 0.4),
        inset 0 -3px 0 rgba(0, 0, 0, 0.2);
      text-transform: uppercase;
      letter-spacing: 2px;
      position: relative;
      overflow: hidden;
    }

    .btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    .btn:hover::before {
      width: 300px;
      height: 300px;
    }

    .btn:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow:
        0 15px 40px rgba(255, 107, 0, 0.6),
        inset 0 -3px 0 rgba(0, 0, 0, 0.2);
    }

    .btn:active {
      transform: translateY(-1px) scale(1);
    }

    .btn.loading {
      background: linear-gradient(135deg, #ff9100 0%, #ffb800 100%);
      cursor: not-allowed;
      animation: buttonPulse 1.5s ease-in-out infinite;
    }

    @keyframes buttonPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .loading-text {
      display: none;
      margin-top: 25px;
      color: #ff6b00;
      font-size: 15px;
      font-weight: 600;
      animation: fadeInOut 2s ease-in-out infinite;
    }

    .loading-text.show {
      display: block;
    }

    @keyframes fadeInOut {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    .particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
    }

    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: #ff6b00;
      border-radius: 50%;
      animation: float 4s infinite;
      opacity: 0.6;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0) translateX(0);
        opacity: 0;
      }
      50% {
        opacity: 0.6;
      }
      100% {
        transform: translateY(-100vh) translateX(50px);
        opacity: 0;
      }
    }

    /* Responsive */
    @media (max-width: 600px) {
      .container {
        padding: 40px 25px;
      }

      .logo {
        font-size: 36px;
      }

      h1 {
        font-size: 26px;
      }

      .icon-container {
        width: 100px;
        height: 100px;
      }

      .icon-container svg {
        width: 60px;
        height: 60px;
      }

      .btn {
        padding: 16px 35px;
        font-size: 18px;
      }
    }
  </style>
</head>
<body>
  <div class="particles">
    ${Array.from({length: 15}, (_, i) =>
      `<div class="particle" style="left: ${Math.random() * 100}%; animation-delay: ${Math.random() * 4}s;"></div>`
    ).join('')}
  </div>

  <div class="container">
    <div class="logo">LINKY ADS</div>

    <div class="icon-container">
      <svg viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </div>

    <h1>¡Todo Listo!</h1>
    <p>Haz clic en el botón para abrir WhatsApp y comenzar tu conversación.</p>

    <button class="btn" onclick="abrirWhatsApp()">
      ABRIR WHATSAPP
    </button>

    <div class="loading-text" id="loading">Conectando con WhatsApp...</div>
  </div>

  <script>
    const whatsappUrl = ${JSON.stringify(whatsappLink)};
    const linkId = ${JSON.stringify(id)};
    const pixelId = ${JSON.stringify(usuario?.facebook_pixel_id || null)};
    const accessToken = ${JSON.stringify(usuario?.facebook_access_token || null)};
    const eventName = ${JSON.stringify(usuario?.facebook_event_name || 'Lead')};
    const fbp = ${JSON.stringify(fbp || null)};
    const fbc = ${JSON.stringify(fbc || null)};

    async function abrirWhatsApp() {
      const btn = document.querySelector('.btn');
      const loading = document.getElementById('loading');

      btn.classList.add('loading');
      btn.textContent = 'CONECTANDO...';
      loading.classList.add('show');

      // Enviar evento a Facebook si está configurado
      if (pixelId && accessToken) {
        try {
          await enviarEventoFacebook({
            pixelId,
            accessToken,
            eventName,
            ip: '',
            userAgent: navigator.userAgent,
            referer: document.referrer,
            fbp,
            fbc
          });
        } catch (error) {
          console.error('Error enviando evento:', error);
        }
      }

      // Pequeño delay para efecto visual
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 500);
    }

    // Función auxiliar para enviar evento
    async function enviarEventoFacebook({ pixelId, accessToken, eventName, ip, userAgent, referer, fbp, fbc }) {
      if (!pixelId || !accessToken) return;

      const eventData = {
        data: [{
          event_name: eventName || 'Lead',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: referer || window.location.href,
          user_data: {
            client_user_agent: userAgent
          }
        }]
      };

      if (fbp) eventData.data[0].user_data.fbp = fbp;
      if (fbc) eventData.data[0].user_data.fbc = fbc;

      const url = \`https://graph.facebook.com/v21.0/\${pixelId}/events?access_token=\${accessToken}\`;

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
    }
  </script>
</body>
</html>
      `;

      return res.status(200).setHeader('Content-Type', 'text/html').send(htmlPage);
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
