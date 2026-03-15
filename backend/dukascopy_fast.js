#!/usr/bin/env node
/**
 * ⚡ FAST Dukascopy Tick Data Downloader
 * Downloads tick data in parallel (concurrent hours) for maximum speed.
 *
 * Usage:
 *   node dukascopy_fast.js
 *
 * Install deps first:
 *   npm install dukascopy-node csv-writer readline
 */

const { getHistoricalRates } = require("dukascopy-node");
const { createObjectCsvWriter } = require("csv-writer");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

// ─── CONFIG ────────────────────────────────────────────────────────────────
const CONCURRENT_HOURS = 24;   // How many hours to fetch in parallel (tune 8–48)
const OUTPUT_DIR = "./tick_data";

// ───────────────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (q, def) => new Promise(res =>
  rl.question(def !== undefined ? `${q} (default: ${def}): ` : `${q}: `, ans =>
    res(ans.trim() || (def !== undefined ? String(def) : ""))
  )
);

function pad(n) { return String(n).padStart(2, "0"); }

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month is 1-based
}

function buildHourSlots(year, month) {
  const days = getDaysInMonth(year, month);
  const slots = [];
  
  for (let d = 1; d <= days; d++) {
    for (let h = 0; h < 24; h++) {
      const from = new Date(Date.UTC(year, month - 1, d, h, 0, 0));
      const to   = new Date(Date.UTC(year, month - 1, d, h, 59, 59, 999));
      
      // Skip future dates
      if (from > new Date()) continue;
      
      slots.push({ 
        from, 
        to, 
        label: `${year}-${pad(month)}-${pad(d)} ${pad(h)}:00` 
      });
    }
  }
  
  return slots;
}

async function fetchSlot(symbol, slot, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const ticks = await getHistoricalRates({
        instrument: symbol.toLowerCase(),
        dates: { from: slot.from, to: slot.to },
        timeframe: "tick",
        priceType: "bid",
        utcOffset: 0,
        volumes: true,
      });
      
      return ticks || [];
    } catch (e) {
      if (attempt === retries) return [];   // skip on final failure
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  return [];
}

async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  let i = 0;
  
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function downloadMonth(symbol, year, month) {
  const slots = buildHourSlots(year, month);
  
  console.log(`\n   ⚡ Fetching ${slots.length} hour-slots with ${CONCURRENT_HOURS} parallel workers...`);
  
  let done = 0;
  const tasks = slots.map(slot => async () => {
    const ticks = await fetchSlot(symbol, slot);
    done++;
    process.stdout.write(`\r   ⏳ Progress: ${done}/${slots.length} hours (${Math.round(done/slots.length*100)}%)   `);
    return ticks;
  });
  
  const allChunks = await runWithConcurrency(tasks, CONCURRENT_HOURS);
  process.stdout.write("\n");
  
  const allTicks = allChunks.flat();
  return allTicks;
}

async function main() {
  console.log("=".repeat(72));
  console.log("  ⚡ FAST Dukascopy Tick Data Downloader (Parallel Edition)");
  console.log("=".repeat(72));
  
  const symbol    = (await ask("Enter symbol", "EURUSD")).toUpperCase();
  
  console.log("\nStart date:");
  const startYear = parseInt(await ask("  Year (e.g., 2025)", 2025));
  const startMonth = parseInt(await ask("  Month (1-12)", 1));
  
  console.log("\nEnd date:");
  const endYear   = parseInt(await ask("  Year", startYear));
  const endMonth  = parseInt(await ask("  Month (1-12)", startMonth));
  
  rl.close();
  
  // Build month list
  const months = [];
  let y = startYear, m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push({ year: y, month: m });
    m++; if (m > 12) { m = 1; y++; }
  }
  
  const MONTH_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
  
  console.log("\n" + "=".repeat(72));
  console.log("📋 DOWNLOAD PLAN");
  console.log("=".repeat(72));
  console.log(`💱 Symbol : ${symbol}`);
  console.log(`📅 Period : ${startYear}-${pad(startMonth)} → ${endYear}-${pad(endMonth)}`);
  console.log(`📊 Months : ${months.length}`);
  console.log(`⚡ Workers: ${CONCURRENT_HOURS} parallel`);
  
  months.forEach((m2, i) => console.log(`   ${i+1}. ${MONTH_NAMES[m2.month]} ${m2.year}`));
  
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  console.log("\n" + "=".repeat(72));
  console.log("🚀 STARTING DOWNLOADS");
  console.log("=".repeat(72));
  
  for (let i = 0; i < months.length; i++) {
    const { year, month } = months[i];
    const label = `${MONTH_NAMES[month]} ${year}`;
    
    console.log(`\n[${i+1}/${months.length}] 📥 DOWNLOADING ${label}...`);
    
    const ticks = await downloadMonth(symbol, year, month);
    
    if (ticks.length === 0) {
      console.log(`   ⚠️  No ticks returned for ${label} (market may be closed or no data).`);
      continue;
    }
    
    // Save CSV
    const filename = path.join(OUTPUT_DIR, `${symbol}_${year}_${pad(month)}_ticks.csv`);
    const csvWriter = createObjectCsvWriter({
      path: filename,
      header: [
        { id: "timestamp", title: "Timestamp" },
        { id: "bid",       title: "Bid" },
        { id: "ask",       title: "Ask" },
        { id: "bidVolume", title: "BidVolume" },
        { id: "askVolume", title: "AskVolume" },
      ],
    });
    
    const rows = ticks.map(t => ({
      timestamp: new Date(t.timestamp).toISOString(),
      bid:       t.bid,
      ask:       t.ask,
      bidVolume: t.bidVolume ?? "",
      askVolume: t.askVolume ?? "",
    }));
    
    await csvWriter.writeRecords(rows);
    
    const sizeMB = (fs.statSync(filename).size / 1024 / 1024).toFixed(2);
    console.log(`   ✅ Saved ${rows.length.toLocaleString()} ticks → ${filename} (${sizeMB} MB)`);
  }
  
  console.log("\n" + "=".repeat(72));
  console.log("✅ ALL DONE! Files saved to: " + path.resolve(OUTPUT_DIR));
  console.log("=".repeat(72));
}

main().catch(e => { 
  console.error("Fatal error:", e); 
  process.exit(1); 
});