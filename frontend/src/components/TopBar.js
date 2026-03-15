import React, { useState, useRef, useEffect } from 'react';

/* ── SVG icons ── */
const CandleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="4" width="3" height="8" rx="0.5" />
        <rect x="3" y="2" width="1" height="2" /><rect x="3" y="12" width="1" height="2" />
        <rect x="7" y="2" width="3" height="10" rx="0.5" />
        <rect x="8" y="1" width="1" height="1" /><rect x="8" y="12" width="1" height="3" />
        <rect x="12" y="5" width="3" height="6" rx="0.5" />
        <rect x="13" y="3" width="1" height="2" /><rect x="13" y="11" width="1" height="2" />
    </svg>
);

const BarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="5" width="1" height="8" /><rect x="1" y="8" width="3" height="1" />
        <rect x="7" y="2" width="1" height="11" /><rect x="6" y="5" width="3" height="1" />
        <rect x="12" y="4" width="1" height="9" /><rect x="11" y="9" width="3" height="1" />
    </svg>
);

const LineIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="1,13 5,7 9,10 15,3" />
    </svg>
);

const AreaIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" fillOpacity="0.4">
        <path d="M1,13 5,7 9,10 15,3 15,15 1,15 Z" stroke="currentColor" strokeWidth="1.5" strokeOpacity="1" />
    </svg>
);

const HeikinIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="5" width="3" height="7" rx="0.5" opacity="0.6" />
        <rect x="3" y="3" width="1" height="2" /><rect x="3" y="12" width="1" height="2" />
        <rect x="7" y="3" width="3" height="9" rx="0.5" />
        <rect x="8" y="1" width="1" height="2" /><rect x="8" y="12" width="1" height="3" />
        <rect x="12" y="6" width="3" height="5" rx="0.5" opacity="0.6" />
        <rect x="13" y="4" width="1" height="2" /><rect x="13" y="11" width="1" height="2" />
    </svg>
);

const CHART_TYPES = [
    { id: 'candle', label: 'Candlestick', Icon: CandleIcon },
    { id: 'bar', label: 'Bar Chart', Icon: BarIcon },
    { id: 'line', label: 'Line', Icon: LineIcon },
    { id: 'area', label: 'Area', Icon: AreaIcon },
    { id: 'heikin', label: 'Heikin-Ashi', Icon: HeikinIcon },
];

const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'];

const INDICATORS_LIST = [
    { id: 'ema9', label: 'EMA 9', color: '#ff9800' },
    { id: 'ema21', label: 'EMA 21', color: '#2196f3' },
    { id: 'ema50', label: 'EMA 50', color: '#9c27b0' },
    { id: 'volume', label: 'Volume', color: '#26a69a' },
    { id: 'rsi', label: 'RSI (14)', color: '#e91e63' },
    { id: 'macd', label: 'MACD', color: '#00bcd4' },
    { id: 'bb', label: 'Bollinger Bands', color: '#ff5722' },
];

/* ── useClickOutside ── */
function useClickOutside(ref, cb) {
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [ref, cb]);
}

