import React, { useState, useEffect, useRef } from 'react';

const ALL_SYMBOLS = [
    // Forex Majors
    { code: 'EUR_USD', name: 'Euro / US Dollar', exchange: 'FX', category: 'Forex' },
    { code: 'GBP_USD', name: 'British Pound / US Dollar', exchange: 'FX', category: 'Forex' },
    { code: 'USD_JPY', name: 'US Dollar / Japanese Yen', exchange: 'FX', category: 'Forex' },
    { code: 'USD_CHF', name: 'US Dollar / Swiss Franc', exchange: 'FX', category: 'Forex' },
    { code: 'AUD_USD', name: 'Australian Dollar / US Dollar', exchange: 'FX', category: 'Forex' },
    { code: 'USD_CAD', name: 'US Dollar / Canadian Dollar', exchange: 'FX', category: 'Forex' },
    { code: 'NZD_USD', name: 'New Zealand Dollar / US Dollar', exchange: 'FX', category: 'Forex' },
    // Forex Crosses
    { code: 'EUR_GBP', name: 'Euro / British Pound', exchange: 'FX', category: 'Forex' },
    { code: 'EUR_JPY', name: 'Euro / Japanese Yen', exchange: 'FX', category: 'Forex' },
    { code: 'GBP_JPY', name: 'British Pound / Japanese Yen', exchange: 'FX', category: 'Forex' },
    { code: 'EUR_AUD', name: 'Euro / Australian Dollar', exchange: 'FX', category: 'Forex' },
    { code: 'EUR_CAD', name: 'Euro / Canadian Dollar', exchange: 'FX', category: 'Forex' },
    { code: 'AUD_JPY', name: 'Australian Dollar / Japanese Yen', exchange: 'FX', category: 'Forex' },
    { code: 'GBP_AUD', name: 'British Pound / Australian Dollar', exchange: 'FX', category: 'Forex' },
];

const CATEGORIES = ['All', 'Forex'];

const SymbolSearchModal = ({ selected, onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [focusedIndex, setFocusedIndex] = useState(0);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);

    // Auto-focus input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Filter
    const filtered = ALL_SYMBOLS.filter(s => {
        const matchCategory = activeTab === 'All' || s.category === activeTab;
        const q = query.trim().toLowerCase();
        const matchQuery = !q ||
            s.code.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.code.replace('_', '/').toLowerCase().includes(q);
        return matchCategory && matchQuery;
    });

    // Reset focused when query/tab changes
    useEffect(() => { setFocusedIndex(0); }, [query, activeTab]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex(i => Math.min(i + 1, filtered.length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex(i => Math.max(i - 1, 0));
            }
            if (e.key === 'Enter' && filtered.length > 0) {
                onSelect(filtered[focusedIndex].code);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [filtered, focusedIndex, onClose, onSelect]);

    // Scroll focused item into view
    useEffect(() => {
        const el = resultsRef.current?.querySelector(`[data-index="${focusedIndex}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [focusedIndex]);

    const getInitials = (code) => code.replace('_', '').slice(0, 3);

    return (
        <div className="tv-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="tv-modal">
                {/* Search row */}
                <div className="tv-modal-search-row">
                    <span className="tv-modal-search-icon">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <circle cx="7.5" cy="7.5" r="5.5" />
                            <line x1="11.5" y1="11.5" x2="16" y2="16" />
                        </svg>
                    </span>
                    <input
                        ref={inputRef}
                        className="tv-modal-input"
                        type="text"
                        placeholder="Search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className="tv-modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Category tabs */}
                <div className="tv-modal-tabs">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`tv-modal-tab ${activeTab === cat ? 'active' : ''}`}
                            onClick={() => setActiveTab(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Results */}
                <div className="tv-modal-results" ref={resultsRef}>
                    {filtered.length === 0 ? (
                        <div className="tv-modal-empty">No symbols found for "{query}"</div>
                    ) : (
                        filtered.map((sym, idx) => (
                            <button
                                key={sym.code}
                                data-index={idx}
                                className={`tv-modal-result ${selected === sym.code ? 'active' : ''} ${focusedIndex === idx ? 'focused' : ''}`}
                                onClick={() => onSelect(sym.code)}
                                onMouseEnter={() => setFocusedIndex(idx)}
                            >
                                <div className="tv-modal-sym-icon">{getInitials(sym.code)}</div>
                                <div className="tv-modal-sym-info">
                                    <div className="tv-modal-sym-code">{sym.code.replace('_', '/')}</div>
                                    <div className="tv-modal-sym-name">{sym.name}</div>
                                </div>
                                <span className="tv-modal-sym-exch">{sym.exchange}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SymbolSearchModal;
