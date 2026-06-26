import React from 'react';
import { StudySpot, Review } from '../types';
import { Star, Heart, Volume2, Wifi, BatteryCharging, Clock, Utensils, MessageSquare } from 'lucide-react';

function isSpotOpen(hoursStr: string): boolean {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMin;

    const lower = hoursStr.toLowerCase();
    if (lower.includes('24 hours')) return true;

    const parts = lower.split('-');
    if (parts.length !== 2) return true; // fallback

    const parseTime = (timeStr: string) => {
      let cleaned = timeStr.trim();
      if (cleaned.includes('midnight')) return 24 * 60;
      if (cleaned.includes('noon')) return 12 * 60;

      const isPM = cleaned.includes('pm');
      const isAM = cleaned.includes('am');
      
      cleaned = cleaned.replace(/(am|pm)/g, '').trim();
      const timeParts = cleaned.split(':');
      let hr = parseInt(timeParts[0], 10);
      let min = timeParts[1] ? parseInt(timeParts[1], 10) : 0;

      if (isPM && hr < 12) hr += 12;
      if (isAM && hr === 12) hr = 0;

      return hr * 60 + min;
    };

    const startMinutes = parseTime(parts[0]);
    const endMinutes = parseTime(parts[1]);

    if (endMinutes < startMinutes) {
      if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
        return true;
      }
      return false;
    } else {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  } catch (err) {
    return true; // default to open on error
  }
}

interface SpotCardProps {
  spot: StudySpot;
  reviews: Review[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onSelect: () => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  reviews,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  const [imgSrc, setImgSrc] = React.useState(spot.imageUrl);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgSrc(spot.imageUrl);
    setImgError(false);
  }, [spot.imageUrl]);

  // Calculate average rating dynamically
  const spotReviews = reviews.filter((r) => r.spot_id === spot.id);
  const avgRating =
    spotReviews.length > 0
      ? (spotReviews.reduce((sum, r) => sum + r.rating, 0) / spotReviews.length).toFixed(1)
      : 'New';

  const isOpen = isSpotOpen(spot.hours);

  // Determine sound levels styles
  const getQuietLabelColor = (level: string) => {
    switch (level) {
      case 'silent':
        return 'bg-violet-50 text-violet-700 border-violet-100';
      case 'quiet':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'moderate':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'collaborative':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getQuietIconEmoji = (level: string) => {
    switch (level) {
      case 'silent':
        return '🤫';
      case 'quiet':
        return '🔈';
      case 'moderate':
        return '💬';
      case 'collaborative':
        return '🗣️';
      default:
        return '🔊';
    }
  };

  return (
    <div
      id={`spot-card-${spot.id}`}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Banner with thumbnail and Favorite Button */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          {imgError ? (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center p-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 border border-emerald-500/20">
                <span className="text-lg">📍</span>
              </div>
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">Tulane Study Spot</span>
              <span className="text-[10px] text-slate-400 mt-1 text-center line-clamp-1">{spot.name}</span>
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={spot.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => {
                if (imgSrc === 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5c?auto=format&fit=crop&q=80&w=800') {
                  setImgError(true);
                } else {
                  setImgSrc('https://images.unsplash.com/photo-1498243691581-b145c3f54a5c?auto=format&fit=crop&q=80&w=800');
                }
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Favorite heart icon absolute */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute top-3 right-3 z-10 w-9 h-9 items-center justify-center flex bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-sm text-rose-500 hover:scale-110 active:scale-95 transition-all"
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500' : 'text-slate-600'}`} />
          </button>

          {/* Building Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
            <div>
              <p className="font-mono text-[10px] text-emerald-300 font-bold tracking-wider uppercase drop-shadow">
                {spot.building}
              </p>
              <h3 className="font-sans font-bold text-base text-white truncate drop-shadow">
                {spot.name}
              </h3>
            </div>
            {/* Live Rating Badge value */}
            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-sm flex-shrink-0">
              {spotReviews.length > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{avgRating}</span>
                </>
              ) : (
                <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase">NEW</span>
              )}
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {spot.description}
          </p>

          {/* Dynamic Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {/* Quiet level */}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getQuietLabelColor(
                spot.quietLevel
              )}`}
            >
              {getQuietIconEmoji(spot.quietLevel)} {spot.quietLevel}
            </span>

            {/* Outlets level */}
            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
              🔌 {spot.outlets} Outlets
            </span>

            {/* WiFi speed */}
            <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full">
              ⚡ {spot.wifiQuality} Wi-Fi
            </span>

            {/* Conditional Indicators */}
            {spot.openLate && (
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                🌙 Open Late
              </span>
            )}
            {spot.foodNearby && (
              <span className="text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                🍔 Food Nearby
              </span>
            )}
          </div>

          {/* Secondary Details: Hours */}
          <div className="flex justify-between items-center text-xs text-slate-500 font-sans border-t border-slate-100 pt-3 mt-1.5">
            <span className="flex items-center gap-1.5 flex-wrap">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-sans text-slate-600">{spot.hours}</span>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </span>
            <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{spotReviews.length} reviews</span>
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 pb-4">
        <button
          onClick={onSelect}
          className="w-full bg-emerald-800 hover:bg-emerald-900 border border-emerald-950/20 text-white font-sans text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow active:scale-98 transition-all flex items-center justify-center gap-1.5"
        >
          <span>Explore Spot Details</span>
          <span className="text-[10px]">➜</span>
        </button>
      </div>
    </div>
  );
};
