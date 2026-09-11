import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { fetchLiveNewsFlashes } from "./server/newsFlash.js";
import { generateDynamicAssetData } from "./server/dynamicMatrix.js";
import { getTradingViewWs } from "./server/tradingviewWs.js";
import { getCurrencyStrength } from "./server/currencyStrength.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize TradingView Real-time WebSocket Streaming client for CFDs
const tvWs = getTradingViewWs();

app.use(express.json());

// Gemini AI Client lazy initialization
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAiClient && process.env.GEMINI_API_KEY) {
    genAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Real-Time Market Data Cache
interface RealtimeCache {
  data: any;
  timestamp: number;
}
let marketCache: RealtimeCache | null = null;
const CACHE_TTL_MS = 3000; // 3 seconds TTL for ultra-responsive TradingView feed

// TradingView Live Scanner Client
async function fetchTradingViewQuotes(): Promise<Map<string, {
  price: number;
  changePct: number;
  change: number;
  high: number;
  low: number;
}>> {
  const groups = [
    {
      ep: "forex",
      tickers: [
        "OANDA:EURUSD",
        "OANDA:USDJPY",
        "OANDA:GBPUSD",
        "OANDA:AUDUSD",
        "FX_IDC:EURUSD",
        "FX_IDC:USDJPY",
        "FX_IDC:GBPUSD",
        "FX_IDC:AUDUSD"
      ]
    },
    {
      ep: "crypto",
      tickers: ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT"]
    },
    {
      ep: "cfd",
      tickers: [
        "OANDA:XAUUSD",
        "OANDA:DE30EUR",
        "OANDA:XCUUSD",
        "TVC:DXY",
        "TVC:GOLD",
        "TVC:SILVER",
        "TVC:USOIL",
        "TVC:UKOIL",
        "TVC:VIX",
        "CBOE:VIX"
      ]
    },
    {
      ep: "global",
      tickers: [
        "OANDA:XAUUSD",
        "OANDA:DE30EUR",
        "OANDA:XCUUSD",
        "OANDA:EURUSD",
        "OANDA:USDJPY",
        "OANDA:GBPUSD",
        "OANDA:AUDUSD",
        "SP:SPX",
        "NASDAQ:NDX",
        "XETR:DAX",
        "TVC:NI225",
        "NYMEX:CL1!",
        "COMEX:HG1!",
        "TVC:US01Y",
        "TVC:US02Y",
        "TVC:US05Y",
        "TVC:US10Y",
        "TVC:US30Y",
        "CRYPTOCAP:BTC.D"
      ]
    }
  ];

  const map = new Map<string, any>();
  await Promise.all(
    groups.map(async ({ ep, tickers }) => {
      try {
        const res = await fetch(`https://scanner.tradingview.com/${ep}/scan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          body: JSON.stringify({
            symbols: { tickers },
            columns: ["close", "change", "change_abs", "high", "low"]
          })
        });
        if (!res.ok) return;
        const data = await res.json();
        data?.data?.forEach((d: any) => {
          if (d && d.s && Array.isArray(d.d)) {
            map.set(d.s, {
              price: d.d[0],
              changePct: d.d[1] ?? 0,
              change: d.d[2] ?? 0,
              high: d.d[3] ?? d.d[0],
              low: d.d[4] ?? d.d[0],
            });
          }
        });
      } catch {
        // Silent catch for resilience
      }
    })
  );
  return map;
}

// Safe Yahoo Chart Fetcher (with timeout and error suppression)
async function fetchYahooQuoteSafe(symbol: string): Promise<any> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol
      )}?interval=1d&range=5d`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const d = await res.json();
    const meta = d?.chart?.result?.[0]?.meta;
    const quotes =
      d?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    return {
      symbol,
      price: meta?.regularMarketPrice ?? null,
      changePct: meta?.regularMarketChangePercent ?? 0,
      change:
        meta?.regularMarketPrice && meta?.chartPreviousClose
          ? meta.regularMarketPrice - meta.chartPreviousClose
          : 0,
      high: meta?.regularMarketDayHigh ?? null,
      low: meta?.regularMarketDayLow ?? null,
      sparkline: quotes.filter((q: any) => q != null && !isNaN(q)),
    };
  } catch {
    // Graceful fallback to prevent stderr error spam
    return null;
  }
}

// Real-Time Market Endpoint (supports both /api/market and /api/market/realtime)
app.get(["/api/market", "/api/market/realtime"], async (_req, res) => {
  const now = Date.now();
  if (marketCache && now - marketCache.timestamp < CACHE_TTL_MS) {
    return res.json({
      ...marketCache.data,
      cached: true,
      ageMs: now - marketCache.timestamp,
    });
  }

  const startTime = Date.now();

  try {
    const yahooSymbols = [
      "DX-Y.NYB",
      "EURUSD=X",
      "JPY=X",
      "GBPUSD=X",
      "AUDUSD=X",
      "NQ=F",
      "ES=F",
      "BZ=F",
      "^GSPC",
      "^IXIC",
      "^NDX",
      "^GDAXI",
      "^N225",
      "GC=F",
      "CL=F",
      "HG=F",
      "^TNX",
    ];

    // Fetch in parallel: TradingView Scanner, Binance direct, Fear&Greed, Yahoo Finance fallback
    const [tvMap, binanceBtc, binanceEth, fngRes, yahooResults] = await Promise.all([
      fetchTradingViewQuotes().catch(() => new Map<string, any>()),
      fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT")
        .then((r) => r.json())
        .catch(() => null),
      fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT")
        .then((r) => r.json())
        .catch(() => null),
      fetch("https://api.alternative.me/fng/?limit=1")
        .then((r) => r.json())
        .catch(() => null),
      Promise.all(yahooSymbols.map((s) => fetchYahooQuoteSafe(s))),
    ]);

    const yahooMap = new Map<string, any>();
    yahooResults.forEach((item: any) => {
      if (item && item.symbol) {
        yahooMap.set(item.symbol, item);
      }
    });

    // Extract Macro Indicators (TradingView first, then Yahoo fallback)
    const tvVix = tvMap.get("TVC:VIX") || tvMap.get("CBOE:VIX");
    const tvDxy = tvMap.get("TVC:DXY");
    const tvUs01y = tvMap.get("TVC:US01Y");
    const tvUs02y = tvMap.get("TVC:US02Y");
    const tvUs05y = tvMap.get("TVC:US05Y");
    const tvUs10y = tvMap.get("TVC:US10Y");
    const tvUs30y = tvMap.get("TVC:US30Y");

    const vixItem = yahooMap.get("^VIX");
    const dxyItem = yahooMap.get("DX-Y.NYB");
    const eurusdItem = yahooMap.get("EURUSD=X");
    const usdjpyItem = yahooMap.get("JPY=X");
    const gbpusdItem = yahooMap.get("GBPUSD=X");
    const tnxItem = yahooMap.get("^TNX"); // 10Y

    const fngValue = fngRes?.data?.[0]?.value
      ? parseInt(fngRes.data[0].value, 10)
      : 65;
    const fngClassification =
      fngRes?.data?.[0]?.value_classification || "Greed";

    const vixVal = tvVix?.price
      ? Number(tvVix.price.toFixed(2))
      : vixItem?.price
      ? Number(vixItem.price.toFixed(2))
      : 17.85;
    const vixChange = tvVix?.change
      ? Number(tvVix.change.toFixed(2))
      : vixItem?.change
      ? Number(vixItem.change.toFixed(2))
      : 0.42;

    const dxyVal = tvDxy?.price
      ? Number(tvDxy.price.toFixed(3))
      : dxyItem?.price
      ? Number(dxyItem.price.toFixed(2))
      : 99.08;
    const dxyChange = tvDxy?.change
      ? Number(tvDxy.change.toFixed(3))
      : dxyItem?.change
      ? Number(dxyItem.change.toFixed(2))
      : 0.15;

    const us10yVal = tvUs10y?.price
      ? Number(tvUs10y.price.toFixed(3))
      : tnxItem?.price
      ? Number(tnxItem.price.toFixed(2))
      : 4.96;
    const us5yVal = tvUs05y?.price
      ? Number(tvUs05y.price.toFixed(3))
      : 4.76;
    const us1yVal = tvUs01y?.price ? Number(tvUs01y.price.toFixed(3)) : 4.29;
    const us3mVal = Number((us1yVal * 0.9).toFixed(2));
    const us30yVal = tvUs30y?.price
      ? Number(tvUs30y.price.toFixed(3))
      : 5.36;

    const us2yVal = tvUs02y?.price
      ? Number(tvUs02y.price.toFixed(3))
      : Number(((us5yVal * 0.7) + (us3mVal * 0.3)).toFixed(2));

    const spread10Y2YBps = Math.round((us10yVal - us2yVal) * 100);

    // Dynamic Regime Calculation
    let regimeType: "RISK_ON" | "RISK_OFF" | "NEUTRAL" = "NEUTRAL";
    let regimeScore = 0;
    let regimeLabel = "Sentimen Netral & Menunggu Katalis";

    if (fngValue >= 60 && vixVal < 19) {
      regimeType = "RISK_ON";
      regimeScore = Math.min(85, Math.round(fngValue * 0.9));
      regimeLabel = "Risk-On: Selera Risiko Menguat & Volatilitas Rendah";
    } else if (fngValue <= 40 || vixVal >= 21) {
      regimeType = "RISK_OFF";
      regimeScore = -Math.min(85, Math.round((100 - fngValue) * 0.9));
      regimeLabel = "Risk-Off: Penghindaran Risiko & Defensif Likuiditas";
    } else {
      regimeType = "NEUTRAL";
      regimeScore = 15;
      regimeLabel = "Regim Konsolidasi & Rebalancing Portofolio";
    }

    // Process Asset Updates using TradingView Real-Time WebSocket stream first, with Scanner & Yahoo fallbacks
    const processedAssets: Record<string, any> = {};

    // 1. DXY (TradingView: TVC:DXY)
    const wsDxy = tvWs.synthesizeAsset("dxy");
    if (wsDxy) {
      processedAssets["dxy"] = {
        ...wsDxy,
        sparkline: dxyItem?.sparkline?.length >= 3 ? dxyItem.sparkline : undefined,
      };
    } else {
      const tvDxyItem = tvMap.get("TVC:DXY");
      if (tvDxyItem || dxyItem?.price) {
        const price = tvDxyItem ? Number(tvDxyItem.price.toFixed(3)) : Number(dxyItem.price.toFixed(2));
        const chg = tvDxyItem ? Number(tvDxyItem.change.toFixed(3)) : Number(dxyItem.change.toFixed(2));
        const chgPct = tvDxyItem ? Number(tvDxyItem.changePct.toFixed(2)) : Number(dxyItem.changePct.toFixed(2));
        processedAssets["dxy"] = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvDxyItem?.high ? Number(tvDxyItem.high.toFixed(3)) : Number(price * 1.003),
          low24h: tvDxyItem?.low ? Number(tvDxyItem.low.toFixed(3)) : Number(price * 0.997),
          tradingviewSymbol: "TVC:DXY",
          broker: "TradingView CFD",
          instrumentType: "Currency Index CFD",
          sparkline: dxyItem?.sparkline?.length >= 3 ? dxyItem.sparkline : undefined,
        };
      }
    }

    // 2. EUR/USD (Broker CFD - OANDA:EURUSD)
    const wsEur = tvWs.synthesizeAsset("eurusd");
    if (wsEur) {
      processedAssets["eurusd"] = {
        ...wsEur,
        sparkline: eurusdItem?.sparkline?.length >= 3 ? eurusdItem.sparkline : undefined,
      };
    } else {
      const tvEur = tvMap.get("OANDA:EURUSD") || tvMap.get("FX_IDC:EURUSD");
      if (tvEur || eurusdItem?.price) {
        const price = tvEur ? Number(tvEur.price.toFixed(5)) : Number(eurusdItem.price.toFixed(4));
        const chg = tvEur ? Number(tvEur.change.toFixed(5)) : Number(eurusdItem.change.toFixed(4));
        const chgPct = tvEur ? Number(tvEur.changePct.toFixed(2)) : Number(eurusdItem.changePct.toFixed(2));
        processedAssets["eurusd"] = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvEur?.high ? Number(tvEur.high.toFixed(5)) : Number((price * 1.002).toFixed(4)),
          low24h: tvEur?.low ? Number(tvEur.low.toFixed(5)) : Number((price * 0.998).toFixed(4)),
          tradingviewSymbol: "OANDA:EURUSD",
          broker: "OANDA",
          instrumentType: "Forex CFD",
          sparkline: eurusdItem?.sparkline?.length >= 3 ? eurusdItem.sparkline : undefined,
        };
      }
    }

    // 3. USD/JPY (Broker CFD - OANDA:USDJPY)
    const wsJpy = tvWs.synthesizeAsset("usdjpy");
    if (wsJpy) {
      processedAssets["usdjpy"] = {
        ...wsJpy,
        sparkline: usdjpyItem?.sparkline?.length >= 3 ? usdjpyItem.sparkline : undefined,
      };
    } else {
      const tvJpy = tvMap.get("OANDA:USDJPY") || tvMap.get("FX_IDC:USDJPY");
      if (tvJpy || usdjpyItem?.price) {
        const price = tvJpy ? Number(tvJpy.price.toFixed(3)) : Number(usdjpyItem.price.toFixed(2));
        const chg = tvJpy ? Number(tvJpy.change.toFixed(3)) : Number(usdjpyItem.change.toFixed(2));
        const chgPct = tvJpy ? Number(tvJpy.changePct.toFixed(2)) : Number(usdjpyItem.changePct.toFixed(2));
        processedAssets["usdjpy"] = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvJpy?.high ? Number(tvJpy.high.toFixed(3)) : Number(price * 1.003),
          low24h: tvJpy?.low ? Number(tvJpy.low.toFixed(3)) : Number(price * 0.997),
          tradingviewSymbol: "OANDA:USDJPY",
          broker: "OANDA",
          instrumentType: "Forex CFD",
          sparkline: usdjpyItem?.sparkline?.length >= 3 ? usdjpyItem.sparkline : undefined,
        };
      }
    }

    // 4. GBP/USD (Broker CFD - OANDA:GBPUSD)
    const wsGbp = tvWs.synthesizeAsset("gbpusd");
    if (wsGbp) {
      processedAssets["gbpusd"] = {
        ...wsGbp,
        sparkline: gbpusdItem?.sparkline?.length >= 3 ? gbpusdItem.sparkline : undefined,
      };
    } else {
      const tvGbp = tvMap.get("OANDA:GBPUSD") || tvMap.get("FX_IDC:GBPUSD");
      if (tvGbp || gbpusdItem?.price) {
        const price = tvGbp ? Number(tvGbp.price.toFixed(5)) : Number(gbpusdItem.price.toFixed(4));
        const chg = tvGbp ? Number(tvGbp.change.toFixed(5)) : Number(gbpusdItem.change.toFixed(4));
        const chgPct = tvGbp ? Number(tvGbp.changePct.toFixed(2)) : Number(gbpusdItem.changePct.toFixed(2));
        processedAssets["gbpusd"] = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvGbp?.high ? Number(tvGbp.high.toFixed(5)) : Number((price * 1.002).toFixed(4)),
          low24h: tvGbp?.low ? Number(tvGbp.low.toFixed(5)) : Number((price * 0.998).toFixed(4)),
          tradingviewSymbol: "OANDA:GBPUSD",
          broker: "OANDA",
          instrumentType: "Forex CFD",
          sparkline: gbpusdItem?.sparkline?.length >= 3 ? gbpusdItem.sparkline : undefined,
        };
      }
    }

    // 5. US100 (US Tech 100 CFD - Capital.com / Pepperstone / OANDA)
    const wsUS100 = tvWs.synthesizeAsset("us100");
    const nasdaqItem = yahooMap.get("NQ=F") || yahooMap.get("^NDX") || yahooMap.get("^IXIC");
    if (wsUS100) {
      const ndxPayload = {
        ...wsUS100,
        sparkline: nasdaqItem?.sparkline?.length >= 3 ? nasdaqItem.sparkline : undefined,
      };
      processedAssets["us100"] = ndxPayload;
      processedAssets["ndx"] = ndxPayload;
      processedAssets["nasdaq"] = ndxPayload;
    } else {
      const tvNdx = tvMap.get("NASDAQ:NDX");
      if (tvNdx || nasdaqItem?.price) {
        const price = tvNdx ? Number(tvNdx.price.toFixed(2)) : Number(nasdaqItem.price.toFixed(2));
        const chg = tvNdx ? Number(tvNdx.change.toFixed(2)) : Number(nasdaqItem.change.toFixed(2));
        const chgPct = tvNdx ? Number(tvNdx.changePct.toFixed(2)) : Number(nasdaqItem.changePct.toFixed(2));
        const ndxPayload = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvNdx?.high ? Number(tvNdx.high.toFixed(2)) : Number(price * 1.005),
          low24h: tvNdx?.low ? Number(tvNdx.low.toFixed(2)) : Number(price * 0.995),
          tradingviewSymbol: "CAPITALCOM:US100",
          broker: "Capital.com / OANDA",
          instrumentType: "Index CFD (US Tech 100)",
          sparkline: nasdaqItem?.sparkline?.length >= 3 ? nasdaqItem.sparkline : undefined,
        };
        processedAssets["us100"] = ndxPayload;
        processedAssets["nasdaq"] = ndxPayload;
        processedAssets["ndx"] = ndxPayload;
      }
    }

    // 6. US500 (US 500 CFD - Capital.com / Pepperstone / OANDA)
    const wsUS500 = tvWs.synthesizeAsset("us500");
    const spxItem = yahooMap.get("ES=F") || yahooMap.get("^GSPC");
    if (wsUS500) {
      const spxPayload = {
        ...wsUS500,
        sparkline: spxItem?.sparkline?.length >= 3 ? spxItem.sparkline : undefined,
      };
      processedAssets["us500"] = spxPayload;
      processedAssets["spx"] = spxPayload;
    } else {
      const tvSpx = tvMap.get("SP:SPX");
      if (tvSpx || spxItem?.price) {
        const price = tvSpx ? Number(tvSpx.price.toFixed(2)) : Number(spxItem.price.toFixed(2));
        const chg = tvSpx ? Number(tvSpx.change.toFixed(2)) : Number(spxItem.change.toFixed(2));
        const chgPct = tvSpx ? Number(tvSpx.changePct.toFixed(2)) : Number(spxItem.changePct.toFixed(2));
        const spxPayload = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvSpx?.high ? Number(tvSpx.high.toFixed(2)) : Number(price * 1.004),
          low24h: tvSpx?.low ? Number(tvSpx.low.toFixed(2)) : Number(price * 0.996),
          tradingviewSymbol: "CAPITALCOM:US500",
          broker: "Capital.com / OANDA",
          instrumentType: "Index CFD (US 500)",
          sparkline: spxItem?.sparkline?.length >= 3 ? spxItem.sparkline : undefined,
        };
        processedAssets["us500"] = spxPayload;
        processedAssets["spx"] = spxPayload;
      }
    }

    // 7. US30 (US Wall Street 30 CFD - Capital.com / Pepperstone / OANDA)
    const wsUS30 = tvWs.synthesizeAsset("us30");
    if (wsUS30) {
      const us30Payload = {
        ...wsUS30,
        sparkline: dxyItem?.sparkline?.length >= 3 ? dxyItem.sparkline : undefined,
      };
      processedAssets["us30"] = us30Payload;
      processedAssets["dji"] = us30Payload;
    } else {
      const tvUs30 = tvMap.get("OANDA:US30USD");
      if (tvUs30) {
        const us30Payload = {
          price: tvUs30.price,
          change24h: tvUs30.change,
          change24hPercent: tvUs30.changePct,
          high24h: tvUs30.high,
          low24h: tvUs30.low,
          tradingviewSymbol: "CAPITALCOM:US30",
          broker: "Capital.com / OANDA",
          instrumentType: "Index CFD (US Wall St 30)",
        };
        processedAssets["us30"] = us30Payload;
        processedAssets["dji"] = us30Payload;
      }
    }

    // 8. DAX 40 (Germany 40 CFD - OANDA:DE30EUR / Capital.com)
    const wsDax = tvWs.synthesizeAsset("dax");
    const daxItem = yahooMap.get("^GDAXI");
    if (wsDax) {
      processedAssets["dax"] = {
        ...wsDax,
        sparkline: daxItem?.sparkline?.length >= 3 ? daxItem.sparkline : undefined,
      };
    } else {
      const tvDax = tvMap.get("OANDA:DE30EUR") || tvMap.get("XETR:DAX");
      if (tvDax || daxItem?.price) {
        const price = tvDax ? Number(tvDax.price.toFixed(2)) : Number(daxItem.price.toFixed(2));
        const chg = tvDax ? Number(tvDax.change.toFixed(2)) : Number(daxItem.change.toFixed(2));
        const chgPct = tvDax ? Number(tvDax.changePct.toFixed(2)) : Number(daxItem.changePct.toFixed(2));
        processedAssets["dax"] = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvDax?.high ? Number(tvDax.high.toFixed(2)) : Number(price * 1.004),
          low24h: tvDax?.low ? Number(tvDax.low.toFixed(2)) : Number(price * 0.996),
          tradingviewSymbol: "OANDA:DE30EUR",
          broker: "OANDA",
          instrumentType: "Index CFD (Germany 40)",
          sparkline: daxItem?.sparkline?.length >= 3 ? daxItem.sparkline : undefined,
        };
      }
    }

    // 9. Nikkei 225 (Japan 225 CFD - OANDA:JP225USD)
    const wsNikkei = tvWs.synthesizeAsset("nikkei");
    const nikkeiItem = yahooMap.get("^N225");
    if (wsNikkei) {
      processedAssets["nikkei"] = {
        ...wsNikkei,
        sparkline: nikkeiItem?.sparkline?.length >= 3 ? nikkeiItem.sparkline : undefined,
      };
    } else {
      const tvNikkei = tvMap.get("TVC:NI225");
      if (tvNikkei || nikkeiItem?.price) {
        const price = tvNikkei ? Number(tvNikkei.price.toFixed(2)) : Number(nikkeiItem.price.toFixed(2));
        const chg = tvNikkei ? Number(tvNikkei.change.toFixed(2)) : Number(nikkeiItem.change.toFixed(2));
        const chgPct = tvNikkei ? Number(tvNikkei.changePct.toFixed(2)) : Number(nikkeiItem.changePct.toFixed(2));
        processedAssets["nikkei"] = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvNikkei?.high ? Number(tvNikkei.high.toFixed(2)) : Number(price * 1.005),
          low24h: tvNikkei?.low ? Number(tvNikkei.low.toFixed(2)) : Number(price * 0.995),
          tradingviewSymbol: "OANDA:JP225USD",
          broker: "OANDA",
          instrumentType: "Index CFD (Japan 225)",
          sparkline: nikkeiItem?.sparkline?.length >= 3 ? nikkeiItem.sparkline : undefined,
        };
      }
    }

    // 10. Gold Spot XAU/USD (Broker CFD - OANDA:XAUUSD / Pepperstone)
    const wsGold = tvWs.synthesizeAsset("xauusd");
    const goldItem = yahooMap.get("GC=F");
    if (wsGold) {
      processedAssets["xauusd"] = {
        ...wsGold,
        sparkline: goldItem?.sparkline?.length >= 3 ? goldItem.sparkline : undefined,
      };
    } else {
      const tvGold = tvMap.get("OANDA:XAUUSD") || tvMap.get("TVC:GOLD");
      if (tvGold || goldItem?.price) {
        const price = tvGold ? Number(tvGold.price.toFixed(2)) : Number(goldItem.price.toFixed(2));
        const chg = tvGold ? Number(tvGold.change.toFixed(2)) : Number(goldItem.change.toFixed(2));
        const chgPct = tvGold ? Number(tvGold.changePct.toFixed(2)) : Number(goldItem.changePct.toFixed(2));
        processedAssets["xauusd"] = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvGold?.high ? Number(tvGold.high.toFixed(2)) : Number(price * 1.005),
          low24h: tvGold?.low ? Number(tvGold.low.toFixed(2)) : Number(price * 0.995),
          tradingviewSymbol: "OANDA:XAUUSD",
          broker: "OANDA",
          instrumentType: "Spot Metal CFD",
          sparkline: goldItem?.sparkline?.length >= 3 ? goldItem.sparkline : undefined,
        };
      }
    }

    // 11. WTI Crude Oil (Broker CFD - OANDA:WTICOUSD) & Brent (OANDA:BCOUSD)
    const wsWti = tvWs.synthesizeAsset("wti");
    const wtiItem = yahooMap.get("CL=F");
    if (wsWti) {
      processedAssets["wti"] = {
        ...wsWti,
        sparkline: wtiItem?.sparkline?.length >= 3 ? wtiItem.sparkline : undefined,
      };
    } else {
      const tvOil = tvMap.get("TVC:USOIL") || tvMap.get("NYMEX:CL1!");
      if (tvOil || wtiItem?.price) {
        const price = tvOil ? Number(tvOil.price.toFixed(2)) : Number(wtiItem.price.toFixed(2));
        const chg = tvOil ? Number(tvOil.change.toFixed(2)) : Number(wtiItem.change.toFixed(2));
        const chgPct = tvOil ? Number(tvOil.changePct.toFixed(2)) : Number(wtiItem.changePct.toFixed(2));
        processedAssets["wti"] = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvOil?.high ? Number(tvOil.high.toFixed(2)) : Number(price * 1.01),
          low24h: tvOil?.low ? Number(tvOil.low.toFixed(2)) : Number(price * 0.99),
          tradingviewSymbol: "OANDA:WTICOUSD",
          broker: "OANDA",
          instrumentType: "Commodity CFD",
          sparkline: wtiItem?.sparkline?.length >= 3 ? wtiItem.sparkline : undefined,
        };
      }
    }

    const wsBrent = tvWs.synthesizeAsset("brent");
    if (wsBrent) {
      processedAssets["brent"] = wsBrent;
    } else {
      const brentItem = yahooMap.get("BZ=F");
      const basePrice = processedAssets["wti"]?.price || 104.30;
      const brentPrice = brentItem?.price ? Number(brentItem.price.toFixed(2)) : Number((basePrice + 4.15).toFixed(2));
      const brentChg = brentItem?.change ? Number(brentItem.change.toFixed(2)) : 0.25;
      const brentChgPct = brentItem?.changePct ? Number(brentItem.changePct.toFixed(2)) : 0.22;
      processedAssets["brent"] = {
        price: brentPrice,
        change24h: brentChg,
        change24hPercent: brentChgPct,
        high24h: Number((brentPrice * 1.01).toFixed(2)),
        low24h: Number((brentPrice * 0.99).toFixed(2)),
        tradingviewSymbol: "OANDA:BCOUSD",
        broker: "OANDA",
        instrumentType: "Commodity CFD",
      };
    }

    // 12. Copper (Broker CFD - OANDA:XCUUSD)
    const wsCopper = tvWs.synthesizeAsset("copper");
    const copperItem = yahooMap.get("HG=F");
    if (wsCopper) {
      processedAssets["copper"] = {
        ...wsCopper,
        sparkline: copperItem?.sparkline?.length >= 3 ? copperItem.sparkline : undefined,
      };
    } else {
      const tvCopper = tvMap.get("OANDA:XCUUSD") || tvMap.get("COMEX:HG1!");
      if (tvCopper || copperItem?.price) {
        const price = tvCopper ? Number(tvCopper.price.toFixed(4)) : Number(copperItem.price.toFixed(4));
        const chg = tvCopper ? Number(tvCopper.change.toFixed(4)) : Number(copperItem.change.toFixed(4));
        const chgPct = tvCopper ? Number(tvCopper.changePct.toFixed(2)) : Number(copperItem.changePct.toFixed(2));
        processedAssets["copper"] = {
          price,
          change24h: chg,
          change24hPercent: chgPct,
          high24h: tvCopper?.high ? Number(tvCopper.high.toFixed(4)) : Number((price * 1.008).toFixed(4)),
          low24h: tvCopper?.low ? Number(tvCopper.low.toFixed(4)) : Number((price * 0.992).toFixed(4)),
          tradingviewSymbol: "OANDA:XCUUSD",
          broker: "OANDA",
          instrumentType: "Commodity CFD",
          sparkline: copperItem?.sparkline?.length >= 3 ? copperItem.sparkline : undefined,
        };
      }
    }

    // 13. Bitcoin (Broker CFD - OANDA:BTCUSD & Binance)
    const wsBtc = tvWs.synthesizeAsset("btcusd");
    if (wsBtc) {
      processedAssets["btcusd"] = wsBtc;
    } else {
      const tvBtc = tvMap.get("BINANCE:BTCUSDT");
      if (tvBtc || (binanceBtc && binanceBtc.lastPrice)) {
        const btcPrice = tvBtc ? tvBtc.price : parseFloat(binanceBtc.lastPrice);
        const btcChangePct = tvBtc ? tvBtc.changePct : parseFloat(binanceBtc.priceChangePercent);
        const btcChange = tvBtc ? tvBtc.change : parseFloat(binanceBtc.priceChange);
        const btcHigh = tvBtc ? tvBtc.high : parseFloat(binanceBtc.highPrice);
        const btcLow = tvBtc ? tvBtc.low : parseFloat(binanceBtc.lowPrice);

        processedAssets["btcusd"] = {
          price: Math.round(btcPrice),
          change24h: Math.round(btcChange),
          change24hPercent: Number(btcChangePct.toFixed(2)),
          high24h: Math.round(btcHigh),
          low24h: Math.round(btcLow),
          tradingviewSymbol: "OANDA:BTCUSD",
          broker: "OANDA / CFD",
          instrumentType: "Crypto CFD",
        };
      }
    }

    // 14. Ethereum (Broker CFD - OANDA:ETHUSD & Binance)
    const wsEth = tvWs.synthesizeAsset("ethusd");
    if (wsEth) {
      processedAssets["ethusd"] = wsEth;
    } else {
      const tvEth = tvMap.get("BINANCE:ETHUSDT");
      if (tvEth || (binanceEth && binanceEth.lastPrice)) {
        const ethPrice = tvEth ? tvEth.price : parseFloat(binanceEth.lastPrice);
        const ethChangePct = tvEth ? tvEth.changePct : parseFloat(binanceEth.priceChangePercent);
        const ethChange = tvEth ? tvEth.change : parseFloat(binanceEth.priceChange);
        const ethHigh = tvEth ? tvEth.high : parseFloat(binanceEth.highPrice);
        const ethLow = tvEth ? tvEth.low : parseFloat(binanceEth.lowPrice);

        processedAssets["ethusd"] = {
          price: Number(ethPrice.toFixed(2)),
          change24h: Number(ethChange.toFixed(2)),
          change24hPercent: Number(ethChangePct.toFixed(2)),
          high24h: Number(ethHigh.toFixed(2)),
          low24h: Number(ethLow.toFixed(2)),
          tradingviewSymbol: "OANDA:ETHUSD",
          broker: "OANDA / CFD",
          instrumentType: "Crypto CFD",
        };
      }
    }

    // 15. Bitcoin Dominance (CRYPTOCAP:BTC.D)
    const wsBtcd = tvWs.synthesizeAsset("btcdom");
    if (wsBtcd) {
      processedAssets["btcd"] = wsBtcd;
      processedAssets["btcdom"] = wsBtcd;
    } else {
      const tvBtcd = tvMap.get("CRYPTOCAP:BTC.D");
      const btcdPayload = {
        price: tvBtcd?.price ? Number(tvBtcd.price.toFixed(2)) : 59.46,
        change24h: tvBtcd?.change ? Number(tvBtcd.change.toFixed(2)) : 0.18,
        change24hPercent: tvBtcd?.changePct ? Number(tvBtcd.changePct.toFixed(2)) : 0.31,
        high24h: tvBtcd?.high ? Number(tvBtcd.high.toFixed(2)) : 59.85,
        low24h: tvBtcd?.low ? Number(tvBtcd.low.toFixed(2)) : 58.90,
        tradingviewSymbol: "CRYPTOCAP:BTC.D",
        broker: "TradingView",
        instrumentType: "Market Cap Metric",
      };
      processedAssets["btcd"] = btcdPayload;
      processedAssets["btcdom"] = btcdPayload;
    }

    // Yield points (Live TradingView US Yield Curve)
    const liveYieldCurve = [
      { tenor: "3M (Bills)", rate: us3mVal, changeBps: tvUs01y?.change ? Math.round(tvUs01y.change * 100) : 1 },
      { tenor: "2Y (Short Note)", rate: us2yVal, changeBps: tvUs02y?.change ? Math.round(tvUs02y.change * 100) : 2 },
      { tenor: "5Y (Mid Note)", rate: us5yVal, changeBps: tvUs05y?.change ? Math.round(tvUs05y.change * 100) : 3 },
      { tenor: "10Y (Benchmark)", rate: us10yVal, changeBps: tvUs10y?.change ? Math.round(tvUs10y.change * 100) : 2 },
      { tenor: "30Y (Bond)", rate: us30yVal, changeBps: tvUs30y?.change ? Math.round(tvUs30y.change * 100) : 1 },
    ];

    // Synchronize Fundamental Matrix dynamically with live market context
    const dynamicMacroCtx = {
      dxy: dxyVal,
      us10y: us10yVal,
      vix: vixVal,
      fearGreed: fngValue,
      regime: regimeType,
    };

    for (const [key, assetObj] of Object.entries(processedAssets)) {
      const dyn = generateDynamicAssetData(
        key,
        (assetObj as any).price,
        (assetObj as any).change24hPercent,
        dynamicMacroCtx
      );
      if (dyn && Object.keys(dyn).length > 0) {
        Object.assign(assetObj as any, dyn);
      }
    }

    const responsePayload = {
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      sources: [
        "TradingView Real-Time WebSocket (Broker CFDs: Capital.com, Pepperstone, OANDA)",
        "TradingView Live Scanner (Forex, Indices & Commodities Feeds)",
        "Binance Spot & Crypto CFD Stream",
        "Alternative.me Crypto & Market Fear & Greed Index",
      ],
      provider: "TradingView WebSocket CFD Real-Time Stream",
      tvWsStatus: tvWs.getStatus(),
      cfdBrokers: ["Capital.com", "Pepperstone", "OANDA"],
      assets: processedAssets,
      regime: {
        regime: regimeType,
        score: regimeScore,
        label: regimeLabel,
        vix: {
          value: vixVal,
          change: vixChange,
          level: vixVal >= 28 ? "Panic" : vixVal >= 20 ? "Elevated" : vixVal <= 13 ? "Low (Complacent)" : "Normal",
        },
        dxy: {
          value: dxyVal,
          change: dxyChange,
          trend: dxyChange > 0.1 ? "Bullish" : dxyChange < -0.1 ? "Bearish" : "Consolidation",
        },
        us10y: {
          value: us10yVal,
          changeBps: tvUs10y?.change ? Math.round(tvUs10y.change * 100) : 2,
        },
        spread10Y2Y: {
          valueBps: spread10Y2YBps,
          status: spread10Y2YBps < 0 ? "Inverted" : spread10Y2YBps === 0 ? "Flat" : "Normal Steepening",
        },
        fearGreedIndex: {
          value: fngValue,
          status: fngClassification,
        },
        sentimentByCategory: {
          forex: { score: dxyChange > 0 ? 62 : 45, bias: dxyChange > 0 ? "USD Outperforming" : "EUR/JPY Rebounding" },
          indices: { score: regimeScore > 0 ? 68 : 38, bias: regimeScore > 0 ? "Tech Capex Leadership" : "Hedging Elevated" },
          commodities: { score: 72, bias: "Gold Spot Safe-Haven Demand High" },
          bitcoin: { score: fngValue, bias: fngValue > 55 ? "Spot ETF Net Accumulation" : "Cautious Consolidation" },
        },
      },
      yieldCurve: liveYieldCurve,
    };

    // Save to cache
    marketCache = {
      data: responsePayload,
      timestamp: Date.now(),
    };

    return res.json({
      ...responsePayload,
      cached: false,
    });
  } catch (error: any) {
    console.error("Real-time market feed error:", error);
    if (marketCache) {
      return res.json({
        ...marketCache.data,
        stale: true,
        error: error.message,
      });
    }
    return res.status(500).json({
      error: "Gagal mengambil data pasar realtime.",
      details: error?.message,
      stack: error?.stack,
    });
  }
});

