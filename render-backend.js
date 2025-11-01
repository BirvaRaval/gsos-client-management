const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: [
    'https://client-management-system-beige.vercel.app',
    'https://client-management-system-dhyv0li33-birvas-projects-88a78539.vercel.app',
    'https://client-management-system-1uxmhkcn6-birvas-projects-88a78539.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin']
}));

// Additional CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all clients
app.get('/api/clients', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('client_name');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new client
app.post('/api/clients', async (req, res) => {
  try {
    const { client_name, domain_url, client_id, password, latest_pull_date, latest_pull_by, gsos_version } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        client_name,
        domain_url,
        client_id,
        password: hashedPassword,
        original_password: password,
        latest_pull_date: latest_pull_date || null,
        latest_pull_by: latest_pull_by || null,
        gsos_version: gsos_version || null
      })
      .select();
    
    if (error) throw error;
    res.status(201).json({ id: data[0].id, message: 'Client added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client
app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, domain_url, client_id, password, latest_pull_date, latest_pull_by, gsos_version } = req.body;
    
    const updateData = {
      client_name,
      domain_url,
      client_id,
      latest_pull_date: latest_pull_date || null,
      latest_pull_by: latest_pull_by || null,
      gsos_version: gsos_version || null
    };
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
      updateData.original_password = password;
    }
    
    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete client
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get client details
app.get('/api/clients/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Client not found' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pull history
app.get('/api/clients/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('pull_history')
      .select('*')
      .eq('client_id', id)
      .order('pull_date', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add pull history
app.post('/api/clients/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { pull_date, pull_by, version } = req.body;
    
    // Add to pull history
    const { error: historyError } = await supabase
      .from('pull_history')
      .insert({
        client_id: id,
        pull_date,
        pull_by,
        version: version || null
      });
    
    if (historyError) throw historyError;
    
    // Update client's latest pull info
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        latest_pull_date: pull_date,
        latest_pull_by: pull_by,
        gsos_version: version || null
      })
      .eq('id', id);
    
    if (updateError) throw updateError;
    res.status(201).json({ message: 'Pull history added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});