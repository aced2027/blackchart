import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Live Candlestick Chart with Tick Data Integration
 * Integrates with backend tick data for 2021-2026 historical data
 */
const LiveCandlestickChart = () => {
  const canvasRef = useRef(null);
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1H');
  const [candles, setCandles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [viewState, setViewState] = useState({
    visibleStart: 0,
    visibleEnd: 100,
    isDragging: false,
    dragStartX: 0,
    dragStartIdx: 0
  });

  // Timeframe intervals in milliseconds
  const INTERVALS = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1H': 3600000,
    '4H': 14400000,
    '1D': 86400000
  };

  // Chart colors
  const COLORS = {
    background: '#131722',
    grid: 'rgba(42, 46, 57, 0.8)',
    axisText: '#787b86',
    bullBody: '#26a69a',
    bullWick: '#26a69a',
    bearBody: '#ef5350',
    bearWick: '#ef5350',
    crosshair: 'rgba(255,255,255,0.3)',
    priceLine: '#2962ff'
  };

  // Fetch candle data from backend
  const fetchCandleData = useCallback(async (symbol, timeframe) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/candles/${symbol}/${timeframe}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert to internal format
      const processedCandles = data.map(candle => ({
        t: new Date(candle.time).getTime(),
        o: parseFloat(candle.open),
        h: parseFloat(candle.high),
        l: parseFloat(candle.low),
        c: parseFloat(candle.close),
        v: parseFloat(candle.volume || 0)
      }));
      
      setCandles(processedCandles);
      
      // Set initial view
      setViewState(prev => ({
        ...prev,
        visibleEnd: Math.min(100, processedCandles.length),
        visibleStart: Math.max(0, processedCandles.length - 100)
      }));
      
    } catch (error) {
      console.error('Failed to fetch candle data:', error);
      // Fallback to simulated data
      const simulatedData = generateSimulatedData(1000);
      setCandles(simulatedData);
    }
    setIsLoading(false);
  }, []);

  // Generate simulated data as fallback
  const generateSimulatedData = useCallback((count) => {
    const data = [];
    let price = symbol === 'EURUSD' ? 1.0850 : 45000;
    const now = Date.now();
    const interval = INTERVALS[timeframe];
    
    for (let i = 0; i < count; i++) {
      const timestamp = now - (count - i) * interval;
      
      // Random walk with volatility
      const volatility = symbol === 'EURUSD' ? 0.002 : 0.02;
      const change = (Math.random() - 0.5) * volatility * price;
      
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
      const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
      const volume = 100 + Math.random() * 1000;
      
      data.push({
        t: timestamp,
        o: Math.round(open * 100000) / 100000,
        h: Math.round(high * 100000) / 100000,
        l: Math.round(low * 100000) / 100000,
        c: Math.round(close * 100000) / 100000,
        v: Math.round(volume * 100) / 100
      });
      
      price = close;
    }
    
    return data;
  }, [symbol, timeframe, INTERVALS]);

  // Load data when symbol or timeframe changes
  useEffect(() => {
    fetchCandleData(symbol, timeframe);
  }, [symbol, timeframe, fetchCandleData]);

  // Canvas rendering
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);
    
    const padding = { top: 20, right: 70, bottom: 28, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    if (chartWidth <= 0 || chartHeight <= 0) return;
    
    // Calculate visible candles
    const visibleCandles = candles.slice(viewState.visibleStart, viewState.visibleEnd);
    if (visibleCandles.length === 0) return;
    
    // Price range
    const prices = visibleCandles.flatMap(c => [c.h, c.l]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;
    const adjustedMin = minPrice - pricePadding;
    const adjustedMax = maxPrice + pricePadding;
    const adjustedRange = adjustedMax - adjustedMin;
    
    if (adjustedRange <= 0) return;
    
    // Helper functions
    const priceToY = (price) => {
      return padding.top + ((adjustedMax - price) / adjustedRange) * chartHeight;
    };
    
    const indexToX = (index) => {
      return padding.left + ((index - viewState.visibleStart) / (viewState.visibleEnd - viewState.visibleStart)) * chartWidth;
    };
    
    // Draw grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Horizontal grid lines
    for (let i = 0; i <= 6; i++) {
      const price = adjustedMin + (adjustedRange * i / 6);
      const y = Math.round(priceToY(price));
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = Math.round(padding.left + (chartWidth * i / 10));
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
    }
    
    ctx.stroke();
    
    // Draw candles
    const candleWidth = Math.max(1, Math.floor(chartWidth / visibleCandles.length) - 1);
    
    visibleCandles.forEach((candle, index) => {
      const candleIndex = viewState.visibleStart + index;
      const x = Math.round(indexToX(candleIndex));
      const openY = Math.round(priceToY(candle.o));
      const highY = Math.round(priceToY(candle.h));
      const lowY = Math.round(priceToY(candle.l));
      const closeY = Math.round(priceToY(candle.c));
      
      const isBull = candle.c > candle.o;
      const bodyColor = isBull ? COLORS.bullBody : COLORS.bearBody;
      const wickColor = isBull ? COLORS.bullWick : COLORS.bearWick;
      
      // Draw wick
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      
      ctx.fillStyle = bodyColor;
      ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
    });
    
    // Draw price axis
    ctx.fillStyle = COLORS.axisText;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 6; i++) {
      const price = adjustedMin + (adjustedRange * i / 6);
      const y = padding.top + ((1 - i / 6) * chartHeight);
      const priceText = price.toFixed(symbol === 'EURUSD' ? 5 : 2);
      ctx.fillText(priceText, width - padding.right + 5, y);
    }
    
    // Draw time axis
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    for (let i = 0; i <= 8; i++) {
      const candleIndex = viewState.visibleStart + Math.floor((viewState.visibleEnd - viewState.visibleStart) * i / 8);
      if (candleIndex < candles.length) {
        const x = padding.left + (chartWidth * i / 8);
        const time = new Date(candles[candleIndex].t);
        const timeText = time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        ctx.fillText(timeText, x, height - padding.bottom + 5);
      }
    }
    
    // Draw current price line
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const currentPriceY = priceToY(lastCandle.c);
      
      ctx.strokeStyle = COLORS.priceLine;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, currentPriceY);
      ctx.lineTo(width - padding.right, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw crosshair
    if (hoveredCandle !== null && mousePos.x > padding.left && mousePos.x < width - padding.right) {
      ctx.strokeStyle = COLORS.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, mousePos.y);
      ctx.lineTo(width - padding.right, mousePos.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(mousePos.x, padding.top);
      ctx.lineTo(mousePos.x, height - padding.bottom);
      ctx.stroke();
      
      ctx.setLineDash([]);
    }
    
  }, [candles, viewState, hoveredCandle, mousePos, symbol, COLORS]);

  // Mouse event handlers
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    
    // Find hovered candle
    const padding = { top: 20, right: 70, bottom: 28, left: 20 };
    const chartWidth = canvas.width - padding.left - padding.right;
    
    if (x >= padding.left && x <= canvas.width - padding.right) {
      const relativeX = x - padding.left;
      const candleIndex = viewState.visibleStart + Math.floor((relativeX / chartWidth) * (viewState.visibleEnd - viewState.visibleStart));
      
      if (candleIndex >= viewState.visibleStart && candleIndex < viewState.visibleEnd && candleIndex < candles.length) {
        setHoveredCandle(candleIndex);
      } else {
        setHoveredCandle(null);
      }
    } else {
      setHoveredCandle(null);
    }
  }, [candles.length, viewState]);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawChart();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawChart]);

  // Redraw when data changes
  useEffect(() => {
    drawChart();
  }, [drawChart]);
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: COLORS.background,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'monospace'
    }}>
      {/* Top Control Bar */}
      <div style={{
        height: '50px',
        backgroundColor: '#1a1d27',
        borderBottom: '1px solid #2a2e39',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#787b86', fontSize: '12px' }}>Symbol:</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={{
              background: '#131722',
              border: '1px solid #2a2e39',
              borderRadius: '4px',
              padding: '6px 10px',
              color: '#d1d4dc',
              fontSize: '12px'
            }}
          >
            <option value="EURUSD">EURUSD</option>
            <option value="GBPUSD">GBPUSD</option>
            <option value="USDJPY">USDJPY</option>
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '2px' }}>
          {Object.keys(INTERVALS).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                background: timeframe === tf ? '#2962ff' : 'transparent',
                border: '1px solid #2a2e39',
                borderRadius: '4px',
                padding: '4px 8px',
                color: timeframe === tf ? 'white' : '#787b86',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => fetchCandleData(symbol, timeframe)}
          disabled={isLoading}
          style={{
            background: '#2962ff',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            color: 'white',
            fontSize: '12px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '⏳ Loading...' : '📥 Refresh'}
        </button>
        
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#787b86' }}>
          {candles.length > 0 ? `${candles.length} candles loaded` : 'No data'}
        </div>
      </div>
      
      {/* OHLC Summary Bar */}
      <div style={{
        height: '30px',
        backgroundColor: '#1a1d27',
        borderBottom: '1px solid #2a2e39',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '20px',
        fontSize: '12px'
      }}>
        <span style={{ color: '#d1d4dc', fontWeight: '500' }}>{symbol}</span>
        
        {hoveredCandle !== null && candles[hoveredCandle] && (
          <>
            <span style={{ color: '#787b86' }}>
              O: <span style={{ color: '#d1d4dc' }}>{candles[hoveredCandle].o.toFixed(symbol === 'EURUSD' ? 5 : 2)}</span>
            </span>
            <span style={{ color: '#787b86' }}>
              H: <span style={{ color: '#d1d4dc' }}>{candles[hoveredCandle].h.toFixed(symbol === 'EURUSD' ? 5 : 2)}</span>
            </span>
            <span style={{ color: '#787b86' }}>
              L: <span style={{ color: '#d1d4dc' }}>{candles[hoveredCandle].l.toFixed(symbol === 'EURUSD' ? 5 : 2)}</span>
            </span>
            <span style={{ color: '#787b86' }}>
              C: <span style={{ color: '#d1d4dc' }}>{candles[hoveredCandle].c.toFixed(symbol === 'EURUSD' ? 5 : 2)}</span>
            </span>
            <span style={{ color: '#787b86' }}>
              V: <span style={{ color: '#d1d4dc' }}>{candles[hoveredCandle].v.toFixed(1)}</span>
            </span>
            <span style={{ 
              color: candles[hoveredCandle].c > candles[hoveredCandle].o ? COLORS.bullBody : COLORS.bearBody 
            }}>
              {((candles[hoveredCandle].c - candles[hoveredCandle].o) / candles[hoveredCandle].o * 100).toFixed(2)}%
            </span>
          </>
        )}
      </div>
      
      {/* Chart Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredCandle(null)}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'crosshair'
          }}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(30, 34, 45, 0.9)',
            border: '1px solid #2a2e39',
            borderRadius: '8px',
            padding: '20px',
            color: '#d1d4dc',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #2a2e39',
              borderTop: '2px solid #2962ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Loading {symbol} {timeframe} data...
          </div>
        )}
        
        {/* Tooltip */}
        {hoveredCandle !== null && candles[hoveredCandle] && (
          <div style={{
            position: 'absolute',
            top: mousePos.y + 10,
            left: mousePos.x + 10,
            background: 'rgba(30, 34, 45, 0.95)',
            border: '1px solid #2a2e39',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '11px',
            color: '#d1d4dc',
            pointerEvents: 'none',
            zIndex: 1000
          }}>
            <div>Time: {new Date(candles[hoveredCandle].t).toLocaleString()}</div>
            <div>Open: {candles[hoveredCandle].o.toFixed(symbol === 'EURUSD' ? 5 : 2)}</div>
            <div>High: {candles[hoveredCandle].h.toFixed(symbol === 'EURUSD' ? 5 : 2)}</div>
            <div>Low: {candles[hoveredCandle].l.toFixed(symbol === 'EURUSD' ? 5 : 2)}</div>
            <div>Close: {candles[hoveredCandle].c.toFixed(symbol === 'EURUSD' ? 5 : 2)}</div>
            <div>Volume: {candles[hoveredCandle].v.toFixed(1)}</div>
            <div style={{ 
              color: candles[hoveredCandle].c > candles[hoveredCandle].o ? COLORS.bullBody : COLORS.bearBody 
            }}>
              Change: {((candles[hoveredCandle].c - candles[hoveredCandle].o) / candles[hoveredCandle].o * 100).toFixed(2)}%
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LiveCandlestickChart;