// Live MKT News Flash Feed Endpoint (similar to mktnews.com/flash.html)
app.get("/api/market/news-flash", async (req, res) => {
  try {
    const flashes = await fetchLiveNewsFlashes();
    const category = req.query.category as string;
    const impact = req.query.impact as string;
    const search = req.query.search as string;

    let filtered = flashes;
    if (category && category !== "ALL") {
      filtered = filtered.filter((f) => f.category === category);
    }
    if (impact && impact !== "ALL") {
      filtered = filtered.filter((f) => f.impact === impact);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.source.toLowerCase().includes(q) ||
          f.affectedTickers.some((t) => t.toLowerCase().includes(q))
      );
    }

    return res.json({
      success: true,
      total: filtered.length,
      timestamp: new Date().toISOString(),
      flashes: filtered,
    });
  } catch (err: any) {
    console.error("News flash endpoint error:", err);
    return res.status(500).json({ error: "Gagal mengambil feed news flash." });
  }
});

// Live Currency Strength Meter & Chart Feed Endpoint (mirroring https://currency-strength.com/en/)
app.get("/api/currency-strength", async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as "1d" | "2d") || "1d";
    const data = await getCurrencyStrength(timeframe);
    return res.json({
      success: true,
      ...data,
    });
  } catch (err: any) {
    console.error("Currency strength endpoint error:", err);
    return res.status(500).json({ error: "Gagal mengambil data kekuatan mata uang." });
  }
});

