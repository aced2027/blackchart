from typing import List, Dict, Callable
from datetime import datetime

class BacktestEngine:
    def __init__(self, initial_balance: float = 10000):
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.position = None
        self.trades: List[Dict] = []
        
    def run(self, candles: List[Dict], strategy: Callable) -> Dict:
        """Run backtest on historical data"""
        self.balance = self.initial_balance
        self.position = None
        self.trades = []
        
        for i in range(len(candles)):
            current = candles[i]
            signal = strategy(candles[:i+1])
            
            if signal == "BUY" and not self.position:
                self._open_position("BUY", current)
            elif signal == "SELL" and self.position:
                self._close_position(current)
        
        # Close any open position
        if self.position:
            self._close_position(candles[-1])
        
        return self._calculate_metrics()
    
    def _open_position(self, side: str, candle: Dict):
        """Open a trading position"""
        self.position = {
            "side": side,
            "entry_price": candle["close"],
            "entry_time": candle.get("time", datetime.utcnow().isoformat()),
            "quantity": self.balance * 0.95 / candle["close"]
        }
    
    def _close_position(self, candle: Dict):
        """Close current position"""
        if not self.position:
            return
        
        exit_price = candle["close"]
        pnl = (exit_price - self.position["entry_price"]) * self.position["quantity"]
        
        self.balance += pnl
        
        self.trades.append({
            "entry_time": self.position["entry_time"],
            "exit_time": candle.get("time", datetime.utcnow().isoformat()),
            "entry_price": self.position["entry_price"],
            "exit_price": exit_price,
            "pnl": pnl,
            "side": self.position["side"]
        })
        
        self.position = None
    
    def _calculate_metrics(self) -> Dict:
        """Calculate performance metrics"""
        if not self.trades:
            return {"error": "No trades executed"}
        
        winning_trades = [t for t in self.trades if t["pnl"] > 0]
        losing_trades = [t for t in self.trades if t["pnl"] <= 0]
        
        total_pnl = sum(t["pnl"] for t in self.trades)
        win_rate = len(winning_trades) / len(self.trades) * 100
        max_drawdown = self._calculate_drawdown()
        
        avg_win = sum(t["pnl"] for t in winning_trades) / len(winning_trades) if winning_trades else 0
        avg_loss = sum(t["pnl"] for t in losing_trades) / len(losing_trades) if losing_trades else 0
        
        return {
            "total_trades": len(self.trades),
            "winning_trades": len(winning_trades),
            "losing_trades": len(losing_trades),
            "win_rate": round(win_rate, 2),
            "total_pnl": round(total_pnl, 2),
            "final_balance": round(self.balance, 2),
            "return_pct": round((self.balance - self.initial_balance) / self.initial_balance * 100, 2),
            "max_drawdown": round(max_drawdown, 2),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2)
        }
    
    def _calculate_drawdown(self) -> float:
        """Calculate maximum drawdown"""
        cumulative = 0
        running_max = 0
        max_dd = 0
        
        for trade in self.trades:
            cumulative += trade["pnl"]
            running_max = max(running_max, cumulative)
            drawdown = running_max - cumulative
            max_dd = max(max_dd, drawdown)
        
        return max_dd
