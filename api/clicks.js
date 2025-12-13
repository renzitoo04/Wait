import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id, days = '30' } = req.query; // id = link_id
  if (!id) return res.status(400).json({ error: 'Falta id' });

  const nDays = Math.max(1, Math.min(parseInt(days, 10) || 30, 365));
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(from.getUTCDate() - (nDays - 1));

  // Traer clicks
  const { data, error } = await supabase
    .from('clicks')
    .select('clicked_at')
    .eq('link_id', id)
    .gte('clicked_at', from.toISOString());

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error consultando clicks' });
  }

  // Generar serie continua día a día
  const counts = {};
  const cursor = new Date(from);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    counts[key] = 0;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const row of (data || [])) {
    const d = new Date(row.clicked_at);
    const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      .toISOString().slice(0, 10);
    if (counts[key] !== undefined) counts[key]++;
  }

  const labels = Object.keys(counts).sort();
  const values = labels.map(k => counts[k]);

  res.status(200).json({ labels, values });
}