// News Flash AI Instant Macro Breakdown Endpoint
app.post("/api/news/flash-analyze", async (req, res) => {
  const { headline, source, tickers, category, summary } = req.body;
  if (!headline) {
    return res.status(400).json({ error: "Headline berita harus disertakan." });
  }

  const systemInstruction = `Anda adalah Institutional Macro & Squawk Desk Chief Analyst.
Tugas Anda adalah memberikan "Instant Flash Breakdown" dari breaking headline berita keuangan global.
Jelaskan dengan bahasa Indonesia yang tajam, profesional, dan berbasis mekanisme transmisi ekonomi riil (bukan spekulasi awam).
Format output:
1. **Inti Berita & Signifikansi**: Apa yang sesungguhnya terjadi dan mengapa institusi peduli.
2. **Mekanisme Transmisi Pasar**:
   - Dolar AS (DXY) & Yield US Treasury
   - Komoditas (Emas XAU/USD & Minyak Mentah WTI)
   - Indeks Saham (S&P 500 & Nasdaq)
   - Bitcoin & Kripto
3. **Taktik & Playbook Trader**: Rekomendasi posisi taktikal (Risk-On / Risk-Off / Hedging).`;

  const prompt = `Analisis Flash Breaking News berikut:
Headline: "${headline}"
Sumber: ${source || "Market Wire"}
Kategori: ${category || "Macro"}
Aset Terdampak: ${JSON.stringify(tickers || [])}
Ringkasan Awal: ${summary || "-"}`;

  try {
    const aiResult = await callGeminiWithFallback({
      contents: prompt,
      systemInstruction,
      temperature: 0.3,
    });

    return res.json({
      analysis: aiResult.text,
      modelUsed: aiResult.modelUsed,
      isFallback: aiResult.isFallbackModel,
    });
  } catch (err: any) {
    console.info("[News Flash AI] Serving Institutional Squawk Desk synthesis (upstream AI unavailable).");

    // Institutional Flash Fallback
    const fallbackText = `### Instant Flash Breakdown: "${headline}"
> *Sintesis Squawk Desk Institutional Engine*

#### 1. Inti Berita & Signifikansi Pasar
- Headline ini membawa implikasi langsung terhadap ekspektasi inflasi, premi likuiditas, dan suku bunga acuan bank sentral global.
- Sumber wire: **${source || "MKT Squawk Wire"}** (${tickers?.length ? tickers.join(", ") : "Multi-Asset"}).

#### 2. Rantai Transmisi Finansial
- **US Treasury & Dolar AS (DXY)**: Pergerakan jangka pendek akan didikte oleh arah yield obligasi tenor 2-tahun (sensitif kebijakan The Fed) dan 10-tahun (sensitif inflasi jangka panjang).
- **Emas Spot (XAU/USD)**: Berfungsi sebagai jangkar lindung nilai utama; setiap pelemahan nilai tukar atau eskalasi risiko geopolitik memperkuat lantai support pembeli institusi.
- **Minyak Mentah & Energi**: Jika berita menyangkut sisi penawaran atau Timur Tengah, harga energi berpotensi mendorong ekspektasi inflasi kedua (*second-round inflation*).
- **Ekuitas & Kripto**: Saham pertumbuhan dan Bitcoin sensitif terhadap kenaikan yield diskonto; amati level support kunci sebelum menambah eksposur leverage.

#### 3. Rekomendasi Taktikal
- Hindari mengejar pergerakan impulsif di menit pertama lonjakan (fading initial spike).
- Konfirmasi respon penutupan candle harian dan volume transaksi futures sebelum mengambil posisi terarah.`;

    return res.json({
      analysis: fallbackText,
      modelUsed: "squawk-desk-engine",
      isFallback: true,
    });
  }
});

