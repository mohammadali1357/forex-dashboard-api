const axios = require('axios');

// Your Alpha Vantage API Key
const ALPHA_VANTAGE_API_KEY = 'SFQ7TST27CVZTOQU';

// Technical indicator calculations (keep your existing functions)
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        
        if (change > 0) {
            avgGain = (avgGain * (period - 1) + change) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - change) / period;
        }
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod + signalPeriod) return null;
    
    const calculateEMA = (data, period) => {
        const k = 2 / (period + 1);
        const ema = [data[0]];
        for (let i = 1; i < data.length; i++) {
            ema.push(data[i] * k + ema[i - 1] * (1 - k));
        }
        return ema;
    };
    
    const fastEMA = calculateEMA(prices, fastPeriod);
    const slowEMA = calculateEMA(prices, slowPeriod);
    
    const macdLine = [];
    for (let i = 0; i < slowEMA.length; i++) {
        macdLine.push(fastEMA[i] - slowEMA[i]);
    }
    
    const signalLine = calculateEMA(macdLine, signalPeriod);
    
    const histogram = [];
    for (let i = 0; i < signalLine.length; i++) {
        histogram.push(macdLine[i] - signalLine[i]);
    }
    
    return {
        macd: macdLine[macdLine.length - 1],
        signal: signalLine[signalLine.length - 1],
        histogram: histogram[histogram.length - 1]
    };
}

function calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < period + 1) return null;
    
    const trueRanges = [];
    
    for (let i = 1; i < highs.length; i++) {
        const tr1 = highs[i] - lows[i];
        const tr2 = Math.abs(highs[i] - closes[i - 1]);
        const tr3 = Math.abs(lows[i] - closes[i - 1]);
        trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    let atr = 0;
    for (let i = 0; i < period; i++) {
        atr += trueRanges[i];
    }
    atr /= period;
    
    return atr;
}

function calculateSMA(prices, period) {
    if (prices.length < period) return null;
    
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += prices[i - j];
        }
        sma.push(sum / period);
    }
    
    return sma[sma.length - 1];
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
        // Enhanced symbol configuration with Alpha Vantage mapping
        const symbolConfigs = [
            // Major Pairs (7) - Alpha Vantage uses "FROMTO" format
            { symbol: 'EUR/USD', alphaVantage: 'EURUSD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'USD/JPY', alphaVantage: 'USDJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'GBP/USD', alphaVantage: 'GBPUSD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'USD/CHF', alphaVantage: 'USDCHF', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'AUD/USD', alphaVantage: 'AUDUSD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'USD/CAD', alphaVantage: 'USDCAD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'NZD/USD', alphaVantage: 'NZDUSD', type: 'forex', dataSource: 'alpha_vantage' },
            
            // Minor Pairs (21) - Alpha Vantage format
            { symbol: 'EUR/GBP', alphaVantage: 'EURGBP', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'EUR/JPY', alphaVantage: 'EURJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'GBP/JPY', alphaVantage: 'GBPJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'EUR/CHF', alphaVantage: 'EURCHF', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'AUD/JPY', alphaVantage: 'AUDJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'CAD/JPY', alphaVantage: 'CADJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'NZD/JPY', alphaVantage: 'NZDJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'GBP/CAD', alphaVantage: 'GBPCAD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'EUR/AUD', alphaVantage: 'EURAUD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'EUR/CAD', alphaVantage: 'EURCAD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'AUD/CAD', alphaVantage: 'AUDCAD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'GBP/AUD', alphaVantage: 'GBPAUD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'GBP/NZD', alphaVantage: 'GBPNZD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'EUR/NZD', alphaVantage: 'EURNZD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'AUD/NZD', alphaVantage: 'AUDNZD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'CHF/JPY', alphaVantage: 'CHFJPY', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'CAD/CHF', alphaVantage: 'CADCHF', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'NZD/CAD', alphaVantage: 'NZDCAD', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'NZD/CHF', alphaVantage: 'NZDCHF', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'GBP/CHF', alphaVantage: 'GBPCHF', type: 'forex', dataSource: 'alpha_vantage' },
            { symbol: 'EUR/SEK', alphaVantage: 'EURSEK', type: 'forex', dataSource: 'simulated' }, // Alpha Vantage doesn't have this
            
            // Commodities - Alpha Vantage uses different symbols
            { symbol: 'XAU/USD', alphaVantage: 'GOLD', type: 'commodity', dataSource: 'alpha_vantage' },
            { symbol: 'XAG/USD', alphaVantage: 'SILVER', type: 'commodity', dataSource: 'alpha_vantage' },
            { symbol: 'USOIL', alphaVantage: 'WTI', type: 'commodity', dataSource: 'alpha_vantage' },
            { symbol: 'UKOIL', alphaVantage: 'BRENT', type: 'commodity', dataSource: 'alpha_vantage' },
            { symbol: 'NGAS', alphaVantage: 'NGAS', type: 'commodity', dataSource: 'simulated' }, // Not available in Alpha Vantage
            { symbol: 'COPPER', alphaVantage: 'COPPER', type: 'commodity', dataSource: 'alpha_vantage' },
            { symbol: 'XPT/USD', alphaVantage: 'PLATINUM', type: 'commodity', dataSource: 'alpha_vantage' },
            { symbol: 'XPD/USD', alphaVantage: 'PALLADIUM', type: 'commodity', dataSource: 'alpha_vantage' },
            { symbol: 'WHEAT', alphaVantage: 'WHEAT', type: 'commodity', dataSource: 'simulated' }, // Not available
            { symbol: 'SOYBEAN', alphaVantage: 'SOYBEAN', type: 'commodity', dataSource: 'simulated' }, // Not available
            
            // Currency Indices (simulated as Alpha Vantage doesn't have them)
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
        const batchSize = 2; // Alpha Vantage free tier: 5 requests per minute
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < symbolConfigs.length; i += batchSize) {
            const batch = symbolConfigs.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (config) => {
                try {
                    // Handle simulated symbols
                    if (config.dataSource === 'simulated') {
                        return generateSimulatedData(config);
                    }

                    // Alpha Vantage API call for real data
                    const alphaVantageData = await fetchAlphaVantageData(config);
                    
                    if (alphaVantageData) {
                        return {
                            ...alphaVantageData,
                            dataSource: 'alpha_vantage',
                            dataQuality: 'high'
                        };
                    } else {
                        // Fallback to simulated data if Alpha Vantage fails
                        return generateSimulatedData(config);
                    }

                } catch (error) {
                    console.error(`Error fetching ${config.symbol}:`, error.message);
                    return generateSimulatedData(config);
                }
            });

            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    results.push(result.value);
                }
            });

            // Delay between batches to respect Alpha Vantage rate limits (5 RPM)
            if (i + batchSize < symbolConfigs.length) {
                await delay(15000); // 15 seconds between batches
            }
        }

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

