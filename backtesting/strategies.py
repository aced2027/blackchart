from typing import List, Dict

def rsi_strategy(candles: List[Dict], period: int = 14, oversold: int = 30, overbought: int = 70) -> str:
    """Simple RSI strategy"""
    if len(candles) < period + 1:
        return "HOLD"
    
    closes = [c["close"] for c in candles]
    deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    
    gains = [d if d > 0 else 0 for d in deltas[-period:]]
    losses = [-d if d < 0 else 0 for d in deltas[-period:]]
    
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    
    if avg_loss == 0:
        return "HOLD"
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    if rsi < oversold:
        return "BUY"
    elif rsi > overbought:
        return "SELL"
    
    return "HOLD"

def macd_strategy(candles: List[Dict]) -> str:
    """MACD crossover strategy"""
    if len(candles) < 26:
        return "HOLD"
    
    closes = [c["close"] for c in candles]
    
    ema12 = _ema(closes, 12)
    ema26 = _ema(closes, 26)
    
    macd = [ema12[i] - ema26[i] for i in range(len(ema12))]
    signal = _ema(macd, 9)
    
    if len(macd) < 2:
        return "HOLD"
    
    # Crossover detection
    if macd[-2] < signal[-2] and macd[-1] > signal[-1]:
        return "BUY"
    elif macd[-2] > signal[-2] and macd[-1] < signal[-1]:
        return "SELL"
    
    return "HOLD"

def moving_average_crossover(candles: List[Dict], fast: int = 20, slow: int = 50) -> str:
    """Moving average crossover strategy"""
    if len(candles) < slow:
        return "HOLD"
    
    closes = [c["close"] for c in candles]
    ma_fast = sum(closes[-fast:]) / fast
    ma_slow = sum(closes[-slow:]) / slow
    
    prev_ma_fast = sum(closes[-fast-1:-1]) / fast
    prev_ma_slow = sum(closes[-slow-1:-1]) / slow
    
    if prev_ma_fast < prev_ma_slow and ma_fast > ma_slow:
        return "BUY"
    elif prev_ma_fast > prev_ma_slow and ma_fast < ma_slow:
        return "SELL"
    
    return "HOLD"

def _ema(data: List[float], period: int) -> List[float]:
    """Calculate exponential moving average"""
    alpha = 2 / (period + 1)
    ema = [data[0]]
    
    for i in range(1, len(data)):
        ema.append(alpha * data[i] + (1 - alpha) * ema[-1])
    
    return ema