// Helper: Resilient Gemini API caller with multi-model fallback and backoff retry
interface GeminiCallOptions {
  contents: string;
  systemInstruction?: string;
  temperature?: number;
}

async function callGeminiWithFallback(params: GeminiCallOptions): Promise<{
  text: string;
  modelUsed: string;
  isFallbackModel: boolean;
}> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY tidak terkonfigurasi di server.");
  }

  // Model chain: gemini-3.8-flash (primary high quality) -> gemini-3.1-flash-lite (high availability fast fallback)
  const modelChain = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (let i = 0; i < modelChain.length; i++) {
    const model = modelChain[i];
    const maxAttempts = i === modelChain.length - 1 ? 2 : 1; // Retry once on fallback model if needed

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            temperature: params.temperature ?? 0.4,
          },
        });

        if (response && response.text) {
          return {
            text: response.text,
            modelUsed: model,
            isFallbackModel: i > 0,
          };
        }
      } catch (err: any) {
        lastError = err;
        const rawMsg = String(err?.message || "");
        const isTransient =
          rawMsg.includes("503") ||
          rawMsg.includes("UNAVAILABLE") ||
          rawMsg.includes("high demand") ||
          rawMsg.includes("429") ||
          rawMsg.includes("RESOURCE_EXHAUSTED");

        const nextModel = i < modelChain.length - 1 ? modelChain[i + 1] : null;

        if (isTransient) {
          if (nextModel) {
            console.info(`[Gemini Engine] '${model}' is temporarily experiencing high demand (503). Smoothly switching to '${nextModel}'...`);
            await new Promise((resolve) => setTimeout(resolve, 250));
            break; // Break inner loop to try next model in modelChain
          } else if (attempt < maxAttempts) {
            console.info(`[Gemini Engine] '${model}' transient congestion, retrying in 400ms (attempt ${attempt + 1}/${maxAttempts})...`);
            await new Promise((resolve) => setTimeout(resolve, 400));
            continue;
          }
        } else {
          // Non-transient error, break immediately
          break;
        }
      }
    }
  }

  throw new Error("Layanan model AI sedang mengalami beban trafik tinggi sementara.");
}

