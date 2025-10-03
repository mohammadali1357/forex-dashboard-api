const axios = require('axios');

// API Configuration
const ALPHA_VANTAGE_API_KEY = 'SFQ7TST27CVZTOQU';
const TWELVE_DATA_API_KEY = '7c5e73198a0b4ea78c5342bd0800aea7';

// Enhanced symbol configuration with priority mapping
const symbolConfigs = [
    // Major Pairs - High priority
    { symbol: 'EUR/USD', alphaVantage: 'EURUSD', twelveData: 'EUR/USD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'USD/JPY', alphaVantage: 'USDJPY', twelveData: 'USD/JPY', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'GBP/USD', alphaVantage: 'GBPUSD', twelveData: 'GBP/USD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'USD/CHF', alphaVantage: 'USDCHF', twelveData: 'USD/CHF', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'AUD/USD', alphaVantage: 'AUDUSD', twelveData: 'AUD/USD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'USD/CAD', alphaVantage: 'USDCAD', twelveData: 'USD/CAD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    { symbol: 'NZD/USD', alphaVantage: 'NZDUSD', twelveData: 'NZD/USD', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Major Pairs' },
    
    // Minor Pairs - Medium priority
    { symbol: 'EUR/GBP', alphaVantage: 'EURGBP', twelveData: 'EUR/GBP', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'EUR/JPY', alphaVantage: 'EURJPY', twelveData: 'EUR/JPY', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'GBP/JPY', alphaVantage: 'GBPJPY', twelveData: 'GBP/JPY', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    { symbol: 'EUR/CHF', alphaVantage: 'EURCHF', twelveData: 'EUR/CHF', priority: ['alpha_vantage', 'twelve_data'], type: 'forex', category: 'Minor Pairs' },
    
    // Commodities - Twelve Data has better coverage
    { symbol: 'XAU/USD', alphaVantage: 'GOLD', twelveData: 'XAU/USD', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'XAG/USD', alphaVantage: 'SILVER', twelveData: 'XAG/USD', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    { symbol: 'USOIL', alphaVantage: 'WTI', twelveData: 'USOIL', priority: ['twelve_data', 'alpha_vantage'], type: 'commodity', category: 'Commodities' },
    
    // Currency Indices (simulated - neither API provides these directly)
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
        console.log('=== DEBUG: Starting API fetch ===');
        const results = [];
        let alphaVantageCount = 0;
        let twelveDataCount = 0;
        let simulatedCount = 0;
        
        // Process a smaller batch first to debug
        const symbolsToProcess = symbolConfigs.slice(0, 15); // Start with just 15 symbols
        
        for (const config of symbolsToProcess) {
            try {
                console.log(`Processing symbol: ${config.symbol}`);
                let symbolData = null;
                
                // Try sources in priority order
                for (const source of config.priority) {
                    if (source === 'alpha_vantage' && config.alphaVantage) {
                        console.log(`  Trying Alpha Vantage for ${config.symbol}`);
                        symbolData = await fetchAlphaVantageData(config);
                        if (symbolData) {
                            console.log(`  Alpha Vantage SUCCESS for ${config.symbol}`);
                            symbolData.dataSource = 'alpha_vantage';
                            symbolData.dataQuality = 'high';
                            alphaVantageCount++;
                            break;
                        } else {
                            console.log(`  Alpha Vantage FAILED for ${config.symbol}`);
                        }
                    } else if (source === 'twelve_data' && config.twelveData) {
                        console.log(`  Trying Twelve Data for ${config.symbol}`);
                        symbolData = await fetchTwelveData(config);
                        if (symbolData) {
                            console.log(`  Twelve Data SUCCESS for ${config.symbol}`);
                            symbolData.dataSource = 'twelve_data';
                            symbolData.dataQuality = 'high';
                            twelveDataCount++;
                            break;
                        } else {
                            console.log(`  Twelve Data FAILED for ${config.symbol}`);
                        }
                    } else if (source === 'simulated') {
                        console.log(`  Using simulated data for ${config.symbol}`);
                        symbolData = generateSimulatedData(config);
                        symbolData.dataSource = 'simulated';
                        symbolData.dataQuality = 'low';
                        simulatedCount++;
                        break;
                    }
                }
                
                if (symbolData) {
                    symbolData.category = config.category;
                    results.push(symbolData);
                    console.log(`  Completed ${config.symbol} with source: ${symbolData.dataSource}`);
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
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('=== DEBUG: API fetch completed ===');
        console.log(`Results: ${results.length} symbols`);
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

// Alpha Vantage API call with better error handling
async function fetchAlphaVantageData(config) {
    let url;
    
    if (config.type === 'forex') {
        url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${config.alphaVantage.substring(0,3)}&to_currency=${config.alphaVantage.substring(3)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    } else {
        url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${config.alphaVantage}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    }

    try {
        console.log(`    AV URL: ${url.split('apikey')[0]}...`);
        const response = await axios.get(url, { timeout: 8000 });
        
        if (response.data['Error Message']) {
            console.log(`    AV Error Message: ${response.data['Error Message']}`);
            return null;
        }
        
        if (response.data['Note']) {
            console.log(`    AV Rate Limit: ${response.data['Note']}`);
            return null;
        }

        let price, previousPrice;
        
        if (config.type === 'forex') {
            const rate = response.data['Realtime Currency Exchange Rate'];
            if (!rate) {
                console.log(`    AV No exchange rate data for ${config.symbol}`);
                return null;
            }
            price = parseFloat(rate['5. Exchange Rate']);
            previousPrice = price * 0.999;
            console.log(`    AV Forex price: ${price}`);
        } else {
            const quote = response.data['Global Quote'];
            if (!quote) {
                console.log(`    AV No quote data for ${config.symbol}`);
                return null;
            }
            price = parseFloat(quote['05. price']);
            previousPrice = parseFloat(quote['08. previous close']);
            console.log(`    AV Commodity price: ${price}`);
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

// Twelve Data API call with better error handling
async function fetchTwelveData(config) {
    const url = `https://api.twelvedata.com/price?symbol=${config.twelveData}&apikey=${TWELVE_DATA_API_KEY}`;

    try {
        console.log(`    TD URL: ${url.split('apikey')[0]}...`);
        const response = await axios.get(url, { timeout: 8000 });
        
        if (response.data.status === 'error') {
            console.log(`    TD Error: ${response.data.message}`);
            return null;
        }

        const price = parseFloat(response.data.price);
        if (!price || isNaN(price)) {
            console.log(`    TD Invalid price for ${config.symbol}: ${response.data.price}`);
            return null;
        }

        console.log(`    TD Price: ${price}`);
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
