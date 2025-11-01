import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('client_name');
      
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { client_name, domain_url, client_id, password, latest_pull_date, latest_pull_by, gsos_version } = req.body;
      
      const { data, error } = await supabase
        .from('clients')
        .insert({
          client_name,
          domain_url,
          client_id,
          password,
          original_password: password,
          latest_pull_date: latest_pull_date || null,
          latest_pull_by: latest_pull_by || null,
          gsos_version: gsos_version || null
        })
        .select();
      
      if (error) throw error;
      return res.status(201).json({ id: data[0].id, message: 'Client added successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}