// Fetch data from Alpha Vantage
async function fetchAlphaVantageData(config) {
    const baseUrl = 'https://www.alphavantage.co/query';
    
    // Different endpoints for different types
    let url, functionName;
    
    if (config.type === 'forex') {
        functionName = 'FX_DAILY';
        url = `${baseUrl}?function=${functionName}&from_symbol=${config.alphaVantage.substring(0,3)}&to_symbol=${config.alphaVantage.substring(3)}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=compact`;
    } else {
        // For commodities
        functionName = `${config.alphaVantage}`;
        url = `${baseUrl}?function=${functionName}&interval=daily&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=compact`;
    }

    try {
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data['Error Message'] || response.data['Note']) {
            // API error or rate limit
            throw new Error(response.data['Error Message'] || 'API rate limit reached');
        }

        let timeSeries;
        if (config.type === 'forex') {
            timeSeries = response.data['Time Series FX (Daily)'];
        } else {
            timeSeries = response.data['data'] || response.data['Time Series (Daily)'];
        }

        if (!timeSeries) {
            throw new Error('No time series data available');
        }

        // Convert time series to arrays for calculations
        const dates = Object.keys(timeSeries).sort().reverse().slice(0, 50); // Last 50 days
        const closes = dates.map(date => {
            if (config.type === 'forex') {
                return parseFloat(timeSeries[date]['4. close']);
            } else {
                return parseFloat(timeSeries[date]['value'] || timeSeries[date]['4. close']);
            }
        });
        
        const highs = dates.map(date => {
            if (config.type === 'forex') {
                return parseFloat(timeSeries[date]['2. high']);
            } else {
                return parseFloat(timeSeries[date]['high'] || timeSeries[date]['2. high']);
            }
        });
        
        const lows = dates.map(date => {
            if (config.type === 'forex') {
                return parseFloat(timeSeries[date]['3. low']);
            } else {
                return parseFloat(timeSeries[date]['low'] || timeSeries[date]['3. low']);
            }
        });

        // Calculate indicators
        const rsi = calculateRSI(closes);
        const macd = calculateMACD(closes);
        const atr = calculateATR(highs, lows, closes);
        const currentPrice = closes[0];
        const previousPrice = closes[1];
        const change = currentPrice - previousPrice;
        const changePercent = (change / previousPrice) * 100;

        // Determine trend
        let trend = "Neutral";
        if (changePercent > 0.5) trend = "Bullish";
        else if (changePercent < -0.5) trend = "Bearish";

        // RSI condition
        let rsiCondition = "Neutral";
        if (rsi > 70) rsiCondition = "Overbought";
        else if (rsi < 30) rsiCondition = "Oversold";

        // MACD signal
        let macdSignal = "Neutral";
        if (macd && macd.macd > macd.signal) macdSignal = "Bullish";
        else if (macd && macd.macd < macd.signal) macdSignal = "Bearish";

        return {
            symbol: config.symbol,
            price: currentPrice.toFixed(4),
            change: change.toFixed(4),
            changePercent: changePercent.toFixed(2),
            trend: trend,
            rsi: rsi ? Math.round(rsi) : 'N/A',
            rsiCondition: rsiCondition,
            macd: macd ? macd.macd.toFixed(5) : 'N/A',
            macdSignal: macdSignal,
            macdHistogram: macd ? macd.histogram.toFixed(5) : 'N/A',
            atr: atr ? atr.toFixed(5) : 'N/A',
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
        'AUD': 68.9, 'CAD': 74.3, 'CHF': 88.7, 'NZD': 71.4
    };
    
    const base = baseValues[config.symbol] || 1.0;
    const change = (Math.random() - 0.5) * base * 0.02; // Random change up to 2%
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
