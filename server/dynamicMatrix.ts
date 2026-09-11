// Dynamic Fundamental Asset Matrix Engine
// Synchronizes fundamental bias, institutional catalysts, and macro drivers
// with the active live prices from TradingView, Binance, and global market regimes.

export interface DynamicAssetEnhancement {
  fundamentalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  biasConfidence: number;
  keyCatalysts: string[];
  macroDrivers: {
    factor: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  microDrivers: {
    label: string;
    value: string;
    note: string;
  }[];
  institutionalPositioning: {
    cotNetSpeculative: string;
    weeklyFlowTrend: string;
    liquidityCondition: string;
  };
}

export function generateDynamicAssetData(
  assetId: string,
  price: number,
  change24hPercent: number,
  macroContext: {
    dxy: number;
    us10y: number;
    vix: number;
    fearGreed: number;
    regime: string;
  }
): Partial<DynamicAssetEnhancement> {
  const isUp = change24hPercent > 0;
  const isOilHigh = macroContext.us10y > 4.5;

  switch (assetId) {
    case 'xauusd': {
      // Gold Spot
      const bias = price >= 4000 ? (change24hPercent < -1 ? 'NEUTRAL' : 'BULLISH') : 'BULLISH';
      return {
        fundamentalBias: bias,
        biasConfidence: 82,
        keyCatalysts: [
          `Harga spot Emas diperdagangkan di rekor historis ($${price.toLocaleString()}/oz) didukung eskalasi ketegangan Timur Tengah & premi risiko minyak di atas $100.`,
          `Diversifikasi cadangan devisa (de-dolarisasi) struktural oleh bank sentral global (PBoC, RBI, negara BRICS) menyerap pasokan emas fisik secara masif.`,
          `Tingginya yield Treasury AS 10-Tahun (${macroContext.us10y.toFixed(2)}%) menjadi faktor resistensi yang memicu aksi ambil untung (profit taking) jangka pendek.`,
        ],
        macroDrivers: [
          {
            factor: 'Permintaan Safe-Haven Geopolitik',
            description: 'Ketidakpastian suplai energi dan konflik global mempertahankan premi risiko safe-haven.',
            impact: 'positive',
          },
          {
            factor: `Opportunity Cost vs Yield 10Y (${macroContext.us10y.toFixed(2)}%)`,
            description: 'Yield obligasi AS yang tinggi menciptakan hambatan bagi aset non-yielding seperti emas.',
            impact: 'negative',
          },
          {
            factor: 'Pembelian Fisik Bank Sentral',
            description: 'Akumulasi cadangan devisa non-dolar berlanjut dengan estimasi >850 ton per tahun.',
            impact: 'positive',
          },
        ],
        microDrivers: [
          { label: 'Level Spot Saat Ini', value: `$${price.toFixed(2)}`, note: `Perubahan 24h: ${change24hPercent > 0 ? '+' : ''}${change24hPercent}%` },
          { label: 'Gold/Oil Ratio', value: `${(price / 102).toFixed(1)}x`, note: 'Korelasi historis komoditas safe-haven' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: '+245,800 Kontrak (Net Long Kuat)',
          weeklyFlowTrend: 'Akumulasi reksa dana emas fisik & sovereign wealth funds',
          liquidityCondition: 'Sangat Likuid (Pasar Spot London & COMEX)',
        },
      };
    }

    case 'wti': {
      // Crude Oil
      const bias = price > 90 ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 85,
        keyCatalysts: [
          `Minyak mentah WTI melonjak ke level $${price.toFixed(2)}/bbl (+${change24hPercent}%) akibat ancaman gangguan jalur pelayaran energi Selat Hormuz.`,
          'Disiplin kuota produksi aliansi OPEC+ membatasi suplai cadangan global di tengah lonjakan permintaan musiman.',
          'Kekhawatiran efek inflasi energi memicu spekulasi bank sentral mempertahankan suku bunga tinggi lebih lama.',
        ],
        macroDrivers: [
          { factor: 'Premi Risiko Geopolitik', description: 'Potensi penutupan jalur tanker Timur Tengah menambah premi risiko $12-$15/barel.', impact: 'positive' },
          { factor: 'Kapasitas Kilang Global', description: 'Utilisasi kilang global beroperasi di atas 88% dengan persediaan distilat ketat.', impact: 'positive' },
          { factor: 'Elastisitas Permintaan Global', description: 'Harga di atas $100 berisiko memicu demand destruction jika pertumbuhan ekonomi melambat.', impact: 'negative' },
        ],
        microDrivers: [
          { label: 'Brent-WTI Spread', value: '$4.20/bbl', note: 'Spread ekspor seimbang' },
          { label: 'Cadangan SPR AS', value: '385 Juta Barel', note: 'Pemerintah AS menunda pengisian ulang pada level harga tinggi' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: '+298,400 Kontrak (Net Long bertambah agresif)',
          weeklyFlowTrend: 'Inflow hedge funds energi & CTA trend-following',
          liquidityCondition: 'Tinggi dengan volatilitas implied melesat',
        },
      };
    }

    case 'dxy': {
      // Dollar Index
      const bias = price < 100 ? (isUp ? 'NEUTRAL' : 'BEARISH') : 'BULLISH';
      return {
        fundamentalBias: bias,
        biasConfidence: 76,
        keyCatalysts: [
          `Indeks Dolar AS (DXY) berada di level ${price.toFixed(2)}, menguji batas psikologis 100 di tengah penyesuaian ekspektasi siklus The Fed.`,
          `Imbal hasil US 10-Year di level ${macroContext.us10y.toFixed(2)}% memberikan bantalan yield differential dibanding mata uang G10 lainnya.`,
          'Pergeseran aliran modal global menuju komoditas keras dan instrumen lindung nilai menekan dominasi fiat likuiditas murni.',
        ],
        macroDrivers: [
          { factor: 'Yield Differential AS vs Global', description: `Spread bunga acuan AS tetap atraktif dengan yield 10Y di ${macroContext.us10y.toFixed(2)}%.`, impact: 'positive' },
          { factor: 'Sentimen Geopolitik Safe-Haven', description: 'Dolar bersaing dengan Emas sebagai instrumen pelarian risiko utama.', impact: 'neutral' },
          { factor: 'Defisit Fiskal & Penerbitan Utang AS', description: 'Suplai surat utang Departemen Keuangan AS yang masif menyerap likuiditas USD.', impact: 'positive' },
        ],
        microDrivers: [
          { label: 'Posisi DXY', value: `${price.toFixed(2)}`, note: `Pergerakan harian: ${change24hPercent > 0 ? '+' : ''}${change24hPercent}%` },
          { label: 'Carry Trade Score', value: '+4.2% Rata-rata', note: 'Yield advantage tetap positif vs JPY & CHF' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: '+12,400 Kontrak (Net Long moderat)',
          weeklyFlowTrend: 'Konsolidasi taktis manajer investasi global',
          liquidityCondition: 'Maksimal (Deep Interbank FX)',
        },
      };
    }

    case 'spx': {
      // S&P 500
      const bias = isUp ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 74,
        keyCatalysts: [
          `S&P 500 diperdagangkan di level ${price.toLocaleString()}, mencerminkan ketahanan laba korporasi teknologi mega-cap.`,
          `Kenaikan harga minyak ($102+) dan yield 10Y (${macroContext.us10y.toFixed(2)}%) menjadi beban ganda bagi valuasi kelipatan P/E ekuitas.`,
          'Belanja modal (CapEx) infrastruktur komputasi kecerdasan buatan (AI hyperscalers) terus menjadi motor pertumbuhan EPS.',
        ],
        macroDrivers: [
          { factor: 'Pertumbuhan Laba Bersih (EPS)', description: 'Konsensus memproyeksikan ekspansi laba konstituen indeks sebesar +9.8% YoY.', impact: 'positive' },
          { factor: 'Equity Risk Premium (ERP)', description: `ERP terkompresi karena yield obligasi bebas risiko (${macroContext.us10y.toFixed(2)}%) sangat kompetitif.`, impact: 'negative' },
          { factor: 'Likuiditas Pasar Uang MMF', description: 'Dana pasar uang mencapai rekor $6.4T, berpotensi menjadi modal rotasi ke ekuitas saat suku bunga turun.', impact: 'positive' },
        ],
        microDrivers: [
          { label: 'Indeks VIX Volatilitas', value: `${macroContext.vix.toFixed(1)}`, note: macroContext.vix > 20 ? 'Volatilitas meningkat' : 'Kondisi pasar teratur' },
          { label: 'Buyback Korporasi', value: '$950 Miliar/Tahun', note: 'Penopang struktural penurunan supply saham beredar' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: 'Net Long moderat pada E-mini S&P futures',
          weeklyFlowTrend: 'Inflow reksa dana indeks pasif stabil',
          liquidityCondition: 'Tertinggi di pasar modal global',
        },
      };
    }

    case 'nasdaq':
    case 'ndx': {
      // Nasdaq 100 (NDX)
      const bias = isUp ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 77,
        keyCatalysts: [
          `Indeks teknologi Nasdaq diperdagangkan di level ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, merefleksikan ekspansi kuat sektor semikonduktor & adopsi enterprise AI.`,
          `Sensitivitas terhadap kurva imbal hasil obligasi AS (${macroContext.us10y.toFixed(2)}%) tetap tinggi mengingat struktur durasi panjang saham-saham bertumbuh (growth stocks).`,
          'Realisasi pendapatan kuartalan emiten megacap Big Tech (Magnificent 7) melampaui ekspektasi konsensus Wall Street.',
        ],
        macroDrivers: [
          { factor: 'Sensitivitas Duration Suku Bunga', description: `Tingkat suku bunga diskonto mengacu pada yield 10Y (${macroContext.us10y.toFixed(2)}%) untuk valuasi DCF.`, impact: macroContext.us10y > 4.3 ? 'negative' : 'positive' },
          { factor: 'Margin Operasional Software & Cloud', description: 'Free cash flow margin rata-rata konstituen top-10 berada di level solid >28%.', impact: 'positive' },
          { factor: 'Belanja Modal CapEx Kecerdasan Buatan', description: 'CapEx gabungan hyperscaler komputasi awan diproyeksikan melampaui $220 Miliar.', impact: 'positive' },
        ],
        microDrivers: [
          { label: 'Forward P/E NDX', value: `${(price / 1020).toFixed(1)}x`, note: 'Valuasi premi premium didukung oleh pertumbuhan EPS tahunan +16%' },
          { label: 'SOX Semiconductor Index', value: 'Trend Bullish Kuat', note: 'Leading indicator permintaan chip komputasi canggih' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: 'Net Long institusional pada E-mini Nasdaq futures',
          weeklyFlowTrend: 'Arus dana masuk (inflow) ETF QQQ & XLK menguat',
          liquidityCondition: 'Sangat Likuid di bursa NASDAQ & CME',
        },
      };
    }

    case 'btcusd': {
      // Bitcoin
      const bias = price > 75000 ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 78,
        keyCatalysts: [
          `Bitcoin diperdagangkan kuat di kisaran $${price.toLocaleString()} dengan serapan arus modal institusional ETF Spot yang konsisten.`,
          'Struktur pasokan pasca-Halving ke-4 mulai menciptakan defisit pasokan struktural di bursa OTC institusional.',
          `Tingginya imbal hasil obligasi AS (${macroContext.us10y.toFixed(2)}%) membatasi laju spekulasi ritel agresif, namun alokasi korporasi tetap meningkat.`,
        ],
        macroDrivers: [
          { factor: 'Arus Modal Bersih ETF Spot AS', description: 'AUM produk ETF Bitcoin institusional berada di level tertinggi sepanjang masa.', impact: 'positive' },
          { factor: 'Likuiditas Global M2', description: 'Ekspansi suplai uang bank sentral global secara historis memicu siklus kenaikan Bitcoin.', impact: 'positive' },
          { factor: 'Kondisi Regulasi & Kustodi', description: 'Kejelasan kerangka regulasi di AS dan Eropa membuka pintu masuk dana pensiun.', impact: 'positive' },
        ],
        microDrivers: [
          { label: 'Dominasi Pasar (BTC.D)', value: '59.4%', note: 'Likuiditas terkonsentrasi di aset blue-chip kripto' },
          { label: 'Funding Rate Perpetual', value: '+0.008%', note: 'Leverage pasar derivatif dalam kondisi sehat dan tidak overheating' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: 'CME Bitcoin Futures OI melampaui $14.5 Miliar',
          weeklyFlowTrend: 'Akumulasi hedge fund multi-strategi & family office',
          liquidityCondition: 'Sangat Dalam di bursa spot teregulasi & buku order institusi',
        },
      };
    }

    case 'brent': {
      // Brent Crude
      const bias = price > 90 ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 72,
        keyCatalysts: [
          `Harga minyak patokan Brent diperdagangkan di level $${price.toFixed(2)}/barel, merefleksikan ketatnya pasokan fisik laut utara dan rute tanker global.`,
          'Disiplin kuota aliansi OPEC+ dan risiko gangguan logistik maritim menjaga premi risiko geopolitik tetap tinggi.',
          'Kebutuhan persediaan musiman kilang global menyerap suplai minyak mentah non-OPEC.',
        ],
        macroDrivers: [
          { factor: 'Premi Risiko Maritim Global', description: 'Premi rute pengapalan tanker menopang harga Brent dibanding WTI.', impact: 'positive' },
          { factor: 'Disiplin Kuota OPEC+', description: 'Arab Saudi dan aliansi menunda kenaikan produksi guna menjaga stabilitas harga.', impact: 'positive' },
          { factor: 'Elastisitas Permintaan Industri', description: 'Tingginya harga energi memicu kekhawatiran beban biaya transportasi dunia.', impact: 'negative' },
        ],
        microDrivers: [
          { label: 'Brent-WTI Spread', value: '+$4.15/barel', note: 'Spread ekspor seimbang' },
          { label: 'Kapasitas Cadangan OPEC+', value: '~4.8 Juta Barel/Hari', note: 'Bantalan pasokan darurat dunia' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: '+210,000 Kontrak (Net Long ICE Futures)',
          weeklyFlowTrend: 'Akumulasi hedge fund komoditas global',
          liquidityCondition: 'Sangat Likuid di ICE London',
        },
      };
    }

    case 'copper': {
      // Copper
      const bias = price > 5.0 ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 75,
        keyCatalysts: [
          `Tembaga (HG Copper) bertengger di level $${price.toFixed(4)}/lb, didorong oleh konsumsi masif infrastruktur data center AI dan elektrifikasi.`,
          'Ketatnya pasokan konsentrat tambang global menekan marjin peleburan (TC/RC) mendekati rekor terendah.',
          'Stimulus pembangunan jaringan listrik pintar (smart grid) di Asia dan Amerika menyerap persediaan gudang.',
        ],
        macroDrivers: [
          { factor: 'Kebutuhan AI Data Center', description: 'Setiap gigawatt komputasi AI membutuhkan ~30 ton konduktor tembaga murni.', impact: 'positive' },
          { factor: 'Transisi Energi & Grid', description: 'Investasi jaringan listrik global menjadi motor konsumsi struktural jangka panjang.', impact: 'positive' },
          { factor: 'Suku Bunga & Biaya Gudang', description: 'Tingginya biaya modal menahan spekulan menimbun stok tanpa kebutuhan riil.', impact: 'neutral' },
        ],
        microDrivers: [
          { label: 'Stok Gudang LME & SHFE', value: 'Tren Penurunan Bersih', note: 'Permintaan pabrikan riil tinggi' },
          { label: 'Biaya Pengolahan TC/RC', value: 'Kritis Rendah', note: 'Kekurangan pasokan konsentrat bijih' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: '+46,800 Kontrak (Net Long COMEX)',
          weeklyFlowTrend: 'Inflow institusi manufaktur & sovereign fund',
          liquidityCondition: 'Tinggi di bursa COMEX & LME',
        },
      };
    }

    case 'eurusd': {
      // EUR/USD
      const bias = price > 1.12 ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 68,
        keyCatalysts: [
          `Pasangan EUR/USD diperdagangkan di level ${price.toFixed(5)}, mencerminkan kalkulasi selisih suku bunga The Fed vs ECB.`,
          `Suku bunga ECB di level 3.25% dengan sinyal pelonggaran bertahap di tengah deselerasi inflasi zona euro.`,
          `Kekuatan DXY di level ${macroContext.dxy.toFixed(2)} membatasi momentum kenaikan Euro.`,
        ],
        macroDrivers: [
          { factor: 'Spread Bunga The Fed vs ECB', description: 'Selisih suku bunga deposito AS tetap memberikan yield premium vs Euro.', impact: 'negative' },
          { factor: 'Pertumbuhan Jerman & Zona Euro', description: 'Indikator PMI manufaktur Eropa menunjukkan tanda-tanda stabilisasi bertahap.', impact: 'positive' },
          { factor: 'Harga Gas TTF Eropa', description: 'Stabilitas biaya energi meringankan beban defisit transaksi berjalan kawasan euro.', impact: 'positive' },
        ],
        microDrivers: [
          { label: 'ECB Deposit Rate', value: '3.25%', note: 'Stance Dovish terukur' },
          { label: 'Spread Bund 10Y vs UST 10Y', value: '-245 bps', note: 'Dolar masih memiliki keunggulan imbal hasil' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: '+18,200 Kontrak (Net Long moderat)',
          weeklyFlowTrend: 'Aliran dana korporasi repatriasi Eropa',
          liquidityCondition: 'Maksimum (Pasangan FX Paling Likuid)',
        },
      };
    }

    case 'gbpusd': {
      // GBP/USD
      const bias = isUp ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 66,
        keyCatalysts: [
          `GBP/USD berada di kisaran ${price.toFixed(4)}, didukung oleh kehati-hatian Bank of England dalam memangkas suku bunga acuan (5.00%).`,
          'Kekakuan inflasi sektor jasa Inggris (services CPI) membatasi laju siklus pemotongan bunga agresif oleh Andrew Bailey.',
          'Sentimen fiskal dan penerbitan surat utang Gilt menjadi fokus pemantauan manajer aset institusi.',
        ],
        macroDrivers: [
          { factor: 'Suku Bunga Bank of England', description: 'Bank Rate 5.00% mempertahankan daya tarik yield poundsterling.', impact: 'positive' },
          { factor: 'Inflasi Sektor Jasa UK', description: 'Tekanan upah nominal yang bertahan di atas 4.8% menuntut moneter ketat.', impact: 'positive' },
          { factor: 'Kekuatan DXY Global', description: `Dolar AS di level ${macroContext.dxy.toFixed(2)} membatasi ruang reli Sterling.`, impact: 'negative' },
        ],
        microDrivers: [
          { label: 'UK 10Y Gilt Yield', value: '4.42%', note: 'Mencerminkan premi risiko fiskal' },
          { label: 'Pertumbuhan Upah UK', value: '+4.9% YoY', note: 'Faktor utama kehati-hatian BOE' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: '+28,400 Kontrak (Net Long institusional)',
          weeklyFlowTrend: 'Konsolidasi taktis manajer dana London',
          liquidityCondition: 'Sangat Tinggi pada jam perdagangan London-New York',
        },
      };
    }

    case 'usdjpy': {
      // USD/JPY
      const bias = price > 150 ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 74,
        keyCatalysts: [
          `USD/JPY bertengger di level ${price.toFixed(3)}, dipengaruhi oleh selisih imbal hasil US Treasury 10Y (${macroContext.us10y.toFixed(2)}%) terhadap JGB 10Y.`,
          'Gubernur BOJ Kazuo Ueda mempertahankan komitmen normalisasi suku bunga jika tren upah riil terus bertumbuh positif.',
          'Pelaku pasar mewaspadai potensi intervensi verbal maupun pasar terbuka oleh Kementerian Keuangan Jepang (MoF).',
        ],
        macroDrivers: [
          { factor: 'Selisih Imbal Hasil AS - Jepang', description: `Spread US10Y (${macroContext.us10y.toFixed(2)}%) vs JGB 10Y (~0.98%) masih menopang carry trade.`, impact: 'positive' },
          { factor: 'Normalisasi Moneter BOJ', description: 'Ekspektasi kenaikan suku bunga BOJ ke 0.50% menjadi penahan laju pelemahan Yen.', impact: 'negative' },
          { factor: 'Biaya Impor Energi Jepang', description: 'Tingginya harga minyak dunia ($100+) memperlebar defisit neraca perdagangan Jepang.', impact: 'positive' },
        ],
        microDrivers: [
          { label: 'Level Intervensi MoF', value: '155 - 160 JPY', note: 'Ambang batas kewaspadaan otoritas Jepang' },
          { label: 'JGB 10Y Yield', value: '0.98%', note: 'Level tertinggi sejak satu dekade' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: 'Net Short JPY menyusut pasca kalibrasi carry trade',
          weeklyFlowTrend: 'Aliran dana hedging eksportir Jepang',
          liquidityCondition: 'Sangat Dalam pada sesi Tokyo & New York',
        },
      };
    }

    case 'dax': {
      // DAX 40
      const bias = isUp ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 70,
        keyCatalysts: [
          `Indeks DAX 40 Jerman melaju di level ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}, didukung oleh eksposur emiten multinasional di luar Eropa.`,
          'Siklus pemangkasan suku bunga oleh ECB memberikan stimulus likuiditas bagi korporasi manufaktur dan industri.',
          'Valuasi kelipatan P/E DAX menawarkan diskon menarik dibandingkan indeks ekuitas Wall Street.',
        ],
        macroDrivers: [
          { factor: 'Suku Bunga Acuan ECB', description: 'Deposit Facility Rate 3.25% menurunkan beban pembiayaan utang korporasi.', impact: 'positive' },
          { factor: 'Pendapatan Global Emiten DAX', description: '>70% pendapatan konstituen berasal dari pasar internasional di luar Jerman.', impact: 'positive' },
          { factor: 'Biaya Energi Industri', description: 'Harga gas alam industri Eropa terpantau stabil menjaga marjin produksi kimia & otomotif.', impact: 'positive' },
        ],
        microDrivers: [
          { label: 'Forward P/E DAX', value: '14.2x', note: 'Diskon valuasi signifikan vs S&P 500 (21.8x)' },
          { label: 'Dividend Yield Konsensus', value: '3.3%', note: 'Daya tarik defensif bagi investor institusi' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: 'Net Long moderat pada Eurex DAX Futures',
          weeklyFlowTrend: 'Inflow reksa dana ekuitas Eropa pasif',
          liquidityCondition: 'Tinggi pada sesi perdagangan Eropa',
        },
      };
    }

    case 'nikkei': {
      // Nikkei 225
      const bias = isUp ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 73,
        keyCatalysts: [
          `Indeks Nikkei 225 berada di level ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}, didorong oleh reformasi tata kelola Tokyo Stock Exchange (TSE).`,
          'Aksi korporasi buyback saham dan kenaikan rasio pembayaran dividen mencapai rekor tertinggi baru.',
          'Peralihan dana domestik Jepang dari tabungan tunai ke investasi ekuitas melalui program NISA memperkuat basis pemodal lokal.',
        ],
        macroDrivers: [
          { factor: 'Pelemahan Yen (USD/JPY di 154+)', description: 'Mendongkrak profitabilitas repatriasi korporasi raksasa ekspor Jepang.', impact: 'positive' },
          { factor: 'Mandat Efisiensi Modal TSE', description: 'Emiten didorong meningkatkan rasio P/B di atas 1.0x dan ROE >8%.', impact: 'positive' },
          { factor: 'Aliran Modal Asing', description: 'Manajer investasi global terus memperbesar bobot alokasi pasar saham Jepang.', impact: 'positive' },
        ],
        microDrivers: [
          { label: 'Forward P/E Nikkei', value: '16.8x', note: 'Valuasi wajar didukung kenaikan EPS konsensus +12%' },
          { label: 'Share Buyback Korporasi', value: '¥11.5 Triliun/Tahun', note: 'Rekor buyback tertinggi sepanjang masa' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: 'Institusi global mempertahankan posisi Net Buy',
          weeklyFlowTrend: 'Akumulasi via instrumen Nikkei 225 & TOPIX Futures',
          liquidityCondition: 'Sangat Tinggi pada sesi perdagangan Tokyo',
        },
      };
    }

    case 'ethusd': {
      // Ethereum
      const bias = price > 2400 ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 70,
        keyCatalysts: [
          `Ethereum diperdagangkan di kisaran $${price.toLocaleString()}, mencerminkan dominasi sebagai platform smart contract dan penyelesaian Layer-2 terbesar.`,
          'Arus institusional melalui produk ETF Spot ETH memberikan aliran modal jangka panjang yang teratur.',
          'Pertumbuhan ekosistem DeFi dan aset dunia nyata (RWA tokenization) memperkuat utilitas fundamental jaringan.',
        ],
        macroDrivers: [
          { factor: 'Staking Yield Ethereum', description: 'Imbal hasil staking jaringan ~3.4% memberikan aliran kas riil bagi pemegang token.', impact: 'positive' },
          { factor: 'Aktivitas Ekosistem Layer-2', description: 'Volume transaksi di jaringan L2 (Base, Arbitrum) menopang permintaan gas fee Ethereum.', impact: 'positive' },
          { factor: 'Dinamika Likuiditas Kripto Global', description: `Terkorelasi dengan sentimen Bitcoin dan selera risiko pasar digital.`, impact: 'positive' },
        ],
        microDrivers: [
          { label: 'Total Value Locked (TVL)', value: '$52.4 Miliar', note: 'Dominasi likuiditas smart contract 58%' },
          { label: 'Staked ETH Ratio', value: '29.2% dari Total Pasokan', note: 'Pasokan beredar cair terkunci di validator' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: 'CME Ether Futures Open Interest stabil di $1.8 Miliar',
          weeklyFlowTrend: 'Inflow kumulatif ETF Spot institusi',
          liquidityCondition: 'Sangat Likuid di bursa spot dan derivatif teregulasi',
        },
      };
    }

    case 'btcd':
    case 'btcdom': {
      // Bitcoin Dominance
      const bias = price > 58 ? 'BULLISH' : 'NEUTRAL';
      return {
        fundamentalBias: bias,
        biasConfidence: 76,
        keyCatalysts: [
          `Dominasi pasar Bitcoin berada di level ${price.toFixed(2)}%, mencerminkan konsentrasi modal institusi pada aset kripto berkapitalisasi terbesar.`,
          'Dalam fase makro suku bunga tinggi, likuiditas memprioritaskan aset berkarakteristik cadangan moneter seperti Bitcoin.',
          'Pertumbuhan produk ETF spot teregulasi memusatkan alokasi baru institusional langsung ke BTC.',
        ],
        macroDrivers: [
          { factor: 'Konsentrasi Modal Institusi', description: 'Arus dana pensiun dan korporasi mengalir mayoritas ke Bitcoin dibanding altcoins.', impact: 'positive' },
          { factor: 'Pasokan Inflasi Token Altcoin', description: 'Jadwal token unlock besar menekan kapitalisasi pasar altcoin relatif terhadap BTC.', impact: 'positive' },
        ],
        microDrivers: [
          { label: 'Rentang Siklus Dominasi', value: '58% - 62%', note: 'Area dominasi tertinggi sejak siklus 2021' },
          { label: 'Kekuatan Buku Order BTC', value: 'Terdalam di Industri', note: 'Slippage minimal untuk transaksi institusi' },
        ],
        institutionalPositioning: {
          cotNetSpeculative: 'Alokasi institusional memprioritaskan 80-85% porsi BTC',
          weeklyFlowTrend: 'Flight to quality dalam ekosistem aset digital',
          liquidityCondition: 'Representasi agregat bobot pasar kripto global',
        },
      };
    }

    default:
      return {};
  }
}
