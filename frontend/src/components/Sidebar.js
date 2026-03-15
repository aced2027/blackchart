import React, { useState } from 'react';

/* ── Inline SVG icons for each tool (TV-accurate) ── */
const icons = {
  cursor: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2 L3 13 L6 10 L8.5 15 L10 14.3 L7.5 9.3 L11 9.3 Z" />
    </svg>
  ),
  crosshair: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <line x1="8" y1="1" x2="8" y2="5" /><line x1="8" y1="11" x2="8" y2="15" />
      <line x1="1" y1="8" x2="5" y2="8" /><line x1="11" y1="8" x2="15" y2="8" />
      <circle cx="8" cy="8" r="3" />
    </svg>
  ),
  trendline: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="13" x2="14" y2="3" />
      <circle cx="2" cy="13" r="1.5" fill="currentColor" />
      <circle cx="14" cy="3" r="1.5" fill="currentColor" />
    </svg>
  ),
  rayline: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="8" x2="16" y2="4" strokeDasharray="9 3" />
      <circle cx="2" cy="8" r="1.5" fill="currentColor" />
    </svg>
  ),
  hline: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="1" y1="8" x2="15" y2="8" />
      <line x1="1" y1="5" x2="1" y2="11" strokeWidth="1" opacity="0.4" />
      <line x1="15" y1="5" x2="15" y2="11" strokeWidth="1" opacity="0.4" />
    </svg>
  ),
  vline: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="8" y1="1" x2="8" y2="15" />
      <line x1="5" y1="1" x2="11" y2="1" strokeWidth="1" opacity="0.4" />
      <line x1="5" y1="15" x2="11" y2="15" strokeWidth="1" opacity="0.4" />
    </svg>
  ),
  rectangle: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="4" width="12" height="8" rx="0.5" />
    </svg>
  ),
  fib: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="1" y1="3" x2="15" y2="3" />
      <line x1="1" y1="7" x2="15" y2="7" />
      <line x1="1" y1="10" x2="15" y2="10" />
      <line x1="1" y1="13" x2="15" y2="13" />
      <line x1="3" y1="3" x2="13" y2="13" strokeDasharray="2 2" opacity="0.5" />
    </svg>
  ),
  text: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3 L2 5 L6.5 5 L6.5 13 L8 13 L9.5 13 L9.5 5 L14 5 L14 3 Z" />
    </svg>
  ),
  measure: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1" y="6" width="14" height="5" rx="0.5" />
      <line x1="4" y1="6" x2="4" y2="11" /><line x1="7" y1="6" x2="7" y2="11" />
      <line x1="10" y1="6" x2="10" y2="11" /><line x1="13" y1="6" x2="13" y2="11" />
    </svg>
  ),
  magnet: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 3 L3 9 C3 12 13 12 13 9 L13 3" />
      <line x1="3" y1="3" x2="6" y2="3" /><line x1="10" y1="3" x2="13" y2="3" />
    </svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="7" width="10" height="8" rx="1" />
      <path d="M5 7 L5 5 C5 3 11 3 11 5 L11 7" />
    </svg>
  ),
  eyeoff: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M1 8 C1 8 4 3 8 3 C12 3 15 8 15 8 C15 8 12 13 8 13 C4 13 1 8 1 8Z" />
      <circle cx="8" cy="8" r="2.5" />
      <line x1="2" y1="2" x2="14" y2="14" />
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <line x1="2" y1="4" x2="14" y2="4" />
      <path d="M5 4 L5 13 C5 13.5 5.5 14 6 14 L10 14 C10.5 14 11 13.5 11 13 L11 4" />
      <path d="M6 4 L6 2 L10 2 L10 4" />
    </svg>
  ),
  infoline: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="13" x2="14" y2="3" />
      <text x="10" y="6" fontSize="6" fill="currentColor">i</text>
    </svg>
  ),
  extendedline: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="0" y1="13" x2="16" y2="3" strokeDasharray="2 2" opacity="0.4" />
      <line x1="4" y1="11.5" x2="12" y2="4.5" />
    </svg>
  ),
  trendangle: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="13" x2="14" y2="3" />
      <path d="M8 8 L11 8 A3 3 0 0 0 8 5" fill="none" strokeWidth="1" />
    </svg>
  ),
  hray: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="8" x2="16" y2="8" />
      <circle cx="2" cy="8" r="1.5" fill="currentColor" />
    </svg>
  ),
  crossline: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="8" y1="0" x2="8" y2="16" />
      <line x1="0" y1="8" x2="16" y2="8" />
    </svg>
  ),
  parallelchannel: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <line x1="2" y1="12" x2="10" y2="4" />
      <line x1="6" y1="12" x2="14" y2="4" />
    </svg>
  ),
  regressiontrend: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <line x1="2" y1="12" x2="14" y2="4" strokeDasharray="3 2" />
      <circle cx="3" cy="11" r="1" fill="currentColor" />
      <circle cx="7" cy="8" r="1" fill="currentColor" />
      <circle cx="11" cy="6" r="1" fill="currentColor" />
    </svg>
  ),
  flattop: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="2" y1="12" x2="14" y2="12" />
      <line x1="2" y1="4" x2="2" y2="12" />
      <line x1="14" y1="4" x2="14" y2="12" />
    </svg>
  ),
  disjointchannel: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <line x1="2" y1="10" x2="7" y2="5" />
      <line x1="9" y1="11" x2="14" y2="6" />
    </svg>
  ),
  pitchfork: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="3" y1="7" x2="8" y2="2" />
      <line x1="13" y1="7" x2="8" y2="2" />
    </svg>
  ),
  schiffpitchfork: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <line x1="8" y1="3" x2="8" y2="14" />
      <line x1="3" y1="8" x2="8" y2="3" />
      <line x1="13" y1="8" x2="8" y2="3" />
      <line x1="3" y1="8" x2="3" y2="14" strokeDasharray="2 2" opacity="0.5" />
    </svg>
  ),
  modifiedschiff: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <line x1="8" y1="4" x2="8" y2="14" />
      <line x1="3" y1="9" x2="8" y2="4" />
      <line x1="13" y1="9" x2="8" y2="4" />
      <circle cx="8" cy="4" r="1.5" fill="currentColor" />
    </svg>
  ),
  insidepitchfork: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="5" y1="5" x2="8" y2="2" />
      <line x1="11" y1="5" x2="8" y2="2" />
      <line x1="5" y1="5" x2="5" y2="14" opacity="0.5" />
      <line x1="11" y1="5" x2="11" y2="14" opacity="0.5" />
    </svg>
  ),
  brush: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 13 L3 10 L6 7 L9 10 L6 13 Z" />
      <circle cx="9" cy="7" r="3" />
    </svg>
  ),
  eraser: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 10 L6 6 L10 10 L6 14 Z" />
      <line x1="10" y1="10" x2="14" y2="10" />
    </svg>
  ),
  dot: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="3" />
    </svg>
  ),
  arrow: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="13" x2="14" y2="3" />
      <path d="M14 3 L10 4 L11 8" fill="currentColor" />
    </svg>
  ),
  play: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5 3 L5 13 L13 8 Z" />
    </svg>
  ),
  star: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2 L9.5 6.5 L14 7 L10.5 10 L11.5 14 L8 11.5 L4.5 14 L5.5 10 L2 7 L6.5 6.5 Z" />
    </svg>
  ),
  gannbox: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="2" y="2" width="12" height="12" />
      <line x1="2" y1="2" x2="14" y2="14" />
      <line x1="14" y1="2" x2="2" y2="14" />
    </svg>
  ),
  gannfan: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="2" y1="14" x2="14" y2="2" />
      <line x1="2" y1="14" x2="14" y2="6" opacity="0.6" />
      <line x1="2" y1="14" x2="14" y2="10" opacity="0.6" />
    </svg>
  ),
  gannsquare: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="3" width="10" height="10" />
      <line x1="8" y1="3" x2="8" y2="13" opacity="0.5" />
      <line x1="3" y1="8" x2="13" y2="8" opacity="0.5" />
    </svg>
  ),
  longposition: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <line x1="2" y1="10" x2="14" y2="10" />
      <line x1="8" y1="10" x2="8" y2="4" stroke="#089981" strokeWidth="2" />
      <path d="M8 4 L6 6 M8 4 L10 6" stroke="#089981" strokeWidth="1.5" />
      <line x1="8" y1="10" x2="8" y2="14" stroke="#f23645" strokeWidth="1" opacity="0.5" />
    </svg>
  ),
  shortposition: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <line x1="2" y1="6" x2="14" y2="6" />
      <line x1="8" y1="6" x2="8" y2="12" stroke="#f23645" strokeWidth="2" />
      <path d="M8 12 L6 10 M8 12 L10 10" stroke="#f23645" strokeWidth="1.5" />
      <line x1="8" y1="6" x2="8" y2="2" stroke="#089981" strokeWidth="1" opacity="0.5" />
    </svg>
  ),
  fibextension: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="1" y1="3" x2="15" y2="3" />
      <line x1="1" y1="7" x2="15" y2="7" />
      <line x1="1" y1="10" x2="15" y2="10" />
      <line x1="1" y1="13" x2="15" y2="13" />
      <line x1="3" y1="3" x2="13" y2="13" strokeDasharray="2 2" opacity="0.5" />
      <line x1="13" y1="13" x2="15" y2="15" strokeWidth="2" />
    </svg>
  ),
  fibfan: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="2" y1="14" x2="14" y2="2" />
      <line x1="2" y1="14" x2="14" y2="5" opacity="0.6" />
      <line x1="2" y1="14" x2="14" y2="8" opacity="0.6" />
      <line x1="2" y1="14" x2="14" y2="11" opacity="0.6" />
    </svg>
  ),
  fibarc: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 14 Q8 8 14 14" />
      <path d="M4 14 Q8 10 12 14" opacity="0.6" />
      <path d="M6 14 Q8 12 10 14" opacity="0.6" />
    </svg>
  ),
  fibtimezone: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="2" y1="2" x2="2" y2="14" />
      <line x1="5" y1="2" x2="5" y2="14" opacity="0.6" />
      <line x1="8" y1="2" x2="8" y2="14" opacity="0.6" />
      <line x1="12" y1="2" x2="12" y2="14" opacity="0.6" />
    </svg>
  ),
  fibspiral: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M8 8 Q8 4 12 4 Q16 4 16 8 Q16 12 12 12 Q8 12 8 8" />
    </svg>
  ),
  rotatedrect: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 2 L14 6 L12 12 L2 8 Z" />
    </svg>
  ),
  ellipse: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <ellipse cx="8" cy="8" rx="6" ry="4" />
    </svg>
  ),
  triangle: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M8 2 L14 13 L2 13 Z" />
    </svg>
  ),
  polyline: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 12 L6 4 L10 10 L14 2" />
    </svg>
  ),
  curve: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 12 Q6 2 14 8" />
    </svg>
  ),
  note: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="2" width="10" height="12" rx="1" opacity="0.2" />
      <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1" />
      <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1" />
      <line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  anchoredtext: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3 L2 5 L6.5 5 L6.5 13 L8 13 L9.5 13 L9.5 5 L14 5 L14 3 Z" />
      <circle cx="8" cy="14" r="1.5" />
    </svg>
  ),
  pricelabel: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="2" y="6" width="12" height="4" rx="1" />
      <text x="8" y="10" fontSize="6" fill="currentColor" textAnchor="middle">$</text>
    </svg>
  ),
  callout: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="4" y="2" width="10" height="8" rx="1" />
      <path d="M6 10 L4 14 L8 10" />
    </svg>
  ),
  balloon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <ellipse cx="8" cy="6" rx="5" ry="4" />
      <path d="M8 10 L8 14" />
      <path d="M6 14 L8 14 L10 14" />
    </svg>
  ),
};

