import React, { useState } from 'react';
import { RepositoryHotspot } from '../types/repo';
import { Info } from 'lucide-react';

interface RepositoryHotspotsCardProps {
  hotspots: RepositoryHotspot[];
}

interface KPIColor {
  name: string;
  label: string;
  hex: string;
  gradientTo: string;
}

// Vibrant colors from the KPI cards:
// 1. Commits: Orange (#f97316 -> #ea580c)
// 2. Turnaround: Cyan (#06b6d4 -> #0284c7)
// 3. PRs: Emerald (#10b981 -> #059669)
// 4. Code Volume: Sky Blue (#38bdf8 -> #0284c7)
// 5. Hotspot Churn: Rose (#f43f5e -> #e11d48)
const KPI_PALETTE: KPIColor[] = [
  {
    name: 'orange',
    label: 'Commits',
    hex: '#f97316',
    gradientTo: '#ea580c',
  },
  {
    name: 'cyan',
    label: 'Turnaround',
    hex: '#06b6d4',
    gradientTo: '#0284c7',
  },
  {
    name: 'emerald',
    label: 'Pull Requests',
    hex: '#10b981',
    gradientTo: '#059669',
  },
  {
    name: 'sky',
    label: 'Code Volume',
    hex: '#38bdf8',
    gradientTo: '#0284c7',
  },
  {
    name: 'rose',
    label: 'Hotspots',
    hex: '#f43f5e',
    gradientTo: '#e11d48',
  },
];

export const RepositoryHotspotsCard: React.FC<RepositoryHotspotsCardProps> = ({ hotspots }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const displayedHotspots = hotspots.slice(0, 7);

  return (
    <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full min-h-[340px] shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">Repository Hotspots</h2>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              Churn
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Top modified directories and code churn</p>
        </div>
        <div className="relative group/tooltip">
          <button
            type="button"
            aria-label="Repository hotspots info"
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <div className="absolute right-0 top-6 z-50 hidden group-hover/tooltip:block w-56 p-2.5 text-xs bg-zinc-950 border border-zinc-700 text-slate-200 rounded-lg shadow-2xl pointer-events-none leading-relaxed">
            <p className="font-semibold text-white mb-1">Code Churn Frequency</p>
            <p className="text-zinc-400 text-[11px]">
              Total revisions authored per directory. High concentrations often signal architectural volatility or high-touch coordination modules.
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal ranked bars with KPI colors (flat right side edges, no end glow) */}
      <div className="flex flex-col justify-center space-y-2.5 my-auto">
        {displayedHotspots.map((item, index) => {
          const color = KPI_PALETTE[index % KPI_PALETTE.length];
          const isHovered = hoveredIdx === index;

          return (
            <div
              key={item.path}
              className="group/row flex items-center gap-3 text-xs transition-colors py-0.5"
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
              title={`${item.path}: ${item.changesCount} revisions (${item.percentage}%)`}
            >
              {/* Directory Path label on left */}
              <div className="w-32 sm:w-36 md:w-40 shrink-0 text-right truncate font-mono text-[11px] text-slate-300 group-hover/row:text-white transition-colors flex items-center justify-end gap-1.5 min-w-0">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="truncate">{item.path}</span>
              </div>

              {/* Horizontal Bar Track */}
              <div
                className="flex-1 bg-zinc-950 border border-zinc-800/90 h-3.5 rounded-l-xs rounded-r-none overflow-hidden flex items-center relative transition-colors group-hover/row:border-zinc-700 min-w-0"
              >
                {/* Main Bar: flat straight right edge, no end glow */}
                <div
                  className="h-full rounded-l-xs rounded-r-none transition-all duration-300"
                  style={{
                    width: `${item.percentage}%`,
                    minWidth: '8px',
                    background: `linear-gradient(90deg, ${color.hex} 0%, ${color.gradientTo} 100%)`,
                    opacity: isHovered ? 1 : 0.9,
                  }}
                />
              </div>

              {/* Revision count on right */}
              <div
                className="w-14 shrink-0 text-right font-mono text-[11px] font-bold text-white tabular-nums transition-colors"
                style={{
                  color: isHovered ? color.hex : '#ffffff',
                }}
              >
                {item.changesCount.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: KPI_PALETTE[0].hex }}
          />
          <span className="truncate">
            Highest concentration: <strong className="text-zinc-200 font-normal">{displayedHotspots[0]?.path}</strong>
          </span>
        </div>
        <span className="text-zinc-500 shrink-0 font-medium ml-2">
          {displayedHotspots[0]?.changesCount || 0} mods
        </span>
      </div>
    </div>
  );
};
