import React, { useEffect, useRef, useState, useCallback } from 'react';

const WATCHLIST = [
    { code: 'EUR_USD', name: 'Euro / U.S. Dollar', exch: 'FX', decimals: 5 },
    { code: 'GBP_USD', name: 'British Pound / U.S. Dollar', exch: 'FX', decimals: 5 },
    { code: 'USD_JPY', name: 'U.S. Dollar / Japanese Yen', exch: 'FX', decimals: 3 },
    { code: 'USD_CHF', name: 'U.S. Dollar / Swiss Franc', exch: 'FX', decimals: 5 },
    { code: 'AUD_USD', name: 'Australian Dollar / USD', exch: 'FX', decimals: 5 },
    { code: 'USD_CAD', name: 'U.S. Dollar / Canadian Dollar', exch: 'FX', decimals: 5 },
];

function formatPrice(p, decimals) {
    if (p == null) return '—';
    return p.toFixed(decimals);
}

function PriceRow({ item, active, onSelect }) {
    const [price, setPrice] = useState(null);
    const [prevPrice, setPrevPrice] = useState(null);
    const [basePrice, setBasePrice] = useState(null);
    const wsRef = useRef(null);
    const flash = useRef(null);
    const [flashDir, setFlashDir] = useState(null); // 'up' | 'down' | null

    useEffect(() => {
        // Load last candle for initial price
        fetch(`http://localhost:8000/api/candles/${item.code}?timeframe=1m&limit=1`)
            .then(r => r.json())
            .then(d => {
                if (d.data && d.data.length > 0) {
                    const close = d.data[d.data.length - 1].close;
                    setPrice(close);
                    setBasePrice(close);
                }
            })
            .catch(() => { });

        const ws = new WebSocket(`ws://localhost:8000/ws/prices/${item.code}`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.status === 'market_closed') return;
            setPrice(prev => {
                if (prev !== null && data.close !== prev) {
                    setFlashDir(data.close > prev ? 'up' : 'down');
                    clearTimeout(flash.current);
                    flash.current = setTimeout(() => setFlashDir(null), 600);
                }
                setPrevPrice(prev);
                return data.close;
            });
        };

        return () => {
            ws.close();
            clearTimeout(flash.current);
        };
    }, [item.code]);

    const change = price != null && basePrice != null ? ((price - basePrice) / basePrice) * 100 : null;
    const pos = change == null ? null : change >= 0;

    return (
        <button
            className={`tv-wl-row ${active ? 'active' : ''} ${flashDir ? `flash-${flashDir}` : ''}`}
            onClick={() => onSelect(item.code)}
            title={item.name}
        >
            <div className="tv-wl-icon">
                {item.code.replace('_', '').slice(0, 3)}
            </div>
            <div className="tv-wl-info">
                <div className="tv-wl-code">{item.code.replace('_', '/')}</div>
                <div className="tv-wl-name">{item.exch}</div>
            </div>
            <div className="tv-wl-price-col">
                <div className={`tv-wl-price ${flashDir === 'up' ? 'price-up' : flashDir === 'down' ? 'price-down' : ''}`}>
                    {formatPrice(price, item.decimals)}
                </div>
                {change !== null && (
                    <div className={`tv-wl-change ${pos ? 'pos' : 'neg'}`}>
                        {pos ? '+' : ''}{change.toFixed(3)}%
                    </div>
                )}
            </div>
        </button>
    );
}

const WatchlistPanel = ({ activeSymbol, onSymbolSelect }) => {
    const [open, setOpen] = useState(true);

    return (
        <div className={`tv-watchlist ${open ? 'open' : 'collapsed'}`}>
            {/* Toggle strip */}
            <button
                className="tv-wl-toggle"
                onClick={() => setOpen(o => !o)}
                title={open ? 'Collapse Watchlist' : 'Open Watchlist'}
            >
                <svg
                    width="8" height="12" viewBox="0 0 8 12" fill="none"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
                    style={{ transform: open ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }}
                >
                    <polyline points="6,1 1,6 6,11" />
                </svg>
            </button>

            {open && (
                <div className="tv-wl-inner">
                    <div className="tv-wl-header">
                        <span className="tv-wl-title">Watchlist</span>
                    </div>
                    <div className="tv-wl-list">
                        {WATCHLIST.map(item => (
                            <PriceRow
                                key={item.code}
                                item={item}
                                active={activeSymbol === item.code}
                                onSelect={onSymbolSelect}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WatchlistPanel;
