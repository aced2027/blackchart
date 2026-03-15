import { useEffect, useRef } from 'react';

const MIN_CW = 1;
const MAX_CW = 60;
const PRICE_COL_W = 72;
const TIME_ROW_H = 24;
const VOL_PANE_H = 80;
const RSI_PANE_H = 80;
const MACD_PANE_H = 80;

function yToPrice(y, pMin, pRange, chartH) {
    return pMin + ((chartH - y) / chartH) * pRange;
}

export function useChartInteractions({
    canvasRef,
    wrapRef,
    vpRef,
    candlesRef,
    mouseRef,
    drawingRef,
    selectedRef,
    velocityRef,
    priceVelocityRef,
    priceScrollRef,
    priceScaleRef,
    targetCWRef,
    autoScaleRef,
    autoScroll,
    momentumAnimRef,
    goLatestAnimRef,
    getPriceRangeMath,
    setGoLatest,
    commitDrawing,
    indicators,
    activeTool,
    invalidate,
    cursorMode,
    drawingEngineRef
}) {
    const evDeps = useRef({ indicators, activeTool, invalidate, commitDrawing, setGoLatest, getPriceRangeMath, cursorMode, drawingEngineRef });

    useEffect(() => {
        evDeps.current = { indicators, activeTool, invalidate, commitDrawing, setGoLatest, getPriceRangeMath, cursorMode, drawingEngineRef };
    }, [indicators, activeTool, invalidate, commitDrawing, setGoLatest, getPriceRangeMath, cursorMode, drawingEngineRef]);

    useEffect(() => {
        const cv = canvasRef.current;
        const wrap = wrapRef.current;
        if (!cv || !wrap) return;

        let touch = { fingers: [], s1: null, s2: null };
        let md = { down: false, sx: 0, sy: 0, lx: 0, ly: 0, lt: 0, startTO: 0, startPMid: 0, startPRange: 0 };
        let pax = { active: false, sy: 0, sScale: 1 };
        let tax = { active: false, sx: 0, sCW: 10 };
        let lastTap = 0;

        const touchDist = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const touchMid = (t1, t2) => ({ x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 });

        const getCanvasPos = (e) => {
            const rect = cv.getBoundingClientRect();
            if (!rect) return { x: 0, y: 0 };
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        const layout = () => {
            const { indicators } = evDeps.current;
            const subH = (indicators.includes('volume') ? VOL_PANE_H : 0) +
                (indicators.includes('rsi') ? RSI_PANE_H : 0) +
                (indicators.includes('macd') ? MACD_PANE_H : 0);
            return { W: wrap.clientWidth - PRICE_COL_W, H: wrap.clientHeight - TIME_ROW_H - subH, subH };
        };

        const autoFit = () => {
            autoScaleRef.current = true;
            priceScaleRef.current = 1;
            priceScrollRef.current = 0;
            priceVelocityRef.current = 0;
            evDeps.current.invalidate();
        };

        const zoomPricePivoted = (newScale, pivotY) => {
            autoScaleRef.current = false;
            const { H } = layout();
            const { pMin, pRange, rawPMin, rawPMax } = evDeps.current.getPriceRangeMath();
            const pivotPrice = pMin + ((H - pivotY) / H) * pRange;

            priceScaleRef.current = Math.max(0.01, Math.min(100, newScale));
            const newHalf = (rawPMax - rawPMin) / (2 * priceScaleRef.current);
            const midAuto = (rawPMax + rawPMin) / 2;
            priceScrollRef.current = pivotPrice - midAuto + newHalf - ((H - pivotY) / H) * 2 * newHalf;
        };

        const zoomTimePivoted = (newCW, pivotX) => {
            const { W } = layout();
            const vp = vpRef.current;
            const oldStep = vp.candleWidth + Math.max(1, Math.round(vp.candleWidth * 0.15));
            const newStep = newCW + Math.max(1, Math.round(newCW * 0.15));

            const candlesFromRight = (W - pivotX + vp.offset * oldStep) / oldStep;
            const newOffset = Math.max(-150, candlesFromRight - (W - pivotX) / newStep);

            targetCWRef.current = newCW;
            vpRef.current = { ...vp, offset: newOffset, candleWidth: newCW };
        };

        const handleMouseDown = (e) => {
            const { x, y } = getCanvasPos(e);
            const { W, H, subH } = layout();
            mouseRef.current.down = true;
            mouseRef.current.startX = e.clientX;
            mouseRef.current.startY = e.clientY;
            mouseRef.current.lastX = e.clientX;
            mouseRef.current.lastY = e.clientY;
            mouseRef.current.button = e.button;

            cancelAnimationFrame(momentumAnimRef.current);
            cancelAnimationFrame(goLatestAnimRef.current);
            velocityRef.current = 0;
            priceVelocityRef.current = 0;

            // Price axis drag
            if (x >= W && e.button === 0) {
                pax = { active: true, sy: e.clientY, sScale: priceScaleRef.current, pivotY: Math.min(y, H) };
                return;
            }
            // Time axis drag
            if (y >= H && y < H + subH + TIME_ROW_H && x < W && e.button === 0) {
                tax = { active: true, sx: e.clientX, sCW: targetCWRef.current, pivotX: Math.min(x, W) };
                return;
            }

            const { activeTool, invalidate, cursorMode, drawingEngineRef } = evDeps.current;
            if (e.button === 2) { e.preventDefault(); return; }
            if (x > W || y > H) return;

            // Eraser mode - delete drawing on click
            if (cursorMode === 'eraser' && e.button === 0) {
                if (drawingEngineRef && drawingEngineRef.current) {
                    const hitDrawing = drawingEngineRef.current.hitTest(x, y);
                    if (hitDrawing) {
                        drawingEngineRef.current.removeDrawing(hitDrawing.id);
                        invalidate();
                        return;
                    }
                }
                return;
            }

            // Arrow mode - select drawing on click
            if (cursorMode === 'arrow' && e.button === 0) {
                if (drawingEngineRef && drawingEngineRef.current) {
                    const hitDrawing = drawingEngineRef.current.hitTest(x, y);
                    if (hitDrawing) {
                        drawingEngineRef.current.selectedDrawing = hitDrawing;
                        invalidate();
                        return;
                    } else {
                        drawingEngineRef.current.selectedDrawing = null;
                        invalidate();
                    }
                }
                return;
            }

            if (['trendline', 'rectangle', 'fib', 'ray', 'hline', 'vline', 'text', 'extendedline', 'hray', 'parallelchannel'].includes(activeTool) && e.button === 0) {
                const vp = vpRef.current;
                const candles = candlesRef.current;
                const cw = vp.candleWidth;
                const gap = Math.max(1, Math.round(cw * 0.15));
                const step = cw + gap;
                const rightIdx = candles.length - 1 - Math.floor(vp.offset);
                const { pMin, pRange } = evDeps.current.getPriceRangeMath();
                const price = yToPrice(y, pMin, pRange, H);
                const ci = Math.round(rightIdx - (W - x) / step);
                const clampedCi = Math.max(0, Math.min(candles.length - 1, ci));
                const candleTime = candles[clampedCi]?.time;
                drawingRef.current = { type: activeTool, startX: x, startY: y, p1: price, t1: candleTime };
            } else {
                selectedRef.current = -1;
            }

            md = {
                down: true, sx: e.clientX, sy: e.clientY,
                lx: e.clientX, ly: e.clientY, lt: performance.now(),
                startTO: vpRef.current.offset,
                startScroll: priceScrollRef.current
            };
            invalidate();
        };

        const handleMouseMove = (e) => {
            const { x, y } = getCanvasPos(e);
            mouseRef.current.x = x;
            mouseRef.current.y = y;
            const { W, H } = layout();
            const { invalidate, activeTool } = evDeps.current;

            // Axis Drag
            if (pax.active) {
                const dy = e.clientY - pax.sy;
                zoomPricePivoted(pax.sScale * Math.pow(1.005, -dy), pax.pivotY);
                invalidate(); return;
            }
            if (tax.active) {
                const dx = e.clientX - tax.sx;
                zoomTimePivoted(Math.max(MIN_CW, Math.min(MAX_CW, tax.sCW * Math.pow(1.008, -dx))), tax.pivotX);
                invalidate(); return;
            }

            if (md.down && ['cursor', 'crosshair'].includes(activeTool)) {
                const now = performance.now();
                const dt = Math.max(1, now - md.lt);
                const dx = e.clientX - md.sx;
                const dy = e.clientY - md.sy;

                if (Math.abs(dy) > 2) autoScaleRef.current = false;

                const vp = vpRef.current;
                const stepW = vp.candleWidth + Math.max(1, Math.round(vp.candleWidth * 0.15));
                const newOffset = Math.max(-150, md.startTO + dx / stepW);
                vpRef.current = { ...vp, offset: newOffset };

                const { pRange } = evDeps.current.getPriceRangeMath();
                priceScrollRef.current = md.startScroll + (dy / H) * pRange;

                velocityRef.current = (e.clientX - md.lx) / dt * 16 / stepW;
                priceVelocityRef.current = (e.clientY - md.ly) / dt * 16 * (pRange / H);

                // Disable auto-scroll immediately when user starts dragging away from latest
                // Only keep auto-scroll if offset is very close to 0 (at latest candles)
                if (Math.abs(newOffset) > 0.5) { 
                    autoScroll.current = false; 
                    evDeps.current.setGoLatest(true); 
                }
                
                md.lx = e.clientX; md.ly = e.clientY; md.lt = now;
            } else if (md.down && drawingRef.current) {
                drawingRef.current = { ...drawingRef.current, endX: x, endY: y };
            }
            invalidate();
        };

        const handleMouseUp = (e) => {
            md.down = false;
            mouseRef.current.down = false;
            pax.active = false;
            tax.active = false;
            const { x, y } = getCanvasPos(e);
            const { invalidate, activeTool, commitDrawing } = evDeps.current;
            const { W, H } = layout();

            const vel = velocityRef.current;
            const pVel = priceVelocityRef.current;
            const { pRange } = evDeps.current.getPriceRangeMath();

            if ((Math.abs(vel) > 0.015 || Math.abs(pVel) > pRange * 0.005) && ['cursor', 'crosshair'].includes(activeTool)) {
                let v = vel;
                let vp_y = pVel;
                const step = () => {
                    v *= 0.88;
                    vp_y *= 0.88;
                    if (Math.abs(v) < 0.003 && Math.abs(vp_y) < pRange * 0.001) {
                        velocityRef.current = 0; priceVelocityRef.current = 0; return;
                    }
                    const vp = vpRef.current;
                    const newOffset = Math.max(-150, vp.offset + v);
                    vpRef.current = { ...vp, offset: newOffset };
                    priceScrollRef.current += vp_y;
                    
                    // Don't auto-enable scroll during momentum - let user control it
                    if (newOffset <= -150) {
                        velocityRef.current = 0;
                        priceVelocityRef.current = 0;
                        evDeps.current.invalidate();
                        return;
                    }
                    evDeps.current.invalidate();
                    momentumAnimRef.current = requestAnimationFrame(step);
                };
                momentumAnimRef.current = requestAnimationFrame(step);
            } else {
                velocityRef.current = 0; priceVelocityRef.current = 0;
            }

            if (drawingRef.current && ['trendline', 'rectangle', 'fib', 'ray', 'hline', 'vline', 'text', 'extendedline', 'hray', 'parallelchannel'].includes(activeTool)) {
                const d = drawingRef.current;
                if (Math.abs(x - d.startX) > 5 || Math.abs(y - d.startY) > 5) {
                    const vp = vpRef.current;
                    const candles = candlesRef.current;
                    const cw = vp.candleWidth;
                    const gap = Math.max(1, Math.round(cw * 0.15));
                    const rightIdx = candles.length - 1 - Math.floor(vp.offset);
                    const price2 = yToPrice(y, evDeps.current.getPriceRangeMath().pMin, evDeps.current.getPriceRangeMath().pRange, H);
                    const clampedCi = Math.max(0, Math.min(candles.length - 1, Math.round(rightIdx - (W - x) / (cw + gap))));
                    const time2 = candles[clampedCi]?.time;
                    commitDrawing({ type: d.type, p1: d.p1, t1: d.t1, p2: price2, t2: time2 });
                }
                drawingRef.current = null;
                invalidate();
            }
        };

        const handleMouseLeave = () => {
            mouseRef.current.x = -1; mouseRef.current.y = -1;
            mouseRef.current.down = false; md.down = false;
            drawingRef.current = null;
            evDeps.current.invalidate();
        };

        const handleWheel = (e) => {
            e.preventDefault();
            const { x, y } = getCanvasPos(e);
            const { W, H } = layout();

            const timeFactor = e.deltaY < 0 ? 1.08 : 0.92;
            const priceFactor = e.deltaY < 0 ? 1.10 : 0.90;

            if (e.shiftKey || x >= W) {
                zoomPricePivoted(priceScaleRef.current * priceFactor, Math.min(y, H));
                evDeps.current.invalidate();
                return;
            }

            if (y > H && x < W) { // Time axis wheel
                zoomTimePivoted(Math.max(MIN_CW, Math.min(MAX_CW, targetCWRef.current * timeFactor)), Math.min(x, W));
                evDeps.current.invalidate(); return;
            }

            // Main chart wheel zoom
            zoomTimePivoted(Math.max(MIN_CW, Math.min(MAX_CW, targetCWRef.current * timeFactor)), Math.min(x, W));
            evDeps.current.invalidate();
        };

        /* ── TOUCH EVENTS ── */
        const handleTouchStart = (e) => {
            e.preventDefault();
            touch.fingers = Array.from(e.touches);
            velocityRef.current = 0; priceVelocityRef.current = 0;
            cancelAnimationFrame(momentumAnimRef.current);
            cancelAnimationFrame(goLatestAnimRef.current);

            const { W, H } = layout();
            if (e.touches.length === 1) {
                const t = e.touches[0];
                const { x, y } = getCanvasPos(t);
                // Dispatch to Axis Drags if on axes
                if (x >= W) { pax = { active: true, sy: t.clientY, sScale: priceScaleRef.current, pivotY: Math.min(y, H) }; return; }
                if (y >= H && x < W) { tax = { active: true, sx: t.clientX, sCW: targetCWRef.current, pivotX: Math.min(x, W) }; return; }

                touch.s1 = {
                    cx: t.clientX, cy: t.clientY, lx: t.clientX, ly: t.clientY, lt: performance.now(),
                    startTO: vpRef.current.offset, startScroll: priceScrollRef.current
                };
                touch.s2 = null;
            }
            if (e.touches.length === 2) {
                const [t1, t2] = e.touches;
                const mid = touchMid(t1, t2);
                touch.s2 = {
                    midX: mid.x, midY: mid.y,
                    dist: touchDist(t1, t2),
                    startTO: vpRef.current.offset,
                    startCW: targetCWRef.current,
                    startScale: priceScaleRef.current,
                    startScroll: priceScrollRef.current
                };
                touch.s1 = null; pax.active = false; tax.active = false;
            }
        };

        const handleTouchMove = (e) => {
            e.preventDefault();
            const { W, H } = layout();

            // Axis Drags (1 finger)
            if (pax.active && e.touches.length === 1) {
                const dy = e.touches[0].clientY - pax.sy;
                zoomPricePivoted(pax.sScale * Math.pow(1.005, -dy), pax.pivotY);
                evDeps.current.invalidate(); return;
            }
            if (tax.active && e.touches.length === 1) {
                const dx = e.touches[0].clientX - tax.sx;
                zoomTimePivoted(Math.max(MIN_CW, Math.min(MAX_CW, tax.sCW * Math.pow(1.008, -dx))), tax.pivotX);
                evDeps.current.invalidate(); return;
            }

            // 1-finger PAN
            if (e.touches.length === 1 && touch.s1) {
                const t = e.touches[0];
                const now = performance.now();
                const dt = Math.max(1, now - touch.s1.lt);
                const dx = t.clientX - touch.s1.cx;
                const dy = t.clientY - touch.s1.cy;

                if (Math.abs(dy) > 2) autoScaleRef.current = false;

                const vp = vpRef.current;
                const stepW = vp.candleWidth + Math.max(1, Math.round(vp.candleWidth * 0.15));
                const newOffset = Math.max(-150, touch.s1.startTO + dx / stepW);
                vpRef.current = { ...vp, offset: newOffset };

                const { pRange } = evDeps.current.getPriceRangeMath();
                priceScrollRef.current = touch.s1.startScroll + (dy / H) * pRange;

                velocityRef.current = (t.clientX - touch.s1.lx) / dt * 16 / stepW;
                priceVelocityRef.current = (t.clientY - touch.s1.ly) / dt * 16 * (pRange / H);

                // Disable auto-scroll immediately when user starts dragging away from latest
                if (Math.abs(newOffset) > 0.5) { 
                    autoScroll.current = false; 
                    evDeps.current.setGoLatest(true); 
                }

                const { x, y } = getCanvasPos(t);
                mouseRef.current.x = x; mouseRef.current.y = y;

                touch.s1.lx = t.clientX; touch.s1.ly = t.clientY; touch.s1.lt = now;
                evDeps.current.invalidate();
            }

            // 2-finger PINCH
            if (e.touches.length === 2 && touch.s2) {
                const [t1, t2] = e.touches;
                const dist = touchDist(t1, t2);
                const mid = touchMid(t1, t2);
                const scaleRatio = touch.s2.dist / Math.max(1, dist);

                const { x: midCanvasX, y: midCanvasY } = getCanvasPos({ clientX: mid.x, clientY: mid.y });

                zoomTimePivoted(Math.max(MIN_CW, Math.min(MAX_CW, touch.s2.startCW / scaleRatio)), Math.min(midCanvasX, W));
                zoomPricePivoted(touch.s2.startScale * scaleRatio, Math.min(midCanvasY, H));

                mouseRef.current.x = -1; mouseRef.current.y = -1;
                evDeps.current.invalidate();
            }
        };

        const handleTouchEnd = (e) => {
            e.preventDefault();
            pax.active = false; tax.active = false;
            if (e.touches.length === 0) {
                touch.s1 = null; touch.s2 = null;
                mouseRef.current.x = -1; mouseRef.current.y = -1;

                handleMouseUp({ clientX: 0, clientY: 0 });

                const now = Date.now();
                if (now - lastTap < 300) autoFit();
                lastTap = now;
            } else if (e.touches.length === 1 && touch.s2) {
                const t = e.touches[0];
                touch.s1 = {
                    cx: t.clientX, cy: t.clientY, lx: t.clientX, ly: t.clientY, lt: performance.now(),
                    startTO: vpRef.current.offset, startScroll: priceScrollRef.current
                };
                touch.s2 = null; velocityRef.current = 0; priceVelocityRef.current = 0;
            }
        };

        const handleDblClick = (e) => {
            const { x, y } = getCanvasPos(e);
            const { W } = layout();
            if (x >= W || x < W) {
                // AutoFit when double clicking price axis or main chart
                autoFit();
            }
        };

        cv.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        cv.addEventListener('mouseleave', handleMouseLeave);
        cv.addEventListener('wheel', handleWheel, { passive: false });
        cv.addEventListener('dblclick', handleDblClick);

        cv.addEventListener('touchstart', handleTouchStart, { passive: false });
        cv.addEventListener('touchmove', handleTouchMove, { passive: false });
        cv.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            cv.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            cv.removeEventListener('mouseleave', handleMouseLeave);
            cv.removeEventListener('wheel', handleWheel);
            cv.removeEventListener('dblclick', handleDblClick);

            cv.removeEventListener('touchstart', handleTouchStart);
            cv.removeEventListener('touchmove', handleTouchMove);
            cv.removeEventListener('touchend', handleTouchEnd);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once, attach stable bound functions using evDeps
}
