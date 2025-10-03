const axios = require('axios');

// Your Alpha Vantage API Key
const ALPHA_VANTAGE_API_KEY = 'SFQ7TST27CVZTOQU';

// Technical indicator calculations (simplified for speed)
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
}

function calculateMACD(prices) {
    if (prices.length < 26) return null;
    
    // Simplified MACD calculation
    const shortEMA = prices[0] * 0.15 + prices[12] * 0.85;
    const longEMA = prices[0] * 0.075 + prices[25] * 0.925;
    const macd = shortEMA - longEMA;
    
    return {
        macd: macd,
        signal: macd * 0.2,
        histogram: macd * 0.1
    };
}

function calculateATR(highs, lows, closes) {
    if (highs.length < 2) return null;
    
    // Simplified ATR calculation
    const tr1 = highs[0] - lows[0];
    const tr2 = Math.abs(highs[0] - closes[1]);
    const tr3 = Math.abs(lows[0] - closes[1]);
    return Math.max(tr1, tr2, tr3);
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Reduced symbol set for faster processing
        const symbolConfigs = [
            // Major Pairs (7) - Alpha Vantage uses "FROMTO" format
            { symbol: 'EUR/USD', alphaVantage: 'EURUSD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'USD/JPY', alphaVantage: 'USDJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'GBP/USD', alphaVantage: 'GBPUSD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'USD/CHF', alphaVantage: 'USDCHF', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'AUD/USD', alphaVantage: 'AUDUSD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'USD/CAD', alphaVantage: 'USDCAD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'NZD/USD', alphaVantage: 'NZDUSD', type: 'forex', dataSource: 'alpha_vantage' },
            
            // Top 5 Minor Pairs only
            { symbol: 'EUR/GBP', alphaVantage: 'EURGBP', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'EUR/JPY', alphaVantage: 'EURJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'GBP/JPY', alphaVantage: 'GBPJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'AUD/JPY', alphaVantage: 'AUDJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'EUR/CHF', alphaVantage: 'EURCHF', type: 'forex', dataSource: 'alpha_vantage' },
            
            // Top Commodities only
            { symbol: 'XAU/USD', alphaVantage: 'GOLD', type: 'commodity', dataSource: 'alpha_vantage' },
            { symbol: 'XAG/USD', alphaVantage: 'SILVER', type: 'commodity', dataSource: 'alpha_vantage' },
            { symbol: 'USOIL', alphaVantage: 'WTI', type: 'commodity', dataSource: 'alpha_vantage' },
            
            // Rest will be simulated for now
            { symbol: 'GBP/CAD', alphaVantage: 'GBPCAD', type: 'forex', dataSource: 'simulated' },
            { symbol: 'EUR/AUD', alphaVantage: 'EURAUD', type: 'forex', dataSource: 'simulated' },
            { symbol: 'CAD/JPY', alphaVantage: 'CADJPY', type: 'forex', dataSource: 'simulated' },
            { symbol: 'NZD/JPY', alphaVantage: 'NZDJPY', type: 'forex', dataSource: 'simulated' },
            { symbol: 'EUR/CAD', alphaVantage: 'EURCAD', type: 'forex', dataSource: 'simulated' },
            { symbol: 'AUD/CAD', alphaVantage: 'AUDCAD', type: 'forex', dataSource: 'simulated' },
            { symbol: 'GBP/AUD', alphaVantage: 'GBPAUD', type: 'forex', dataSource: 'simulated' },
            { symbol: 'GBP/NZD', alphaVantage: 'GBPNZD', type: 'forex', dataSource: 'simulated' },
            { symbol: 'EUR/NZD', alphaVantage: 'EURNZD', type: 'forex', dataSource: 'simulated' },
            { symbol: 'AUD/NZD', alphaVantage: 'AUDNZD', type: 'forex', dataSource: 'simulated' },
            { symbol: 'CHF/JPY', alphaVantage: 'CHFJPY', type: 'forex', dataSource: 'simulated' },
            { symbol: 'CAD/CHF', alphaVantage: 'CADCHF', type: 'forex', dataSource: 'simulated' },
            { symbol: 'NZD/CAD', alphaVantage: 'NZDCAD', type: 'forex', dataSource: 'simulated' },
            { symbol: 'NZD/CHF', alphaVantage: 'NZDCHF', type: 'forex', dataSource: 'simulated' },
            { symbol: 'GBP/CHF', alphaVantage: 'GBPCHF', type: 'forex', dataSource: 'simulated' },
            { symbol: 'EUR/SEK', alphaVantage: 'EURSEK', type: 'forex', dataSource: 'simulated' },
            
            // Commodities - simulated
            { symbol: 'UKOIL', alphaVantage: 'BRENT', type: 'commodity', dataSource: 'simulated' },
            { symbol: 'NGAS', alphaVantage: 'NGAS', type: 'commodity', dataSource: 'simulated' },
            { symbol: 'COPPER', alphaVantage: 'COPPER', type: 'commodity', dataSource: 'simulated' },
            { symbol: 'XPT/USD', alphaVantage: 'PLATINUM', type: 'commodity', dataSource: 'simulated' },
            { symbol: 'XPD/USD', alphaVantage: 'PALLADIUM', type: 'commodity', dataSource: 'simulated' },
            { symbol: 'WHEAT', alphaVantage: 'WHEAT', type: 'commodity', dataSource: 'simulated' },
            { symbol: 'SOYBEAN', alphaVantage: 'SOYBEAN', type: 'commodity', dataSource: 'simulated' },
            
            // Currency Indices (simulated)
            { symbol: 'USD', alphaVantage: null, type: 'index', dataSource: 'simulated' },
            { symbol: 'EUR', alphaVantage: null, type: 'index', dataSource: 'simulated' },
            { symbol: 'JPY', alphaVantage: null, type: 'index', dataSource: 'simulated' },
            { symbol: 'GBP', alphaVantage: null, type: 'index', dataSource: 'simulated' },
            { symbol: 'AUD', alphaVantage: null, type: 'index', dataSource: 'simulated' },
            { symbol: 'CAD', alphaVantage: null, type: 'index', dataSource: 'simulated' },
            { symbol: 'CHF', alphaVantage: null, type: 'index', dataSource: 'simulated' },
            { symbol: 'NZD', alphaVantage: null, type: 'index', dataSource: 'simulated' }
        ];

        const results = [];
        
        // Process all symbols without batching delays
        const promises = symbolConfigs.map(async (config) => {
            try {
                if (config.dataSource === 'simulated') {
                    return generateSimulatedData(config);
                }

                const alphaVantageData = await fetchAlphaVantageData(config);
                
                if (alphaVantageData) {
                    return {
                        ...alphaVantageData,
                        dataSource: 'alpha_vantage',
                        dataQuality: 'high'
                    };
                } else {
                    return generateSimulatedData(config);
                }
            } catch (error) {
                console.error(`Error fetching ${config.symbol}:`, error.message);
                return generateSimulatedData(config);
            }
        });

        const allResults = await Promise.allSettled(promises);
        
        allResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                results.push(result.value);
            }
        });

        res.status(200).json({
            success: true,
            data: results,
            timestamp: new Date().toISOString(),
            count: results.length,
            dataSummary: {
                realData: results.filter(r => r.dataSource === 'alpha_vantage').length,
                simulatedData: results.filter(r => r.dataSource === 'simulated').length,
                total: results.length
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Fetch data from Alpha Vantage (simplified and faster)
async function fetchAlphaVantageData(config) {
    // For now, let's use a simple price fetch without complex indicators to avoid timeout
    let url;
    
    if (config.type === 'forex') {
        url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${config.alphaVantage.substring(0,3)}&to_currency=${config.alphaVantage.substring(3)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    } else {
        // For commodities, use global quote
        url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${config.alphaVantage}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    }

    try {
        const response = await axios.get(url, { timeout: 5000 }); // 5 second timeout
        
        if (response.data['Error Message'] || response.data['Note']) {
            throw new Error(response.data['Error Message'] || 'API rate limit reached');
        }

        let price, previousPrice;
        
        if (config.type === 'forex') {
            const rate = response.data['Realtime Currency Exchange Rate'];
            if (!rate) throw new Error('No exchange rate data');
            price = parseFloat(rate['5. Exchange Rate']);
            previousPrice = price * 0.999; // Simple approximation for demo
        } else {
            const quote = response.data['Global Quote'];
            if (!quote) throw new Error('No quote data');
            price = parseFloat(quote['05. price']);
            previousPrice = parseFloat(quote['08. previous close']);
        }

        const change = price - previousPrice;
        const changePercent = (change / previousPrice) * 100;

        // Simple indicator calculations
        const rsi = 50 + (changePercent * 0.5);
        const rsiCondition = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';
        const trend = changePercent > 0 ? 'Bullish' : changePercent < 0 ? 'Bearish' : 'Neutral';
        const macdSignal = changePercent > 0 ? 'Bullish' : changePercent < 0 ? 'Bearish' : 'Neutral';

        return {
            symbol: config.symbol,
            price: price.toFixed(4),
            change: change.toFixed(4),
            changePercent: changePercent.toFixed(2),
            trend: trend,
            rsi: Math.round(rsi),
            rsiCondition: rsiCondition,
            macd: change.toFixed(5),
            macdSignal: macdSignal,
            macdHistogram: (change * 0.1).toFixed(5),
            atr: (Math.abs(changePercent) * 0.1).toFixed(5),
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(`Alpha Vantage error for ${config.symbol}:`, error.message);
        return null;
    }
}

// Generate simulated data for unavailable symbols
function generateSimulatedData(config) {
    const baseValues = {
        'EUR/SEK': 11.25, 'NGAS': 2.85, 'WHEAT': 580.25, 'SOYBEAN': 1250.75,
        'USD': 104.5, 'EUR': 92.8, 'JPY': 76.2, 'GBP': 85.6,
        'AUD': 68.9, 'CAD': 74.3, 'CHF': 88.7, 'NZD': 71.4,
        'UKOIL': 82.75, 'COPPER': 3.82, 'XPT/USD': 920.50, 'XPD/USD': 1250.80
    };
    
    const base = baseValues[config.symbol] || 1.0;
    const change = (Math.random() - 0.5) * base * 0.02;
    const price = base + change;
    const changePercent = (change / base) * 100;

    // Simulate indicators
    const rsi = 50 + (changePercent * 0.5);
    const rsiCondition = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';
    const trend = changePercent > 0.5 ? 'Bullish' : changePercent < -0.5 ? 'Bearish' : 'Neutral';
    const macdSignal = changePercent > 0 ? 'Bullish' : changePercent < 0 ? 'Bearish' : 'Neutral';

    return {
        symbol: config.symbol,
        price: price.toFixed(4),
        change: change.toFixed(4),
        changePercent: changePercent.toFixed(2),
        trend: trend,
        rsi: Math.round(rsi),
        rsiCondition: rsiCondition,
        macd: change.toFixed(5),
        macdSignal: macdSignal,
        macdHistogram: (change * 0.1).toFixed(5),
        atr: (Math.abs(changePercent) * 0.1).toFixed(5),
        dataSource: 'simulated',
        dataQuality: 'low',
        timestamp: new Date().toISOString()
    };
}
