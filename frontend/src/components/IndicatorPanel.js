import React from 'react';

const IndicatorPanel = ({ indicators, onChange }) => {
  const availableIndicators = [
    { id: 'rsi', name: 'RSI (14)', color: '#9c27b0' },
    { id: 'macd', name: 'MACD', color: '#2196f3' },
    { id: 'ma20', name: 'MA (20)', color: '#ff9800' },
    { id: 'ma50', name: 'MA (50)', color: '#f44336' }
  ];

  const toggleIndicator = (id) => {
    if (indicators.includes(id)) {
      onChange(indicators.filter(i => i !== id));
    } else {
      onChange([...indicators, id]);
    }
  };

  return (
    <div className="indicator-panel">
      <h3>Indicators</h3>
      {availableIndicators.map(ind => (
        <div key={ind.id} className="indicator-item">
          <label>
            <input
              type="checkbox"
              checked={indicators.includes(ind.id)}
              onChange={() => toggleIndicator(ind.id)}
            />
            <span style={{ color: ind.color }}>{ind.name}</span>
          </label>
        </div>
      ))}
    </div>
  );
};

export default IndicatorPanel;
