import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * TradingView-style Candlestick Chart Component
 * Production-grade Japanese candlestick chart with settings modal
 */
const TradingViewChart = ({ tickData = [] }) => {
  // ===== CHART STATE =====
  const canvasRef = useRef(null);
  const [timeframe, setTimeframe] = useState('1H');
  const [candles, setCandles] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(null);
  
  // ===== CHART SETTINGS =====
  const [settings, setSettings] = useState({
    // Candle colors - Black and White style
    bullColor: '#FFFFFF',
    bearColor: '#000000',
    bullBorderColor: '#000000',
    bearBorderColor: '#000000',
    bullWickColor: '#000000',
    bearWickColor: '#000000',
    
    // Visibility toggles
    showBody: true,
    showBorders: true,
    showWicks: true,
    colorBasedOnPrevClose: false,
    
    // Data settings
    precision: 'Default',
    timezone: 'UTC',
    
    // Status line
    showLogo: true,
    showTitle: true,
    showChartValues: true,
    showBarChange: true,
    showVolume: true,
    showLastDayChange: true,
    showIndicatorTitles: true,
    showIndicatorInputs: true,
    showIndicatorValues: true,
    
    // Canvas
    backgroundColor: '#FFFFFF',
    showGridLines: true,
    
    // Scales
    showPriceScale: true,
    showTimeScale: true
  });

  // ===== TIMEFRAME INTERVALS =====
  const timeframes = useMemo(() => ({
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1H': 3600000,
    '4H': 14400000,
    '1D': 86400000
  }), []);

  // ===== SAMPLE TICK DATA GENERATOR =====
  const generateTicks = useCallback((count, startPrice = 65432.10) => {
    const ticks = [];
    let price = startPrice;
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 20;
      price += change;
      price = Math.max(price, startPrice * 0.8); // Floor
      price = Math.min(price, startPrice * 1.2); // Ceiling
      
      ticks.push({
        timestamp: now - (count - i) * 1000,
        price: parseFloat(price.toFixed(2)),
        volume: Math.random() * 2 + 0.1
      });
    }
    return ticks;
  }, []);

  // ===== TICK DATA AGGREGATION =====
  const aggregateTicks = useCallback((ticks, intervalMs) => {
    if (!ticks || ticks.length === 0) return [];
    
    const groups = {};
    
    ticks.forEach(tick => {
      const bucketTime = Math.floor(tick.timestamp / intervalMs) * intervalMs;
      if (!groups[bucketTime]) {
        groups[bucketTime] = [];
      }
      groups[bucketTime].push(tick);
    });
    
    const candles = Object.keys(groups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(bucketTime => {
        const ticksInBucket = groups[bucketTime];
        const prices = ticksInBucket.map(t => t.price);
        const volumes = ticksInBucket.map(t => t.volume);
        
        return {
          t: parseInt(bucketTime),
          o: ticksInBucket[0].price,
          h: Math.max(...prices),
          l: Math.min(...prices),
          c: ticksInBucket[ticksInBucket.length - 1].price,
          v: volumes.reduce((sum, vol) => sum + vol, 0)
        };
      });
    
    return candles;
  }, []);

  // ===== INITIALIZE WITH SAMPLE DATA =====
  useEffect(() => {
    if (tickData.length === 0) {
      const sampleTicks = generateTicks(5000);
      const aggregatedCandles = aggregateTicks(sampleTicks, timeframes[timeframe]);
      setCandles(aggregatedCandles);
    } else {
      const aggregatedCandles = aggregateTicks(tickData, timeframes[timeframe]);
      setCandles(aggregatedCandles);
    }
  }, [tickData, timeframe, generateTicks, aggregateTicks, timeframes]);
  // ===== CHART RENDERING =====
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Chart dimensions
    const padding = { top: 60, right: 80, bottom: 40, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    if (chartWidth <= 0 || chartHeight <= 0) return;
    
    // Price range
    const prices = candles.flatMap(c => [c.h, c.l]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;
    const adjustedMin = minPrice - pricePadding;
    const adjustedMax = maxPrice + pricePadding;
    const adjustedRange = adjustedMax - adjustedMin;
    
    // Price to Y coordinate
    const priceToY = (price) => {
      return padding.top + ((adjustedMax - price) / adjustedRange) * chartHeight;
    };
    
    // Time to X coordinate
    const candleWidth = Math.max(2, chartWidth / candles.length * 0.8);
    const candleSpacing = chartWidth / candles.length;
    
    const timeToX = (index) => {
      return padding.left + (index + 0.5) * candleSpacing;
    };
    
    // Draw grid lines
    if (settings.showGridLines) {
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines (price levels)
      const priceSteps = 6;
      for (let i = 0; i <= priceSteps; i++) {
        const price = adjustedMin + (adjustedRange * i / priceSteps);
        const y = priceToY(price);
        
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }
      
      // Vertical grid lines (time)
      const timeSteps = Math.min(10, candles.length);
      for (let i = 0; i <= timeSteps; i++) {
        const index = Math.floor((candles.length - 1) * i / timeSteps);
        const x = timeToX(index);
        
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();
      }
    }
    
    // Draw candles
    candles.forEach((candle, index) => {
      const x = timeToX(index);
      const openY = priceToY(candle.o);
      const highY = priceToY(candle.h);
      const lowY = priceToY(candle.l);
      const closeY = priceToY(candle.c);
      
      // Determine candle color
      let isBullish;
      if (settings.colorBasedOnPrevClose && index > 0) {
        isBullish = candle.c > candles[index - 1].c;
      } else {
        isBullish = candle.c > candle.o;
      }
      
      const bodyColor = isBullish ? settings.bullColor : settings.bearColor;
      const borderColor = isBullish ? settings.bullBorderColor : settings.bearBorderColor;
      const wickColor = isBullish ? settings.bullWickColor : settings.bearWickColor;
      
      // Draw wick
      if (settings.showWicks) {
        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();
      }
      
      // Draw body
      if (settings.showBody) {
        const bodyTop = Math.min(openY, closeY);
        const bodyBottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(1, bodyBottom - bodyTop);
        
        // Fill body - white for bullish, black for bearish
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
        
        // Draw border - always black
        if (settings.showBorders) {
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
        }
      }
    });
    
    // Draw price axes
    if (settings.showPriceScale) {
      ctx.fillStyle = '#333333';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      
      const priceSteps = 6;
      for (let i = 0; i <= priceSteps; i++) {
        const price = adjustedMin + (adjustedRange * i / priceSteps);
        const y = priceToY(price);
        const priceText = price.toFixed(2);
        
        ctx.fillText(priceText, width - padding.right + 5, y + 3);
      }
    }
    
    // Draw time axis
    if (settings.showTimeScale) {
      ctx.fillStyle = '#333333';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      
      const timeSteps = Math.min(8, candles.length);
      for (let i = 0; i <= timeSteps; i++) {
        const index = Math.floor((candles.length - 1) * i / timeSteps);
        if (index < candles.length) {
          const x = timeToX(index);
          const time = new Date(candles[index].t);
          const timeText = time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          
          ctx.fillText(timeText, x, height - padding.bottom + 15);
        }
      }
    }
    
    // Draw current price line
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const currentPriceY = priceToY(lastCandle.c);
      const isUp = candles.length > 1 ? lastCandle.c > candles[candles.length - 2].c : true;
      const lineColor = '#888888';
      
      // Dotted line
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, currentPriceY);
      ctx.lineTo(width - padding.right, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Price tag
      const priceText = lastCandle.c.toFixed(2);
      const tagWidth = 60;
      const tagHeight = 20;
      const tagX = width - padding.right - tagWidth;
      const tagY = currentPriceY - tagHeight/2;
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(tagX, tagY, tagWidth, tagHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(priceText, tagX + tagWidth/2, tagY + tagHeight/2 + 4);
    }
    
    // Draw crosshair
    if (showCrosshair && mousePos.x > padding.left && mousePos.x < width - padding.right &&
        mousePos.y > padding.top && mousePos.y < height - padding.bottom) {
      
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padding.left, mousePos.y);
      ctx.lineTo(width - padding.right, mousePos.y);
      ctx.stroke();
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, padding.top);
      ctx.lineTo(mousePos.x, height - padding.bottom);
      ctx.stroke();
      
      ctx.setLineDash([]);
    }
    
  }, [candles, settings, showCrosshair, mousePos]);

  // ===== MOUSE HANDLERS =====
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    setShowCrosshair(true);
    
    // Find hovered candle
    const padding = { top: 60, right: 80, bottom: 40, left: 20 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const candleSpacing = chartWidth / candles.length;
    
    if (x > padding.left && x < canvas.width - padding.right) {
      const candleIndex = Math.floor((x - padding.left) / candleSpacing);
      if (candleIndex >= 0 && candleIndex < candles.length) {
        setHoveredCandle(candles[candleIndex]);
      } else {
        setHoveredCandle(null);
      }
    } else {
      setHoveredCandle(null);
    }
  }, [candles]);

  const handleMouseLeave = useCallback(() => {
    setShowCrosshair(false);
    setHoveredCandle(null);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setShowSettingsModal(true);
  }, []);

  // ===== CANVAS SETUP =====
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

  // Redraw when settings change
  useEffect(() => {
    drawChart();
  }, [drawChart]);
  // ===== COLOR PICKER COMPONENT =====
  const ColorPicker = ({ color, onChange, onClose }) => {
    const [selectedColor, setSelectedColor] = useState(color);
    const [recentColors] = useState(['#26a69a', '#ef5350', '#2962ff', '#ff9800', '#9c27b0']);
    const [customHex, setCustomHex] = useState(color);
    
    // Preset color palette (96 colors in 12 columns)
    const presetColors = [
      '#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00', '#bfff00', '#80ff00', '#40ff00', '#00ff00', '#00ff40', '#00ff80', '#00ffbf',
      '#00ffff', '#00bfff', '#0080ff', '#0040ff', '#0000ff', '#4000ff', '#8000ff', '#bf00ff', '#ff00ff', '#ff00bf', '#ff0080', '#ff0040',
      '#800000', '#804000', '#808000', '#80bf00', '#80ff00', '#40ff00', '#008000', '#008040', '#008080', '#0040ff', '#000080', '#400080',
      '#800080', '#800040', '#ff8080', '#ffbf80', '#ffff80', '#bfff80', '#80ff80', '#80ffbf', '#80ffff', '#80bfff', '#8080ff', '#bf80ff',
      '#ff80ff', '#ff80bf', '#400000', '#402000', '#404000', '#405f00', '#408000', '#208000', '#004000', '#004020', '#004040', '#002040',
      '#000040', '#200040', '#400040', '#400020', '#000000', '#202020', '#404040', '#606060', '#808080', '#a0a0a0', '#c0c0c0', '#e0e0e0',
      '#ffffff', '#ffe0e0', '#fff0e0', '#ffffe0', '#e0ffe0', '#e0f0ff', '#e0e0ff', '#f0e0ff', '#ffe0ff', '#ffe0f0', '#f0f0f0', '#e8e8e8',
      '#d0d0d0', '#b8b8b8', '#a0a0a0', '#888888', '#707070', '#585858', '#404040', '#282828', '#101010', '#080808', '#000000', '#ffffff'
    ];
    
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#1e222d',
        border: '1px solid #2a2e39',
        borderRadius: '8px',
        padding: '16px',
        zIndex: 1001,
        width: '320px'
      }}>
        <div style={{ marginBottom: '12px', color: '#d1d4dc', fontSize: '14px', fontWeight: '500' }}>
          Color Picker
        </div>
        
        {/* Preset Colors Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(12, 1fr)', 
          gap: '2px', 
          marginBottom: '12px' 
        }}>
          {presetColors.map((presetColor, index) => (
            <div
              key={index}
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: presetColor,
                cursor: 'pointer',
                border: selectedColor === presetColor ? '2px solid #2962ff' : '1px solid #2a2e39',
                borderRadius: '2px'
              }}
              onClick={() => setSelectedColor(presetColor)}
            />
          ))}
        </div>
        
        {/* Recent Colors */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: '#787b86', fontSize: '12px', marginBottom: '4px' }}>Recent</div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {recentColors.map((recentColor, index) => (
              <div
                key={index}
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: recentColor,
                  cursor: 'pointer',
                  border: selectedColor === recentColor ? '2px solid #2962ff' : '1px solid #2a2e39',
                  borderRadius: '2px'
                }}
                onClick={() => setSelectedColor(recentColor)}
              />
            ))}
          </div>
        </div>
        
        {/* Hex Input */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#787b86', fontSize: '12px', marginBottom: '4px' }}>Hex</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              style={{
                flex: 1,
                background: '#131722',
                border: '1px solid #2a2e39',
                borderRadius: '4px',
                padding: '6px 8px',
                color: '#d1d4dc',
                fontSize: '12px'
              }}
              placeholder="#ffffff"
            />
            <button
              onClick={() => setSelectedColor(customHex)}
              style={{
                background: '#2962ff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>
        </div>
        
        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #2a2e39',
              borderRadius: '4px',
              padding: '6px 16px',
              color: '#d1d4dc',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onChange(selectedColor);
              onClose();
            }}
            style={{
              background: '#2962ff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            OK
          </button>
        </div>
      </div>
    );
  };
  // ===== SETTINGS MODAL COMPONENT =====
  const SettingsModal = () => {
    const tabs = [
      'Symbol',
      'Status line', 
      'Scales and lines',
      'Canvas',
      'Trading',
      'Alerts',
      'Events'
    ];
    
    const ColorSwatch = ({ color, onChange, label }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: color,
            border: '1px solid #2a2e39',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
          onClick={() => setShowColorPicker({ color, onChange, label })}
        />
        <span style={{ color: '#d1d4dc', fontSize: '12px' }}>{label}</span>
      </div>
    );
    
    const Checkbox = ({ checked, onChange, label }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ accentColor: '#2962ff' }}
        />
        <span style={{ color: '#d1d4dc', fontSize: '12px' }}>{label}</span>
      </div>
    );
    
    const renderTabContent = () => {
      switch (activeTab) {
        case 0: // Symbol
          return (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#d1d4dc', margin: '0 0 12px 0', fontSize: '14px' }}>CANDLES</h4>
                
                <div style={{ marginBottom: '16px' }}>
                  <Checkbox
                    checked={settings.showBody}
                    onChange={(checked) => setSettings(prev => ({ ...prev, showBody: checked }))}
                    label="Body"
                  />
                  {settings.showBody && (
                    <div style={{ marginLeft: '28px' }}>
                      <ColorSwatch
                        color={settings.bullColor}
                        onChange={(color) => setSettings(prev => ({ ...prev, bullColor: color }))}
                        label="Bull"
                      />
                      <ColorSwatch
                        color={settings.bearColor}
                        onChange={(color) => setSettings(prev => ({ ...prev, bearColor: color }))}
                        label="Bear"
                      />
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <Checkbox
                    checked={settings.showBorders}
                    onChange={(checked) => setSettings(prev => ({ ...prev, showBorders: checked }))}
                    label="Borders"
                  />
                  {settings.showBorders && (
                    <div style={{ marginLeft: '28px' }}>
                      <ColorSwatch
                        color={settings.bullBorderColor}
                        onChange={(color) => setSettings(prev => ({ ...prev, bullBorderColor: color }))}
                        label="Bull"
                      />
                      <ColorSwatch
                        color={settings.bearBorderColor}
                        onChange={(color) => setSettings(prev => ({ ...prev, bearBorderColor: color }))}
                        label="Bear"
                      />
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <Checkbox
                    checked={settings.showWicks}
                    onChange={(checked) => setSettings(prev => ({ ...prev, showWicks: checked }))}
                    label="Wick"
                  />
                  {settings.showWicks && (
                    <div style={{ marginLeft: '28px' }}>
                      <ColorSwatch
                        color={settings.bullWickColor}
                        onChange={(color) => setSettings(prev => ({ ...prev, bullWickColor: color }))}
                        label="Bull"
                      />
                      <ColorSwatch
                        color={settings.bearWickColor}
                        onChange={(color) => setSettings(prev => ({ ...prev, bearWickColor: color }))}
                        label="Bear"
                      />
                    </div>
                  )}
                </div>
                
                <Checkbox
                  checked={settings.colorBasedOnPrevClose}
                  onChange={(checked) => setSettings(prev => ({ ...prev, colorBasedOnPrevClose: checked }))}
                  label="Color bars based on previous close"
                />
              </div>
              
              <div>
                <h4 style={{ color: '#d1d4dc', margin: '0 0 12px 0', fontSize: '14px' }}>DATA MODIFICATION</h4>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: '#787b86', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Precision
                  </label>
                  <select
                    value={settings.precision}
                    onChange={(e) => setSettings(prev => ({ ...prev, precision: e.target.value }))}
                    style={{
                      background: '#131722',
                      border: '1px solid #2a2e39',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      color: '#d1d4dc',
                      fontSize: '12px',
                      width: '100px'
                    }}
                  >
                    <option value="Default">Default</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ color: '#787b86', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    style={{
                      background: '#131722',
                      border: '1px solid #2a2e39',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      color: '#d1d4dc',
                      fontSize: '12px',
                      width: '120px'
                    }}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">New York</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>
            </div>
          );
          
        case 1: // Status line
          return (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#d1d4dc', margin: '0 0 12px 0', fontSize: '14px' }}>SYMBOL</h4>
                <Checkbox
                  checked={settings.showLogo}
                  onChange={(checked) => setSettings(prev => ({ ...prev, showLogo: checked }))}
                  label="Logo"
                />
                <Checkbox
                  checked={settings.showTitle}
                  onChange={(checked) => setSettings(prev => ({ ...prev, showTitle: checked }))}
                  label="Title"
                />
                <Checkbox
                  checked={settings.showChartValues}
                  onChange={(checked) => setSettings(prev => ({ ...prev, showChartValues: checked }))}
                  label="Chart values"
                />
                <Checkbox
                  checked={settings.showBarChange}
                  onChange={(checked) => setSettings(prev => ({ ...prev, showBarChange: checked }))}
                  label="Bar change values"
                />
                <Checkbox
                  checked={settings.showVolume}
                  onChange={(checked) => setSettings(prev => ({ ...prev, showVolume: checked }))}
                  label="Volume"
                />
                <Checkbox
                  checked={settings.showLastDayChange}
                  onChange={(checked) => setSettings(prev => ({ ...prev, showLastDayChange: checked }))}
                  label="Last day change values"
                />
              </div>
              
              <div>
                <h4 style={{ color: '#d1d4dc', margin: '0 0 12px 0', fontSize: '14px' }}>INDICATORS</h4>
                <Checkbox
                  checked={settings.showIndicatorTitles}
                  onChange={(checked) => setSettings(prev => ({ ...prev, showIndicatorTitles: checked }))}
                  label="Titles"
                />
                <Checkbox
                  checked={settings.showIndicatorInputs}
                  onChange={(checked) => setSettings(prev => ({ ...prev, showIndicatorInputs: checked }))}
                  label="Inputs"
                />
                <Checkbox
                  checked={settings.showIndicatorValues}
                  onChange={(checked) => setSettings(prev => ({ ...prev, showIndicatorValues: checked }))}
                  label="Values"
                />
              </div>
            </div>
          );
          
        case 2: // Scales and lines
          return (
            <div>
              <h4 style={{ color: '#d1d4dc', margin: '0 0 12px 0', fontSize: '14px' }}>SCALES</h4>
              <Checkbox
                checked={settings.showPriceScale}
                onChange={(checked) => setSettings(prev => ({ ...prev, showPriceScale: checked }))}
                label="Price scale"
              />
              <Checkbox
                checked={settings.showTimeScale}
                onChange={(checked) => setSettings(prev => ({ ...prev, showTimeScale: checked }))}
                label="Time scale"
              />
            </div>
          );
          
        case 3: // Canvas
          return (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <ColorSwatch
                  color={settings.backgroundColor}
                  onChange={(color) => setSettings(prev => ({ ...prev, backgroundColor: color }))}
                  label="Background"
                />
              </div>
              <Checkbox
                checked={settings.showGridLines}
                onChange={(checked) => setSettings(prev => ({ ...prev, showGridLines: checked }))}
                label="Grid lines"
              />
            </div>
          );
          
        case 4: // Trading
        case 5: // Alerts  
        case 6: // Events
          return (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '200px',
              color: '#787b86',
              fontSize: '14px'
            }}>
              {tabs[activeTab]} settings coming soon...
            </div>
          );
          
        default:
          return null;
      }
    };
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: '#1e222d',
          border: '1px solid #2a2e39',
          borderRadius: '8px',
          width: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #2a2e39',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ color: '#d1d4dc', margin: 0, fontSize: '16px' }}>Settings</h3>
            <button
              onClick={() => setShowSettingsModal(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#787b86',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ display: 'flex', flex: 1 }}>
            {/* Tabs */}
            <div style={{
              width: '160px',
              background: '#1a1d27',
              borderRight: '1px solid #2a2e39',
              padding: '12px 0'
            }}>
              {tabs.map((tab, index) => (
                <div
                  key={index}
                  onClick={() => setActiveTab(index)}
                  style={{
                    padding: '8px 16px',
                    color: activeTab === index ? '#d1d4dc' : '#787b86',
                    backgroundColor: activeTab === index ? '#2a2e39' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderLeft: activeTab === index ? '2px solid #2962ff' : '2px solid transparent'
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
            
            {/* Content */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {renderTabContent()}
            </div>
          </div>
          
          {/* Footer */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #2a2e39',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <button
              style={{
                background: 'transparent',
                border: '1px solid #2a2e39',
                borderRadius: '4px',
                padding: '6px 12px',
                color: '#d1d4dc',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Template ▼
            </button>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #2a2e39',
                  borderRadius: '4px',
                  padding: '6px 16px',
                  color: '#d1d4dc',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: '#2962ff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 16px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // ===== MAIN RENDER =====
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: settings.backgroundColor,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'monospace'
    }}>
      {/* Top Bar with OHLC Info */}
      <div style={{
        height: '40px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #cccccc',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '20px'
      }}>
        <div style={{ color: '#333333', fontSize: '14px', fontWeight: '500' }}>
          EURUSD
        </div>
        
        {/* Timeframe Buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {Object.keys(timeframes).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                background: timeframe === tf ? '#333333' : 'transparent',
                border: '1px solid #cccccc',
                borderRadius: '4px',
                padding: '4px 8px',
                color: timeframe === tf ? 'white' : '#666666',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
        
        {/* OHLC Display */}
        {hoveredCandle && (
          <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto' }}>
            <span style={{ color: '#666666', fontSize: '12px' }}>
              O: <span style={{ color: '#333333' }}>{hoveredCandle.o.toFixed(2)}</span>
            </span>
            <span style={{ color: '#666666', fontSize: '12px' }}>
              H: <span style={{ color: '#333333' }}>{hoveredCandle.h.toFixed(2)}</span>
            </span>
            <span style={{ color: '#666666', fontSize: '12px' }}>
              L: <span style={{ color: '#333333' }}>{hoveredCandle.l.toFixed(2)}</span>
            </span>
            <span style={{ color: '#666666', fontSize: '12px' }}>
              C: <span style={{ color: '#333333' }}>{hoveredCandle.c.toFixed(2)}</span>
            </span>
            <span style={{ color: '#666666', fontSize: '12px' }}>
              Vol: <span style={{ color: '#333333' }}>{hoveredCandle.v.toFixed(1)}</span>
            </span>
          </div>
        )}
      </div>
      
      {/* Chart Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'crosshair'
          }}
        />
        
        {/* OHLC Tooltip */}
        {hoveredCandle && showCrosshair && (
          <div style={{
            position: 'absolute',
            top: mousePos.y + 10,
            left: mousePos.x + 10,
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #cccccc',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '11px',
            color: '#333333',
            pointerEvents: 'none',
            zIndex: 100
          }}>
            <div>Time: {new Date(hoveredCandle.t).toLocaleString()}</div>
            <div>Open: {hoveredCandle.o.toFixed(2)}</div>
            <div>High: {hoveredCandle.h.toFixed(2)}</div>
            <div>Low: {hoveredCandle.l.toFixed(2)}</div>
            <div>Close: {hoveredCandle.c.toFixed(2)}</div>
            <div>Volume: {hoveredCandle.v.toFixed(1)}</div>
            <div style={{ 
              color: hoveredCandle.c > hoveredCandle.o ? '#000000' : '#666666'
            }}>
              Change: {((hoveredCandle.c - hoveredCandle.o) / hoveredCandle.o * 100).toFixed(2)}%
            </div>
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      {showSettingsModal && <SettingsModal />}
      
      {/* Color Picker */}
      {showColorPicker && (
        <ColorPicker
          color={showColorPicker.color}
          onChange={showColorPicker.onChange}
          onClose={() => setShowColorPicker(null)}
        />
      )}
    </div>
  );
};

export default TradingViewChart;