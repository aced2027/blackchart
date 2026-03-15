# Drawing Tools Usage Guide

## Quick Start

### 1. Select a Tool
Click any tool icon in the left sidebar:
- **Cursor** (V) - Default selection mode
- **Crosshair** (Alt+C) - Crosshair cursor
- **Trendline** (Alt+T) - Draw trend lines
- **Ray** (Alt+R) - Draw rays
- **Horizontal Line** (Alt+H) - Draw horizontal price levels
- **Vertical Line** (Alt+V) - Draw vertical time markers
- **Rectangle** - Draw rectangular zones
- **Fibonacci** (Alt+F) - Draw Fibonacci retracement levels

### 2. Draw on Chart

#### Trendline / Ray / Rectangle / Fibonacci
1. Click tool in sidebar
2. Click on chart for first point
3. Drag to second point
4. Release mouse to complete

#### Horizontal Line
1. Click tool in sidebar
2. Click at desired price level
3. Line extends across entire chart

#### Vertical Line
1. Click tool in sidebar
2. Click at desired time
3. Line extends vertically

### 3. Edit Drawings

#### Select
- Click on any drawing to select it
- Selected drawings show handles (small squares)

#### Move
- Click and drag selected drawing
- Handles allow resizing

#### Delete
- Select drawing
- Press **Delete** or **Backspace** key

#### Clear All
- Right-click on chart
- Select "Remove All Drawings"

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| V | Cursor tool |
| Alt+C | Crosshair |
| Alt+T | Trendline |
| Alt+R | Ray |
| Alt+H | Horizontal line |
| Alt+V | Vertical line |
| Alt+F | Fibonacci |
| E | Eraser |
| Delete | Remove selected drawing |
| Escape | Deselect / Cancel |

## Tool Details

### Trendline
- **Purpose**: Identify trends and support/resistance
- **How to use**: Connect two price points
- **Features**: Extends across chart, shows slope

### Ray
- **Purpose**: Project trend into future
- **How to use**: Set origin and direction
- **Features**: Extends infinitely in one direction

### Horizontal Line
- **Purpose**: Mark key price levels
- **How to use**: Click at price level
- **Features**: Shows price label on right axis

### Vertical Line
- **Purpose**: Mark important time events
- **How to use**: Click at time point
- **Features**: Extends full chart height

### Rectangle
- **Purpose**: Highlight price zones or consolidation areas
- **How to use**: Drag from corner to corner
- **Features**: Semi-transparent fill, adjustable

### Fibonacci Retracement
- **Purpose**: Identify potential support/resistance levels
- **How to use**: Drag from swing low to swing high (or vice versa)
- **Features**: Shows 0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100% levels
- **Colors**: Each level has distinct color for easy identification

## Advanced Features (Coming Soon)

### Channels
- Parallel Channel
- Regression Trend
- Flat Top/Bottom
- Disjoint Channel

### Pitchforks
- Standard Pitchfork
- Schiff Pitchfork
- Modified Schiff
- Inside Pitchfork

### Gann Tools
- Gann Box
- Gann Fan
- Gann Square

### Fibonacci Tools
- Fibonacci Extension
- Fibonacci Fan
- Fibonacci Arc
- Fibonacci Time Zone
- Fibonacci Spiral

### Patterns
- XABCD Pattern
- ABCD Pattern
- Triangle Pattern
- 3-Drives Pattern
- Head & Shoulders
- Elliott Wave (5 variants)
- Cyclic Lines

### Forecasting
- Long Position
- Short Position
- VWAP
- Fixed Range VWAP
- Volume Profile
- Date/Price Range
- Bars Pattern
- Ghost Feed

### Shapes
- Brush
- Highlighter
- Arrow (4 directions)
- Rotated Rectangle
- Ellipse
- Triangle
- Arc
- Polyline
- Curve
- Double Curve

### Annotations
- Text
- Note
- Anchored Text
- Price Label
- Callout
- Balloon
- Signpost
- URL Link
- Image Upload

### Icons & Stickers
- Full emoji library
- Financial icons
- Custom markers

## Tips & Tricks

### Precision Drawing
- Zoom in for more precise placement
- Use grid lines as reference
- Snap to candle high/low (coming soon)

### Organization
- Use different colors for different strategies
- Group related drawings (coming soon)
- Save drawing templates (coming soon)

### Performance
- Drawings are rendered efficiently using canvas
- No performance impact with many drawings
- Drawings persist across timeframe changes

### Workflow
1. Analyze chart with cursor tool
2. Mark key levels with horizontal lines
3. Draw trendlines to identify trends
4. Add Fibonacci for potential reversal zones
5. Use rectangles to highlight consolidation
6. Annotate with text for notes

## Troubleshooting

### Drawing not appearing
- Make sure tool is selected (icon highlighted)
- Check if drawing is outside visible area
- Try zooming out

### Can't select drawing
- Switch to Cursor tool (V)
- Click directly on the line/shape
- Drawings may be behind other elements

### Drawing disappeared
- Check if accidentally deleted
- Scroll/zoom to find it
- Use "Reset Chart" if needed

### Performance issues
- Clear old drawings you don't need
- Use "Remove All Drawings" to start fresh
- Restart browser if needed

## Best Practices

1. **Start Simple**: Master basic tools before advanced ones
2. **Stay Organized**: Delete old drawings regularly
3. **Use Colors**: Different colors for different purposes
4. **Save Work**: Export drawings before closing (coming soon)
5. **Practice**: The more you use tools, the faster you'll be

## Support

For issues or feature requests:
- Check the implementation plan: `DRAWING_TOOLS_IMPLEMENTATION_PLAN.md`
- Review integration status: `DRAWING_TOOLS_INTEGRATION_STATUS.md`
- Test in development mode to see console logs

---

**Note**: This is a living document. As more tools are implemented, this guide will be updated with detailed instructions for each tool.
