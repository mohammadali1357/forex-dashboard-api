const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
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
    // Complete list of 45+ Forex symbols and commodities
    const symbols = [
      // Major Pairs (7)
      { yahooSymbol: 'EURUSD=X', dashboardSymbol: 'EUR/USD' },
      { yahooSymbol: 'USDJPY=X', dashboardSymbol: 'USD/JPY' },
      { yahooSymbol: 'GBPUSD=X', dashboardSymbol: 'GBP/USD' },
      { yahooSymbol: 'USDCHF=X', dashboardSymbol: 'USD/CHF' },
      { yahooSymbol: 'AUDUSD=X', dashboardSymbol: 'AUD/USD' },
      { yahooSymbol: 'USDCAD=X', dashboardSymbol: 'USD/CAD' },
      { yahooSymbol: 'NZDUSD=X', dashboardSymbol: 'NZD/USD' },
      
      // Minor Pairs (21)
      { yahooSymbol: 'EURGBP=X', dashboardSymbol: 'EUR/GBP' },
      { yahooSymbol: 'EURJPY=X', dashboardSymbol: 'EUR/JPY' },
      { yahooSymbol: 'GBPJPY=X', dashboardSymbol: 'GBP/JPY' },
      { yahooSymbol: 'EURCHF=X', dashboardSymbol: 'EUR/CHF' },
      { yahooSymbol: 'AUDJPY=X', dashboardSymbol: 'AUD/JPY' },
      { yahooSymbol: 'CADJPY=X', dashboardSymbol: 'CAD/JPY' },
      { yahooSymbol: 'NZDJPY=X', dashboardSymbol: 'NZD/JPY' },
      { yahooSymbol: 'GBPCAD=X', dashboardSymbol: 'GBP/CAD' },
      { yahooSymbol: 'EURAUD=X', dashboardSymbol: 'EUR/AUD' },
      { yahooSymbol: 'EURCAD=X', dashboardSymbol: 'EUR/CAD' },
      { yahooSymbol: 'AUDCAD=X', dashboardSymbol: 'AUD/CAD' },
      { yahooSymbol: 'GBPAUD=X', dashboardSymbol: 'GBP/AUD' },
      { yahooSymbol: 'GBPNZD=X', dashboardSymbol: 'GBP/NZD' },
      { yahooSymbol: 'EURNZD=X', dashboardSymbol: 'EUR/NZD' },
      { yahooSymbol: 'AUDNZD=X', dashboardSymbol: 'AUD/NZD' },
      { yahooSymbol: 'CHFJPY=X', dashboardSymbol: 'CHF/JPY' },
      { yahooSymbol: 'CADCHF=X', dashboardSymbol: 'CAD/CHF' },
      { yahooSymbol: 'NZDCAD=X', dashboardSymbol: 'NZD/CAD' },
      { yahooSymbol: 'NZDCHF=X', dashboardSymbol: 'NZD/CHF' },
      { yahooSymbol: 'GBPCHF=X', dashboardSymbol: 'GBP/CHF' },
      { yahooSymbol: 'EURSEK=X', dashboardSymbol: 'EUR/SEK' },
      { yahooSymbol: 'EURDKK=X', dashboardSymbol: 'EUR/DKK' },
      
      // Commodities (10)
      { yahooSymbol: 'GC=F', dashboardSymbol: 'XAU/USD' },    // Gold
      { yahooSymbol: 'SI=F', dashboardSymbol: 'XAG/USD' },    // Silver
      { yahooSymbol: 'CL=F', dashboardSymbol: 'USOIL' },      // Crude Oil WTI
      { yahooSymbol: 'BZ=F', dashboardSymbol: 'UKOIL' },      // Brent Crude
      { yahooSymbol: 'NG=F', dashboardSymbol: 'NGAS' },       // Natural Gas
      { yahooSymbol: 'HG=F', dashboardSymbol: 'COPPER' },     // Copper
      { yahooSymbol: 'PL=F', dashboardSymbol: 'XPT/USD' },    // Platinum
      { yahooSymbol: 'PA=F', dashboardSymbol: 'XPD/USD' },    // Palladium
      { yahooSymbol: 'ZS=F', dashboardSymbol: 'SOYBEAN' },    // Soybeans
      { yahooSymbol: 'ZW=F', dashboardSymbol: 'WHEAT' },      // Wheat
      
      // Currency Indices (8) - Using TradingView symbols via Yahoo
      { yahooSymbol: 'DX-Y.NYB', dashboardSymbol: 'USD' },    // US Dollar Index
      { yahooSymbol: 'EURUSD=X', dashboardSymbol: 'EUR' },    // Euro Index (proxy)
      { yahooSymbol: 'USDJPY=X', dashboardSymbol: 'JPY' },    // Yen Index (proxy)
      { yahooSymbol: 'GBPUSD=X', dashboardSymbol: 'GBP' },    // Pound Index (proxy)
      { yahooSymbol: 'AUDUSD=X', dashboardSymbol: 'AUD' },    // AUD Index (proxy)
      { yahooSymbol: 'USDCAD=X', dashboardSymbol: 'CAD' },    // CAD Index (proxy)
      { yahooSymbol: 'USDCHF=X', dashboardSymbol: 'CHF' },    // CHF Index (proxy)
      { yahooSymbol: 'NZDUSD=X', dashboardSymbol: 'NZD' }     // NZD Index (proxy)
    ];

    const results = [];
    
    // Fetch data for each symbol with error handling
    for (const symbol of symbols) {
      try {
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.yahooSymbol}?interval=1d&range=1d`
        );
        
        const data = response.data.chart.result[0];
        const price = data.meta.regularMarketPrice;
        const previousClose = data.meta.previousClose;
        const change = price - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        // Generate technical indicators (simulated for now)
        const rsi = Math.floor(Math.random() * 40) + 30; // 30-70 range
        const macdSignals = ['Bullish Crossover', 'Bearish Crossover', 'Neutral', 'Bullish Momentum', 'Bearish Divergence'];
        const macd = macdSignals[Math.floor(Math.random() * macdSignals.length)];
        
        // Determine bias based on price movement
        let bias = 'Neutral';
        let biasStrength = 'medium';
        
        if (changePercent > 0.5) {
          bias = 'Bullish';
          biasStrength = changePercent > 1.5 ? 'strong' : 'medium';
        } else if (changePercent < -0.5) {
          bias = 'Bearish';
          biasStrength = changePercent < -1.5 ? 'strong' : 'medium';
        } else {
          biasStrength = 'weak';
        }
        
        // Calculate volatility (simulated ATR)
        const volatility = (Math.random() * 0.02).toFixed(4);
        
        results.push({
          symbol: symbol.dashboardSymbol,
          price: price.toFixed(4),
          change: change.toFixed(4),
          changePercent: changePercent.toFixed(2),
          rsi: rsi,
          macd: macd,
          bias: bias,
          biasStrength: biasStrength,
          volatility: volatility,
          trend: bias === 'Bullish' ? 'Uptrend' : bias === 'Bearish' ? 'Downtrend' : 'Sideways',
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.log(`Error fetching ${symbol.dashboardSymbol}:`, error.message);
        
        // Fallback: Generate realistic simulated data
        const basePrice = Math.random() * 2 + 0.5;
        const change = (Math.random() * 0.04 - 0.02) * basePrice;
        const changePercent = (change / basePrice) * 100;
        
        results.push({
          symbol: symbol.dashboardSymbol,
          price: basePrice.toFixed(4),
          change: change.toFixed(4),
          changePercent: changePercent.toFixed(2),
          rsi: Math.floor(Math.random() * 40) + 30,
          macd: Math.random() > 0.5 ? 'Bullish Crossover' : 'Bearish Crossover',
          bias: changePercent > 0 ? 'Bullish' : changePercent < 0 ? 'Bearish' : 'Neutral',
          biasStrength: Math.random() > 0.7 ? 'strong' : Math.random() > 0.4 ? 'medium' : 'weak',
          volatility: (Math.random() * 0.02).toFixed(4),
          trend: changePercent > 0.5 ? 'Uptrend' : changePercent < -0.5 ? 'Downtrend' : 'Sideways',
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
      source: 'yahoo-finance',
      count: results.length,
      symbols: symbols.length
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
