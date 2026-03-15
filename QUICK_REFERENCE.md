# Quick Reference Card

## 🚀 Start the Application

```bash
# Terminal 1 - Backend
cd blackchart/backend
python main.py

# Terminal 2 - Frontend
cd blackchart/frontend
npm start
```

## 🎨 Drawing Tools

### Basic Tools (Working Now)
| Tool | Shortcut | How to Use |
|------|----------|------------|
| Trendline | Alt+T | Click → Drag → Release |
| Ray | Alt+R | Click → Drag → Release |
| H-Line | Alt+H | Click at price level |
| V-Line | Alt+V | Click at time |
| Rectangle | - | Click → Drag → Release |
| Fibonacci | Alt+F | Click → Drag → Release |
| Text | - | Click to place |

### Actions
| Action | Shortcut |
|--------|----------|
| Select | Click on drawing |
| Delete | Delete or Backspace |
| Deselect | Escape |
| Clear All | Right-click → Remove All |

## 📊 Data Downloads

### Quick Commands
```bash
cd blackchart/backend

# Download 2026 (3 months)
python download_2026_only.py

# Download specific year
python download_single_year.py 2024

# Check status
python check_organized_status.py
```

## 📁 File Structure

```
blackchart/
├── frontend/
│   └── src/
│       └── components/
│           ├── ChartPanel.js          ← Main chart
│           ├── DrawingEngine.js       ← Drawing logic
│           ├── Sidebar.js             ← Tool selector
│           └── useChartInteractions.js ← Mouse events
├── backend/
│   ├── main.py                        ← Start server
│   ├── download_*.py                  ← Download scripts
│   ├── check_*.py                     ← Status scripts
│   └── data/
│       └── ticks/
│           └── YYYY/                  ← Tick data by year
└── docs/
    ├── DRAWING_TOOLS_IMPLEMENTATION_PLAN.md
    ├── DRAWING_TOOLS_INTEGRATION_STATUS.md
    ├── DRAWING_TOOLS_USAGE_GUIDE.md
    ├── NEXT_STEPS.md
    └── SESSION_SUMMARY.md
```

## 🔧 Key Functions

### ChartPanel.js
```javascript
// Get chart context for DrawingEngine
getChartContext()

// Add new drawing
commitDrawing(drawing)

// Invalidate to trigger redraw
invalidate()
```

### DrawingEngine.js
```javascript
// Add drawing
drawingEngine.addDrawing(drawing)

// Remove drawing
drawingEngine.removeDrawing(id)

// Clear all
drawingEngine.clearAll()

// Render all drawings
drawingEngine.render(ctx, dpr)
```

## 🐛 Troubleshooting

### Drawing not appearing?
1. Check tool is selected (icon highlighted)
2. Try zooming out
3. Check console for errors

### Backend not connecting?
1. Check backend is running (port 8000)
2. Check WebSocket connection
3. Restart backend

### Downloads failing?
1. Normal for Dukascopy (timeouts)
2. Script auto-retries
3. Be patient, will complete

## 📚 Documentation

| File | Purpose |
|------|---------|
| `DRAWING_TOOLS_IMPLEMENTATION_PLAN.md` | Full roadmap |
| `DRAWING_TOOLS_INTEGRATION_STATUS.md` | Current status |
| `DRAWING_TOOLS_USAGE_GUIDE.md` | User guide |
| `NEXT_STEPS.md` | TODO list |
| `SESSION_SUMMARY.md` | What was done |
| `QUICK_REFERENCE.md` | This file |

## 🎯 Current Status

### ✅ Working
- 7 drawing tools functional
- Mouse interaction complete
- Selection and deletion working
- Context menu integrated

### 🔄 In Progress
- Testing all tools
- Data downloads (0/75 months)

### 📋 TODO
- 50+ more drawing tools
- Drawing settings panel
- localStorage persistence
- Undo/redo system

## 💡 Quick Tips

1. **Zoom**: Mouse wheel on chart
2. **Pan**: Click and drag
3. **Auto-fit**: Double-click chart
4. **Latest**: Click "LIVE" badge
5. **Precision**: Zoom in before drawing

## 🔗 Quick Links

### Code
- ChartPanel: `frontend/src/components/ChartPanel.js`
- DrawingEngine: `frontend/src/components/DrawingEngine.js`
- Sidebar: `frontend/src/components/Sidebar.js`

### Data
- Downloads: `backend/download_*.py`
- Status: `backend/check_*.py`
- Data: `backend/data/ticks/YYYY/`

### Docs
- All docs in root: `blackchart/*.md`

---

**Last Updated**: March 14, 2026
**Version**: 1.0
**Status**: DrawingEngine integrated ✅
