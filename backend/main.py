from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
from datetime import datetime
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from api.routes import router
from websocket.manager import ConnectionManager
from data_collector.candle_generator import CandleGenerator

manager = ConnectionManager()
candle_gen = CandleGenerator()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await candle_gen.start()
        print("✓ Candle generator started")
    except Exception as e:
        print(f"✗ Failed to start candle generator: {e}")
    yield
    # Shutdown
    try:
        await candle_gen.stop()
        print("✓ Candle generator stopped")
    except Exception as e:
        print(f"✗ Error stopping candle generator: {e}")

app = FastAPI(title="MiniView API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.websocket("/ws/prices/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await manager.connect(websocket, symbol)
    print(f"✓ WebSocket connected: {symbol}")
    try:
        while True:
            # Check if market is open (not weekend)
            now = datetime.utcnow()
            if now.weekday() in [5, 6]:
                # Send market closed message
                await websocket.send_json({
                    "status": "market_closed",
                    "message": "Forex market is closed on weekends",
                    "reopens": "Monday 00:00 UTC"
                })
                await asyncio.sleep(60)  # Check every minute
                continue
            
            # Keep connection alive and send updates
            candle = await candle_gen.get_latest_candle(symbol)
            if candle:
                await websocket.send_json(candle)
                print(f"→ Sent candle: {candle['close']:.5f}")
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print(f"✗ WebSocket disconnected: {symbol}")
        manager.disconnect(websocket, symbol)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, symbol)

@app.get("/")
async def root():
    return {
        "service": "MiniView API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "candles": "/api/candles/{symbol}",
            "symbols": "/api/symbols",
            "indicators": "/api/indicators/{symbol}",
            "websocket": "/ws/prices/{symbol}"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
