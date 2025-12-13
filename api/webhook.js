import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Inicializar cliente de Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_TOKEN });
const paymentClient = new Payment(client);

export default async function handler(req, res) {
  try {
    console.log("Webhook recibido:", req.body);

    const { type, action, data } = req.body;

    // --- PAGOS ÚNICOS ---
    if (type === "payment" && action === "payment.created") {
      const paymentId = data.id;

      // Obtener detalles del pago
      const payment = await paymentClient.get({ id: paymentId });
      console.log("Detalles del pago único:", payment);

      if (payment && payment.status === "approved") {
        const email = payment.external_reference;
        const descripcion = payment.description || "";
        console.log(`Pago único aprobado para: ${email}, Plan: ${descripcion}`);

        // Determinar limiteNumeros según el plan
        let limiteNumeros = 1;
        if (descripcion.includes("2 números")) limiteNumeros = 2;
        if (descripcion.includes("3 números")) limiteNumeros = 3;
        if (descripcion.includes("4 números")) limiteNumeros = 4;

        // Calcular nueva fecha (un mes desde hoy)
        const nuevaFecha = new Date();
        nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);

        // Actualizar en Supabase
        const { error } = await supabase
          .from("usuarios")
          .update({
            limiteNumeros,
            suscripcion_valida_hasta: nuevaFecha.toISOString()
          })
          .eq("email", email);

        if (error) {
          console.error("Error actualizando en Supabase:", error);
          return res.status(500).json({ error });
        }

        console.log(`Supabase actualizado para ${email}`);
      }

      return res.status(200).json({ message: "Pago único procesado" });
    }

    // --- SUSCRIPCIONES / DÉBITOS AUTOMÁTICOS ---
    if (type === "authorized_payment" || action === "authorized_payment.created") {
      const paymentId = data.id;

      const payment = await paymentClient.get({ id: paymentId });
      console.log("Detalles del pago recurrente:", payment);

      if (payment && payment.status === "approved") {
        const email = payment.external_reference;
        const descripcion = payment.description || "";
        console.log(`Pago recurrente aprobado para: ${email}, Plan: ${descripcion}`);

        // Determinar limiteNumeros según el plan
        let limiteNumeros = 1;
        if (descripcion.includes("2 números")) limiteNumeros = 2;
        if (descripcion.includes("3 números")) limiteNumeros = 3;
        if (descripcion.includes("4 números")) limiteNumeros = 4;

        // Calcular nueva fecha (un mes desde hoy)
        const nuevaFecha = new Date();
        nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);

        const { error } = await supabase
          .from("usuarios")
          .update({
            limiteNumeros,
            suscripcion_valida_hasta: nuevaFecha.toISOString()
          })
          .eq("email", email);

        if (error) {
          console.error("Error actualizando en Supabase:", error);
          return res.status(500).json({ error });
        }

        console.log(`Supabase actualizado para ${email}`);
      }

      return res.status(200).json({ message: "Pago recurrente procesado" });
    }

    // --- CUALQUIER OTRO EVENTO ---
    console.log("Evento ignorado:", type, action);
    return res.status(200).json({ message: "Evento ignorado" });

  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: error.message });
  }
}
