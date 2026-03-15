from typing import List, Dict

def calculate_rsi(candles: List[Dict], period: int = 14) -> List[Dict]:
    """Calculate RSI indicator"""
    if len(candles) < period + 1:
        return []
    
    closes = [c["close"] for c in candles]
    deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]
    
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    
    if avg_loss == 0:
        rsi = 100
    else:
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
    
    return [{"time": candles[-1]["time"], "value": rsi}]

def calculate_macd(candles: List[Dict], fast=12, slow=26, signal=9) -> Dict:
    """Calculate MACD indicator"""
    if len(candles) < slow:
        return {"macd": [], "signal": [], "histogram": []}
    
    closes = [c["close"] for c in candles]
    
    ema_fast = _ema(closes, fast)
    ema_slow = _ema(closes, slow)
    macd_line = [ema_fast[i] - ema_slow[i] for i in range(len(ema_fast))]
    signal_line = _ema(macd_line, signal)
    histogram = [macd_line[i] - signal_line[i] for i in range(len(signal_line))]
    
    return {
        "macd": macd_line[-10:],
        "signal": signal_line[-10:],
        "histogram": histogram[-10:]
    }

def _ema(data: List[float], period: int) -> List[float]:
    """Calculate exponential moving average"""
    alpha = 2 / (period + 1)
    ema = [data[0]]
    
    for i in range(1, len(data)):
        ema.append(alpha * data[i] + (1 - alpha) * ema[-1])
    
    return ema
