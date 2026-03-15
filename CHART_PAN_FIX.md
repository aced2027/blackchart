# Chart Pan Fix - Complete Solution

## Problem
When dragging the chart left to view historical data, it would sometimes automatically snap back to the right (latest candles). This made it impossible to study historical price action.

## Root Causes Identified

### 1. **Auto-scroll trigger was too sensitive**
- **Location**: `useChartInteractions.js` line ~200
- **Issue**: `if (newOffset > 5)` meant auto-scroll only disabled after dragging 5+ candles away
- **Fix**: Changed to `if (Math.abs(newOffset) > 0.5)` - now disables immediately when user drags even slightly

### 2. **WebSocket updates were resetting viewport**
- **Location**: `ChartPanel.js` line ~354
- **Issue**: `if (autoScroll.current) vpRef.current = { ...vpRef.current, offset: 0 };`
  - This reset offset to 0 on EVERY new candle when autoScroll was true
  - Even if user had manually panned away, if autoScroll hadn't been disabled yet, it would snap back
- **Fix**: Added additional check: `if (autoScroll.current && Math.abs(vpRef.current.offset) < 1)`
  - Now only resets if BOTH autoScroll is true AND user is already at latest position

### 3. **Momentum animation was re-enabling auto-scroll**
- **Location**: `useChartInteractions.js` line ~230
- **Issue**: When momentum reached edge, it would set `autoScroll.current = true`
- **Fix**: Removed auto-enable logic - now momentum just stops, doesn't re-enable auto-scroll

## Changes Made

### File: `frontend/src/components/useChartInteractions.js`

#### Change 1: Mouse drag (line ~195)
```javascript
// OLD:
if (newOffset > 5) { 
    autoScroll.current = false; 
    evDeps.current.setGoLatest(true); 
}

// NEW:
if (Math.abs(newOffset) > 0.5) { 
    autoScroll.current = false; 
    evDeps.current.setGoLatest(true); 
}
```

#### Change 2: Touch drag (line ~330)
```javascript
// OLD:
if (newOffset > 5) { 
    autoScroll.current = false; 
    evDeps.current.setGoLatest(true); 
}

// NEW:
if (Math.abs(newOffset) > 0.5) { 
    autoScroll.current = false; 
    evDeps.current.setGoLatest(true); 
}
```

#### Change 3: Momentum animation (line ~230)
```javascript
// OLD:
if (newOffset <= -150) {
    autoScroll.current = true;  // ❌ This was re-enabling auto-scroll
    evDeps.current.setGoLatest(false);
    velocityRef.current = 0;
    priceVelocityRef.current = 0;
    evDeps.current.invalidate();
    return;
}

// NEW:
if (newOffset <= -150) {
    velocityRef.current = 0;  // ✅ Just stop, don't re-enable
    priceVelocityRef.current = 0;
    evDeps.current.invalidate();
    return;
}
```

### File: `frontend/src/components/ChartPanel.js`

#### Change: WebSocket candle update (line ~354)
```javascript
// OLD:
candlesRef.current = chartType === 'heikin' ? toHeikinAshi(raw) : raw;
if (autoScroll.current) vpRef.current = { ...vpRef.current, offset: 0 };
updateHeader(candlesRef.current);
invalidate();

// NEW:
candlesRef.current = chartType === 'heikin' ? toHeikinAshi(raw) : raw;
// CRITICAL: Only reset offset if autoScroll is true AND user hasn't manually panned
if (autoScroll.current && Math.abs(vpRef.current.offset) < 1) {
  vpRef.current = { ...vpRef.current, offset: 0 };
}
updateHeader(candlesRef.current);
invalidate();
```

## Expected Behavior After Fix

✅ **Drag LEFT** → Chart pans LEFT (shows older candles) and STAYS there
✅ **Drag RIGHT** → Chart pans RIGHT (shows newer candles) and STAYS there
✅ **Release mouse** → Chart stays exactly where you left it
✅ **New candles arrive** → Chart stays locked in your position (no snap back)
✅ **Click "⟩⟩" button** → Smoothly animates back to latest candles and re-enables auto-scroll
✅ **At latest position** → New candles automatically scroll into view

## How Auto-Scroll Works Now

1. **Initial state**: `autoScroll = true`, chart follows new candles
2. **User drags**: As soon as `|offset| > 0.5`, auto-scroll is disabled
3. **Chart locked**: New candles arrive but chart stays where user left it
4. **Return to live**: User clicks "⟩⟩" button → animates to latest → re-enables auto-scroll

## Testing Checklist

- [ ] Drag chart left → stays in place
- [ ] Drag chart right → stays in place  
- [ ] Wait for new candle → chart doesn't move
- [ ] Click "⟩⟩" button → smoothly returns to latest
- [ ] At latest position → new candles auto-scroll
- [ ] Zoom in/out → position maintained
- [ ] Touch gestures → same behavior as mouse

## Technical Notes

### Offset Coordinate System
- `offset = 0` → Viewing latest candles (rightmost position)
- `offset > 0` → Viewing future (shouldn't happen, clamped)
- `offset < 0` → Viewing historical data (panned left)
- `offset = -150` → Maximum historical view (150 candles back)

### Why 0.5 threshold?
- Allows for tiny floating-point errors without disabling auto-scroll
- Prevents accidental disable from sub-pixel mouse movements
- Still disables immediately on any intentional drag

### Why check `Math.abs(offset) < 1` in WebSocket handler?
- Double-safety: Even if autoScroll flag is true, don't reset if user has panned
- Handles edge case where autoScroll might not have been disabled yet
- Ensures chart never snaps back unexpectedly

## Files Modified
1. `frontend/src/components/useChartInteractions.js` - 3 changes
2. `frontend/src/components/ChartPanel.js` - 1 change

Total: 4 lines changed, massive improvement in UX!
