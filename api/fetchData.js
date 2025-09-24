// Simple serverless function for Forex data
const axios = require('axios');

module.exports = async (req, res) => {
  // Allow requests from any domain (important for your dashboard)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only respond to GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Your list of Forex symbols (simplified for testing)
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'];
    
    const results = [];
    
    for (const symbol of symbols) {
      try {
        // Using Yahoo Finance API (free, no key needed)
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}=X?interval=1d&range=1d`
        );
        
        const data = response.data.chart.result[0];
        const price = data.meta.regularMarketPrice;
        const previousClose = data.meta.previousClose;
        const change = price - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        results.push({
          symbol: symbol.replace('=X', '/USD'),
          price: price.toFixed(4),
          change: change.toFixed(4),
          changePercent: changePercent.toFixed(2),
          timestamp: new Date().toISOString()
        });
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.log(`Could not fetch ${symbol}:`, error.message);
        // Add fallback data if API fails
        results.push({
          symbol: symbol.replace('=X', '/USD'),
          price: (Math.random() * 1.5 + 0.5).toFixed(4),
          change: (Math.random() * 0.02 - 0.01).toFixed(4),
          changePercent: (Math.random() * 2 - 1).toFixed(2),
          timestamp: new Date().toISOString(),
          note: 'Simulated data (API unavailable)'
        });
      }
    }

    // Send successful response
    res.status(200).json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      source: 'yahoo-finance'
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market data',
      timestamp: new Date().toISOString()
    });
  }
};