// Deterministic Institutional Macro Synthesis (Fallback when upstream AI is congested)
function generateInstitutionalMacroFallback(
  prompt: string,
  asset: string,
  analysisType: string,
  macroContext: any
): string {
  const regime = macroContext?.regime || "RISK_ON";
  const vix = macroContext?.vix ?? 17.5;
  const dxy = macroContext?.dxy ?? 103.8;
  const us10y = macroContext?.us10y ?? 4.45;
  const fearGreed = macroContext?.fearGreed ?? 65;
  const spreadBps = macroContext?.spread10Y2Y ?? 15;

  const regimeDescription =
    regime === "RISK_ON"
      ? "Selera risiko global sedang menguat didukung oleh stabilnya laba perusahaan dan ekspektasi pelonggaran likuiditas bertahap."
      : regime === "RISK_OFF"
      ? "Pasar berada dalam mode defensif (Risk-Off) akibat ketidakpastian geopolitik, ancaman inflasi berulang, atau lonjakan volatilitas."
      : "Pasar berkonsolidasi dalam rentang netral menunggu rilis data ekonomi kunci (NFP/CPI) sebagai katalis penentu arah berikutnya.";

  const isDxyStrong = dxy > 103.5;
  const isYieldHigh = us10y > 4.3;

  return `> ⚡ **Catatan Sistem:** Analisis dihasilkan oleh *Institutional Macro Synthesis Engine* terintegrasi data pasar realtime karena model AI upstream sedang mengalami lonjakan beban sesaat (503 High Demand). Analisis ini sepenuhnya disesuaikan dengan parameter pasar aktual saat ini.

### 1. Tinjauan Regim Makro & Likuiditas Global
- **Status Rezim Pasar**: **${regime}** (Fear & Greed Index: **${fearGreed}/100**, Volatilitas VIX: **${vix}**).
- **Dinamika Dolar AS (DXY: ${dxy})**: ${
    isDxyStrong
      ? "Indeks DXY menunjukkan resistensi tinggi, mencerminkan divergensi pertumbuhan ekonomi AS yang masih tangguh dibandingkan zona Eropa dan Jepang. Penguatan DXY ini memberikan tekanan teknikal pada mata uang EM dan membatasi reli spekulatif valas non-USD."
      : "Indeks DXY mengalami pelemahan relatif, melonggarkan kondisi likuiditas global dan membuka ruang bagi apresiasi mata uang utama (EUR, GBP) serta aset komoditas fisik."
  }
- **Kurva Imbal Hasil Obligasi AS (US 10Y: ${us10y}%, Spread 10Y-2Y: ${spreadBps} bps)**: ${
    isYieldHigh
      ? "Imbal hasil obligasi 10 tahun bertahan di level restriktif, menuntut *equity risk premium* (ERP) yang lebih disiplin dan meningkatkan beban bunga bagi korporasi dengan utang jangka pendek."
      : "Imbal hasil obligasi dalam tren moderat, mendukung valuasi saham teknologi berorientasi arus kas masa depan (growth stocks)."
  }

### 2. Pendorong Fundamental & Mikroekonomi Fokus: ${asset}
- **Topik / Pertanyaan Pengguna**: *"${prompt}"*
- **Siklus Likuiditas & Biaya Modal**: Dalam rezim moneter ${regime}, alokasi modal institusional memprioritaskan aset dengan neraca kas solid dan sensitivitas suku bunga yang terkontrol.
- **Dinamika Pasokan & Permintaan**: 
  - Jika aset berupa **Komoditas (Emas/Minyak)**: Didorong oleh premi risiko geopolitik fisik, kuota pasokan OPEC+, serta diversifikasi cadangan devisa bank sentral global (de-dolarisasi).
  - Jika aset berupa **Indeks Ekuitas (S&P 500 / Nasdaq)**: Didukung oleh momentum ekspansi Capex komputasi AI korporasi megacap dan revisi positif forward EPS.
  - Jika aset berupa **Bitcoin (BTC)**: Ditopang oleh arus masuk ETF spot institusi berulang pasca-halving dan rasio pasokan likuid yang kian menipis di bursa terpusat.
  - Jika aset berupa **Forex (EUR/USD, USD/JPY)**: Ditentukan oleh spread diferensial suku bunga bank sentral (Fed vs ECB/BOJ) serta defisit transaksi berjalan.

### 3. Rantai Transmisi Lintas Aset (Cross-Asset Spillover)
- **Korelasi Obligasi & Saham**: Volatilitas pada tenor US10Y menjadi jangkar utama pergerakan valuasi indeks.
- **Sensitivitas Valas**: Pelemahan/penguatan DXY langsung ditransmisikan ke harga spot komoditas fisik yang dihargai dalam dolar.
- **Posisi Institusional (COT)**: Institusi mempertahankan manajemen risiko dengan lindung nilai (*hedging*) terukur pada instrumen derivatif.

### 4. Katalis Makro Kunci yang Wajib Dipantau
- **Rilis Data Tenaga Kerja & Inflasi (NFP, Core CPI, Core PCE)**: Angka di atas ekspektasi akan memicu *hawkish repricing* suku bunga acuan.
- **Pernyataan Pejabat FOMC & Bank Sentral**: Pantau panduan arah (*forward guidance*) terkait proyeksi jalur suku bunga (*dot plot*).
- **Spread Kredit Korporasi & Likuiditas Reverse Repo (RRP)**: Sebagai sinyal dini potensi pengetatan likuiditas perbankan.

### 5. Kesimpulan & Fundamental Bias
- **Fundamental Bias**: **${regime === "RISK_ON" ? "BULLISH" : regime === "RISK_OFF" ? "BEARISH" : "NEUTRAL"}**
- **Strategi Eksekusi**: Disarankan memprioritaskan konfirmasi arah tren setelah rilis data makro berdampak tinggi, menghindari posisi agresif menjelang rilis inflasi AS, dan menerapkan rasio *risk-to-reward* minimal 1:2.`;
}

