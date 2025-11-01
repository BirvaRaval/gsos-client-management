export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: process.env.SUPABASE_URL ? 'Set' : 'Missing',
      supabase_key: process.env.SUPABASE_KEY ? 'Set' : 'Missing'
    }
  });
}