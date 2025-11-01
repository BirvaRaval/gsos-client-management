const express = require('express');
const mysql = require('mysql2/promise');
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
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all clients
app.get('/api/clients', async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);
    const [rows] = await db.execute('SELECT * FROM clients ORDER BY client_name');
    await db.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new client
app.post('/api/clients', async (req, res) => {
  try {
    const { client_name, domain_url, client_id, password, latest_pull_date, latest_pull_by, gsos_version } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const db = await mysql.createConnection(dbConfig);
    const [result] = await db.execute(
      'INSERT INTO clients (client_name, domain_url, client_id, password, original_password, latest_pull_date, latest_pull_by, gsos_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [client_name, domain_url, client_id, hashedPassword, password, latest_pull_date || null, latest_pull_by || null, gsos_version || null]
    );
    await db.end();
    
    res.status(201).json({ id: result.insertId, message: 'Client added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client
app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, domain_url, client_id, password, latest_pull_date, latest_pull_by, gsos_version } = req.body;
    
    let query = 'UPDATE clients SET client_name = ?, domain_url = ?, client_id = ?, latest_pull_date = ?, latest_pull_by = ?, gsos_version = ?';
    let params = [client_name, domain_url, client_id, latest_pull_date || null, latest_pull_by || null, gsos_version || null];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?, original_password = ?';
      params.push(hashedPassword, password);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    const db = await mysql.createConnection(dbConfig);
    await db.execute(query, params);
    await db.end();
    
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete client
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await mysql.createConnection(dbConfig);
    await db.execute('DELETE FROM clients WHERE id = ?', [id]);
    await db.end();
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get client details
app.get('/api/clients/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await mysql.createConnection(dbConfig);
    const [rows] = await db.execute('SELECT * FROM clients WHERE id = ?', [id]);
    await db.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pull history
app.get('/api/clients/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await mysql.createConnection(dbConfig);
    const [rows] = await db.execute(
      'SELECT * FROM pull_history WHERE client_id = ? ORDER BY pull_date DESC',
      [id]
    );
    await db.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add pull history
app.post('/api/clients/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { pull_date, pull_by, version } = req.body;
    
    const db = await mysql.createConnection(dbConfig);
    
    await db.execute(
      'INSERT INTO pull_history (client_id, pull_date, pull_by, version) VALUES (?, ?, ?, ?)',
      [id, pull_date, pull_by, version || null]
    );
    
    await db.execute(
      'UPDATE clients SET latest_pull_date = ?, latest_pull_by = ?, gsos_version = ? WHERE id = ?',
      [pull_date, pull_by, version || null, id]
    );
    
    await db.end();
    res.status(201).json({ message: 'Pull history added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