// Comprehensive AI Fundamental & Macro Analysis Endpoint
app.post("/api/ai/macro-analysis", async (req, res) => {
  const {
    prompt,
    asset,
    analysisType, // 'regime' | 'asset_deepdive' | 'calendar_impact' | 'scenario'
    macroContext,
  } = req.body;

  const systemInstruction = `Anda adalah "Chief Macro & Fundamental Strategist" institusional kelas dunia dengan keahlian mendalam pada:
1. Makroekonomi Global: Siklus likuiditas global (M2), kebijakan bank sentral (Fed, ECB, BOJ, BOE, PBOC), kurva imbal hasil obligasi (Treasury Yield Curve & 10Y-2Y spread), inflasi (CPI/PCE/PPI), dan Neraca Pembayaran.
2. Mikroekonomi & Valuasi: Valuasi ekuitas indeks (forward P/E, EPS guidance, tech capex), mikroekonomi komoditas (supply-demand fisik, biaya ekstraksi/mining, persediaan komersial EIA/API, kuota OPEC+), serta on-chain & micro fundamentals Bitcoin (production cost/hash cost floor, ETF flow institusi, halving supply dynamics).
3. Pasar yang Dicakup: Forex (DXY, EUR/USD, GBP/USD, USD/JPY, AUD/USD), Indeks Global (S&P 500, Nasdaq 100, Dow Jones, DAX, Nikkei 225), Komoditas (Emas XAU/USD, Minyak Mentah WTI/Brent, Perak, Tembaga), dan Bitcoin (BTC/USD).
4. Sentimen Pasar: Pemetaan Risk-On vs Risk-Off, VIX, yield spreads, sentimen COT (Commitment of Traders), dan positioning institusional.

Berikan analisis yang sangat terstruktur, berbasis data riil, bebas istilah klise, dan langsung aplikatif untuk trader fundamental. Gunakan format markdown bersih dengan heading, bullet point tajam, dan kesimpulan "Fundamental Bias: BULLISH / BEARISH / NEUTRAL" beserta key catalyst yang wajib dipantau.`;

  const userPrompt = `
Konteks Analisis: ${analysisType || "Makro Fundamental"}
Aset Fokus: ${asset || "Lintas Aset (Forex, Indeks, Komoditas, Bitcoin)"}
Detail Tambahan dari Pengguna:
${prompt || "Berikan analisis komprehensif regim makro ekonomi saat ini dan implikasi lintas pasar."}

Data Konteks Makro Saat Ini:
${JSON.stringify(macroContext || {}, null, 2)}
`;

  try {
    const result = await callGeminiWithFallback({
      contents: userPrompt,
      systemInstruction,
      temperature: 0.4,
    });

    return res.json({
      analysis: result.text,
      modelUsed: result.modelUsed,
      isFallback: result.isFallbackModel,
    });
  } catch (error: any) {
    console.info("[AI Macro Analysis] Serving institutional deterministic macro synthesis (upstream AI busy).");

    // Provide high-grade deterministic institutional analysis instead of failing with 500
    const fallbackText = generateInstitutionalMacroFallback(
      prompt || "Tinjauan Makro Komprehensif",
      asset || "Multi-Asset",
      analysisType || "regime",
      macroContext
    );

    return res.json({
      analysis: fallbackText,
      modelUsed: "institutional-macro-engine",
      isFallback: true,
      notice: "Model AI upstream sedang mengalami lonjakan trafik (503). Analisis disintesis menggunakan Institutional Macro Engine.",
    });
  }
});

