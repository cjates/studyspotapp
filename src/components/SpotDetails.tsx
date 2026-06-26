import React, { useState, useEffect } from 'react';
import { StudySpot, Review, UserProfile } from '../types';
import { Star, Heart, X, MessageSquare, Plus, Check, MapPin, Zap, Coffee, Clock, ShieldCheck, HelpCircle, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface SpotDetailsProps {
  spot: StudySpot;
  reviews: Review[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  currentUser: UserProfile | null;
  onAddReview: (review: Omit<Review, 'id' | 'created_at'>) => Promise<void>;
  onTriggerAuth: () => void;
  isSupabaseActive: boolean;
}

export const SpotDetails: React.FC<SpotDetailsProps> = ({
  spot,
  reviews,
  isFavorite,
  onToggleFavorite,
  onClose,
  currentUser,
  onAddReview,
  onTriggerAuth,
  isSupabaseActive,
}) => {
  const [imgSrc, setImgSrc] = useState(spot.imageUrl);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgSrc(spot.imageUrl);
    setImgError(false);
  }, [spot.imageUrl]);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // AI Summary states
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Review specific dropdown overrides
  const [reviewQuiet, setReviewQuiet] = useState<StudySpot['quietLevel']>(spot.quietLevel);
  const [reviewOutlets, setReviewOutlets] = useState<StudySpot['outlets']>(spot.outlets);

  const spotReviews = reviews.filter((r) => r.spot_id === spot.id);

  // Auto-fetch summary when spot or reviews count change
  useEffect(() => {
    const fetchSummary = async () => {
      // If there are no reviews, we can just show a default starting message
      if (spotReviews.length === 0) {
        setAiSummary('No student reports or reviews available yet to summarize! Be the first to add one below to train the Green Wave AI.');
        setSummaryError(null);
        return;
      }

      setLoadingSummary(true);
      setSummaryError(null);

      try {
        const res = await fetch('/api/gemini/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            spotName: spot.name,
            reviews: spotReviews,
          }),
        });
        const data = await res.json();
        if (data.error && !data.summary) {
          setSummaryError(data.error);
        } else {
          setAiSummary(data.summary);
        }
      } catch (err: any) {
        console.error('Error fetching AI summary:', err);
        setSummaryError('Service request temporarily offline. Click the refresh icon to try again.');
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [spot.id, spotReviews.length]);

  const handleManualRefreshSummary = async () => {
    if (loadingSummary) return;
    setLoadingSummary(true);
    setSummaryError(null);

    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotName: spot.name,
          reviews: spotReviews,
        }),
      });
      const data = await res.json();
      if (data.error && !data.summary) {
        setSummaryError(data.error);
      } else {
        setAiSummary(data.summary);
      }
    } catch (err: any) {
      console.error('Error refreshing AI summary:', err);
      setSummaryError('Service request temporarily offline. Please try again.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const ratingSum = spotReviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = spotReviews.length > 0 ? (ratingSum / spotReviews.length).toFixed(1) : 'New';

  // Calculate detailed aggregated attributes based on student reports
  const silentReportsCount = spotReviews.filter(r => r.quiet_level === 'silent').length;
  const quietReportsCount = spotReviews.filter(r => r.quiet_level === 'quiet').length;
  const modReportsCount = spotReviews.filter(r => r.quiet_level === 'moderate').length;
  const collabReportsCount = spotReviews.filter(r => r.quiet_level === 'collaborative').length;

  const plentifulOutletsReports = spotReviews.filter(r => r.outlets === 'plentiful').length;
  const fewOutletsReports = spotReviews.filter(r => r.outlets === 'few').length;
  const noOutletsReports = spotReviews.filter(r => r.outlets === 'none').length;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onTriggerAuth();
      return;
    }
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await onAddReview({
        spot_id: spot.id,
        user_email: currentUser.email,
        user_name: currentUser.name,
        rating,
        comment,
        quiet_level: reviewQuiet,
        outlets: reviewOutlets,
      });

      setComment('');
      setSuccessMsg('Review added successfully! Thank you for helping your peers.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl max-w-4xl w-full mx-auto flex flex-col md:flex-row">
      {/* LEFT COLUMN: Visual Media & Key Indicators */}
      <div className="md:w-5/12 bg-slate-900 text-white relative flex flex-col justify-between min-h-[350px] md:min-h-0">
        {/* Spot Image */}
        <div className="absolute inset-0 bg-slate-950">
          {imgError ? (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 opacity-80">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/20">
                <span className="text-xl">📍</span>
              </div>
              <span className="text-sm font-semibold tracking-wider uppercase text-slate-300">Tulane Study Spot</span>
              <span className="text-xs text-slate-400 mt-1 text-center max-w-[200px]">{spot.name}</span>
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={spot.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-70"
              onError={() => {
                if (imgSrc === 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5c?auto=format&fit=crop&q=80&w=800') {
                  setImgError(true);
                } else {
                  setImgSrc('https://images.unsplash.com/photo-1498243691581-b145c3f54a5c?auto=format&fit=crop&q=80&w=800');
                }
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/40" />
        </div>

        {/* Top Floating actions inside details panel */}
        <div className="relative p-6 flex justify-between items-start z-10 w-full">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-950/80 backdrop-blur rounded-full text-white hover:bg-slate-900 border border-white/15 transition-all"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleFavorite}
            className={`w-9 h-9 flex items-center justify-center rounded-full shadow z-10 transition-all ${
              isFavorite
                ? 'bg-rose-600 text-white scale-105'
                : 'bg-white/90 text-slate-800 hover:bg-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Panel Text contents */}
        <div className="relative p-6 z-10 select-none mt-auto">
          <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/85 px-2.5 py-1 rounded inline-block mb-3">
            {spot.building}
          </span>
          <h2 className="font-sans font-extrabold text-2xl tracking-tight leading-tight mb-2 text-white">
            {spot.name}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
            {spot.description}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono py-3 border-t border-white/10 mt-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="truncate">
                <div className="text-[9px] text-slate-400">HOURS</div>
                <div className="text-[11px] truncate">{spot.hours}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400">LOCATION</div>
                <div className="text-[11px] truncate">Tulane Uptown</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Reviews timeline and detailed reports metrics */}
      <div className="md:w-7/12 p-6 md:p-8 overflow-y-auto max-h-[600px] flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-sans font-bold text-lg text-slate-800">Spot Insights & Features</h3>
            <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-md">
              {spotReviews.length} Student Reports
            </span>
          </div>

          {/* Core Features Specs Details */}
          <div className="grid grid-cols-2 gap-4.5 py-4 border-b border-slate-100 text-xs text-slate-600">
            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <span>🔊 Noise Profile:</span>
              </div>
              <p className="font-mono text-[11px] capitalize text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 inline-block">
                {spot.quietLevel}
              </p>
            </div>

            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <span>🔌 Power Outlets:</span>
              </div>
              <p className="font-mono text-[11px] capitalize text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 inline-block">
                {spot.outlets} Density
              </p>
            </div>

            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <span>⚡ Academic Wi-Fi:</span>
              </div>
              <p className="font-mono text-[11px] capitalize text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 inline-block">
                {spot.wifiQuality} Quality
              </p>
            </div>

            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <span>📍 Finding Details:</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {spot.locationDetails}
              </p>
            </div>
          </div>
        </div>

        {/* Aggregated Student Metrics Visualizer */}
        {spotReviews.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
            <h4 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1">
              <span>📊 Live Aggregated Campus Intelligence</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Quiet distribution */}
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Quietness profile</span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-600">🤫 Silent</span>
                    <span className="font-mono text-slate-500">{silentReportsCount}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(silentReportsCount/spotReviews.length)*100}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] mt-0.5">
                    <span className="text-slate-600">🗣️ Collab</span>
                    <span className="font-mono text-slate-500">{collabReportsCount}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(collabReportsCount/spotReviews.length)*100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Outlet density reports */}
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Outlet availability</span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-600">🔌 Plentiful</span>
                    <span className="font-mono text-slate-500">{plentifulOutletsReports}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(plentifulOutletsReports/spotReviews.length)*100}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] mt-0.5">
                    <span className="text-slate-600">🔋 Few/None</span>
                    <span className="font-mono text-slate-500">{fewOutletsReports + noOutletsReports}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-full rounded-full" style={{ width: `${((fewOutletsReports+noOutletsReports)/spotReviews.length)*100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GREEN WAVE AI CONSENSUS CARD */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/25 border border-emerald-100 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          {/* Subtle ambient light mesh */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex justify-between items-center mb-3">
            <h4 className="font-sans font-bold text-xs text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Green Wave AI Consensus</span>
            </h4>
            {spotReviews.length > 0 && (
              <button
                onClick={handleManualRefreshSummary}
                disabled={loadingSummary}
                className="text-[10px] text-emerald-700 hover:text-emerald-900 bg-emerald-100/60 hover:bg-emerald-100 border border-emerald-200/50 px-2 py-1 rounded-lg flex items-center gap-1 font-mono transition-all disabled:opacity-50"
                title="Regenerate review summary"
              >
                <RefreshCw className={`w-3 h-3 ${loadingSummary ? 'animate-spin' : ''}`} />
                <span>Sync AI</span>
              </button>
            )}
          </div>

          {loadingSummary ? (
            <div className="flex flex-col gap-2 py-2">
              <div className="h-3 bg-emerald-200/30 rounded w-11/12 animate-pulse" />
              <div className="h-3 bg-emerald-200/30 rounded w-full animate-pulse" />
              <div className="h-3 bg-emerald-200/30 rounded w-10/12 animate-pulse" />
            </div>
          ) : summaryError ? (
            <div className="text-[11px] text-amber-700 bg-amber-50/50 border border-amber-100 rounded-xl p-3 leading-relaxed">
              <p>{summaryError}</p>
            </div>
          ) : (
            <div className="text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-line">
              {aiSummary}
            </div>
          )}
        </div>

        {/* REVIEWS LIST */}
        <div className="flex-1 flex flex-col gap-4">
          <h4 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <MessageSquare className="w-4 h-4 text-emerald-800" />
            <span>Community Feed ({spotReviews.length})</span>
          </h4>

          {spotReviews.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
              <span className="text-xl block mb-1">📝</span>
              <p className="text-xs text-slate-500 font-sans">No student reviews yet. Be the first to add yours!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {spotReviews.map((rev) => (
                <div key={rev.id} className="bg-slate-50/50 p-4.5 rounded-2xl border border-slate-100 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{rev.user_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{rev.user_email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs font-bold text-slate-800 font-mono ml-1">{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">{rev.comment}</p>
                  
                  {/* Student reported specs tags */}
                  <div className="flex gap-2 text-[9px] font-mono font-semibold text-slate-500 pt-1 border-t border-slate-100/50">
                    <span>🔊 Sound: {rev.quiet_level}</span>
                    <span>•</span>
                    <span>🔌 Power: {rev.outlets}</span>
                    <span>•</span>
                    <span>📅 {new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FEEDBACK SUBMIT FORM */}
        <div className="border-t border-slate-150 pt-6 mt-2">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-sans font-bold text-sm text-slate-800">Write a review</h4>
              <p className="text-[11px] text-slate-400">Share your on-site findings with other students.</p>
            </div>
            {isSupabaseActive && (
              <span className="text-[9px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-100 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3" /> Connected
              </span>
            )}
          </div>

          {successMsg && (
            <div className="mb-4 bg-emerald-50 text-emerald-800 text-xs px-4 py-3 rounded-xl border border-emerald-100 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!currentUser ? (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-center flex flex-col items-center gap-2.5">
              <span className="text-xs text-slate-600">Please sign in to submit reviews and live reports.</span>
              <button
                onClick={onTriggerAuth}
                className="bg-slate-900 text-white font-sans text-xs font-semibold py-1.5 px-4 rounded-xl hover:bg-slate-800 hover:scale-103 transition-all"
              >
                Sign In with Student ID / Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
              {/* Star selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Overall rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setRating(stars)}
                      className="text-amber-400 hover:scale-115 transition-transform"
                    >
                      <Star className={`w-5 h-5 ${stars <= rating ? 'fill-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Attributes Selectors */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    Current Quietness:
                  </label>
                  <select
                    value={reviewQuiet}
                    onChange={(e) => setReviewQuiet(e.target.value as StudySpot['quietLevel'])}
                    className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-600 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  >
                    <option value="silent">🤫 Silent</option>
                    <option value="quiet">🔈 Quiet</option>
                    <option value="moderate">💬 Moderate</option>
                    <option value="collaborative">🗣️ Collaborative</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    Current Outlets Status:
                  </label>
                  <select
                    value={reviewOutlets}
                    onChange={(e) => setReviewOutlets(e.target.value as StudySpot['outlets'])}
                    className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-600 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  >
                    <option value="plentiful">🔌 Plentiful</option>
                    <option value="few">🔋 Few</option>
                    <option value="none">❌ None</option>
                  </select>
                </div>
              </div>

              {/* Comments */}
              <div className="flex flex-col gap-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Is the Wi-Fi stable today? Are there seats left? Mention current statuses here..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white text-slate-700 placeholder-slate-400 min-h-[75px] focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 border border-slate-950/20 hover:bg-slate-800 text-white font-sans text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Adding Report...' : 'Submit Student Report'}
                <Plus className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
