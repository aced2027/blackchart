/**
 * Drawing Engine - Core drawing functionality for all tools
 * Handles rendering, interaction, and manipulation of drawings
 */

export class DrawingEngine {
  constructor(canvasRef, getChartContext) {
    this.canvasRef = canvasRef;
    this.getChartContext = getChartContext; // Function to get chart state (candles, viewport, etc.)
    this.drawings = [];
    this.activeDrawing = null;
    this.selectedDrawing = null;
    this.hoveredDrawing = null;
  }

  // Convert screen coordinates to chart coordinates
  screenToChart(x, y) {
    const ctx = this.getChartContext();
    if (!ctx) return null;
    
    const { candles, pMin, pRange, chartH, rightIdx, step, fractPx, chartW } = ctx;
    
    // Convert Y to price
    const price = pMin + ((chartH - y) / chartH) * pRange;
    
    // Convert X to candle index
    const slot = Math.round((chartW - x) / step);
    const candleIndex = Math.max(0, Math.min(candles.length - 1, rightIdx - slot + 1));
    
    const candle = candles[candleIndex];
    const time = candle ? candle.time : null;
    
    return { x, y, price, candleIndex, time };
  }

  // Convert chart coordinates to screen coordinates
  chartToScreen(point) {
    const ctx = this.getChartContext();
    if (!ctx) return null;
    
    const { pMin, pRange, chartH, rightIdx, step, fractPx, chartW } = ctx;
    
    // Convert price to Y
    const y = chartH - ((point.price - pMin) / pRange) * chartH;
    
    // Convert candle index to X
    const x = chartW - fractPx - (rightIdx - point.candleIndex + 1) * step;
    
    return { x, y };
  }

  // Add a new drawing
  addDrawing(drawing) {
    drawing.id = `drawing_${Date.now()}_${Math.random()}`;
    drawing.zIndex = this.drawings.length;
    this.drawings.push(drawing);
    return drawing.id;
  }

  // Remove a drawing
  removeDrawing(id) {
    this.drawings = this.drawings.filter(d => d.id !== id);
  }

  // Update a drawing
  updateDrawing(id, updates) {
    const drawing = this.drawings.find(d => d.id === id);
    if (drawing) {
      Object.assign(drawing, updates);
    }
  }

  // Get drawing by ID
  getDrawing(id) {
    return this.drawings.find(d => d.id === id);
  }

  // Clear all drawings
  clearAll() {
    this.drawings = [];
    this.activeDrawing = null;
    this.selectedDrawing = null;
  }

  // Check if point is near a line (for hit detection)
  isPointNearLine(px, py, x1, y1, x2, y2, threshold = 5) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  // Hit test - find drawing at point
  hitTest(x, y) {
    // Check in reverse order (top to bottom)
    for (let i = this.drawings.length - 1; i >= 0; i--) {
      const drawing = this.drawings[i];
      if (!drawing.visible) continue;

      const hit = this.hitTestDrawing(drawing, x, y);
      if (hit) return drawing;
    }
    return null;
  }

