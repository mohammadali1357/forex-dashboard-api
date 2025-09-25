const yahooFinance = require('yahoo-finance2').default;

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
        // Enhanced symbol configuration with proper mapping
        const symbolConfigs = [
            // Major Pairs (7)
            { symbol: 'EUR/USD', yahooSymbol: 'EURUSD=X', type: 'forex' },
            { symbol: 'USD/JPY', yahooSymbol: 'USDJPY=X', type: 'forex' },
            { symbol: 'GBP/USD', yahooSymbol: 'GBPUSD=X', type: 'forex' },
            { symbol: 'USD/CHF', yahooSymbol: 'USDCHF=X', type: 'forex' },
            { symbol: 'AUD/USD', yahooSymbol: 'AUDUSD=X', type: 'forex' },
            { symbol: 'USD/CAD', yahooSymbol: 'USDCAD=X', type: 'forex' },
            { symbol: 'NZD/USD', yahooSymbol: 'NZDUSD=X', type: 'forex' },
            
            // Minor Pairs (21 - selected major ones)
            { symbol: 'EUR/GBP', yahooSymbol: 'EURGBP=X', type: 'forex' },
            { symbol: 'EUR/JPY', yahooSymbol: 'EURJPY=X', type: 'forex' },
            { symbol: 'GBP/JPY', yahooSymbol: 'GBPJPY=X', type: 'forex' },
            { symbol: 'EUR/CHF', yahooSymbol: 'EURCHF=X', type: 'forex' },
            { symbol: 'AUD/JPY', yahooSymbol: 'AUDJPY=X', type: 'forex' },
            { symbol: 'CAD/JPY', yahooSymbol: 'CADJPY=X', type: 'forex' },
            { symbol: 'NZD/JPY', yahooSymbol: 'NZDJPY=X', type: 'forex' },
            { symbol: 'GBP/CAD', yahooSymbol: 'GBPCAD=X', type: 'forex' },
            { symbol: 'EUR/AUD', yahooSymbol: 'EURAUD=X', type: 'forex' },
            { symbol: 'EUR/CAD', yahooSymbol: 'EURCAD=X', type: 'forex' },
            { symbol: 'AUD/CAD', yahooSymbol: 'AUDCAD=X', type: 'forex' },
            { symbol: 'GBP/AUD', yahooSymbol: 'GBPAUD=X', type: 'forex' },
            { symbol: 'GBP/NZD', yahooSymbol: 'GBPNZD=X', type: 'forex' },
            { symbol: 'EUR/NZD', yahooSymbol: 'EURNZD=X', type: 'forex' },
            { symbol: 'AUD/NZD', yahooSymbol: 'AUDNZD=X', type: 'forex' },
            { symbol: 'CHF/JPY', yahooSymbol: 'CHFJPY=X', type: 'forex' },
            { symbol: 'CAD/CHF', yahooSymbol: 'CADCHF=X', type: 'forex' },
            { symbol: 'NZD/CAD', yahooSymbol: 'NZDCAD=X', type: 'forex' },
            { symbol: 'NZD/CHF', yahooSymbol: 'NZDCHF=X', type: 'forex' },
            { symbol: 'GBP/CHF', yahooSymbol: 'GBPCHF=X', type: 'forex' },
            { symbol: 'EUR/SEK', yahooSymbol: 'EURSEK=X', type: 'forex' },
            
            // Commodities with proper symbols
            { symbol: 'XAU/USD', yahooSymbol: 'GC=F', type: 'commodity' }, // Gold
            { symbol: 'XAG/USD', yahooSymbol: 'SI=F', type: 'commodity' }, // Silver
            { symbol: 'USOIL', yahooSymbol: 'CL=F', type: 'commodity' },   // WTI Crude
            { symbol: 'UKOIL', yahooSymbol: 'BZ=F', type: 'commodity' },   // Brent Crude
            { symbol: 'NGAS', yahooSymbol: 'NG=F', type: 'commodity' },    // Natural Gas
            { symbol: 'COPPER', yahooSymbol: 'HG=F', type: 'commodity' },  // Copper
            { symbol: 'XPT/USD', yahooSymbol: 'PL=F', type: 'commodity' }, // Platinum
            { symbol: 'XPD/USD', yahooSymbol: 'PA=F', type: 'commodity' }, // Palladium
            
            // Currency Indices (simulated as Yahoo Finance doesn't have direct indices)
            { symbol: 'USD', yahooSymbol: null, type: 'index', simulated: true },
            { symbol: 'EUR', yahooSymbol: null, type: 'index', simulated: true },
            { symbol: 'JPY', yahooSymbol: null, type: 'index', simulated: true },
            { symbol: 'GBP', yahooSymbol: null, type: 'index', simulated: true },
            { symbol: 'AUD', yahooSymbol: null, type: 'index', simulated: true },
            { symbol: 'CAD', yahooSymbol: null, type: 'index', simulated: true },
            { symbol: 'CHF', yahooSymbol: null, type: 'index', simulated: true },
            { symbol: 'NZD', yahooSymbol: null, type: 'index', simulated: true }
        ];

        const results = [];
        const batchSize = 5; // Process 5 symbols at a time to avoid rate limiting
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < symbolConfigs.length; i += batchSize) {
            const batch = symbolConfigs.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (config) => {
                try {
                    // Handle simulated symbols (currency indices)
                    if (config.simulated) {
                        return generateSimulatedData(config);
                    }

                    // Get current quote with timeout
                    const quotePromise = yahooFinance.quote(config.yahooSymbol);
                    const quote = await Promise.race([
                        quotePromise,
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout')), 10000)
                        )
                    ]);

                    // Get historical data for indicators
                    const historical = await yahooFinance.historical(config.yahooSymbol, {
                        period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
                        period2: new Date(),
                        interval: '1d'
                    });

                    if (!historical || historical.length < 15) {
                        return createFallbackData(config, quote);
                    }

                    const closes = historical.map(h => h.close).filter(Boolean);
                    const highs = historical.map(h => h.high).filter(Boolean);
                    const lows = historical.map(h => h.low).filter(Boolean);

                    // Calculate indicators
                    const rsi = calculateRSI(closes);
                    const macd = calculateMACD(closes);
                    const atr = calculateATR(highs, lows, closes);
                    const sma20 = calculateSMA(closes, 20);
                    const sma50 = calculateSMA(closes, 50);

                    // Determine trend
                    let trend = "Neutral";
                    if (sma20 && sma50) {
                        const currentPrice = closes[closes.length - 1];
                        if (currentPrice > sma20 && sma20 > sma50) trend = "Bullish";
                        else if (currentPrice < sma20 && sma20 < sma50) trend = "Bearish";
                    }

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
                        price: quote.regularMarketPrice?.toFixed(4) || 'N/A',
                        change: quote.regularMarketChange?.toFixed(4) || '0',
                        changePercent: quote.regularMarketChangePercent?.toFixed(2) || '0',
                        trend: trend,
                        rsi: rsi ? Math.round(rsi) : 'N/A',
                        rsiCondition: rsiCondition,
                        macd: macd ? macd.macd.toFixed(5) : 'N/A',
                        macdSignal: macdSignal,
                        macdHistogram: macd ? macd.histogram.toFixed(5) : 'N/A',
                        atr: atr ? atr.toFixed(5) : 'N/A',
                        sma20: sma20 ? sma20.toFixed(5) : 'N/A',
                        sma50: sma50 ? sma50.toFixed(5) : 'N/A',
                        timestamp: new Date().toISOString(),
                        source: 'yahoo-finance'
                    };

                } catch (error) {
                    console.error(`Error fetching ${config.symbol}:`, error.message);
                    return createFallbackData(config, null);
                }
            });

            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    results.push(result.value);
                }
            });

            // Delay between batches to avoid rate limiting
            if (i + batchSize < symbolConfigs.length) {
                await delay(1000);
            }
        }

        res.status(200).json({
            success: true,
            data: results,
            timestamp: new Date().toISOString(),
            count: results.length
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

// Generate simulated data for currency indices
function generateSimulatedData(config) {
    const baseValues = {
        'USD': 104.5, 'EUR': 92.8, 'JPY': 76.2, 'GBP': 85.6,
        'AUD': 68.9, 'CAD': 74.3, 'CHF': 88.7, 'NZD': 71.4
    };
    
    const base = baseValues[config.symbol];
    const change = (Math.random() - 0.5) * 0.5; // Small random change
    const price = base + change;
    const changePercent = (change / base) * 100;

    // Simulate indicators based on price movement
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
        sma20: (price - change * 0.5).toFixed(4),
        sma50: (price - change).toFixed(4),
        timestamp: new Date().toISOString(),
        source: 'simulated'
    };
}

// Create fallback data when API fails
function createFallbackData(config, quote) {
    const basePrice = config.type === 'commodity' ? 
        (config.symbol.includes('XAU') ? 1925 : 
         config.symbol.includes('XAG') ? 23 : 75) : 1.0;
    
    const price = quote?.regularMarketPrice || basePrice;
    const change = quote?.regularMarketChange || (Math.random() - 0.5) * 0.02;
    const changePercent = quote?.regularMarketChangePercent || (change / basePrice) * 100;

    return {
        symbol: config.symbol,
        price: price.toFixed(4),
        change: change.toFixed(4),
        changePercent: changePercent.toFixed(2),
        trend: "Neutral",
        rsi: 'N/A',
        rsiCondition: "Neutral",
        macd: 'N/A',
        macdSignal: "Neutral",
        macdHistogram: 'N/A',
        atr: 'N/A',
        sma20: 'N/A',
        sma50: 'N/A',
        timestamp: new Date().toISOString(),
        source: 'fallback'
    };
}
