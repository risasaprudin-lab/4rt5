import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { EconomicEvent } from '../types';

interface EconomicCalendarProps {
  events: EconomicEvent[];
  onSimulateEvent?: (event: EconomicEvent) => void;
}

export const EconomicCalendar: React.FC<EconomicCalendarProps> = ({
  events,
  onSimulateEvent,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH' | 'MED'>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(events[0]?.id || null);
  const [countdown, setCountdown] = useState<string>('02:45:12');

  // Simulated live countdown to next high-impact release (CPI)
  useEffect(() => {
    let secondsLeft = 2 * 3600 + 45 * 60 + 12;
    const interval = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      const h = Math.floor(secondsLeft / 3600)
        .toString()
        .padStart(2, '0');
      const m = Math.floor((secondsLeft % 3600) / 60)
        .toString()
        .padStart(2, '0');
      const s = (secondsLeft % 60).toString().padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter((ev) => {
    if (selectedCurrency !== 'ALL' && ev.currency !== selectedCurrency) return false;
    if (impactFilter !== 'ALL' && ev.impact !== impactFilter) return false;
    return true;
  });

  const nextHighImpact = events.find((e) => e.status === 'upcoming' && e.impact === 'HIGH');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      {/* Calendar Header & Countdown Alert */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-700/50 text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Kalender Rilis Data Ekonomi Makro Real-Time
            </h2>
            <p className="text-xs text-slate-400">
              Proyeksi konsensus, kejutan data (surprise indicator), dan peta transmisi ke pasar
            </p>
          </div>
        </div>

        {/* Countdown to Next Key Catalyst */}
        {nextHighImpact && (
          <div className="flex items-center space-x-2.5 bg-rose-950/40 border border-rose-800/80 px-3.5 py-1.5 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></div>
            <div className="text-xs">
              <span className="text-rose-300 font-medium">Katalis Berikutnya:</span>{' '}
              <strong className="text-rose-200">{nextHighImpact.title}</strong>
            </div>
            <div className="font-mono font-bold text-xs text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
              {countdown}
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
        {/* Currency filters */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-slate-500 px-2 font-mono text-[11px]">MATA UANG:</span>
          {['ALL', 'USD', 'EUR', 'GBP', 'CNY'].map((curr) => (
            <button
              key={curr}
              onClick={() => setSelectedCurrency(curr)}
              className={`px-2.5 py-1 rounded transition cursor-pointer font-mono font-medium ${
                selectedCurrency === curr
                  ? 'bg-slate-700 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>

        {/* Impact filters */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-slate-500 px-2 font-mono text-[11px]">DAMPAK:</span>
          {(['ALL', 'HIGH', 'MED'] as const).map((imp) => (
            <button
              key={imp}
              onClick={() => setImpactFilter(imp)}
              className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                impactFilter === imp
                  ? imp === 'HIGH'
                    ? 'bg-rose-900 text-rose-200'
                    : 'bg-amber-900 text-amber-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {imp}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.map((event) => {
          const isExpanded = expandedEventId === event.id;

          return (
            <div
              key={event.id}
              className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg overflow-hidden transition"
            >
              {/* Event Row */}
              <div
                onClick={() =>
                  setExpandedEventId(isExpanded ? null : event.id)
                }
                className="p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
              >
                {/* Left: Time, Flag, Title */}
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="text-center font-mono text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <div className="font-bold text-slate-200">{event.time}</div>
                    <div className="text-[10px] text-slate-500">{event.date}</div>
                  </div>

                  <span className="text-lg" title={event.country}>
                    {event.countryFlag}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        [{event.currency}]
                      </span>
                      <h3 className="font-semibold text-sm text-slate-200 truncate">
                        {event.title}
                      </h3>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                          event.impact === 'HIGH'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {event.impact} IMPACT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: Previous vs Forecast vs Actual */}
                <div className="flex items-center space-x-4 font-mono text-xs">
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">PREVIOUS</span>
                    <span className="text-slate-400">{event.previous}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">FORECAST</span>
                    <span className="text-cyan-400 font-semibold">{event.forecast}</span>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <span className="text-slate-500 text-[10px] block">ACTUAL</span>
                    {event.actual ? (
                      <span className="text-emerald-400 font-bold bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800">
                        {event.actual}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic">Menunggu...</span>
                    )}
                  </div>

                  <button className="text-slate-400 hover:text-slate-200 p-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Fundamental Impact Transmission Panel */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-900/60 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2">
                    {/* Scenario 1: If Higher */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded p-3">
                      <div className="flex items-center space-x-1.5 font-bold text-rose-400 mb-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Jika Rilis Lebih Tinggi dari Konsensus (Surprise Up)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {event.fundamentalImpact.ifHigher}
                      </p>
                    </div>

                    {/* Scenario 2: If Lower */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded p-3">
                      <div className="flex items-center space-x-1.5 font-bold text-emerald-400 mb-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Jika Rilis Lebih Rendah dari Konsensus (Surprise Down)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {event.fundamentalImpact.ifLower}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                    <div className="text-[11px] text-slate-400">
                      <strong className="text-slate-300 font-semibold">
                        Transmisi Pasar:
                      </strong>{' '}
                      {event.fundamentalImpact.marketTransmission}
                    </div>

                    {onSimulateEvent && (
                      <button
                        onClick={() => onSimulateEvent(event)}
                        className="flex items-center space-x-1.5 px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-xs font-semibold transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Simulasikan Dampak dengan AI</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
