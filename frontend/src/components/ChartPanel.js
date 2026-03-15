import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChartInteractions } from './useChartInteractions';
import DrawingEngine from './DrawingEngine';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS — exact TradingView dark theme values
═══════════════════════════════════════════════════════════ */
const C = {
  bg: '#ffffff',
  bgDeep: '#ffffff',
  panel: '#ffffff',
  border: '#e0e3eb',
  grid: '#e0e3eb',
  text: '#787b86',
  textLt: '#787b86',
  textHi: '#131722',
  bull: '#089981',
  bear: '#f23645',
  bullBody: '#089981',
  bearBody: '#f23645',
  bullBg: 'rgba(8,153,129,0.08)',
  bearBg: 'rgba(242,54,69,0.08)',
  blue: '#2962ff',
  blueDim: 'rgba(41,98,255,0.15)',
  cross: '#9598a1',
  ema9: '#ff9800',
  ema21: '#2196f3',
  ema50: '#9c27b0',
  volume: 'rgba(8,153,129,0.4)',
  volBear: 'rgba(242,54,69,0.4)',
};

const PRICE_COL_W = 72;
const TIME_ROW_H = 24;
const VOL_PANE_H = 80;  // height for volume sub-pane
const RSI_PANE_H = 80;  // height for RSI sub-pane
const MACD_PANE_H = 80;  // height for MACD sub-pane
const MIN_CW = 1;
const MAX_CW = 60;

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function niceNum(range, round) {
  if (range <= 0) return 1;
  const exp = Math.floor(Math.log10(range));
  const f = range / Math.pow(10, exp);
  let nf;
  if (round) { nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10; }
  else { nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10; }
  return nf * Math.pow(10, exp);
}

function niceTicks(min, max, n = 8) {
  const range = niceNum(max - min, false);
  const d = niceNum(range / (n - 1), true);
  const gMin = Math.floor(min / d) * d;
  const ticks = [];
  for (let v = gMin; v <= max + d * 0.5; v += d) ticks.push(parseFloat(v.toPrecision(10)));
  return ticks;
}

function formatPrice(p) {
  if (p == null) return '';
  const a = Math.abs(p);
  if (a < 10) return p.toFixed(5);
  if (a < 1000) return p.toFixed(3);
  if (a < 1e6) return p.toFixed(2);
  return p.toFixed(0);
}

function formatTime(iso, tf) {
  if (!iso) return '';
  const d = new Date(iso);
  const tf_l = (tf || '1m').toLowerCase();
  if (['1m', '3m', '5m', '15m', '30m'].includes(tf_l))
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (['1h', '4h', '2h'].includes(tf_l))
    return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-GB', { year: '2-digit', month: 'short', day: 'numeric' });
}

function calcEMA(data, period) {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const out = new Array(data.length).fill(null);
  let ema = data.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  out[period - 1] = ema;
  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

function calcRSI(data, period = 14) {
  if (data.length < period + 1) return new Array(data.length).fill(null);
  const out = new Array(data.length).fill(null);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = data[i].close - data[i - 1].close;
    if (d > 0) gains += d; else losses -= d;
  }
  let avgG = gains / period, avgL = losses / period;
  out[period] = 100 - 100 / (1 + avgG / (avgL || 1e-10));
  for (let i = period + 1; i < data.length; i++) {
    const d = data[i].close - data[i - 1].close;
    avgG = (avgG * (period - 1) + Math.max(0, d)) / period;
    avgL = (avgL * (period - 1) + Math.max(0, -d)) / period;
    out[i] = 100 - 100 / (1 + avgG / (avgL || 1e-10));
  }
  return out;
}

function calcMACD(data, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(data, fast);
  const emaSlow = calcEMA(data, slow);
  const macdLine = data.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i] - emaSlow[i] : null
  );
  // build fake "closes" array from macdLine for signal EMA
  const macdObjs = macdLine.map(v => ({ close: v ?? 0 }));
  const signalLine = calcEMA(macdObjs, signal);
  const signalAdj = signalLine.map((v, i) => (macdLine[i] != null && i >= slow + signal - 2 ? v : null));
  const histogram = macdLine.map((v, i) =>
    v != null && signalAdj[i] != null ? v - signalAdj[i] : null
  );
  return { macdLine, signalLine: signalAdj, histogram };
}