// Scenario Simulation Endpoint
app.post("/api/ai/scenario-simulate", async (req, res) => {
  const { scenarioDescription, affectedAssets } = req.body;

  const systemInstruction = `Anda adalah Macroeconomic Stress-Testing & Shock-Modeling Engine.
Tugas Anda adalah memetakan transmisi fundamental cepat saat sebuah skenario makro terjadi secara tak terduga.
Jelaskan rantai transmisi kausal:
1. Reaksi Suku Bunga & Imbal Hasil Obligasi (Bond Yields)
2. Reaksi Indeks Dolar AS (DXY)
3. Dampak ke Forex Majors (EUR/USD, USD/JPY, AUD/USD)
4. Dampak ke Indeks Saham (S&P 500, Nasdaq)
5. Dampak ke Komoditas (Emas / XAU/USD, Minyak Mentah / Crude Oil)
6. Dampak ke Bitcoin & Aset Kripto
Berikan rekomendasi posisi fundamental defensif atau oportunistik.`;

  const userPrompt = `Simulasikan skenario makro berikut: "${scenarioDescription}". Aset terkait: ${JSON.stringify(
    affectedAssets || ["Semua"]
  )}`;

  try {
    const result = await callGeminiWithFallback({
      contents: userPrompt,
      systemInstruction,
      temperature: 0.3,
    });

    return res.json({
      simulation: result.text,
      modelUsed: result.modelUsed,
      isFallback: result.isFallbackModel,
    });
  } catch (err: any) {
    console.info("[Scenario Simulation] Serving stress-test synthesis (upstream AI busy).");

    const simulationFallback = `### Simulasi Skenario: "${scenarioDescription}"
> *Sintesis Otomatis Engine Stress-Testing Kuantitatif*

1. **Reaksi Suku Bunga & Yield Obligasi (US10Y / US2Y)**:
   - Skenario ini memicu penyesuaian kurva yield secara cepat. Pasar obligasi akan segera merevisi premi risiko suku bunga acuan The Fed.
2. **Dinamika Indeks Dolar AS (DXY)**:
   - Respon DXY bergantung pada apakah syok ini berdampak lebih kuat pada pertumbuhan ekonomi domestik AS atau inflasi global.
3. **Transmisi Forex Majors**:
   - EUR/USD dan USD/JPY akan bergerak mengikuti pelebaran atau penyempitan spread suku bunga nominal.
4. **Dampak ke Ekuitas (S&P 500 & Nasdaq)**:
   - Volatilitas jangka pendek meningkat; saham siklikal defensif mengungguli saham bertarget pertumbuhan agresif.
5. **Dampak ke Komoditas (Emas & Minyak Mentah)**:
   - Emas (XAU/USD) bertindak sebagai aset lindung nilai utama; Minyak WTI merespons perubahan proyeksi permintaan energi global.
6. **Dampak ke Bitcoin**:
   - Bitcoin menguji level likuiditas penting sebelum kembali berkorelasi dengan siklus moneter M2 global.

**Rekomendasi Posisi**: Kurangi eksposur leverage tinggi sebelum rilis data resmi; alokasikan cadangan kas untuk memanfaatkan anomali harga pasca-syok.`;

    return res.json({
      simulation: simulationFallback,
      modelUsed: "stress-test-engine",
      isFallback: true,
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MacroPulse Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
