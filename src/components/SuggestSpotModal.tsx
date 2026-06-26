import React, { useState } from 'react';
import { X, Sparkles, MapPin, AlignLeft, ShieldCheck, Heart } from 'lucide-react';
import { SuggestedSpot } from '../types';

interface SuggestSpotModalProps {
  onClose: () => void;
  onSubmit: (spot: Omit<SuggestedSpot, 'id' | 'created_at'>) => Promise<void>;
  userEmail: string;
}

export const SuggestSpotModal: React.FC<SuggestSpotModalProps> = ({
  onClose,
  onSubmit,
  userEmail,
}) => {
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [description, setDescription] = useState('');
  const [quietLevel, setQuietLevel] = useState<'silent' | 'quiet' | 'moderate' | 'collaborative'>('quiet');
  const [outlets, setOutlets] = useState<'none' | 'few' | 'plentiful'>('few');
  const [wifiQuality, setWifiQuality] = useState<'poor' | 'good' | 'excellent'>('good');
  const [openLate, setOpenLate] = useState(false);
  const [foodNearby, setFoodNearby] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a spot name.');
      return;
    }
    if (!building.trim()) {
      setErrorMsg('Please enter the campus building.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please provide a brief description.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await onSubmit({
        name: name.trim(),
        building: building.trim(),
        description: description.trim(),
        quietLevel,
        outlets,
        wifiQuality,
        openLate,
        foodNearby,
        user_email: userEmail,
      });
      setSuccessMsg('Thank you! Your spot suggestion has been recorded successfully.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit spot suggestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col my-8">
        {/* Decorative Top Green Bar */}
        <div className="h-2.5 bg-emerald-800" />

        {/* Modal Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/80 hover:bg-slate-100 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 md:p-8 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-1.5 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
              <Sparkles className="w-6 h-6 fill-emerald-100" />
            </div>
            <h3 className="font-sans font-bold text-xl text-slate-800 tracking-tight mt-2">
              Suggest a Campus Study Spot
            </h3>
            <p className="text-xs text-slate-500 font-sans max-w-sm leading-relaxed">
              Found a hidden nook or great collaborative desk on campus? Suggest it so other Green Wave students can find it!
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl font-sans">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl font-sans font-semibold">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            {/* Spot Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Spot Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Sparkles className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 3rd Floor quiet alcove near windows"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Building Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Tulane Building / Quad
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="e.g. Tilton Hall or Newcomb Quad"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                What makes this spot great?
              </label>
              <div className="relative">
                <span className="absolute top-3 left-3 text-slate-400">
                  <AlignLeft className="w-4 h-4" />
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the atmosphere, seats, and any tips (e.g., 'Very chilly, bring a jacket! Highly spacious tables perfect for drawing or team layouts.')"
                  rows={3}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans resize-none"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Core Metrics Grids */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quietness Level */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Quietness
                </label>
                <select
                  value={quietLevel}
                  onChange={(e) => setQuietLevel(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                  disabled={loading}
                >
                  <option value="silent">🤫 Silent</option>
                  <option value="quiet">🔈 Quiet</option>
                  <option value="moderate">💬 Moderate</option>
                  <option value="collaborative">🗣️ Collaborative</option>
                </select>
              </div>

              {/* Outlet Density */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Outlets
                </label>
                <select
                  value={outlets}
                  onChange={(e) => setOutlets(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                  disabled={loading}
                >
                  <option value="none">❌ None</option>
                  <option value="few">🔌 Few</option>
                  <option value="plentiful">⚡ Plentiful</option>
                </select>
              </div>

              {/* WiFi Speed */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Wi-Fi Quality
                </label>
                <select
                  value={wifiQuality}
                  onChange={(e) => setWifiQuality(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                  disabled={loading}
                >
                  <option value="poor">📶 Poor</option>
                  <option value="good">📶 Good</option>
                  <option value="excellent">🚀 Excellent</option>
                </select>
              </div>
            </div>

            {/* Checkbox toggles */}
            <div className="flex gap-6 py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={openLate}
                  onChange={(e) => setOpenLate(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 border-slate-300 accent-emerald-800"
                  disabled={loading}
                />
                <span className="text-xs text-slate-700 font-sans">🌙 Open Late</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={foodNearby}
                  onChange={(e) => setFoodNearby(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 border-slate-300 accent-emerald-800"
                  disabled={loading}
                />
                <span className="text-xs text-slate-700 font-sans">🍔 Food/Café Nearby</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-800 hover:bg-emerald-900 border border-emerald-950/20 text-white font-sans text-xs font-semibold py-3 rounded-xl transition duration-200 shadow-sm mt-2 flex items-center justify-center gap-2 disabled:bg-emerald-800/60"
            >
              <span>{loading ? 'Submitting suggestion...' : 'Submit Study Spot'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
