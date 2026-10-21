import React, { useState, useRef } from 'react';
import { MilestoneItem } from '../types/repo';
import {
  Info,
  Rocket,
  Flame,
  Trophy,
  Tag,
  Box,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Search,
  CheckCircle2,
  GitCommit,
  Layers,
} from 'lucide-react';

interface MilestonesCardProps {
  milestones: MilestoneItem[];
}

export const MilestonesCard: React.FC<MilestonesCardProps> = ({ milestones }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredMilestone, setHoveredMilestone] = useState<MilestoneItem | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Precision icons with tailored accents
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'rocket':
        return <Rocket className="w-4 h-4 text-orange-400 group-hover:text-orange-300 transition-colors" />;
      case 'flame':
        return <Flame className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />;
      case 'trophy':
        return <Trophy className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" />;
      case 'dollar':
        return <DollarSign className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />;
      case 'box':
        return <Box className="w-4 h-4 text-sky-400 group-hover:text-sky-300 transition-colors" />;
      default:
        return <Tag className="w-4 h-4 text-orange-400 group-hover:text-orange-300 transition-colors" />;
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredMilestones = milestones.filter((m) => {
    const matchesCategory =
      activeCategory === 'all' ||
      (activeCategory === 'record' && (m.category === 'record' || m.category === 'spend')) ||
      m.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.badgeLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.date.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-[310px] shadow-sm relative overflow-hidden transition-all duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>Milestones</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                {milestones.length} Landmarks
              </span>
            </h2>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Key historical inflection points & open-source velocity markers
          </p>
        </div>

        {/* Controls: Quick Search, Scroll Navigation, Tooltip */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter..."
              className="w-28 sm:w-36 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-zinc-200 text-[11px] rounded-lg pl-7 pr-2.5 py-1 outline-none transition-colors placeholder:text-zinc-600 font-mono"
            />
          </div>

          {/* Smooth Scroll Navigation */}
          <div className="flex items-center gap-1 border border-zinc-800 rounded-lg p-0.5 bg-zinc-900/60">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Scroll left"
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Scroll right"
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info Tooltip */}
          <div className="relative group/tooltip">
            <button
              type="button"
              aria-label="Milestones info"
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg border border-zinc-800 bg-zinc-900/60"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 top-7 z-50 hidden group-hover/tooltip:block w-56 p-2.5 text-xs bg-black border border-zinc-700 text-slate-200 rounded-lg shadow-2xl pointer-events-none leading-relaxed">
              <p className="font-semibold text-white mb-0.5">Timeline Landmarks</p>
              <p className="text-zinc-400 text-[11px]">
                Critical open-source inflection points including first commit, major contributor milestones, and stable releases.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Milestones Ribbon with Medallion Nodes on continuous wire */}
      <div
        ref={scrollContainerRef}
        className="relative my-auto overflow-x-auto py-2 no-scrollbar scroll-smooth select-none"
      >
        {/* Continuous horizontal timeline rail */}
        <div className="absolute top-[28px] left-6 right-6 h-[2px] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 z-0" />

        <div className="flex items-start justify-between min-w-[780px] px-4 relative z-10 gap-3">
          {filteredMilestones.map((m, index) => {
            const isHovered = hoveredMilestone?.id === m.id;

            return (
              <div
                key={m.id}
                onMouseEnter={() => setHoveredMilestone(m)}
                onMouseLeave={() => setHoveredMilestone(null)}
                className="flex flex-col items-center text-center group cursor-pointer px-1 flex-1 max-w-[145px] transition-all duration-200"
              >
                {/* Timeline Medallion Node (replacing raw orange dot) */}
                <div className="relative z-10 flex items-center justify-center">
                  <div
                    className={`w-9 h-9 rounded-xl bg-zinc-950 border transition-all duration-200 flex items-center justify-center shadow-md relative ${
                      isHovered
                        ? 'border-orange-500 -translate-y-1 scale-105 shadow-[0_0_16px_rgba(254,83,0,0.3)]'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Embedded milestone icon */}
                    {getIcon(m.icon)}

                    {/* Subtle micro index label */}
                    <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 bg-zinc-900 border border-zinc-800 text-[8px] font-mono font-medium text-zinc-500 rounded group-hover:text-orange-400 group-hover:border-orange-500/40 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Vertical connector tick */}
                <div
                  className={`w-px h-2 transition-colors duration-200 ${
                    isHovered ? 'bg-orange-500/60' : 'bg-zinc-800'
                  }`}
                />

                {/* Title */}
                <p
                  className="text-[12px] font-semibold text-zinc-200 group-hover:text-white transition-colors truncate w-full tracking-tight mt-1"
                  title={m.title}
                >
                  {m.title}
                </p>

                {/* Subtitle / Note */}
                <p
                  className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate w-full"
                  title={m.subtitle}
                >
                  {m.subtitle}
                </p>

                {/* Date */}
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5 whitespace-nowrap">
                  {m.date}
                </p>

                {/* Category Pill Tag */}
                <div className="mt-2">
                  <span
                    className={`inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider rounded font-mono uppercase border transition-all duration-200 ${
                      isHovered
                        ? 'bg-orange-500/15 border-orange-500/60 text-orange-400 shadow-sm'
                        : 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {m.badgeLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMilestones.length === 0 && (
          <div className="py-6 text-center text-zinc-500 text-xs font-mono">
            No milestones match &quot;{searchQuery}&quot;.
          </div>
        )}
      </div>

      {/* Dynamic Context Footer */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 font-mono min-h-[24px]">
        {hoveredMilestone ? (
          <div className="flex items-center gap-2 truncate text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="font-semibold text-white">{hoveredMilestone.title}</span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400 truncate">{hoveredMilestone.subtitle}</span>
            <span className="text-zinc-500">•</span>
            <span className="text-orange-400 font-mono">{hoveredMilestone.date}</span>
          </div>
        ) : (
          <span className="text-zinc-500">Timeline spans initial commit to present</span>
        )}
        <span className="text-amber-400/90 font-medium whitespace-nowrap pl-2">
          {filteredMilestones.length} Verified Milestones
        </span>
      </div>
    </div>
  );
};