  // Hit test for specific drawing
  hitTestDrawing(drawing, x, y) {
    const points = drawing.points.map(p => this.chartToScreen(p)).filter(p => p);
    if (points.length < 2) return false;

    switch (drawing.type) {
      case 'trendline':
      case 'ray':
      case 'extendedline':
      case 'hray':
      case 'hline':
      case 'vline':
        return this.isPointNearLine(x, y, points[0].x, points[0].y, points[1].x, points[1].y);
      
      case 'parallelchannel':
        if (points.length < 3) return false;
        // Check if near either line
        return this.isPointNearLine(x, y, points[0].x, points[0].y, points[1].x, points[1].y) ||
               this.isPointNearLine(x, y, points[0].x, points[0].y, points[2].x, points[2].y);
      
      case 'rectangle':
        const [p1, p2] = points;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
      
      case 'fib':
        // Check if near any fib level line
        const [start, end] = points;
        const levels = drawing.settings?.levels || [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        for (const level of levels) {
          const ly = start.y + (end.y - start.y) * level;
          if (Math.abs(y - ly) < 5 && x >= Math.min(start.x, end.x) && x <= Math.max(start.x, end.x)) {
            return true;
          }
        }
        return false;
      
      default:
        return false;
    }
  }

  // Render all drawings
  render(ctx, dpr) {
    const chartCtx = this.getChartContext();
    if (!chartCtx) return;

    ctx.save();
    
    // Render drawings in z-index order
    const sortedDrawings = [...this.drawings].sort((a, b) => a.zIndex - b.zIndex);
    
    for (const drawing of sortedDrawings) {
      if (!drawing.visible) continue;
      
      const isSelected = this.selectedDrawing?.id === drawing.id;
      const isHovered = this.hoveredDrawing?.id === drawing.id;
      
      this.renderDrawing(ctx, drawing, isSelected, isHovered);
    }

    // Render active drawing being created
    if (this.activeDrawing) {
      this.renderDrawing(ctx, this.activeDrawing, false, false, true);
    }

    ctx.restore();
  }

  // Render individual drawing
  renderDrawing(ctx, drawing, isSelected, isHovered, isActive = false) {
    const points = drawing.points.map(p => this.chartToScreen(p)).filter(p => p);
    if (points.length === 0) return;

    const style = drawing.style || {};
    const color = style.color || '#2962ff';
    const lineWidth = (style.lineWidth || 2) * (isSelected ? 1.5 : 1);
    const alpha = isActive ? 0.6 : isHovered ? 0.8 : 1;

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(style.lineStyle === 'dashed' ? [5, 5] : style.lineStyle === 'dotted' ? [2, 2] : []);

    switch (drawing.type) {
      case 'trendline':
        this.renderTrendLine(ctx, points, drawing, isSelected);
        break;
      case 'ray':
        this.renderRay(ctx, points, drawing, isSelected);
        break;
      case 'extendedline':
        this.renderExtendedLine(ctx, points, drawing, isSelected);
        break;
      case 'hray':
        this.renderHorizontalRay(ctx, points, drawing, isSelected);
        break;
      case 'parallelchannel':
        this.renderParallelChannel(ctx, points, drawing, isSelected);
        break;
      case 'hline':
        this.renderHLine(ctx, points, drawing, isSelected);
        break;
      case 'vline':
        this.renderVLine(ctx, points, drawing, isSelected);
        break;
      case 'rectangle':
        this.renderRectangle(ctx, points, drawing, isSelected);
        break;
      case 'fib':
        this.renderFibonacci(ctx, points, drawing, isSelected);
        break;
      case 'text':
        this.renderText(ctx, points, drawing, isSelected);
        break;
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Render trend line
  renderTrendLine(ctx, points, drawing, isSelected) {
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();

    // Draw handles if selected
    if (isSelected) {
      points.forEach(p => {
        ctx.fillStyle = '#2962ff';
        ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
      });
    }
  }

  // Render ray (extends infinitely in one direction)
  renderRay(ctx, points, drawing, isSelected) {
    if (points.length < 2) return;
    
    const chartCtx = this.getChartContext();
    const { chartW, chartH } = chartCtx;
    
    const dx = points[1].x - points[0].x;
    const dy = points[1].y - points[0].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) return;
    
    // Extend to edge of chart
    const maxLen = Math.max(chartW, chartH) * 2;
    const endX = points[0].x + (dx / len) * maxLen;
    const endY = points[0].y + (dy / len) * maxLen;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    if (isSelected) {
      ctx.fillStyle = '#2962ff';
      ctx.fillRect(points[0].x - 4, points[0].y - 4, 8, 8);
    }
  }

  // Render horizontal line
  renderHLine(ctx, points, drawing, isSelected) {
    if (points.length < 1) return;
    
    const chartCtx = this.getChartContext();
    const { chartW } = chartCtx;
    
    const y = points[0].y;
    
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartW, y);
    ctx.stroke();

    // Price label
    if (drawing.settings?.showPrice !== false) {
      const price = drawing.points[0].price.toFixed(5);
      ctx.fillStyle = drawing.style?.color || '#2962ff';
      ctx.fillRect(chartW - 60, y - 10, 58, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(price, chartW - 4, y + 4);
    }

    if (isSelected) {
      ctx.fillStyle = '#2962ff';
      ctx.fillRect(chartW / 2 - 4, y - 4, 8, 8);
    }
  }

  // Render vertical line
  renderVLine(ctx, points, drawing, isSelected) {
    if (points.length < 1) return;
    
    const chartCtx = this.getChartContext();
    const { chartH } = chartCtx;
    
    const x = points[0].x;
    
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, chartH);
    ctx.stroke();

    if (isSelected) {
      ctx.fillStyle = '#2962ff';
      ctx.fillRect(x - 4, chartH / 2 - 4, 8, 8);
    }
  }

  // Render rectangle
  renderRectangle(ctx, points, drawing, isSelected) {
    if (points.length < 2) return;
    
    const x1 = Math.min(points[0].x, points[1].x);
    const y1 = Math.min(points[0].y, points[1].y);
    const w = Math.abs(points[1].x - points[0].x);
    const h = Math.abs(points[1].y - points[0].y);
    
    // Fill
    if (drawing.style?.fillColor) {
      ctx.fillStyle = drawing.style.fillColor;
      ctx.fillRect(x1, y1, w, h);
    }
    
    // Border
    ctx.strokeRect(x1, y1, w, h);

    // Handles
    if (isSelected) {
      ctx.fillStyle = '#2962ff';
      [[x1, y1], [x1 + w, y1], [x1, y1 + h], [x1 + w, y1 + h]].forEach(([x, y]) => {
        ctx.fillRect(x - 4, y - 4, 8, 8);
      });
    }
  }

  // Render Fibonacci retracement
  renderFibonacci(ctx, points, drawing, isSelected) {
    if (points.length < 2) return;
    
    const chartCtx = this.getChartContext();
    const { chartW } = chartCtx;
    
    const levels = drawing.settings?.levels || [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const labels = ['0.0', '0.236', '0.382', '0.5', '0.618', '0.786', '1.0'];
    
    const startY = points[0].y;
    const endY = points[1].y;
    const range = endY - startY;
    
    levels.forEach((level, i) => {
      const y = startY + range * level;
      
      // Alternate colors
      const color = i % 2 === 0 ? 'rgba(41,98,255,0.1)' : 'rgba(41,98,255,0.05)';
      const nextY = i < levels.length - 1 ? startY + range * levels[i + 1] : y;
      
      // Fill zone
      ctx.fillStyle = color;
      ctx.fillRect(0, y, chartW, nextY - y);
      
      // Line
      ctx.strokeStyle = drawing.style?.color || '#2962ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label
      const price = drawing.points[0].price + (drawing.points[1].price - drawing.points[0].price) * level;
      ctx.fillStyle = drawing.style?.color || '#2962ff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${labels[i]} (${price.toFixed(5)})`, 8, y - 4);
    });

    // Handles
    if (isSelected) {
      ctx.fillStyle = '#2962ff';
      points.forEach(p => {
        ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
      });
    }
  }

  // Render text annotation
  renderText(ctx, points, drawing, isSelected) {
    if (points.length < 1) return;
    
    const text = drawing.settings?.text || 'Text';
    const fontSize = drawing.style?.fontSize || 14;
    const fontFamily = drawing.style?.fontFamily || 'Arial';
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = drawing.style?.color || '#2962ff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Background
    const metrics = ctx.measureText(text);
    const padding = 4;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(
      points[0].x - padding,
      points[0].y - padding,
      metrics.width + padding * 2,
      fontSize + padding * 2
    );
    
    // Text
    ctx.fillStyle = drawing.style?.color || '#2962ff';
    ctx.fillText(text, points[0].x, points[0].y);

    // Handle
    if (isSelected) {
      ctx.fillStyle = '#2962ff';
      ctx.fillRect(points[0].x - 4, points[0].y - 4, 8, 8);
    }
  }

  // Render extended line (extends both directions infinitely)
  renderExtendedLine(ctx, points, drawing, isSelected) {
    if (points.length < 2) return;
    
    const chartCtx = this.getChartContext();
    const { chartW, chartH } = chartCtx;
    
    const dx = points[1].x - points[0].x;
    const dy = points[1].y - points[0].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) return;
    
    // Extend to both edges of chart
    const maxLen = Math.max(chartW, chartH) * 2;
    const startX = points[0].x - (dx / len) * maxLen;
    const startY = points[0].y - (dy / len) * maxLen;
    const endX = points[0].x + (dx / len) * maxLen;
    const endY = points[0].y + (dy / len) * maxLen;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    if (isSelected) {
      ctx.fillStyle = '#2962ff';
      points.forEach(p => {
        ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
      });
    }
  }

  // Render horizontal ray (extends right from point)
  renderHorizontalRay(ctx, points, drawing, isSelected) {
    if (points.length < 1) return;
    
    const chartCtx = this.getChartContext();
    const { chartW } = chartCtx;
    
    const y = points[0].y;
    const x = points[0].x;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(chartW, y);
    ctx.stroke();

    // Origin point
    ctx.fillStyle = '#2962ff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected) {
      ctx.fillRect(x - 4, y - 4, 8, 8);
    }
  }

