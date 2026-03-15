import React, { useState, useRef, useEffect } from 'react';

const SymbolSearch = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  const symbols = [
    { code: 'EUR_USD', name: 'Euro / US Dollar', category: 'Major' },
    { code: 'GBP_USD', name: 'British Pound / US Dollar', category: 'Major' },
    { code: 'USD_JPY', name: 'US Dollar / Japanese Yen', category: 'Major' },
    { code: 'USD_CHF', name: 'US Dollar / Swiss Franc', category: 'Major' },
    { code: 'AUD_USD', name: 'Australian Dollar / US Dollar', category: 'Major' },
    { code: 'USD_CAD', name: 'US Dollar / Canadian Dollar', category: 'Major' },
    { code: 'NZD_USD', name: 'New Zealand Dollar / US Dollar', category: 'Major' },
    { code: 'EUR_GBP', name: 'Euro / British Pound', category: 'Cross' },
    { code: 'EUR_JPY', name: 'Euro / Japanese Yen', category: 'Cross' },
    { code: 'GBP_JPY', name: 'British Pound / Japanese Yen', category: 'Cross' }
  ];

  const filtered = symbols.filter(s => 
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  const displayName = selected.replace('_', '/');

  return (
    <div className="symbol-search" ref={dropdownRef}>
      <button 
        className="symbol-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="symbol-code">{displayName}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="symbol-dropdown">
          <input
            type="text"
            className="symbol-search-input"
            placeholder="Search symbols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="symbol-list">
            {filtered.map(symbol => (
              <div
                key={symbol.code}
                className={`symbol-item ${selected === symbol.code ? 'active' : ''}`}
                onClick={() => handleSelect(symbol.code)}
              >
                <div className="symbol-info">
                  <span className="symbol-code">{symbol.code.replace('_', '/')}</span>
                  <span className="symbol-name">{symbol.name}</span>
                </div>
                <span className="symbol-category">{symbol.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SymbolSearch;
