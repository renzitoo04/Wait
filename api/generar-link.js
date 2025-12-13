import dotenv from 'dotenv';
dotenv.config();

import { Preference } from 'mercadopago';

const preference = new Preference({ accessToken: process.env.MERCADO_PAGO_TOKEN });

export default async function handler(req, res) {
  const plan = req.method === 'POST' ? req.body.plan : req.query.plan;
  const userEmail = req.method === 'POST' ? req.body.email : req.query.email;
  
  if (!plan || !userEmail) {
    console.warn("❌ Faltan parámetros requeridos.");
    return res.status(400).json({ error: 'Falta el parámetro "plan" o "email".' });
  }

  const planes = {
    plan_1_numeros: { title: 'Plan PRO - 1 número', price: 4200 },

    plan_2_numeros: { title: 'Plan PRO - 2 números', price: 8400 },
    plan_3_numeros: { title: 'Plan PRO - 3 números', price: 12600 },
    plan_4_numeros: { title: 'Plan PRO - 4 números', price: 16800 },
    plan_5_numeros: { title: 'Plan PRO - 5 números', price: 21000},
    plan_6_numeros: { title: 'Plan PRO - 6 números', price: 25200 },
    plan_7_numeros: { title: 'Plan PRO - 7 números', price: 29400 },
    plan_8_numeros: { title: 'Plan PRO - 8 números', price: 33600 },
    plan_9_numeros: { title: 'Plan PRO - 9 números', price: 37800 },
    plan_10_numeros: { title: 'Plan PRO - 10 números', price: 40200 },
    plan_11_numeros: { title: 'Plan PRO - 11 números', price: 44220 },
    plan_12_numeros: { title: 'Plan PRO - 12 números', price: 48240 },
    plan_13_numeros: { title: 'Plan PRO - 13 números', price: 52260 },
    plan_14_numeros: { title: 'Plan PRO - 14 números', price: 56280 },
    plan_15_numeros: { title: 'Plan PRO - 15 números', price: 60300 },
    plan_16_numeros: { title: 'Plan PRO - 16 números', price: 64320 },
    plan_17_numeros: { title: 'Plan PRO - 17 números', price: 68340 },
    plan_18_numeros: { title: 'Plan PRO - 18 números', price: 72360 },
    plan_19_numeros: { title: 'Plan PRO - 19 números', price: 76380 },
    plan_20_numeros: { title: 'Plan PRO - 20 números', price: 80400 },
  };

  const planInfo = planes[plan];

  if (!planInfo) {
    return res.status(400).json({ error: 'Plan no válido o no especificado.' });
  }

  try {
    const response = await preference.create({
      body: {
        items: [
          {
            title: planInfo.title,
            quantity: 1,
            unit_price: planInfo.price
          }
        ],
        external_reference: userEmail, // Usamos el email como referencia
        back_urls: {
          success: 'https://www.linkify.com.ar/panel',
          failure: 'https://www.linkify.com.ar/fallo',
          pending: 'https://www.linkify.com.ar/pendiente'
        },
        auto_return: 'approved',
        notification_url: 'https://www.linkify.com.ar/api/webhook' // Asegúrate de configurar esto
      }
    });

    return res.status(200).json({ init_point: response.init_point });
  } catch (err) {
    console.error('Error al crear preferencia de Mercado Pago:', err);
    return res.status(500).json({ error: 'Error al generar el link de pago', detalles: err.message });
  }
}
