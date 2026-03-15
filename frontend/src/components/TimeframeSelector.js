import React from 'react';

const TimeframeSelector = ({ selected, onChange }) => {
  const timeframes = ['1m', '5m', '15m', '1h', '1d'];

  return (
    <div className="timeframe-selector">
      {timeframes.map(tf => (
        <button
          key={tf}
          className={selected === tf ? 'active' : ''}
          onClick={() => onChange(tf)}
        >
          {tf}
        </button>
      ))}
    </div>
  );
};

export default TimeframeSelector;
