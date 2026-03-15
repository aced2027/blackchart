import React, { useState, useEffect } from 'react';
import './DrawingSettings.css';

/**
 * DrawingSettings - Settings panel for drawing tools
 * Allows users to customize color, line width, style, and tool-specific options
 */
const DrawingSettings = ({ activeTool, settings, onSettingsChange, onClose }) => {
  const [localSettings, setLocalSettings] = useState({
    color: '#2962ff',
    lineWidth: 2,
    lineStyle: 'solid',
    fillColor: 'rgba(41,98,255,0.1)',
    fontSize: 14,
    fontFamily: 'Arial',
    text: 'Text',
    showPrice: true,
    extendLeft: false,
    extendRight: false,
    ...settings
  });

  useEffect(() => {
    setLocalSettings(prev => ({ ...prev, ...settings }));
  }, [settings]);

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const colors = [
    { name: 'Blue', value: '#2962ff' },
    { name: 'Red', value: '#f23645' },
    { name: 'Green', value: '#089981' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Yellow', value: '#ffd700' },
    { name: 'Cyan', value: '#00bcd4' },
    { name: 'Pink', value: '#e91e63' },
    { name: 'Gray', value: '#787b86' },
    { name: 'White', value: '#ffffff' },
  ];

  const lineWidths = [1, 1.5, 2, 2.5, 3, 4, 5];
  const lineStyles = [
    { name: 'Solid', value: 'solid' },
    { name: 'Dashed', value: 'dashed' },
    { name: 'Dotted', value: 'dotted' },
  ];

  const fontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32];
  const fontFamilies = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia'];

  return (
    <div className="drawing-settings-panel">
      <div className="drawing-settings-header">
        <h3>Drawing Settings</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="drawing-settings-content">
        {/* Color Picker */}
        <div className="setting-group">
          <label>Color</label>
          <div className="color-grid">
            {colors.map(color => (
              <button
                key={color.value}
                className={`color-swatch ${localSettings.color === color.value ? 'active' : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleChange('color', color.value)}
                title={color.name}
              />
            ))}
          </div>
          <input
            type="color"
            value={localSettings.color}
            onChange={(e) => handleChange('color', e.target.value)}
            className="color-input"
          />
        </div>

        {/* Line Width */}
        {!['text'].includes(activeTool) && (
          <div className="setting-group">
            <label>Line Width: {localSettings.lineWidth}px</label>
            <div className="line-width-options">
              {lineWidths.map(width => (
                <button
                  key={width}
                  className={`line-width-btn ${localSettings.lineWidth === width ? 'active' : ''}`}
                  onClick={() => handleChange('lineWidth', width)}
                >
                  <div style={{ height: `${width}px`, backgroundColor: 'currentColor', width: '100%' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Line Style */}
        {!['text', 'rectangle'].includes(activeTool) && (
          <div className="setting-group">
            <label>Line Style</label>
            <div className="line-style-options">
              {lineStyles.map(style => (
                <button
                  key={style.value}
                  className={`line-style-btn ${localSettings.lineStyle === style.value ? 'active' : ''}`}
                  onClick={() => handleChange('lineStyle', style.value)}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fill Color (for rectangles) */}
        {['rectangle'].includes(activeTool) && (
          <div className="setting-group">
            <label>Fill Color</label>
            <div className="fill-options">
              <input
                type="color"
                value={localSettings.fillColor.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+).*\)/, (m, r, g, b) => 
                  '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')
                )}
                onChange={(e) => {
                  const hex = e.target.value;
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);
                  handleChange('fillColor', `rgba(${r},${g},${b},0.1)`);
                }}
                className="color-input"
              />
              <label>
                Opacity:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={parseFloat(localSettings.fillColor.match(/[\d.]+\)$/)?.[0] || 0.1)}
                  onChange={(e) => {
                    const match = localSettings.fillColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    if (match) {
                      handleChange('fillColor', `rgba(${match[1]},${match[2]},${match[3]},${e.target.value})`);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {/* Text Settings */}
        {['text'].includes(activeTool) && (
          <>
            <div className="setting-group">
              <label>Text</label>
              <input
                type="text"
                value={localSettings.text}
                onChange={(e) => handleChange('text', e.target.value)}
                className="text-input"
                placeholder="Enter text..."
              />
            </div>

            <div className="setting-group">
              <label>Font Size</label>
              <select
                value={localSettings.fontSize}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                className="select-input"
              >
                {fontSizes.map(size => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label>Font Family</label>
              <select
                value={localSettings.fontFamily}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                className="select-input"
              >
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Horizontal Line Settings */}
        {['hline'].includes(activeTool) && (
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={localSettings.showPrice}
                onChange={(e) => handleChange('showPrice', e.target.checked)}
              />
              Show Price Label
            </label>
          </div>
        )}

        {/* Ray/Line Extension Settings */}
        {['trendline', 'ray'].includes(activeTool) && (
          <>
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.extendLeft}
                  onChange={(e) => handleChange('extendLeft', e.target.checked)}
                />
                Extend Left
              </label>
            </div>
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.extendRight}
                  onChange={(e) => handleChange('extendRight', e.target.checked)}
                />
                Extend Right
              </label>
            </div>
          </>
        )}

        {/* Fibonacci Settings */}
        {['fib'].includes(activeTool) && (
          <div className="setting-group">
            <label>Fibonacci Levels</label>
            <div className="fib-levels">
              <small>0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%</small>
            </div>
          </div>
        )}
      </div>

      <div className="drawing-settings-footer">
        <button className="reset-btn" onClick={() => {
          const defaults = {
            color: '#2962ff',
            lineWidth: 2,
            lineStyle: 'solid',
            fillColor: 'rgba(41,98,255,0.1)',
            fontSize: 14,
            fontFamily: 'Arial',
            text: 'Text',
            showPrice: true,
            extendLeft: false,
            extendRight: false,
          };
          setLocalSettings(defaults);
          onSettingsChange(defaults);
        }}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default DrawingSettings;