  // Render parallel channel (3 points: 2 for main line, 1 for width)
  renderParallelChannel(ctx, points, drawing, isSelected) {
    if (points.length < 3) return;
    
    const chartCtx = this.getChartContext();
    const { chartW, chartH } = chartCtx;
    
    // Main line (points 0 and 1)
    const dx = points[1].x - points[0].x;
    const dy = points[1].y - points[0].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) return;
    
    // Calculate perpendicular distance from point 2 to main line
    const perpDist = Math.abs((dy * points[2].x - dx * points[2].y + points[1].x * points[0].y - points[1].y * points[0].x) / len);
    
    // Perpendicular vector (normalized)
    const perpX = -dy / len;
    const perpY = dx / len;
    
    // Determine which side point 2 is on
    const cross = (points[1].x - points[0].x) * (points[2].y - points[0].y) - (points[1].y - points[0].y) * (points[2].x - points[0].x);
    const side = cross > 0 ? 1 : -1;
    
    // Extend lines to chart edges
    const maxLen = Math.max(chartW, chartH) * 2;
    const dirX = dx / len;
    const dirY = dy / len;
    
    // Main line
    const main1X = points[0].x - dirX * maxLen;
    const main1Y = points[0].y - dirY * maxLen;
    const main2X = points[0].x + dirX * maxLen;
    const main2Y = points[0].y + dirY * maxLen;
    
    // Parallel line
    const para1X = main1X + perpX * perpDist * side;
    const para1Y = main1Y + perpY * perpDist * side;
    const para2X = main2X + perpX * perpDist * side;
    const para2Y = main2Y + perpY * perpDist * side;
    
    // Fill channel
    ctx.fillStyle = drawing.style?.fillColor || 'rgba(41,98,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(main1X, main1Y);
    ctx.lineTo(main2X, main2Y);
    ctx.lineTo(para2X, para2Y);
    ctx.lineTo(para1X, para1Y);
    ctx.closePath();
    ctx.fill();
    
    // Draw lines
    ctx.beginPath();
    ctx.moveTo(main1X, main1Y);
    ctx.lineTo(main2X, main2Y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(para1X, para1Y);
    ctx.lineTo(para2X, para2Y);
    ctx.stroke();

    // Handles
    if (isSelected) {
      ctx.fillStyle = '#2962ff';
      points.forEach(p => {
        ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
      });
    }
  }
}

export default DrawingEngine;
