-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Candles table
CREATE TABLE IF NOT EXISTS candles (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    timeframe VARCHAR(5) NOT NULL,
    open DECIMAL(12, 5) NOT NULL,
    high DECIMAL(12, 5) NOT NULL,
    low DECIMAL(12, 5) NOT NULL,
    close DECIMAL(12, 5) NOT NULL,
    volume INTEGER DEFAULT 0
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('candles', 'time', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_candles_symbol_time ON candles (symbol, time DESC);
CREATE INDEX IF NOT EXISTS idx_candles_timeframe ON candles (timeframe, time DESC);

-- Ticks table (raw tick data)
CREATE TABLE IF NOT EXISTS ticks (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    bid DECIMAL(12, 5) NOT NULL,
    ask DECIMAL(12, 5) NOT NULL,
    spread DECIMAL(8, 5)
);

SELECT create_hypertable('ticks', 'time', if_not_exists => TRUE);

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parameters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backtest results
CREATE TABLE IF NOT EXISTS backtest_results (
    id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES strategies(id),
    symbol VARCHAR(10),
    timeframe VARCHAR(5),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    total_trades INTEGER,
    win_rate DECIMAL(5, 2),
    profit_loss DECIMAL(12, 2),
    max_drawdown DECIMAL(12, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES strategies(id),
    symbol VARCHAR(10),
    entry_time TIMESTAMPTZ,
    exit_time TIMESTAMPTZ,
    entry_price DECIMAL(12, 5),
    exit_price DECIMAL(12, 5),
    quantity DECIMAL(12, 2),
    profit_loss DECIMAL(12, 2),
    side VARCHAR(4) CHECK (side IN ('BUY', 'SELL'))
);
