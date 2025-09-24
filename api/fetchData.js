// Simple test API - put this in api/fetchData.js
module.exports = async (req, res) => {
  // Allow requests from any domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple test response
    res.status(200).json({
      success: true,
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      Data: [
        { symbol: 'EUR/USD', price: '1.0850' },
        { symbol: 'GBP/USD', price: '1.2650' }
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

