/**
 * TradingView WebSocket Real-Time Client for Broker CFDs (US100, US500, US30, etc.)
 * Connects directly to wss://data.tradingview.com/socket.io/websocket
 * Streams sub-second tick quotes with Bid, Ask, High, Low, and 24h Change.
 */

export interface TvQuote {
  symbol: string;
  broker: string;
  instrumentName: string;
  lp?: number;            // Last price
  ch?: number;            // Change absolute
  chp?: number;           // Change percent
  high_price?: number;    // 24h high
  low_price?: number;     // 24h low
  open_price?: number;    // Open price
  prev_close_price?: number; // Previous close
  bid?: number;
  ask?: number;
  volume?: number;
  lp_time?: number;       // Last price timestamp
  description?: string;
  updatedAt: number;
}

export const WATCHED_SYMBOLS = [
  // US100 / NAS100 CFDs
  { symbol: "CAPITALCOM:US100", broker: "Capital.com", assetKey: "us100", name: "US Tech 100 CFD" },
  { symbol: "PEPPERSTONE:NAS100", broker: "Pepperstone", assetKey: "us100", name: "US Tech 100 CFD" },
  { symbol: "OANDA:NAS100USD", broker: "OANDA", assetKey: "us100", name: "US Tech 100 CFD" },

  // US500 / SPX500 CFDs
  { symbol: "CAPITALCOM:US500", broker: "Capital.com", assetKey: "us500", name: "US 500 CFD" },
  { symbol: "PEPPERSTONE:US500", broker: "Pepperstone", assetKey: "us500", name: "US 500 CFD" },
  { symbol: "OANDA:SPX500USD", broker: "OANDA", assetKey: "us500", name: "US 500 CFD" },

  // US30 / Wall Street 30 CFDs
  { symbol: "CAPITALCOM:US30", broker: "Capital.com", assetKey: "us30", name: "US Wall Street 30 CFD" },
  { symbol: "PEPPERSTONE:US30", broker: "Pepperstone", assetKey: "us30", name: "US Wall Street 30 CFD" },
  { symbol: "OANDA:US30USD", broker: "OANDA", assetKey: "us30", name: "US Wall Street 30 CFD" },

  // Global Indices CFDs
  { symbol: "OANDA:DE30EUR", broker: "OANDA", assetKey: "dax", name: "Germany 40 CFD" },
  { symbol: "PEPPERSTONE:GER40", broker: "Pepperstone", assetKey: "dax", name: "Germany 40 CFD" },
  { symbol: "OANDA:JP225USD", broker: "OANDA", assetKey: "nikkei", name: "Japan 225 CFD" },

  // Commodities CFDs
  { symbol: "OANDA:XAUUSD", broker: "OANDA", assetKey: "xauusd", name: "Gold Spot USD CFD" },
  { symbol: "PEPPERSTONE:XAUUSD", broker: "Pepperstone", assetKey: "xauusd", name: "Gold Spot USD CFD" },
  { symbol: "OANDA:WTICOUSD", broker: "OANDA", assetKey: "wti", name: "WTI Crude Oil CFD" },
  { symbol: "OANDA:BCOUSD", broker: "OANDA", assetKey: "brent", name: "Brent Crude Oil CFD" },
  { symbol: "OANDA:XCUUSD", broker: "OANDA", assetKey: "copper", name: "Doctor Copper CFD" },

  // Forex CFDs / Index
  { symbol: "TVC:DXY", broker: "TradingView", assetKey: "dxy", name: "US Dollar Index" },
  { symbol: "OANDA:EURUSD", broker: "OANDA", assetKey: "eurusd", name: "EUR/USD CFD" },
  { symbol: "OANDA:USDJPY", broker: "OANDA", assetKey: "usdjpy", name: "USD/JPY CFD" },
  { symbol: "OANDA:GBPUSD", broker: "OANDA", assetKey: "gbpusd", name: "GBP/USD CFD" },

  // Crypto CFDs / Spot
  { symbol: "OANDA:BTCUSD", broker: "OANDA", assetKey: "btcusd", name: "Bitcoin CFD" },
  { symbol: "BINANCE:BTCUSDT", broker: "Binance", assetKey: "btcusd", name: "Bitcoin Spot" },
  { symbol: "OANDA:ETHUSD", broker: "OANDA", assetKey: "ethusd", name: "Ethereum CFD" },
  { symbol: "BINANCE:ETHUSDT", broker: "Binance", assetKey: "ethusd", name: "Ethereum Spot" },
  { symbol: "CRYPTOCAP:BTC.D", broker: "TradingView", assetKey: "btcdom", name: "Bitcoin Dominance" },
];

