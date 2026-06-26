import React from 'react';
import { Filters, StudySpot } from '../types';
import { Search, Volume2, Wifi, BatteryCharging, Check, Clock, Utensils, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
  const quietLevels: StudySpot['quietLevel'][] = ['silent', 'quiet', 'moderate', 'collaborative'];
  const outletOptions: StudySpot['outlets'][] = ['none', 'few', 'plentiful'];
  const wifiQuas: StudySpot['wifiQuality'][] = ['poor', 'good', 'excellent'];

  const toggleQuietLevel = (level: StudySpot['quietLevel']) => {
    const isSelected = filters.quietLevel.includes(level);
    const updated = isSelected
      ? filters.quietLevel.filter((q) => q !== level)
      : [...filters.quietLevel, level];
    onFiltersChange({ ...filters, quietLevel: updated });
  };

  const toggleOutletOption = (option: StudySpot['outlets']) => {
    const isSelected = filters.outlets.includes(option);
    const updated = isSelected
      ? filters.outlets.filter((o) => o !== option)
      : [...filters.outlets, option];
    onFiltersChange({ ...filters, outlets: updated });
  };

  const toggleWifiQuality = (quality: StudySpot['wifiQuality']) => {
    const isSelected = filters.wifiQuality.includes(quality);
    const updated = isSelected
      ? filters.wifiQuality.filter((w) => w !== quality)
      : [...filters.wifiQuality, quality];
    onFiltersChange({ ...filters, wifiQuality: updated });
  };

  const clearAll = () => {
    onFiltersChange({
      quietLevel: [],
      outlets: [],
      wifiQuality: [],
      openLate: false,
      foodNearby: false,
      searchQuery: '',
    });
  };

  const hasActiveFilters =
    filters.quietLevel.length > 0 ||
    filters.outlets.length > 0 ||
    filters.wifiQuality.length > 0 ||
    filters.openLate ||
    filters.foodNearby ||
    filters.searchQuery !== '';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col gap-5 select-none">
      {/* Search Bar Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-4 flex items-center pr-2 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Search Tulane library, buildings, tags (e.g. 'Coffee', 'Academia', 'Group')..."
          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-700 transition"
        />
      </div>

      {/* Advanced Filter Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Quiet Level Filters */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
            🔊 Quiet profile
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quietLevels.map((level) => {
              const isSelected = filters.quietLevel.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleQuietLevel(level)}
                  className={`text-[11px] font-medium font-sans px-2.5 py-1.5 rounded-xl border transition ${
                    isSelected
                      ? 'bg-emerald-800 border-emerald-950/20 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="capitalize">{level}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Outlets Level Filters */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
            🔌 Power Outlet density
          </span>
          <div className="flex flex-wrap gap-1.5">
            {outletOptions.map((opt) => {
              const isSelected = filters.outlets.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOutletOption(opt)}
                  className={`text-[11px] font-medium font-sans px-2.5 py-1.5 rounded-xl border transition ${
                    isSelected
                      ? 'bg-indigo-700 border-indigo-950/20 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="capitalize">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wi-Fi Quality level */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
            ⚡ Wi-Fi Speed level
          </span>
          <div className="flex flex-wrap gap-1.5">
            {wifiQuas.map((qual) => {
              const isSelected = filters.wifiQuality.includes(qual);
              return (
                <button
                  key={qual}
                  type="button"
                  onClick={() => toggleWifiQuality(qual)}
                  className={`text-[11px] font-medium font-sans px-2.5 py-1.5 rounded-xl border transition ${
                    isSelected
                      ? 'bg-sky-600 border-sky-950/20 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="capitalize">{qual}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Boolean Switches & Clear action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap gap-3">
          {/* Open Late Flag */}
          <button
            type="button"
            onClick={() => onFiltersChange({ ...filters, openLate: !filters.openLate })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
              filters.openLate
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>🌙 Open Late</span>
          </button>

          {/* Food Nearby Flag */}
          <button
            type="button"
            onClick={() => onFiltersChange({ ...filters, foodNearby: !filters.foodNearby })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
              filters.foodNearby
                ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>🍔 Food Nearby</span>
          </button>
        </div>

        {/* Clear Filter Trigger */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-[11px] font-semibold font-mono text-emerald-800 hover:text-emerald-950 hover:underline px-2.5 py-1.5 transition flex items-center gap-1 bg-emerald-50 rounded-lg border border-emerald-100"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Reset Active Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