/* ── Tool groups with expandable menus ── */
const TOOL_GROUPS = [
  {
    main: { id: 'cursor', label: 'Cursor', shortcut: 'V' },
    submenu: [
      { id: 'dot', label: 'Dot cursor' },
      { id: 'arrow', label: 'Arrow cursor' },
      { id: 'eraser', label: 'Eraser', shortcut: 'E' },
    ]
  },
  {
    main: { id: 'crosshair', label: 'Crosshair', shortcut: 'Alt + C' },
  },
  {
    main: { id: 'trendline', label: 'Trend Line', shortcut: 'Alt + T' },
    submenu: [
      { id: 'ray', label: 'Ray', shortcut: 'Alt + R' },
      { id: 'infoline', label: 'Info line' },
      { id: 'extendedline', label: 'Extended line' },
      { id: 'trendangle', label: 'Trend angle' },
      { id: 'hline', label: 'Horizontal line', shortcut: 'Alt + H' },
      { id: 'hray', label: 'Horizontal ray', shortcut: 'Alt + J' },
      { id: 'vline', label: 'Vertical line', shortcut: 'Alt + V' },
      { id: 'crossline', label: 'Cross line' },
    ]
  },
  {
    main: { id: 'parallelchannel', label: 'Parallel Channel' },
    submenu: [
      { id: 'regressiontrend', label: 'Regression trend' },
      { id: 'flattop', label: 'Flat top/bottom' },
      { id: 'disjointchannel', label: 'Disjoint channel' },
    ]
  },
  {
    main: { id: 'pitchfork', label: 'Pitchfork' },
    submenu: [
      { id: 'schiffpitchfork', label: 'Schiff pitchfork' },
      { id: 'modifiedschiff', label: 'Modified Schiff' },
      { id: 'insidepitchfork', label: 'Inside pitchfork' },
    ]
  },
  {
    main: { id: 'fib', label: 'Fibonacci Retracement', shortcut: 'Alt + F' },
    submenu: [
      { id: 'fibextension', label: 'Fib Extension' },
      { id: 'fibfan', label: 'Fib Fan' },
      { id: 'fibarc', label: 'Fib Arc' },
      { id: 'fibtimezone', label: 'Fib Time Zones' },
      { id: 'fibspiral', label: 'Fib Spiral' },
    ]
  },
  {
    main: { id: 'gannbox', label: 'Gann & Forecast' },
    submenu: [
      { id: 'gannfan', label: 'Gann Fan' },
      { id: 'gannsquare', label: 'Gann Square' },
      { id: 'longposition', label: 'Long Position' },
      { id: 'shortposition', label: 'Short Position' },
    ]
  },
  {
    main: { id: 'rectangle', label: 'Rectangle', shortcut: 'Alt + S' },
    submenu: [
      { id: 'rotatedrect', label: 'Rotated Rectangle' },
      { id: 'ellipse', label: 'Ellipse' },
      { id: 'triangle', label: 'Triangle' },
      { id: 'polyline', label: 'Polyline' },
      { id: 'curve', label: 'Curve' },
    ]
  },
  {
    main: { id: 'text', label: 'Text', shortcut: 'Alt + X' },
    submenu: [
      { id: 'note', label: 'Note' },
      { id: 'anchoredtext', label: 'Anchored Text' },
      { id: 'pricelabel', label: 'Price Label' },
      { id: 'callout', label: 'Callout' },
      { id: 'balloon', label: 'Balloon' },
    ]
  },
  {
    main: { id: 'brush', label: 'Brush / Highlighter' },
  },
  {
    main: { id: 'measure', label: 'Measure', shortcut: 'Alt + M' },
  },
];

