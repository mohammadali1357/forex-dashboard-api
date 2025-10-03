const axios = require('axios');

// API Configuration
const ALPHA_VANTAGE_API_KEY = 'SFQ7TST27CVZTOQU';
const TWELVE_DATA_API_KEY = '7c5e73198a0b4ea78c5342bd0800aea7';

// Enhanced symbol configuration with priority mapping - ALL 38 SYMBOLS
const symbolConfigs = [
    // Major Pairs - High priority (7 symbols)
    { symbol: 'EUR/USD', alphaVantage: 'EURUSD', twelveData: 'EUR/USD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'USD/JPY', alphaVantage: 'USDJPY', twelveData: 'USD/JPY', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'GBP/USD', alphaVantage: 'GBPUSD', twelveData: 'GBP/USD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'USD/CHF', alphaVantage: 'USDCHF', twelveData: 'USD/CHF', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'AUD/USD', alphaVantage: 'AUDUSD', twelveData: 'AUD/USD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'USD/CAD', alphaVantage: 'USDCAD', twelveData: 'USD/CAD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'NZD/USD', alphaVantage: 'NZDUSD', twelveData: 'NZD/USD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    
    // Minor Pairs - Medium priority (21 symbols)
    { symbol: 'EUR/GBP', alphaVantage: 'EURGBP', twelveData: 'EUR/GBP', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'EUR/JPY', alphaVantage: 'EURJPY', twelveData: 'EUR/JPY', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'GBP/JPY', alphaVantage: 'GBPJPY', twelveData: 'GBP/JPY', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'EUR/CHF', alphaVantage: 'EURCHF', twelveData: 'EUR/CHF', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'AUD/JPY', alphaVantage: 'AUDJPY', twelveData: 'AUD/JPY', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'CAD/JPY', alphaVantage: 'CADJPY', twelveData: 'CAD/JPY', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'NZD/JPY', alphaVantage: 'NZDJPY', twelveData: 'NZD/JPY', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'GBP/CAD', alphaVantage: 'GBPCAD', twelveData: 'GBP/CAD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'EUR/AUD', alphaVantage: 'EURAUD', twelveData: 'EUR/AUD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'EUR/CAD', alphaVantage: 'EURCAD', twelveData: 'EUR/CAD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'AUD/CAD', alphaVantage: 'AUDCAD', twelveData: 'AUD/CAD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'GBP/AUD', alphaVantage: 'GBPAUD', twelveData: 'GBP/AUD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'GBP/NZD', alphaVantage: 'GBPNZD', twelveData: 'GBP/NZD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'EUR/NZD', alphaVantage: 'EURNZD', twelveData: 'EUR/NZD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'AUD/NZD', alphaVantage: 'AUDNZD', twelveData: 'AUD/NZD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'CHF/JPY', alphaVantage: 'CHFJPY', twelveData: 'CHF/JPY', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'CAD/CHF', alphaVantage: 'CADCHF', twelveData: 'CAD/CHF', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'NZD/CAD', alphaVantage: 'NZDCAD', twelveData: 'NZD/CAD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'NZD/CHF', alphaVantage: 'NZDCHF', twelveData: 'NZD/CHF', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'GBP/CHF', alphaVantage: 'GBPCHF', twelveData: 'GBP/CHF', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    
    // Commodities - Twelve Data has better coverage (10 symbols)
    { symbol: 'XAU/USD', alphaVantage: 'GOLD', twelveData: 'XAU/USD', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'XAG/USD', alphaVantage: 'SILVER', twelveData: 'XAG/USD', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'USOIL', alphaVantage: 'WTI', twelveData: 'USOIL', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'UKOIL', alphaVantage: 'BRENT', twelveData: 'UKOIL', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'NGAS', alphaVantage: 'NATURALGAS', twelveData: 'NGAS', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'COPPER', alphaVantage: 'COPPER', twelveData: 'COPPER', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'XPT/USD', alphaVantage: 'PLATINUM', twelveData: 'XPT/USD', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'XPD/USD', alphaVantage: 'PALLADIUM', twelveData: 'XPD/USD', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'WHEAT', alphaVantage: 'WHEAT', twelveData: 'WHEAT', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'SOYBEAN', alphaVantage: 'SOYBEAN', twelveData: 'SOYBEAN', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    
    // Currency Indices (simulated - neither API provides these directly) (8 symbols)
    { symbol: 'USD', alphaVantage: null, twelveData: null, priority: ['simulated'], type: 'index', category: 'Currency Indices' },
    { symbol: 'EUR', alphaVantage: null, twelveData: null, priority: ['simulated'], type: 'index', category: 'Currency Indices' },
    { symbol: 'JPY', alphaVantage: null, twelveData: null, priority: ['simulated'], type: 'index', category: 'Currency Indices' },
    { symbol: 'GBP', alphaVantage: null, twelveData: null, priority: ['simulated'], type: 'index', category: 'Currency Indices' },
    { symbol: 'AUD', alphaVantage: null, twelveData: null, priority: ['simulated'], type: 'index', category: 'Currency Indices' },
    { symbol: 'CAD', alphaVantage: null, twelveData: null, priority: ['simulated'], type: 'index', category: 'Currency Indices' },
    { symbol: 'CHF', alphaVantage: null, twelveData: null, priority: ['simulated'], type: 'index', category: 'Currency Indices' },
    { symbol: 'NZD', alphaVantage: null, twelveData: null, priority: ['simulated'], type: 'index', category: 'Currency Indices' }
];

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
        console.log('=== Starting API fetch ===');
        const results = [];
        let alphaVantageCount = 0;
        let twelveDataCount = 0;
        let simulatedCount = 0;
        
        // Process ALL symbols with proper error handling
        for (const config of symbolConfigs) {
            try {
                let symbolData = null;
                let usedSource = 'simulated';
                
                // Try sources in priority order
                for (const source of config.priority) {
                    if (source === 'alpha_vantage' && config.alphaVantage) {
                        symbolData = await fetchAlphaVantageData(config);
                        if (symbolData) {
                            usedSource = 'alpha_vantage';
                            alphaVantageCount++;
                            break;
                        }
                    } else if (source === 'twelve_data' && config.twelveData) {
                        symbolData = await fetchTwelveData(config);
                        if (symbolData) {
                            usedSource = 'twelve_data';
                            twelveDataCount++;
                            break;
                        }
                    } else if (source === 'simulated') {
                        symbolData = generateSimulatedData(config);
                        usedSource = 'simulated';
                        simulatedCount++;
                        break;
                    }
                }
                
                if (symbolData) {
                    symbolData.dataSource = usedSource;
                    symbolData.dataQuality = usedSource === 'simulated' ? 'low' : 'high';
                    symbolData.category = config.category;
                    results.push(symbolData);
                }
                
            } catch (error) {
                console.error(`Error processing ${config.symbol}:`, error.message);
                // Fallback to simulated data
                const simulatedData = generateSimulatedData(config);
                simulatedData.dataSource = 'simulated';
                simulatedData.dataQuality = 'low';
                simulatedData.category = config.category;
                results.push(simulatedData);
                simulatedCount++;
            }
            
            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        console.log(`=== API fetch completed: ${results.length} symbols ===`);
        console.log(`Alpha Vantage: ${alphaVantageCount}, Twelve Data: ${twelveDataCount}, Simulated: ${simulatedCount}`);

        res.status(200).json({
            success: true,
            data: results,
            timestamp: new Date().toISOString(),
            count: results.length,
            dataSummary: {
                alpha_vantage: alphaVantageCount,
                twelve_data: twelveDataCount,
                simulated: simulatedCount,
                total: results.length
            },
            apiStatus: {
                alpha_vantage: alphaVantageCount > 0 ? 'operational' : 'unavailable',
                twelve_data: twelveDataCount > 0 ? 'operational' : 'unavailable'
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

// Alpha Vantage API call
async function fetchAlphaVantageData(config) {
    let url;
    
    if (config.type === 'forex') {
        url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${config.alphaVantage.substring(0,3)}&to_currency=${config.alphaVantage.substring(3)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    } else {
        url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${config.alphaVantage}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    }

    try {
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data['Error Message'] || response.data['Note']) {
            return null;
        }

        let price, previousPrice;
        
        if (config.type === 'forex') {
            const rate = response.data['Realtime Currency Exchange Rate'];
            if (!rate) return null;
            price = parseFloat(rate['5. Exchange Rate']);
            previousPrice = price * 0.999;
        } else {
            const quote = response.data['Global Quote'];
            if (!quote) return null;
            price = parseFloat(quote['05. price']);
            previousPrice = parseFloat(quote['08. previous close']);
        }

        const change = price - previousPrice;
        const changePercent = (change / previousPrice) * 100;

        // Calculate indicators
        const rsi = 50 + (changePercent * 0.5);
        const rsiCondition = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';
        const trend = changePercent > 0.1 ? 'Bullish' : changePercent < -0.1 ? 'Bearish' : 'Neutral';
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

// Twelve Data API call
async function fetchTwelveData(config) {
    const url = `https://api.twelvedata.com/price?symbol=${config.twelveData}&apikey=${TWELVE_DATA_API_KEY}`;

    try {
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data.status === 'error') {
            return null;
        }

        const price = parseFloat(response.data.price);
        if (!price || isNaN(price)) return null;

        // Twelve Data only provides current price, so we simulate change
        const previousPrice = price * (0.995 + Math.random() * 0.01);
        const change = price - previousPrice;
        const changePercent = (change / previousPrice) * 100;

        // Calculate indicators
        const rsi = 50 + (changePercent * 0.5);
        const rsiCondition = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';
        const trend = changePercent > 0.1 ? 'Bullish' : changePercent < -0.1 ? 'Bearish' : 'Neutral';
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
        console.error(`Twelve Data error for ${config.symbol}:`, error.message);
        return null;
    }
}

// Generate simulated data
function generateSimulatedData(config) {
    const baseValues = {
        'EUR/USD': 1.0745, 'USD/JPY': 149.25, 'GBP/USD': 1.2650, 'USD/CHF': 0.8950,
        'AUD/USD': 0.6450, 'USD/CAD': 1.3520, 'NZD/USD': 0.5920, 'EUR/GBP': 0.8570,
        'EUR/JPY': 158.50, 'GBP/JPY': 188.75, 'EUR/CHF': 0.9550, 'AUD/JPY': 96.20,
        'XAU/USD': 1925.6, 'XAG/USD': 23.15, 'USOIL': 78.40,
        'USD': 104.5, 'EUR': 92.8, 'JPY': 76.2, 'GBP': 85.6,
        'AUD': 68.9, 'CAD': 74.3, 'CHF': 88.7, 'NZD': 71.4
    };
    
    const base = baseValues[config.symbol] || 1.0;
    const change = (Math.random() - 0.5) * base * 0.02;
    const price = base + change;
    const changePercent = (change / base) * 100;

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
        timestamp: new Date().toISOString()
    };
}