/* ═══════════════════════════════════════════════════════════
   TOPBAR COMPONENT
═══════════════════════════════════════════════════════════ */
const TopBar = ({
    symbol, timeframe, chartType, indicators, connected,
    onSymbolClick, onTimeframeChange, onChartTypeChange, onIndicatorsChange,
}) => {
    const [chartOpen, setChartOpen] = useState(false);
    const [indicOpen, setIndicOpen] = useState(false);
    const chartRef = useRef(null);
    const indicRef = useRef(null);

    useClickOutside(chartRef, () => setChartOpen(false));
    useClickOutside(indicRef, () => setIndicOpen(false));

    const currentChartType = CHART_TYPES.find(t => t.id === chartType) || CHART_TYPES[0];
    const CurrentChartIcon = currentChartType.Icon;

    const toggleIndicator = (id) => {
        onIndicatorsChange(
            indicators.includes(id)
                ? indicators.filter(i => i !== id)
                : [...indicators, id]
        );
    };

    return (
        <div className="tv-topbar">
            {/* Logo */}
            <div className="tv-logo">
                <div className="tv-logo-icon">MV</div>
                <span className="tv-logo-text">MiniView</span>
            </div>

            <div className="tv-topbar-sep" />

            {/* Symbol */}
            <button className="tv-symbol-btn" onClick={onSymbolClick} id="symbol-btn">
                <span className="tv-symbol-name">{symbol.replace('_', '/')}</span>
                <span className="tv-exchange-badge">FX</span>
                <svg className="tv-sym-arrow" width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                    <path d="M0 2 L4 6 L8 2" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </svg>
            </button>

            <div className="tv-topbar-sep" />

            {/* Timeframes */}
            <div className="tv-tf-group">
                {TIMEFRAMES.map(tf => (
                    <button
                        key={tf}
                        className={`tv-tf-btn ${timeframe === tf ? 'active' : ''}`}
                        onClick={() => onTimeframeChange(tf)}
                    >
                        {tf}
                    </button>
                ))}
            </div>

            <div className="tv-topbar-sep" />

            {/* Chart Type */}
            <div className="tv-charttype-wrap" ref={chartRef}>
                <button
                    className={`tv-topbar-btn ${chartOpen ? 'active' : ''}`}
                    onClick={() => setChartOpen(v => !v)}
                    title="Chart Type"
                >
                    <CurrentChartIcon />
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                        <path d="M0 2 L4 6 L8 2" stroke="currentColor" strokeWidth="1.2" fill="none" />
                    </svg>
                </button>
                {chartOpen && (
                    <div className="tv-charttype-dropdown">
                        {CHART_TYPES.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                className={`tv-charttype-item ${chartType === id ? 'active' : ''}`}
                                onClick={() => { onChartTypeChange(id); setChartOpen(false); }}
                            >
                                <Icon />
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Indicators */}
            <div className="tv-indicators-wrap" ref={indicRef}>
                <button
                    className={`tv-topbar-btn ${indicOpen || indicators.length > 0 ? 'active' : ''}`}
                    onClick={() => setIndicOpen(v => !v)}
                    title="Indicators"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1,12 L5,5 L8,9 L11,4 L15,8" />
                        <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
                        <circle cx="11" cy="4" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                    Indicators
                    {indicators.length > 0 && (
                        <span style={{
                            background: 'var(--tv-blue)',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '0 5px',
                            fontSize: '10px',
                            fontWeight: '700',
                            lineHeight: '16px',
                        }}>{indicators.length}</span>
                    )}
                </button>
                {indicOpen && (
                    <div className="tv-indicators-dropdown">
                        {INDICATORS_LIST.map(({ id, label, color }) => {
                            const active = indicators.includes(id);
                            return (
                                <button
                                    key={id}
                                    className="tv-indicator-item"
                                    onClick={() => toggleIndicator(id)}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            width: 12, height: 12, borderRadius: 2,
                                            background: active ? color : 'transparent',
                                            border: `1.5px solid ${active ? color : 'var(--tv-border-lt)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 9, color: '#fff',
                                        }}>
                                            {active ? '✓' : ''}
                                        </span>
                                        {label}
                                    </span>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right area */}
            <div className="tv-topbar-right">
                <button className="tv-topbar-btn" title="Alert">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M7.5 1.5 C5,1.5 3,3.5 3,6 L3,10 L2,11 L13,11 L12,10 L12,6 C12,3.5 10,1.5 7.5,1.5Z" />
                        <path d="M6,11 C6,12.1 6.7,13 7.5,13 C8.3,13 9,12.1 9,11" />
                    </svg>
                </button>
                <button className="tv-topbar-btn" title="Screenshot">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <rect x="1" y="3" width="13" height="10" rx="1.5" />
                        <circle cx="7.5" cy="8" r="2.5" />
                        <path d="M5 3 L6 1 L9 1 L10 3" />
                    </svg>
                </button>
                <button className="tv-topbar-btn" title="Fullscreen" onClick={() => {
                    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                    else document.exitFullscreen();
                }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M1 5 L1 1 L5 1M9 1 L13 1 L13 5M13 9 L13 13 L9 13M5 13 L1 13 L1 9" />
                    </svg>
                </button>

                <div className="tv-topbar-sep" />

                {/* Live dot */}
                <div className="tv-live-dot">
                    <span className={`tv-live-dot-circle ${connected ? '' : 'offline'}`} />
                    <span>{connected ? 'LIVE' : 'OFFLINE'}</span>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