const BOTTOM_TOOLS = [
  { id: 'magnet', label: 'Magnet Mode', toggle: true },
  { id: 'lock', label: 'Lock All Drawings' },
  { id: 'eyeoff', label: 'Hide All Drawings' },
];

/* ═══════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
═══════════════════════════════════════════════════════════ */
const Sidebar = ({ activeTool, onToolChange, cursorMode, onCursorModeChange, onClearDrawings }) => {
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [favorites, setFavorites] = useState(['trendline', 'hline', 'vline', 'eraser']);

  const toggleFavorite = (toolId) => {
    setFavorites(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleToolClick = (toolId, hasSubmenu, groupIndex) => {
    if (hasSubmenu) {
      setExpandedMenu(expandedMenu === groupIndex ? null : groupIndex);
    } else {
      // Handle cursor mode tools
      if (['cursor', 'crosshair', 'dot', 'arrow', 'eraser'].includes(toolId)) {
        if (toolId === 'cursor' || toolId === 'crosshair') {
          onCursorModeChange('crosshair');
          onToolChange('cursor');
        } else if (toolId === 'dot') {
          onCursorModeChange('dot');
          onToolChange('cursor');
        } else if (toolId === 'arrow') {
          onCursorModeChange('arrow');
          onToolChange('cursor');
        } else if (toolId === 'eraser') {
          onCursorModeChange('eraser');
          onToolChange('cursor');
        }
      } else {
        // Regular drawing tools - reset to crosshair mode
        onCursorModeChange('crosshair');
        onToolChange(toolId === activeTool ? 'cursor' : toolId);
      }
      setExpandedMenu(null);
    }
  };

  return (
    <div className="tv-sidebar">
      {TOOL_GROUPS.map((group, gi) => (
        <React.Fragment key={gi}>
          <div className="tv-sidebar-tool-group">
            <button
              className={`tv-sidebar-tool ${activeTool === group.main.id ? 'active' : ''} ${group.submenu ? 'has-submenu' : ''}`}
              onClick={() => handleToolClick(group.main.id, !!group.submenu, gi)}
              title=""
            >
              {icons[group.main.id]}
              {group.submenu && <span className="submenu-arrow">›</span>}
              <span className="tv-tooltip">
                {group.main.label}
                {group.main.shortcut && <span className="shortcut">{group.main.shortcut}</span>}
              </span>
            </button>

            {/* Expanded submenu */}
            {group.submenu && expandedMenu === gi && (
              <div className="tv-submenu">
                <div className="tv-submenu-header">
                  <button 
                    className="tv-submenu-back"
                    onClick={() => setExpandedMenu(null)}
                  >
                    ‹
                  </button>
                  <span className="tv-submenu-title">{group.main.label}</span>
                </div>
                
                <div className="tv-submenu-items">
                  {/* Main tool first */}
                  <button
                    className={`tv-submenu-item ${activeTool === group.main.id ? 'active' : ''}`}
                    onClick={() => {
                      onToolChange(group.main.id);
                      setExpandedMenu(null);
                    }}
                  >
                    {icons[group.main.id]}
                    <span className="tv-submenu-label">{group.main.label}</span>
                    {group.main.shortcut && <span className="tv-submenu-shortcut">{group.main.shortcut}</span>}
                    <button 
                      className={`tv-favorite-btn ${favorites.includes(group.main.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(group.main.id); }}
                    >
                      {favorites.includes(group.main.id) ? icons.star : '☆'}
                    </button>
                  </button>

                  {/* Submenu items */}
                  {group.submenu.map(tool => (
                    <button
                      key={tool.id}
                      className={`tv-submenu-item ${activeTool === tool.id ? 'active' : ''}`}
                      onClick={() => {
                        onToolChange(tool.id);
                        setExpandedMenu(null);
                      }}
                    >
                      {icons[tool.id]}
                      <span className="tv-submenu-label">{tool.label}</span>
                      {tool.shortcut && <span className="tv-submenu-shortcut">{tool.shortcut}</span>}
                      <button 
                        className={`tv-favorite-btn ${favorites.includes(tool.id) ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(tool.id); }}
                      >
                        {favorites.includes(tool.id) ? icons.star : '☆'}
                      </button>
                    </button>
                  ))}
                </div>

                {/* Eraser at bottom */}
                <div className="tv-submenu-footer">
                  <button
                    className={`tv-submenu-item ${activeTool === 'eraser' ? 'active' : ''}`}
                    onClick={() => {
                      onToolChange('eraser');
                      setExpandedMenu(null);
                    }}
                  >
                    {icons.eraser}
                    <span className="tv-submenu-label">Eraser</span>
                    <button 
                      className={`tv-favorite-btn ${favorites.includes('eraser') ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite('eraser'); }}
                    >
                      {favorites.includes('eraser') ? icons.star : '☆'}
                    </button>
                  </button>
                  <div className="tv-submenu-toggle">
                    <label>
                      <input type="checkbox" />
                      <span>Values tooltip on long press</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
          {gi < TOOL_GROUPS.length - 1 && <div className="tv-sidebar-sep" />}
        </React.Fragment>
      ))}

      {/* Bottom tools */}
      <div className="tv-sidebar-bottom">
        {BOTTOM_TOOLS.map(tool => (
          <button
            key={tool.id}
            className={`tv-sidebar-tool ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => tool.toggle ? onToolChange(tool.id === activeTool ? 'cursor' : tool.id) : undefined}
            title=""
          >
            {icons[tool.id]}
            <span className="tv-tooltip">{tool.label}</span>
          </button>
        ))}
        <button
          className="tv-sidebar-tool"
          onClick={onClearDrawings}
          title=""
          style={{ color: 'var(--tv-bear)' }}
        >
          {icons.trash}
          <span className="tv-tooltip">Remove All Drawings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
