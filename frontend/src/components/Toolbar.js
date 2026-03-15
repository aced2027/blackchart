import React from 'react';

const Toolbar = ({ symbol, timeframe, onSymbolChange, onTimeframeChange, onFullscreenToggle, isFullscreen }) => {
  const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
  
  const chartTypes = [
    { id: 'candle', icon: '📊', name: 'Candlestick' },
    { id: 'bar', icon: '📈', name: 'Bar' },
    { id: 'line', icon: '📉', name: 'Line' },
    { id: 'area', icon: '🏔', name: 'Area' }
  ];

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn symbol-btn" onClick={() => {}}>
          <span className="symbol-text">{symbol.replace('_', '/')}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        
        <div className="timeframe-group">
          {timeframes.map(tf => (
            <button
              key={tf}
              className={`toolbar-btn tf-btn ${timeframe === tf ? 'active' : ''}`}
              onClick={() => onTimeframeChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-center">
        <div className="chart-type-group">
          {chartTypes.map(type => (
            <button
              key={type.id}
              className="toolbar-btn icon-btn"
              title={type.name}
            >
              {type.icon}
            </button>
          ))}
        </div>
        
        <button className="toolbar-btn" title="Indicators">
          <span>📊 Indicators</span>
        </button>
        
        <button className="toolbar-btn" title="Compare">
          <span>⚖ Compare</span>
        </button>
      </div>

      <div className="toolbar-right">
        <button className="toolbar-btn icon-btn" title="Undo">↶</button>
        <button className="toolbar-btn icon-btn" title="Redo">↷</button>
        <button 
          className="toolbar-btn icon-btn" 
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          onClick={onFullscreenToggle}
        >
          {isFullscreen ? '⛶' : '⛶'}
        </button>
        <button className="toolbar-btn icon-btn" title="Screenshot">📷</button>
      </div>
    </div>
  );
};

export default Toolbar;
