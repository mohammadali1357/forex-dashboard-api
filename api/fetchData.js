const yahooFinance = require('yahoo-finance2').default;

// Technical indicator calculations
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    // Calculate initial gains/losses
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate subsequent values
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
    
    // Calculate EMAs
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
    
    // Calculate MACD line
    const macdLine = [];
    for (let i = 0; i < slowEMA.length; i++) {
        macdLine.push(fastEMA[i] - slowEMA[i]);
    }
    
    // Calculate Signal line
    const signalLine = calculateEMA(macdLine, signalPeriod);
    
    // Calculate Histogram
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
    
    // Simple moving average of true ranges
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
    // Comprehensive CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const symbols = [
            'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X',
            'EURGBP=X', 'EURJPY=X', 'GBPJPY=X', 'EURCHF=X', 'AUDJPY=X', 'CADJPY=X', 'NZDJPY=X',
            'GBPCAD=X', 'EURAUD=X', 'EURCAD=X', 'AUDCAD=X', 'GBPAUD=X', 'GBPNZD=X', 'EURNZD=X',
            'AUDNZD=X', 'CHFJPY=X', 'CADCHF=X', 'NZDCAD=X', 'NZDCHF=X', 'GBPCHF=X', 'EURSEK=X',
            'GC=F', 'SI=F', 'CL=F', 'BZ=F', 'NG=F', 'HG=F', 'PL=F', 'PA=F', 'ZC=F', 'ZS=F', 'ZM=F',
            'DX-Y.NYB'
        ];

        const results = [];

        for (const symbol of symbols) {
            try {
                // Get current quote
                const quote = await yahooFinance.quote(symbol);
                
                // Get historical data for indicators (last 60 days)
                const historical = await yahooFinance.historical(symbol, {
                    period1: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    period2: new Date().toISOString().split('T')[0],
                    interval: '1d'
                });

                if (historical && historical.length > 15) { // Need at least 15 days for RSI
                    const closes = historical.map(h => h.close).filter(Boolean);
                    const highs = historical.map(h => h.high).filter(Boolean);
                    const lows = historical.map(h => h.low).filter(Boolean);
                    
                    // Calculate indicators
                    const rsi = calculateRSI(closes);
                    const macd = calculateMACD(closes);
                    const atr = calculateATR(highs, lows, closes);
                    const sma20 = calculateSMA(closes, 20);
                    const sma50 = calculateSMA(closes, 50);
                    
                    // Determine trend based on moving averages
                    let trend = "Neutral";
                    if (sma20 && sma50) {
                        if (closes[closes.length - 1] > sma20 && sma20 > sma50) trend = "Bullish";
                        else if (closes[closes.length - 1] < sma20 && sma20 < sma50) trend = "Bearish";
                    }
                    
                    // Determine RSI condition
                    let rsiCondition = "Neutral";
                    if (rsi > 70) rsiCondition = "Overbought";
                    else if (rsi < 30) rsiCondition = "Oversold";
                    
                    // Determine MACD signal
                    let macdSignal = "Neutral";
                    if (macd && macd.macd > macd.signal) macdSignal = "Bullish";
                    else if (macd && macd.macd < macd.signal) macdSignal = "Bearish";
                    
                    // Format symbol for display
                    let displaySymbol = symbol;
                    if (symbol === 'GC=F') displaySymbol = 'XAU/USD';
                    if (symbol === 'SI=F') displaySymbol = 'XAG/USD';
                    if (symbol.endsWith('=X')) displaySymbol = symbol.replace('=X', '');
                    
                    results.push({
                        symbol: displaySymbol,
                        price: quote.regularMarketPrice || 'N/A',
                        change: quote.regularMarketChange || 0,
                        changePercent: quote.regularMarketChangePercent || 0,
                        trend: trend,
                        rsi: rsi ? Math.round(rsi) : 'N/A',
                        rsiCondition: rsiCondition,
                        macd: macd ? macd.macd.toFixed(5) : 'N/A',
                        macdSignal: macdSignal,
                        macdHistogram: macd ? macd.histogram.toFixed(5) : 'N/A',
                        atr: atr ? atr.toFixed(5) : 'N/A',
                        sma20: sma20 ? sma20.toFixed(5) : 'N/A',
                        sma50: sma50 ? sma50.toFixed(5) : 'N/A',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    // Fallback if no historical data
                    let displaySymbol = symbol;
                    if (symbol === 'GC=F') displaySymbol = 'XAU/USD';
                    if (symbol === 'SI=F') displaySymbol = 'XAG/USD';
                    if (symbol.endsWith('=X')) displaySymbol = symbol.replace('=X', '');
                    
                    results.push({
                        symbol: displaySymbol,
                        price: quote.regularMarketPrice || 'N/A',
                        change: quote.regularMarketChange || 0,
                        changePercent: quote.regularMarketChangePercent || 0,
                        trend: "Neutral",
                        rsi: 'N/A',
                        rsiCondition: "Neutral",
                        macd: 'N/A',
                        macdSignal: "Neutral",
                        macdHistogram: 'N/A',
                        atr: 'N/A',
                        sma20: 'N/A',
                        sma50: 'N/A',
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error.message);
                // Continue with other symbols even if one fails
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


