import React, { useState, useEffect } from 'react';
import { Radio, Tv, Volume2, VolumeX, Activity, ShieldCheck, Zap } from 'lucide-react';

interface LiveTelemetryHudBarProps {
  isCrtScanlines: boolean;
  onToggleCrt: () => void;
  activeRepoName: string;
  commitsCount: number;
}

export const LiveTelemetryHudBar: React.FC<LiveTelemetryHudBarProps> = ({
  isCrtScanlines,
  onToggleCrt,
  activeRepoName,
  commitsCount,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [eventIndex, setEventIndex] = useState(0);

  const telemetryEvents = [
    `Ingest: Mainline commit pipeline active on ${activeRepoName}`,
    'Radar Scan: All 6 engineering health dimensions nominal',
    'Cadence Engine: Dual bi-axial review & PR velocity synced',
    'Chronometer: 24h diurnal developer peak detected (15:00-18:00 UTC)',
    'Streak Matrix: 52-week activity grid updated in real-time',
  ];

  // Cycle through simulated movie-style real-time HUD events
  useEffect(() => {
    const timer = setInterval(() => {
      setEventIndex((prev) => (prev + 1) % telemetryEvents.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [telemetryEvents.length]);

  // Audio sonar ping on interval if sound is enabled
  useEffect(() => {
    if (!soundEnabled) return;

    const playPing = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(960, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.28);
        gain.gain.setValueAtTime(0.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.29);
      } catch {}
    };

    const interval = setInterval(playPing, 6000);
    playPing(); // Initial ping on enable
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  return (
    <div className="relative bg-zinc-950/90 border border-zinc-800/90 rounded-xl px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shadow-black/80 font-mono text-xs overflow-hidden">
      {/* Sci-Fi Reticles */}
      <span className="hud-corner-tl opacity-60" />
      <span className="hud-corner-tr opacity-60" />
      <span className="hud-corner-bl opacity-60" />
      <span className="hud-corner-br opacity-60" />

      {/* Left: Active Live Status & Event Ticker */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-bold tracking-wider text-[11px] uppercase">
            LIVE HUD
          </span>
        </div>

        <div className="h-3.5 w-px bg-zinc-800 hidden sm:block" />

        {/* Dynamic Telemetry Event Ticker */}
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Radio className="w-3.5 h-3.5 text-zinc-500 shrink-0 animate-pulse" />
          <span className="text-zinc-300 text-[11px] truncate select-none">
            {telemetryEvents[eventIndex]}
          </span>
        </div>
      </div>

      {/* Right: Technical Telemetry stats & Movie Mode Toggles */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        <div className="hidden lg:flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="text-zinc-400">60 FPS</span>
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-400">LATENCY 14ms</span>
          <span className="text-zinc-700">·</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>SYNCED</span>
          </span>
        </div>

        <div className="h-3.5 w-px bg-zinc-800 hidden lg:block" />

        {/* CRT Scanlines Overlay Toggle */}
        <button
          type="button"
          onClick={onToggleCrt}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors border cursor-pointer ${
            isCrtScanlines
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle authentic movie CRT monitor scanline overlay"
        >
          <Tv className="w-3 h-3" />
          <span>CRT Scanlines: {isCrtScanlines ? 'ON' : 'OFF'}</span>
        </button>

        {/* Optional Sonar Ping Audio Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors border cursor-pointer ${
            soundEnabled
              ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300 font-semibold'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle sci-fi sonar ping audio feedback"
        >
          {soundEnabled ? (
            <Volume2 className="w-3 h-3 text-yellow-400 animate-pulse" />
          ) : (
            <VolumeX className="w-3 h-3 text-zinc-500" />
          )}
          <span>Sonar: {soundEnabled ? 'ACTIVE' : 'MUTE'}</span>
        </button>
      </div>
    </div>
  );
};