class TradingViewWsClient {
  private ws: WebSocket | null = null;
  private quotes: Map<string, TvQuote> = new Map();
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastMessageAt: number = 0;
  private sessionId: string = "";

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      this.sessionId = "qs_" + Math.random().toString(36).substring(2, 10);
      this.ws = new (WebSocket as any)("wss://data.tradingview.com/socket.io/websocket", {
        headers: {
          "Origin": "https://www.tradingview.com",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      this.ws.onopen = () => {
        this.isConnected = true;
        this.lastMessageAt = Date.now();
        console.log(`[TradingView WS] Connected! Initializing session ${this.sessionId}...`);

        this.send("set_auth_token", ["unauthorized_user_token"]);
        this.send("quote_create_session", [this.sessionId]);
        this.send("quote_set_fields", [
          this.sessionId,
          "ch",
          "chp",
          "lp",
          "lp_time",
          "volume",
          "ask",
          "bid",
          "high_price",
          "low_price",
          "open_price",
          "prev_close_price",
          "short_name",
          "description",
          "exchange",
        ]);

        const tickerSymbols = WATCHED_SYMBOLS.map((s) => s.symbol);
        this.send("quote_add_symbols", [this.sessionId, ...tickerSymbols]);
        console.log(`[TradingView WS] Subscribed to ${tickerSymbols.length} CFD & market tickers.`);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.lastMessageAt = Date.now();
        const data = event.data;
        if (typeof data !== "string") return;

        // Heartbeat ping-pong
        if (data.startsWith("~h~")) {
          this.ws?.send(data);
          return;
        }

        // TradingView frame format: ~m~<length>~m~<json>
        const regex = /~m~(\d+)~m~/g;
        let match;
        while ((match = regex.exec(data)) !== null) {
          const len = parseInt(match[1], 10);
          const start = regex.lastIndex;
          const jsonStr = data.substring(start, start + len);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.m === "qsd" && parsed.p && parsed.p[1]) {
              const item = parsed.p[1];
              const symbol = item.n;
              const values = item.v;

              if (symbol && values) {
                const meta = WATCHED_SYMBOLS.find((w) => w.symbol === symbol);
                const prev = this.quotes.get(symbol) || {
                  symbol,
                  broker: meta?.broker || "CFD Broker",
                  instrumentName: meta?.name || symbol,
                  updatedAt: Date.now(),
                };

                const updated: TvQuote = {
                  ...prev,
                  ...values,
                  updatedAt: Date.now(),
                };

                this.quotes.set(symbol, updated);
              }
            }
          } catch {
            // ignore partial json
          }
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[TradingView WS] Error:", err);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log("[TradingView WS] Connection closed, scheduling reconnect in 3s...");
        this.scheduleReconnect(3000);
      };
    } catch (e) {
      console.error("[TradingView WS] Connection attempt failed:", e);
      this.scheduleReconnect(5000);
    }
  }

  private send(func: string, args: unknown[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const payload = JSON.stringify({ m: func, p: args });
    this.ws.send(`~m~${payload.length}~m~${payload}`);
  }

  private scheduleReconnect(delayMs: number) {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delayMs);
  }

  public getQuote(symbol: string): TvQuote | undefined {
    return this.quotes.get(symbol);
  }

  public getQuotesForAsset(assetKey: string): TvQuote[] {
    const symbols = WATCHED_SYMBOLS.filter((w) => w.assetKey === assetKey).map((w) => w.symbol);
    const results: TvQuote[] = [];
    for (const sym of symbols) {
      const q = this.quotes.get(sym);
      if (q && typeof q.lp === "number") {
        results.push(q);
      }
    }
    return results;
  }

  public getAllQuotes(): Record<string, TvQuote> {
    const result: Record<string, TvQuote> = {};
    for (const [sym, quote] of this.quotes.entries()) {
      result[sym] = quote;
    }
    return result;
  }

  public synthesizeAsset(assetKey: string) {
    const quotes = this.getQuotesForAsset(assetKey);
    if (!quotes.length) return null;

    // Prefer Capital.com or OANDA or Pepperstone
    const primary =
      quotes.find((q) => q.symbol.startsWith("CAPITALCOM") && typeof q.lp === "number") ||
      quotes.find((q) => q.symbol.startsWith("OANDA") && typeof q.lp === "number") ||
      quotes.find((q) => q.symbol.startsWith("PEPPERSTONE") && typeof q.lp === "number") ||
      quotes[0];

    if (!primary || typeof primary.lp !== "number") return null;

    const brokerQuotes = quotes.map((q) => {
      const p = q.lp || 0;
      const b = q.bid;
      const a = q.ask;
      const spread =
        typeof a === "number" && typeof b === "number"
          ? Number((a - b).toFixed(3))
          : undefined;
      return {
        broker: q.broker,
        symbol: q.symbol,
        price: p,
        change24hPercent: q.chp ?? 0,
        bid: b,
        ask: a,
        spread,
      };
    });

    const ask = primary.ask;
    const bid = primary.bid;
    const spread =
      typeof ask === "number" && typeof bid === "number"
        ? Number((ask - bid).toFixed(3))
        : undefined;

    let instrumentType = "CFD Instrument";
    if (["us100", "us500", "us30", "dax", "nikkei"].includes(assetKey)) {
      instrumentType = `Index CFD (${primary.instrumentName || assetKey.toUpperCase()})`;
    } else if (["xauusd", "wti", "brent", "copper"].includes(assetKey)) {
      instrumentType = `Commodity CFD (${primary.instrumentName || assetKey.toUpperCase()})`;
    } else if (["eurusd", "usdjpy", "gbpusd"].includes(assetKey)) {
      instrumentType = "Forex CFD";
    } else if (assetKey === "dxy") {
      instrumentType = "Currency Index CFD";
    } else if (["btcusd", "ethusd"].includes(assetKey)) {
      instrumentType = "Crypto CFD";
    }

    return {
      price: primary.lp,
      change24h: primary.ch ?? 0,
      change24hPercent: primary.chp ?? 0,
      high24h: primary.high_price ?? primary.lp,
      low24h: primary.low_price ?? primary.lp,
      bid,
      ask,
      spread,
      tradingviewSymbol: primary.symbol,
      broker: quotes.length > 1 ? quotes.map((q) => q.broker).join(" / ") : primary.broker,
      instrumentType,
      brokerQuotes,
    };
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      activeQuotesCount: this.quotes.size,
      lastMessageAt: this.lastMessageAt,
      ageSeconds: Math.round((Date.now() - this.lastMessageAt) / 1000),
    };
  }
}

// Singleton instance
let tvWsClient: TradingViewWsClient | null = null;

export function getTradingViewWs(): TradingViewWsClient {
  if (!tvWsClient) {
    tvWsClient = new TradingViewWsClient();
  }
  return tvWsClient;
}
