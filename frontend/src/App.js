import React, { useState, useRef, useCallback } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ChartPanel from './components/ChartPanel';
import WatchlistPanel from './components/WatchlistPanel';
import SymbolSearchModal from './components/SymbolSearchModal';
import TradingViewChart from './components/TradingViewChart';
import LiveCandlestickChart from './components/LiveCandlestickChart';
import './App.css';

function App() {
  const [symbol, setSymbol] = useState('EUR_USD');
  const [timeframe, setTimeframe] = useState('1H');
  const [chartType, setChartType] = useState('candle');
  const [indicators, setIndicators] = useState([]);
  const [activeTool, setActiveTool] = useState('cursor');
  const [cursorMode, setCursorMode] = useState('crosshair'); // crosshair, dot, arrow, eraser
  const [symbolModal, setSymbolModal] = useState(false);
  const [connected, setConnected] = useState(false);
  const [viewMode, setViewMode] = useState('original'); // 'original', 'tradingview', 'live'
  const drawingsRef = useRef([]);

  const handleSymbolSelect = (code) => {
    setSymbol(code);
    setSymbolModal(false);
  };

  const handleClearDrawings = () => {
    drawingsRef.current = [];
  };

  const handleConnectionChange = useCallback((isConnected) => {
    setConnected(isConnected);
  }, []);

  // If TradingView mode is selected, render the new chart
  if (viewMode === 'tradingview') {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setViewMode('original')}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: '#2962ff',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Back to Original
        </button>
        <TradingViewChart />
      </div>
    );
  }

  // If Live Chart mode is selected, render the live chart
  if (viewMode === 'live') {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setViewMode('original')}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: '#2962ff',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Back to Original
        </button>
        <LiveCandlestickChart />
      </div>
    );
  }

  return (
    <div className="tv-app">
      {/* Top navigation bar */}
      <TopBar
        symbol={symbol}
        timeframe={timeframe}
        chartType={chartType}
        indicators={indicators}
        connected={connected}
        onSymbolClick={() => setSymbolModal(true)}
        onTimeframeChange={setTimeframe}
        onChartTypeChange={setChartType}
        onIndicatorsChange={setIndicators}
      />

      {/* Body: sidebar + chart + watchlist */}
      <div className="tv-body">
        <Sidebar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          cursorMode={cursorMode}
          onCursorModeChange={setCursorMode}
          onClearDrawings={handleClearDrawings}
        />

        <div className="tv-main">
          {/* Main Chart Rendering */}
          <ChartPanel
            symbol={symbol}
            timeframe={timeframe}
            chartType={chartType}
            indicators={indicators}
            activeTool={activeTool}
            cursorMode={cursorMode}
            drawingsRef={drawingsRef}
            onConnectionChange={handleConnectionChange}
          />
          
          {/* TradingView Chart Toggle Button */}
          <button
            onClick={() => setViewMode('tradingview')}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              background: '#2962ff',
              border: 'none',
              borderRadius: '4px',
              padding: '12px 20px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(41, 98, 255, 0.3)',
              zIndex: 100
            }}
          >
            🚀 TradingView Style Chart
          </button>
        </div>

        <WatchlistPanel
          activeSymbol={symbol}
          onSymbolSelect={handleSymbolSelect}
        />
      </div>

      {/* Symbol search modal */}
      {symbolModal && (
        <SymbolSearchModal
          selected={symbol}
          onSelect={handleSymbolSelect}
          onClose={() => setSymbolModal(false)}
        />
      )}
    </div>
  );
}

export default App;