/* Heikin-Ashi conversion */
function toHeikinAshi(candles) {
  const out = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0
      ? (c.open + c.close) / 2
      : (out[i - 1].open + out[i - 1].close) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    out.push({ ...c, open: haOpen, close: haClose, high: haHigh, low: haLow });
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════
   DRAWING ENGINE HELPERS
═══════════════════════════════════════════════════════════ */
// priceToY is inlined as toY inside draw(), yToPrice used for mouse coord conversion
function yToPrice(y, pMin, pRange, chartH) {
  return pMin + ((chartH - y) / chartH) * pRange;
}
function canvasXToCandleIndex(mx, rightIdx, step, gap, chartW) {
  // which slot does mx land in?
  const slot = Math.round((chartW - mx) / step);
  return rightIdx - slot + 1;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const ChartPanel = ({ symbol, timeframe, chartType, indicators, activeTool, cursorMode: externalCursorMode, drawingsRef: externalDrawingsRef, onConnectionChange }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  // data & viewport — all in refs to skip React re-renders
  const candlesRef = useRef([]);
  const rawCandlesRef = useRef([]);          // before HA conversion
  const vpRef = useRef({ offset: -8, candleWidth: 10 }); // offset = candles from right (float for sub-pixel)
  const mouseRef = useRef({ x: -1, y: -1, down: false, startX: 0, startOffset: 0, button: 0, lastX: 0 });
  const dirty = useRef(true);
  const autoScroll = useRef(true);
  const wsRef = useRef(null);
  const animRef = useRef(null);
  const velocityRef = useRef(0);             // scroll velocity for momentum glide
  const priceVelocityRef = useRef(0);        // vertical scroll velocity
  const priceScrollRef = useRef(0);          // explicit vertical price pan offset
  const lastPRangeRef = useRef(1);           // caches range for correct pixel-to-price pan dragging
  const momentumAnimRef = useRef(null);      // RAF id for momentum loop
  const goLatestAnimRef = useRef(null);      // RAF id for animated scroll-to-latest
  const priceScaleRef = useRef(1);           // price axis zoom multiplier
  const targetCWRef = useRef(10);            // smooth-zoom target candle width
  const priceScaleDragRef = useRef(null);    // { startY, startScale } — Y-axis drag state
  const timeDragRef = useRef(null);          // { startX, startCW } — X-axis drag state
  const internalDrawingsRef = useRef([]);
  const drawingsRef = externalDrawingsRef ?? internalDrawingsRef;
  const drawingRef = useRef(null);         // in-progress drawing
  const selectedRef = useRef(-1);          // index of selected drawing

  const autoScaleRef = useRef(true);       // active TradingView auto-scale
  const manualBoundsRef = useRef({ rawPMin: 0, rawPMax: 100 }); // fixed bounds when auto-scale is broken

  // Initialize DrawingEngine
  const drawingEngineRef = useRef(null);
  
  /* ── helpers available to draw() ── */
  const getViewGeom = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const W = wrap.clientWidth;
    const hasVol = indicators.includes('volume');
    const hasRSI = indicators.includes('rsi');
    const hasMACD = indicators.includes('macd');
    const subH = (hasVol ? VOL_PANE_H : 0) + (hasRSI ? RSI_PANE_H : 0) + (hasMACD ? MACD_PANE_H : 0);
    const chartH = wrap.clientHeight - TIME_ROW_H - subH;
    const chartW = W - PRICE_COL_W;
    return { W, H: wrap.clientHeight, chartW, chartH, hasVol, hasRSI, hasMACD };
  }, [indicators]);

  const getPriceRangeMath = useCallback(() => {
    const vp = vpRef.current;
    const candles = candlesRef.current;
    const geom = getViewGeom();
    if (!geom) return { pMin: 0, pMax: 100, pRange: 100, rawPMin: 0, rawPMax: 100 };
    const { chartW } = geom;

    const cw = vp.candleWidth;
    const gap = Math.max(1, Math.round(cw * 0.15));
    const step = cw + gap;
    const total = Math.ceil(chartW / step) + 2;
    const rightIdx = candles.length - 1 - Math.floor(vp.offset);
    const visStart = Math.max(0, rightIdx - total + 1);
    const visEnd = Math.min(candles.length - 1, rightIdx + 1); // +1 buffer
    const visible = candles.slice(visStart, visEnd + 1);

    let rawPMax, rawPMin;

    if (autoScaleRef.current) {
      let rawMax = -Infinity, rawMin = Infinity;
      if (visible.length === 0) {
        rawMax = 100; rawMin = 0;
      } else {
        visible.forEach(c => { rawMax = Math.max(rawMax, c.high); rawMin = Math.min(rawMin, c.low); });
      }
      const pad = (rawMax - rawMin) * 0.08 || 0.001;
      rawPMax = rawMax + pad;
      rawPMin = rawMin - pad;
      manualBoundsRef.current = { rawPMin, rawPMax };
    } else {
      rawPMin = manualBoundsRef.current.rawPMin;
      rawPMax = manualBoundsRef.current.rawPMax;
    }

    const scale = Math.max(0.01, priceScaleRef.current);
    const half = (rawPMax - rawPMin) / (2 * scale);
    const midAuto = (rawPMax + rawPMin) / 2;

    const center = midAuto + priceScrollRef.current;
    const pMax = center + half;
    const pMin = center - half;

    return { pMin, pMax, pRange: pMax - pMin, rawPMin, rawPMax, visible, visStart, visEnd, rightIdx, step, gap, cw, fractPx: (vp.offset % 1) * step };
  }, [getViewGeom]);
  
  // Invalidate function for triggering redraws
  const invalidate = useCallback(() => { dirty.current = true; }, []);
  
  // Chart context provider for DrawingEngine
  const getChartContext = useCallback(() => {
    const geom = getViewGeom();
    if (!geom) return null;
    const { chartW, chartH } = geom;
    const vp = vpRef.current;
    const candles = candlesRef.current;
    const cw = vp.candleWidth;
    const gap = Math.max(1, Math.round(cw * 0.15));
    const step = cw + gap;
    const fractPx = (vp.offset % 1) * step;
    const rightIdx = candles.length - 1 - Math.floor(vp.offset);
    const { pMin, pRange } = getPriceRangeMath();
    
    return {
      candles,
      pMin,
      pRange,
      chartH,
      chartW,
      rightIdx,
      step,
      fractPx
    };
  }, [getViewGeom, getPriceRangeMath]);

  // Initialize DrawingEngine once
  useEffect(() => {
    if (!drawingEngineRef.current) {
      drawingEngineRef.current = new DrawingEngine(canvasRef, getChartContext);
      
      // Load drawings from localStorage
      try {
        const savedDrawings = localStorage.getItem(`blackchart_drawings_${symbol}_${timeframe}`);
        if (savedDrawings) {
          const drawings = JSON.parse(savedDrawings);
          drawings.forEach(drawing => {
            drawingEngineRef.current.addDrawing(drawing);
          });
          invalidate();
        }
      } catch (error) {
        console.error('Failed to load drawings from localStorage:', error);
      }
    }
  }, [getChartContext, symbol, timeframe, invalidate]);

  // Save drawings to localStorage whenever they change
  useEffect(() => {
    if (!drawingEngineRef.current) return;
    
    const saveDrawings = () => {
      try {
        const drawings = drawingEngineRef.current.drawings;
        localStorage.setItem(
          `blackchart_drawings_${symbol}_${timeframe}`,
          JSON.stringify(drawings)
        );
      } catch (error) {
        console.error('Failed to save drawings to localStorage:', error);
      }
    };

    // Save on a slight delay to avoid too frequent saves
    const timeoutId = setTimeout(saveDrawings, 500);
    return () => clearTimeout(timeoutId);
  }, [symbol, timeframe]); // Will trigger when drawings change via invalidate

  // minimal UI state
  const [headerInfo, setHeaderInfo] = useState(null);
  const [connected, setConnected] = useState(false);
  const [goLatestVisible, setGoLatest] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, drawingIdx }
  const cursorMode = externalCursorMode || 'crosshair'; // Use prop or default

  /* ══════════════════════════════════════════════
     RAF DRAW LOOP  +  smooth zoom easing
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    const loop = () => {
      // ── Smooth zoom: lerp candleWidth toward targetCW each frame ──
      const vp = vpRef.current;
      const target = targetCWRef.current;
      if (Math.abs(vp.candleWidth - target) > 0.01) {
        // 18% lerp per frame → crisp but smooth (~10 frames to settle)
        const newCW = vp.candleWidth + (target - vp.candleWidth) * 0.18;
        vpRef.current = { ...vp, candleWidth: newCW };
        dirty.current = true;
      }

      if (dirty.current) { draw(); dirty.current = false; }
      animRef.current = requestAnimationFrame(loop);
    };
    targetCWRef.current = vpRef.current.candleWidth;  // sync on mount
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicators, chartType, activeTool]);

  /* ── ResizeObserver ── */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = el.clientWidth * dpr;
      canvas.height = el.clientHeight * dpr;
      canvas.style.width = el.clientWidth + 'px';
      canvas.style.height = el.clientHeight + 'px';
      invalidate();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [invalidate]);

  /* ── Fetch + WebSocket ── */
  useEffect(() => {
    candlesRef.current = [];
    rawCandlesRef.current = [];
    autoScroll.current = true;
    vpRef.current = { ...vpRef.current, offset: 0 };
    setHeaderInfo(null);
    setConnected(false);
    invalidate();

    // map timeframe labels to API values
    const tfMap = { '1H': '1h', '4H': '4h', '1D': '1d', '1W': '1w' };
    const tf = tfMap[timeframe] || timeframe.toLowerCase();

    fetch(`http://localhost:8000/api/candles/${symbol}?timeframe=${tf}&limit=50000`)
      .then(r => r.json())
      .then(d => {
        if (d.data && d.data.length > 0) {
          rawCandlesRef.current = d.data;
          candlesRef.current = chartType === 'heikin' ? toHeikinAshi(d.data) : d.data;
          updateHeader(candlesRef.current);
          invalidate();
        }
      })
      .catch(() => { });

    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`ws://localhost:8000/ws/prices/${symbol}`);
    wsRef.current = ws;

    ws.onopen = () => { setConnected(true); onConnectionChange && onConnectionChange(true); };
    ws.onclose = () => { setConnected(false); onConnectionChange && onConnectionChange(false); };
    ws.onerror = () => { setConnected(false); onConnectionChange && onConnectionChange(false); };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.status === 'market_closed') return;

      const raw = rawCandlesRef.current;
      if (raw.length === 0) {
        raw.push(data);
      } else {
        const last = raw[raw.length - 1];
        if (last.time === data.time) raw[raw.length - 1] = data;
        else {
          raw.push(data);
          if (raw.length > 2000) raw.splice(0, raw.length - 2000);
        }
      }

      candlesRef.current = chartType === 'heikin' ? toHeikinAshi(raw) : raw;
      // CRITICAL: Only reset offset if autoScroll is true AND user hasn't manually panned
      // This prevents the chart from snapping back when user is viewing historical data
      if (autoScroll.current && Math.abs(vpRef.current.offset) < 1) {
        vpRef.current = { ...vpRef.current, offset: 0 };
      }
      updateHeader(candlesRef.current);
      invalidate();
    };

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  /* ── Re-process candles when chartType changes ── */
  useEffect(() => {
    if (rawCandlesRef.current.length > 0) {
      candlesRef.current = chartType === 'heikin'
        ? toHeikinAshi(rawCandlesRef.current)
        : rawCandlesRef.current;
      updateHeader(candlesRef.current);
      invalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType]);

  function updateHeader(candles) {
    if (candles.length < 2) return;
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const chg = last.close - prev.close;
    const chgP = (chg / prev.close) * 100;
    setHeaderInfo({ ...last, chg, chgP });
  }

  /* ══════════════════════════════════════════════
     DRAW ENGINE
  ═══════════════════════════════════════════════ */
  function draw() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    const hasVol = indicators.includes('volume');
    const hasRSI = indicators.includes('rsi');
    const hasMACD = indicators.includes('macd');
    const volH = hasVol ? VOL_PANE_H : 0;
    const rsiH = hasRSI ? RSI_PANE_H : 0;
    const macdH = hasMACD ? MACD_PANE_H : 0;
    const subH = volH + rsiH + macdH;
    const chartH = H - TIME_ROW_H - subH;
    const chartW = W - PRICE_COL_W;
    const candles = candlesRef.current;
    const vp = vpRef.current;
    const mouse = mouseRef.current;

    ctx.save();
    ctx.scale(dpr, dpr);

    /* ── background ── */
    ctx.fillStyle = C.bgDeep;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, chartW, chartH);

    if (candles.length === 0) {
      // ── Animated skeleton loader ──
      const t = Date.now() / 1000;
      const skelCW = 10;
      const skelGap = 2;
      const skelStep = skelCW + skelGap;
      const numBars = Math.floor(chartW / skelStep);

      // Draw ghost candles with wave animation
      for (let i = 0; i < numBars; i++) {
        const x = i * skelStep;
        const phase = Math.sin(t * 1.8 + i * 0.3) * 0.5 + 0.5; // 0..1
        const alpha = 0.06 + phase * 0.1;
        const barH = 20 + Math.sin(i * 0.7) * 15;
        const barY = chartH * 0.3 + Math.sin(i * 0.5) * chartH * 0.15;

        ctx.fillStyle = `rgba(120,123,134,${alpha})`;
        ctx.fillRect(x, barY, skelCW, barH);

        // wick
        ctx.fillStyle = `rgba(120,123,134,${alpha * 0.6})`;
        ctx.fillRect(x + skelCW / 2 - 0.5, barY - 8, 1, 8);
        ctx.fillRect(x + skelCW / 2 - 0.5, barY + barH, 1, 6);
      }

      // Price axis placeholder
      ctx.fillStyle = C.panel;
      ctx.fillRect(chartW, 0, PRICE_COL_W, chartH);
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.moveTo(chartW + 0.5, 0); ctx.lineTo(chartW + 0.5, chartH); ctx.stroke();

      // Connecting line (trend)
      ctx.beginPath();
      ctx.strokeStyle = `rgba(41,98,255,0.15)`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < numBars; i++) {
        const x = i * skelStep + skelCW / 2;
        const y = chartH * 0.3 + Math.sin(i * 0.5) * chartH * 0.15 + (20 + Math.sin(i * 0.7) * 15) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // "Connecting to server…" label
      const pulse = Math.sin(t * 2) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(120,123,134,${pulse})`;
      ctx.font = '13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Connecting to server…', chartW / 2, chartH / 2 + 60);
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillStyle = `rgba(120,123,134,${pulse * 0.6})`;
      ctx.fillText('Make sure the backend is running on port 8000', chartW / 2, chartH / 2 + 80);

      dirty.current = true;  // keep animating
      ctx.restore();
      return;
    }


    /* ── viewport math ──
       vp.offset is a float: integer part = candles from right, fractional part = sub-candle pixel shift.
       Using the fractional part for rendering gives pixel-perfect sub-candle smooth scrolling.
    ── */
    const { pMin, pMax, pRange, visible, visStart, visEnd, rightIdx, step, gap, cw, fractPx } = getPriceRangeMath();
    if (visible.length === 0) { ctx.restore(); return; }
    lastPRangeRef.current = pRange;

    const toY = (p) => chartH - ((p - pMin) / pRange) * chartH;

    /* ── VOLUME (sub-pane) ── */
    if (hasVol) {
      const volTop = chartH;
      const volBot = chartH + volH - 2;

      // Sub-pane background
      ctx.fillStyle = C.bgDeep;
      ctx.fillRect(0, volTop, chartW, volH);

      // Separator
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, volTop + 0.5); ctx.lineTo(chartW, volTop + 0.5);
      ctx.stroke();

      // "Vol" label
      ctx.fillStyle = C.text;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Vol', 8, volTop + 14);

      const maxVol = Math.max(...visible.map(c => c.volume || 0)) || 1;
      visible.forEach((candle, i) => {
        const ci = visStart + i;
        const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap;
        if (x + cw < 0 || x > chartW) return;
        const vol = candle.volume || 0;
        const barH = ((vol / maxVol) * (volH - 20));
        const bull = candle.close >= candle.open;
        ctx.fillStyle = bull ? C.volume : C.volBear;
        ctx.fillRect(x, volBot - barH, cw, barH);
      });
    }

    /* ── RSI SUB-PANE ── */
    if (hasRSI) {
      const rsiTop = chartH + volH;
      const rsiBot = rsiTop + rsiH - 2;
      const rsiMid = rsiTop + rsiH / 2;

      ctx.fillStyle = C.bgDeep;
      ctx.fillRect(0, rsiTop, chartW, rsiH);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, rsiTop + 0.5); ctx.lineTo(chartW, rsiTop + 0.5); ctx.stroke();

      // Label
      ctx.fillStyle = C.text; ctx.font = '10px monospace'; ctx.textAlign = 'left';
      ctx.fillText('RSI(14)', 6, rsiTop + 14);

      // OB/OS lines
      const toRsiY = (v) => rsiTop + ((100 - v) / 100) * rsiH;
      [[70, C.bear], [50, C.border], [30, C.bull]].forEach(([lvl, col]) => {
        const y = toRsiY(lvl);
        ctx.strokeStyle = col;
        ctx.lineWidth = 0.7;
        ctx.setLineDash(lvl === 50 ? [] : [4, 3]);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartW, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = col;
        ctx.font = '9px monospace'; ctx.textAlign = 'right';
        ctx.fillText(lvl, chartW - 4, y - 2);
      });

      // RSI line
      const rsiData = calcRSI(candles);
      ctx.beginPath();
      ctx.strokeStyle = '#e91e63';
      ctx.lineWidth = 1.5;
      let rsiStarted = false;
      visible.forEach((_, i) => {
        const ci = visStart + i;
        const val = rsiData[ci];
        if (val == null) return;
        const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap + cw / 2;
        const y = toRsiY(val);
        if (!rsiStarted) { ctx.moveTo(x, y); rsiStarted = true; } else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Crosshair RSI value
      if (mouse.x >= 0 && mouse.x <= chartW && mouse.y >= rsiTop && mouse.y <= rsiTop + rsiH) {
        const crossRSI = ((100 - (mouse.y - rsiTop) / rsiH * 100)).toFixed(1);
        ctx.fillStyle = '#e91e63';
        ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
        ctx.fillText(crossRSI, chartW - 68, rsiTop + 14);
      }
    }

    /* ── MACD SUB-PANE ── */
    if (hasMACD) {
      const macdTop = chartH + volH + rsiH;
      const macdBot = macdTop + macdH;
      const macdMid = (macdTop + macdBot) / 2;

      ctx.fillStyle = C.bgDeep;
      ctx.fillRect(0, macdTop, chartW, macdH);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, macdTop + 0.5); ctx.lineTo(chartW, macdTop + 0.5); ctx.stroke();

      ctx.fillStyle = C.text; ctx.font = '10px monospace'; ctx.textAlign = 'left';
      ctx.fillText('MACD(12,26,9)', 6, macdTop + 14);

      const { macdLine, signalLine, histogram } = calcMACD(candles);

      // Calculate range for the pane
      let macdMax = -Infinity, macdMin = Infinity;
      visible.forEach((_, i) => {
        const ci = visStart + i;
        if (histogram[ci] != null) { macdMax = Math.max(macdMax, Math.abs(histogram[ci])); }
        if (macdLine[ci] != null) { macdMax = Math.max(macdMax, Math.abs(macdLine[ci])); }
        if (signalLine[ci] != null) { macdMax = Math.max(macdMax, Math.abs(signalLine[ci])); }
      });
      if (macdMax === -Infinity) macdMax = 1;
      macdMin = -macdMax;
      const macdRange = macdMax - macdMin || 1;
      const toMacdY = (v) => macdTop + ((macdMax - v) / macdRange) * macdH;

      // Zero line
      const zeroY = toMacdY(0);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(0, zeroY); ctx.lineTo(chartW, zeroY); ctx.stroke();
      ctx.setLineDash([]);

      // Histogram bars
      visible.forEach((_, i) => {
        const ci = visStart + i;
        const val = histogram[ci];
        if (val == null) return;
        const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap;
        const y = toMacdY(Math.max(0, val));
        const barH = Math.abs(toMacdY(val) - zeroY);
        ctx.fillStyle = val >= 0 ? 'rgba(38,166,154,0.6)' : 'rgba(239,83,80,0.6)';
        ctx.fillRect(x, val >= 0 ? zeroY - barH : zeroY, cw, barH || 1);
      });

      // MACD line
      const drawLine = (arr, color, dash = []) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash(dash);
        let started = false;
        visible.forEach((_, i) => {
          const ci = visStart + i;
          const val = arr[ci];
          if (val == null) return;
          const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap + cw / 2;
          const y = toMacdY(val);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      };
      drawLine(macdLine, '#2196f3');
      drawLine(signalLine, '#ff9800', [4, 3]);
    }

    /* ── EMA LINES ── */
    const indicatorsCopy = indicators; // close over current value
    const drawEMA = (period, color) => {
      const emaData = calcEMA(candles, period);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      let started = false;
      visible.forEach((_, i) => {
        const ci = visStart + i;
        const val = emaData[ci];
        if (!val) return;
        const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap + cw / 2;
        const y = toY(val);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    if (indicatorsCopy.includes('ema9')) drawEMA(9, C.ema9);
    if (indicatorsCopy.includes('ema21')) drawEMA(21, C.ema21);
    if (indicatorsCopy.includes('ema50')) drawEMA(50, C.ema50);

    /* ── BOLLINGER BANDS ── */
    if (indicatorsCopy.includes('bb')) {
      const period = 20, mult = 2;
      if (candles.length >= period) {
        ctx.lineWidth = 1;
        ['upper', 'mid', 'lower'].forEach((band, bi) => {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255,87,34,0.7)';
          ctx.setLineDash(bi === 1 ? [4, 3] : []);
          let started = false;
          visible.forEach((_, i) => {
            const ci = visStart + i;
            if (ci < period - 1) return;
            const slice = candles.slice(ci - period + 1, ci + 1);
            const avg = slice.reduce((s, c) => s + c.close, 0) / period;
            const std = Math.sqrt(slice.reduce((s, c) => s + (c.close - avg) ** 2, 0) / period);
            const val = band === 'upper' ? avg + mult * std : band === 'lower' ? avg - mult * std : avg;
            const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap + cw / 2;
            const y = toY(val);
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }
    }

    /* ── CANDLES / BARS / LINE / AREA ── */
    if (chartType === 'line' || chartType === 'area') {
      // Line / Area chart
      ctx.beginPath();
      let firstX = null, firstY = null;
      const pts = [];
      visible.forEach((candle, i) => {
        const ci = visStart + i;
        const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap + cw / 2;
        const y = toY(candle.close);
        pts.push({ x, y });
      });
      if (pts.length > 0) {
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        pts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
        ctx.stroke();

        if (chartType === 'area') {
          ctx.lineTo(pts[pts.length - 1].x, chartH);
          ctx.lineTo(pts[0].x, chartH);
          ctx.closePath();
          const grad = ctx.createLinearGradient(0, 0, 0, chartH);
          grad.addColorStop(0, 'rgba(41,98,255,0.25)');
          grad.addColorStop(1, 'rgba(41,98,255,0.02)');
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }
    } else if (chartType === 'bar') {
      // OHLC Bar chart
      visible.forEach((candle, i) => {
        const ci = visStart + i;
        const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap;
        if (x + cw < 0 || x > chartW) return;
        const cx = x + cw / 2;
        const bull = candle.close >= candle.open;
        const col = bull ? C.bull : C.bear;
        const oY = toY(candle.open);
        const cY = toY(candle.close);
        const hY = toY(candle.high);
        const lY = toY(candle.low);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        // main wick
        ctx.beginPath(); ctx.moveTo(cx, hY); ctx.lineTo(cx, lY); ctx.stroke();
        // open tick left
        ctx.beginPath(); ctx.moveTo(cx, oY); ctx.lineTo(cx - cw / 2, oY); ctx.stroke();
        // close tick right
        ctx.beginPath(); ctx.moveTo(cx, cY); ctx.lineTo(cx + cw / 2, cY); ctx.stroke();
      });
    } else {
      // Pass 1: Draw Enhanced Wicks with Japanese Style
      ctx.lineWidth = 1;
      ctx.lineCap = 'round'; // Rounded caps for smoother look
      visible.forEach((candle, i) => {
        const ci = visStart + i;
        const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap;
        if (x + cw < 0 || x > chartW) return;
        const xCenter = x + cw / 2;

        const xC = Math.floor(xCenter) + 0.5;
        const oY = toY(candle.open);
        const cY = toY(candle.close);
        const hY = toY(candle.high);
        const lY = toY(candle.low);

        const bodyTop = Math.min(oY, cY);
        const bodyBot = Math.max(oY, cY);
        const isBull = candle.close >= candle.open;

        // Enhanced wick colors with slight transparency
        const wickColor = isBull ? 'rgba(8,153,129,0.8)' : 'rgba(242,54,69,0.8)';
        ctx.strokeStyle = wickColor;
        
        // Calculate wick proportions for visual emphasis
        const upperWick = Math.abs(candle.high - Math.max(candle.open, candle.close));
        const lowerWick = Math.abs(Math.min(candle.open, candle.close) - candle.low);
        const totalRange = candle.high - candle.low;
        
        // Thicker wicks for significant price rejection
        if (totalRange > 0) {
          const upperRatio = upperWick / totalRange;
          const lowerRatio = lowerWick / totalRange;
          
          // Upper wick
          if (upperRatio > 0.3) {
            ctx.lineWidth = 2; // Thicker for significant upper rejection
            ctx.strokeStyle = isBull ? 'rgba(8,153,129,0.9)' : 'rgba(242,54,69,0.9)';
          } else {
            ctx.lineWidth = 1;
            ctx.strokeStyle = wickColor;
          }
          
          ctx.beginPath();
          ctx.moveTo(xC, Math.floor(hY) + 0.5);
          ctx.lineTo(xC, Math.floor(bodyTop) + 0.5);
          ctx.stroke();
          
          // Lower wick
          if (lowerRatio > 0.3) {
            ctx.lineWidth = 2; // Thicker for significant lower rejection
            ctx.strokeStyle = isBull ? 'rgba(8,153,129,0.9)' : 'rgba(242,54,69,0.9)';
          } else {
            ctx.lineWidth = 1;
            ctx.strokeStyle = wickColor;
          }
          
          ctx.beginPath();
          ctx.moveTo(xC, Math.floor(bodyBot) + 0.5);
          ctx.lineTo(xC, Math.floor(lY) + 0.5);
          ctx.stroke();
          
          // Add small dots at wick extremes for high/low emphasis
          if (cw > 8) {
            ctx.fillStyle = isBull ? '#26a69a' : '#ef5350';
            
            // High point dot
            ctx.beginPath();
            ctx.arc(xC, Math.floor(hY) + 0.5, 1, 0, Math.PI * 2);
            ctx.fill();
            
            // Low point dot
            ctx.beginPath();
            ctx.arc(xC, Math.floor(lY) + 0.5, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Pass 2: Draw Japanese Candlesticks with Unique Design
      visible.forEach((candle, i) => {
        const ci = visStart + i;
        const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap;
        if (x + cw < 0 || x > chartW) return;

        const boxX = Math.round(x);
        const boxW = Math.max(1, Math.round(cw));

        const oY = toY(candle.open);
        const cY = toY(candle.close);
        const hY = toY(candle.high);
        const lY = toY(candle.low);

        const boxTop = Math.round(Math.min(oY, cY));
        const boxBot = Math.round(Math.max(oY, cY));
        const boxH = Math.max(1, boxBot - boxTop);

        const isBull = candle.close >= candle.open;
        
        // Enhanced Japanese Candlestick Design
        if (isBull) {
          // Bullish Candle - Green with gradient effect
          const gradient = ctx.createLinearGradient(boxX, boxTop, boxX, boxBot);
          gradient.addColorStop(0, '#26a69a'); // Lighter green at top
          gradient.addColorStop(0.5, '#089981'); // Main green
          gradient.addColorStop(1, '#00695c'); // Darker green at bottom
          
          ctx.fillStyle = gradient;
          ctx.fillRect(boxX, boxTop, boxW, boxH);
          
          // Add subtle border for definition
          ctx.strokeStyle = '#004d40';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(boxX, boxTop, boxW, boxH);
          
          // Add inner highlight for 3D effect
          if (boxW > 3 && boxH > 3) {
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(boxX + 1, boxTop + 1);
            ctx.lineTo(boxX + boxW - 1, boxTop + 1);
            ctx.moveTo(boxX + 1, boxTop + 1);
            ctx.lineTo(boxX + 1, boxBot - 1);
            ctx.stroke();
          }
        } else {
          // Bearish Candle - Red with gradient effect
          const gradient = ctx.createLinearGradient(boxX, boxTop, boxX, boxBot);
          gradient.addColorStop(0, '#ef5350'); // Lighter red at top
          gradient.addColorStop(0.5, '#f23645'); // Main red
          gradient.addColorStop(1, '#c62828'); // Darker red at bottom
          
          ctx.fillStyle = gradient;
          ctx.fillRect(boxX, boxTop, boxW, boxH);
          
          // Add subtle border for definition
          ctx.strokeStyle = '#b71c1c';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(boxX, boxTop, boxW, boxH);
          
          // Add inner shadow for 3D effect
          if (boxW > 3 && boxH > 3) {
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(boxX + 1, boxBot - 1);
            ctx.lineTo(boxX + boxW - 1, boxBot - 1);
            ctx.moveTo(boxX + boxW - 1, boxTop + 1);
            ctx.lineTo(boxX + boxW - 1, boxBot - 1);
            ctx.stroke();
          }
        }
        
        // Add volume-based transparency effect
        if (candle.volume) {
          const maxVol = Math.max(...visible.map(c => c.volume || 0));
          const volRatio = (candle.volume || 0) / maxVol;
          const alpha = 0.3 + (volRatio * 0.7); // 30% to 100% opacity based on volume
          
          // Apply volume-based glow effect for high volume candles
          if (volRatio > 0.8) {
            ctx.shadowColor = isBull ? '#26a69a' : '#f23645';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Redraw with glow
            ctx.globalAlpha = alpha;
            ctx.fillStyle = isBull ? '#089981' : '#f23645';
            ctx.fillRect(boxX, boxTop, boxW, boxH);
            
            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
          }
        }
        
        // Add price action indicators for significant moves
        const priceChange = Math.abs(candle.close - candle.open);
        const bodyRange = Math.abs(candle.high - candle.low);
        const bodyRatio = bodyRange > 0 ? priceChange / bodyRange : 0;
        
        // Strong directional move indicator (thick body relative to wicks)
        if (bodyRatio > 0.7 && boxH > 5) {
          ctx.strokeStyle = isBull ? '#4caf50' : '#ff5722';
          ctx.lineWidth = 2;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(boxX - 1, boxTop - 1, boxW + 2, boxH + 2);
          ctx.setLineDash([]);
        }
        
        // Doji indicator (very small body)
        if (bodyRatio < 0.1 && bodyRange > 0) {
          ctx.strokeStyle = '#ffc107';
          ctx.lineWidth = 2;
          const centerY = (boxTop + boxBot) / 2;
          ctx.beginPath();
          ctx.arc(boxX + boxW / 2, centerY, 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }

    /* ── DRAWINGS ── */
    // Render drawings using DrawingEngine
    if (drawingEngineRef.current) {
      drawingEngineRef.current.render(ctx, dpr);
    }

    /* ── In-progress drawing preview ── */
    const inProg = drawingRef.current;
    if (inProg && drawingEngineRef.current) {
      const mx = mouse.x, my = mouse.y;
      
      // Create temporary drawing for preview
      const tempDrawing = {
        type: inProg.type,
        points: [
          { price: inProg.p1, time: inProg.t1, candleIndex: 0 },
          { price: yToPrice(my, pMin, pRange, chartH), time: null, candleIndex: 0 }
        ],
        style: { color: C.blue, lineWidth: 1.5 },
        visible: true
      };
      
      // Temporarily set as active drawing
      const prevActive = drawingEngineRef.current.activeDrawing;
      drawingEngineRef.current.activeDrawing = tempDrawing;
      drawingEngineRef.current.renderDrawing(ctx, tempDrawing, false, false, true);
      drawingEngineRef.current.activeDrawing = prevActive;
    }

    /* ── LIVE price line ── */
    const lastCandle = candles[candles.length - 1];
    const liveY = Math.round(toY(lastCandle.close)) + 0.5;
    if (liveY >= 0 && liveY <= chartH) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, liveY); ctx.lineTo(chartW, liveY); ctx.stroke();
      ctx.setLineDash([]);

      // label box
      const lw = PRICE_COL_W - 2;
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(chartW + 1, liveY - 9, lw, 18, 2) : ctx.rect(chartW + 1, liveY - 9, lw, 18);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(formatPrice(lastCandle.close), chartW + 1 + lw / 2, liveY + 4);
    }

    /* ── PRICE AXIS (right column) ── */
    ctx.fillStyle = C.panel;
    ctx.fillRect(chartW, 0, PRICE_COL_W, chartH);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(chartW + 0.5, 0); ctx.lineTo(chartW + 0.5, chartH); ctx.stroke();

    ctx.fillStyle = C.text;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    const ticks = niceTicks(pMin, pMax, 8);
    ticks.forEach(tick => {
      const y = Math.round(toY(tick));
      if (y < 4 || y > chartH - 4) return;
      ctx.fillText(formatPrice(tick), chartW + 5, y + 4);
    });

    /* ── TIME AXIS (bottom row) ── */
    const timeAxisY = chartH + volH;
    ctx.fillStyle = C.panel;
    ctx.fillRect(0, timeAxisY, chartW, TIME_ROW_H);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, timeAxisY + 0.5); ctx.lineTo(chartW, timeAxisY + 0.5); ctx.stroke();

    const minLabelGap = 80;
    let lastLabelX = -minLabelGap;
    ctx.fillStyle = C.text;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    visible.forEach((candle, i) => {
      const ci = visStart + i;
      const x = chartW - fractPx - (rightIdx - ci + 1) * step + gap + cw / 2;
      if (x - lastLabelX >= minLabelGap && x > 0 && x < chartW - 20) {
        ctx.fillText(formatTime(candle.time, timeframe), x, timeAxisY + 16);
        ctx.strokeStyle = C.border;
        ctx.beginPath(); ctx.moveTo(x, timeAxisY); ctx.lineTo(x, timeAxisY + 4); ctx.stroke();
        lastLabelX = x;
      }
    });

    /* ── corner ── */
    ctx.fillStyle = C.panel;
    ctx.fillRect(chartW, timeAxisY, PRICE_COL_W, TIME_ROW_H);

    /* ── CROSSHAIR / DOT CURSOR ── */
    const mx = mouse.x, my = mouse.y;
    if (mx >= 0 && mx <= chartW && my >= 0 && my <= chartH) {
      // Render based on cursor mode
      if (cursorMode === 'crosshair') {
        // Full crosshair with lines
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = C.cross;
        ctx.lineWidth = 1;

        // vertical
        ctx.beginPath(); ctx.moveTo(mx + 0.5, 0); ctx.lineTo(mx + 0.5, chartH); ctx.stroke();
        // horizontal
        ctx.beginPath(); ctx.moveTo(0, my + 0.5); ctx.lineTo(chartW, my + 0.5); ctx.stroke();
        ctx.setLineDash([]);

        // Price label on right axis
        const crossPrice = yToPrice(my, pMin, pRange, chartH);
        const clH = 18;
        ctx.fillStyle = C.cross;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(chartW + 1, my - clH / 2, PRICE_COL_W - 2, clH, 2)
          : ctx.rect(chartW + 1, my - clH / 2, PRICE_COL_W - 2, clH);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(formatPrice(crossPrice), chartW + 6, my + 4);

        // Time label on bottom axis
        const hovCandle = getHoveredCandle(mx, rightIdx, step, gap, cw, chartW, candles, visStart, visEnd);
        if (hovCandle) {
          const timeStr = formatTime(hovCandle.time, timeframe);
          ctx.font = '10px monospace';
          const tw = ctx.measureText(timeStr).width + 14;
          ctx.fillStyle = C.cross;
          ctx.fillRect(mx - tw / 2, timeAxisY, tw, TIME_ROW_H);
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText(timeStr, mx, timeAxisY + 16);
        }
      } else if (cursorMode === 'dot') {
        // Dot cursor - just a small circle, no lines
        ctx.fillStyle = C.cross;
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Still show OHLC tooltip on hover
        const hovCandle = getHoveredCandle(mx, rightIdx, step, gap, cw, chartW, candles, visStart, visEnd);
        if (hovCandle) {
          // Show tooltip near cursor
          const tooltipText = `O:${formatPrice(hovCandle.open)} H:${formatPrice(hovCandle.high)} L:${formatPrice(hovCandle.low)} C:${formatPrice(hovCandle.close)}`;
          ctx.font = '10px monospace';
          const tw = ctx.measureText(tooltipText).width + 12;
          const tx = Math.min(mx + 15, chartW - tw);
          const ty = Math.max(my - 25, 10);
          
          ctx.fillStyle = 'rgba(19,23,34,0.95)';
          ctx.fillRect(tx, ty, tw, 20);
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'left';
          ctx.fillText(tooltipText, tx + 6, ty + 14);
        }
      }
      // arrow and eraser modes don't show crosshair/dot
    }

    /* ── LIVE badge ── */
    if (autoScroll.current) {
      const bw = 38, bh = 16;
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(chartW - bw - 8, 8, bw, bh, 3) : ctx.rect(chartW - bw - 8, 8, bw, bh);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LIVE', chartW - 8 - bw / 2, 8 + bh - 4);
    }

    ctx.restore();
  }

  function getHoveredCandle(mx, rightIdx, step, gap, cw, chartW, candles, visStart, visEnd) {
    // Account for fractional offset in hit testing
    const vp = vpRef.current;
    const fractPx = (vp.offset % 1) * step;
    for (let i = visEnd; i >= visStart; i--) {
      const x = chartW - fractPx - (rightIdx - i + 1) * step + gap;
      if (mx >= x && mx <= x + cw) return candles[i];
    }
    return null;
  }

  /* ══════════════════════════════════════════════
     MOUSE / TOUCH EVENTS
  ═══════════════════════════════════════════════ */
  useChartInteractions({
    canvasRef, wrapRef, vpRef, candlesRef, mouseRef, drawingRef, selectedRef,
    velocityRef, priceVelocityRef, priceScrollRef, priceScaleRef, targetCWRef,
    autoScaleRef, autoScroll, momentumAnimRef, goLatestAnimRef,
    getPriceRangeMath, setGoLatest, commitDrawing, indicators, activeTool, invalidate,
    cursorMode, drawingEngineRef
  });

  function commitDrawing(d) {
    if (!drawingEngineRef.current) return;
    
    // Convert old format to DrawingEngine format
    const drawing = {
      type: d.type,
      points: [],
      style: { color: C.blue, lineWidth: 2 },
      settings: {},
      visible: true
    };
    
    // Convert based on drawing type
    if (['trendline', 'ray', 'rectangle', 'fib', 'extendedline', 'hray', 'parallelchannel'].includes(d.type)) {
      const candles = candlesRef.current;
      const idx1 = candles.findIndex(c => c.time === d.t1);
      const idx2 = candles.findIndex(c => c.time === d.t2);
      drawing.points = [
        { price: d.p1, time: d.t1, candleIndex: idx1 >= 0 ? idx1 : 0 },
        { price: d.p2, time: d.t2, candleIndex: idx2 >= 0 ? idx2 : 0 }
      ];
      
      // For parallel channel, add third point if available
      if (d.type === 'parallelchannel' && d.p3 && d.t3) {
        const idx3 = candles.findIndex(c => c.time === d.t3);
        drawing.points.push({ price: d.p3, time: d.t3, candleIndex: idx3 >= 0 ? idx3 : 0 });
      }
    } else if (d.type === 'hline') {
      drawing.points = [{ price: d.price || d.p1, time: null, candleIndex: 0 }];
      drawing.settings = { showPrice: true };
    } else if (d.type === 'vline') {
      const candles = candlesRef.current;
      const time = d.time || d.t1;
      const idx = candles.findIndex(c => c.time === time);
      drawing.points = [{ price: 0, time: time, candleIndex: idx >= 0 ? idx : 0 }];
    } else if (d.type === 'text') {
      const candles = candlesRef.current;
      const idx = candles.findIndex(c => c.time === d.t1);
      drawing.points = [{ price: d.p1, time: d.t1, candleIndex: idx >= 0 ? idx : 0 }];
      drawing.settings = { text: d.text || 'Text' };
    }
    
    drawingEngineRef.current.addDrawing(drawing);
    saveDrawingsToStorage();
    invalidate();
  }

  // Helper function to save drawings
  const saveDrawingsToStorage = useCallback(() => {
    if (!drawingEngineRef.current) return;
    try {
      const drawings = drawingEngineRef.current.drawings;
      localStorage.setItem(
        `blackchart_drawings_${symbol}_${timeframe}`,
        JSON.stringify(drawings)
      );
    } catch (error) {
      console.error('Failed to save drawings:', error);
    }
  }, [symbol, timeframe]);

  const onContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Delete key removes selected drawing
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && drawingEngineRef.current) {
        const selected = drawingEngineRef.current.selectedDrawing;
        if (selected) {
          drawingEngineRef.current.removeDrawing(selected.id);
          drawingEngineRef.current.selectedDrawing = null;
          saveDrawingsToStorage();
          invalidate();
        }
      }
      if (e.key === 'Escape') {
        drawingRef.current = null;
        if (drawingEngineRef.current) {
          drawingEngineRef.current.selectedDrawing = null;
        }
        setContextMenu(null);
        invalidate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [invalidate, saveDrawingsToStorage]);

  const goLive = useCallback(() => {
    cancelAnimationFrame(momentumAnimRef.current);
    cancelAnimationFrame(goLatestAnimRef.current);
    velocityRef.current = 0;
    priceVelocityRef.current = 0;

    /* ── Animated scroll to latest (like TradingView's eased jump) ── */
    const animateToLatest = () => {
      const vp = vpRef.current;
      const targetOffset = -15;
      if (Math.abs(vp.offset - targetOffset) < 0.05) {
        vpRef.current = { ...vp, offset: targetOffset };
        autoScroll.current = true;
        setGoLatest(false);
        invalidate();
        return;
      }
      // Ease-out: move 22% of remaining distance per frame
      vpRef.current = { ...vp, offset: vp.offset + (targetOffset - vp.offset) * 0.22 };
      invalidate();
      goLatestAnimRef.current = requestAnimationFrame(animateToLatest);
    };
    goLatestAnimRef.current = requestAnimationFrame(animateToLatest);
  }, [invalidate]);

  /* ── Cursor style ── */
  const getCursor = () => {
    const wrap = wrapRef.current;
    if (!wrap) return 'crosshair';
    const hasVol = indicators.includes('volume');
    const hasRSI = indicators.includes('rsi');
    const hasMACD = indicators.includes('macd');
    const subH = (hasVol ? VOL_PANE_H : 0) + (hasRSI ? RSI_PANE_H : 0) + (hasMACD ? MACD_PANE_H : 0);
    const chartH = wrap.clientHeight - TIME_ROW_H - subH;
    const chartW = wrap.clientWidth - PRICE_COL_W;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    // Y-axis (price scale) zone → ns-resize
    if (mx >= chartW) return priceScaleDragRef.current ? 'ns-resize' : 'ns-resize';
    // Time-axis (bottom row) zone → ew-resize
    if (my > chartH) return timeDragRef.current ? 'ew-resize' : 'ew-resize';

    // Cursor mode overrides
    if (cursorMode === 'arrow') return 'default';
    if (cursorMode === 'eraser') return 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNiAxOEwxOCA2TTYgNkwxOCAxOCIgc3Ryb2tlPSIjZjIzNjQ1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==") 12 12, crosshair';
    if (cursorMode === 'dot') return 'none'; // Hide cursor, we draw custom dot

    if (mouseRef.current.down && (activeTool === 'cursor' || activeTool === 'crosshair')) return 'grabbing';
    if (['trendline', 'hline', 'vline', 'rectangle', 'fib'].includes(activeTool)) return 'crosshair';
    return 'crosshair';
  };

  return (
    <div className="tv-chart-panel">
      {/* Canvas area */}
      <div
        className="tv-canvas-wrap"
        ref={wrapRef}
        style={{ cursor: getCursor() }}
      >
        <canvas
          className="tv-canvas"
          ref={canvasRef}
          onContextMenu={onContextMenu}
        />

        {/* Go to latest */}
        <button
          className={`tv-go-latest ${!goLatestVisible ? 'hidden' : ''}`}
          onClick={goLive}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <polygon points="0,0 6,5 0,10" />
            <rect x="7" y="0" width="2" height="10" />
          </svg>
          Latest
        </button>

        {/* Context menu */}
        {contextMenu && (
          <div
            className="tv-context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseLeave={() => setContextMenu(null)}
          >
            <button className="tv-context-item" onClick={() => {
              if (drawingEngineRef.current) {
                drawingEngineRef.current.clearAll();
                saveDrawingsToStorage();
              }
              setContextMenu(null);
              invalidate();
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                <line x1="1" y1="3" x2="13" y2="3" />
                <path d="M4 3 L4 12 C4 12.5 4.5 13 5 13 L9 13 C9.5 13 10 12.5 10 12 L10 3" />
              </svg>
              Remove All Drawings
            </button>
            <div className="tv-context-sep" />
            <button className="tv-context-item" onClick={() => {
              vpRef.current = { ...vpRef.current, offset: 0 };
              autoScroll.current = true;
              setGoLatest(false);
              setContextMenu(null);
              invalidate();
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                <line x1="1" y1="7" x2="12" y2="7" />
                <polyline points="8,4 12,7 8,10" />
              </svg>
              Go to Latest Bar
            </button>
            <button className="tv-context-item" onClick={() => {
              vpRef.current = { offset: 0, candleWidth: 10 };
              setContextMenu(null);
              invalidate();
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                <circle cx="7" cy="7" r="5" />
                <line x1="7" y1="4" x2="7" y2="7" />
                <line x1="7" y1="7" x2="9" y2="9" />
              </svg>
              Reset Chart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartPanel;
