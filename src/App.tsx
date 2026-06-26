import { useState, useEffect } from 'react';
import { StudySpot, Review, Favorite, Filters, UserProfile, SuggestedSpot } from './types';
import { INITIAL_SPOTS } from './data/initialSpots';
import { studySpotService, isSupabaseConfigured } from './supabaseClient';
import { InteractiveMap } from './components/InteractiveMap';
import { SpotCard } from './components/SpotCard';
import { FilterBar } from './components/FilterBar';
import { SpotDetails } from './components/SpotDetails';
import { AuthModal } from './components/AuthModal';
import { SuggestSpotModal } from './components/SuggestSpotModal';
import { 
  GraduationCap, 
  User, 
  LogOut, 
  Heart, 
  Map, 
  ListFilter, 
  Sparkles, 
  Info, 
  ChevronDown, 
  Database,
  Search,
  SlidersHorizontal,
  X,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // Db State
  const [spots, setSpots] = useState<StudySpot[]>(INITIAL_SPOTS);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // UI Display Toggles
  const [selectedSpot, setSelectedSpot] = useState<StudySpot | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(true);
  const [showDbInfo, setShowDbInfo] = useState(!isSupabaseConfigured);

  // Filter Engine state
  const [filters, setFilters] = useState<Filters>({
    quietLevel: [],
    outlets: [],
    wifiQuality: [],
    openLate: false,
    foodNearby: false,
    searchQuery: '',
  });

  // Load Initial Session & Data from database connector
  useEffect(() => {
    async function loadInitialData() {
      try {
        const user = await studySpotService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          // Load favorites
          const userFavs = await studySpotService.getFavorites(user.id);
          setFavorites(userFavs);
        }
        
        // Load reviews
        const allReviews = await studySpotService.getReviews();
        setReviews(allReviews);
      } catch (err) {
        console.error('Error loading initial databases keys or sessions:', err);
      }
    }
    loadInitialData();
  }, []);

  // Reload favorites if user logs in
  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    try {
      const userFavs = await studySpotService.getFavorites(user.id);
      setFavorites(userFavs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    await studySpotService.signOut();
    setCurrentUser(null);
    setFavorites([]);
  };

  // OTP Auth handlers
  const handleSendOtp = async (email: string): Promise<boolean> => {
    return await studySpotService.sendOtp(email);
  };

  const handleVerifyOtp = async (email: string, code: string, name?: string): Promise<UserProfile> => {
    return await studySpotService.verifyOtp(email, code, name);
  };

  // Suggest a spot submit handler
  const handleSuggestSpotSubmit = async (newSpot: Omit<SuggestedSpot, 'id' | 'created_at'>) => {
    await studySpotService.suggestSpot(newSpot);
  };

  // Favorite toggle action
  const handleToggleFavorite = async (spotId: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    try {
      const updatedFavs = await studySpotService.toggleFavorite(currentUser.id, spotId);
      setFavorites(updatedFavs);
    } catch (err) {
      console.error('Failed to toggle favorite of spot:', err);
    }
  };

  // Add review action
  const handleAddReview = async (newReviewData: Omit<Review, 'id' | 'created_at'>) => {
    try {
      const reviewResult = await studySpotService.addReview(newReviewData);
      setReviews(prev => [reviewResult, ...prev]);
    } catch (err) {
      console.error('Failed to post review:', err);
    }
  };

  // Filter Computation on Frontend
  const filteredSpots = spots.filter(spot => {
    // 1. Search Query matches Name, Building, Description or tags
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const inName = spot.name.toLowerCase().includes(q);
      const inBuilding = spot.building.toLowerCase().includes(q);
      const inDesc = spot.description.toLowerCase().includes(q);
      const inTags = spot.tags.some(t => t.toLowerCase().includes(q));
      if (!inName && !inBuilding && !inDesc && !inTags) return false;
    }

    // 2. Quiet levels Selection (Additive, displays spots matching any selected quiet levels)
    if (filters.quietLevel.length > 0 && !filters.quietLevel.includes(spot.quietLevel)) {
      return false;
    }

    // 3. Outlets selection
    if (filters.outlets.length > 0 && !filters.outlets.includes(spot.outlets)) {
      return false;
    }

    // 4. Wi-Fi quality selection
    if (filters.wifiQuality.length > 0 && !filters.wifiQuality.includes(spot.wifiQuality)) {
      return false;
    }

    // 5. Open late check
    if (filters.openLate && !spot.openLate) {
      return false;
    }

    // 6. Food nearby check
    if (filters.foodNearby && !spot.foodNearby) {
      return false;
    }

    // 7. Favorite only toggle
    if (showFavoritesOnly && !favorites.includes(spot.id)) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-800 selection:text-white pb-16">
      
      {/* 1. APP TOP BAR HEADER (Tulane Official Brand Olive Green & Slate accents) */}
      <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand Emblem */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-center text-emerald-300">
              <Compass className="w-6 h-6 animate-spin-slow text-green-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-emerald-700/60">
                  Uptown Campus
                </span>
              </div>
              <h1 className="font-sans font-black text-lg tracking-tight select-none">
                Tulane Study Spot Finder
              </h1>
            </div>
          </div>

          {/* User Signin/Profiles controls */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-800 rounded-xl px-3 py-1.5">
                <div className="w-7 h-7 bg-emerald-800/80 rounded-full flex items-center justify-center text-xs font-mono font-bold uppercase tracking-wider text-emerald-200">
                  {currentUser.name.slice(0, 2)}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-bold text-emerald-100 truncate max-w-[120px]">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-400 truncate max-w-[120px]">{currentUser.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1 text-emerald-400 hover:text-emerald-100 ml-1.5 transition-colors focus:none"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-emerald-800 hover:bg-emerald-700 hover:scale-103 text-white border border-emerald-700 px-4.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. SUB-BANNER INFORMATION & CONFIGURATION GUIDE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* Dynamic Campus Summary Metrics Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">
          <div className="max-w-lg">
            <h2 className="font-sans font-black text-xl md:text-2xl tracking-tight mb-1.5 flex items-center gap-2">
              <span>Find Your Next Perfect Study Spot</span>
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </h2>
            <p className="text-xs text-emerald-100 leading-relaxed font-sans font-medium mb-4">
              Filter by real quietness levels, outlet density, academic Wi-Fi speeds, food closeness, and custom search terms. Tap visual pins on our custom interactive campus map below!
            </p>
            <button
              onClick={() => {
                if (!currentUser) {
                  setShowAuthModal(true);
                } else {
                  setShowSuggestModal(true);
                }
              }}
              className="bg-white hover:bg-slate-50 hover:scale-103 text-emerald-800 font-sans text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />
              <span>Suggest a Campus Spot</span>
            </button>
          </div>
          <div className="flex gap-3 text-center sm:text-left flex-shrink-0">
            <div className="bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md">
              <p className="text-2xl font-black text-amber-300 font-mono leading-none">{filteredSpots.length}</p>
              <p className="text-[10px] text-emerald-100 font-mono uppercase tracking-wider mt-1">Available Spots</p>
            </div>
            <div className="bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md">
              <p className="text-2xl font-black text-emerald-200 font-mono leading-none">{reviews.length}</p>
              <p className="text-[10px] text-emerald-100 font-mono uppercase tracking-wider mt-1">Reports Filed</p>
            </div>
          </div>
        </div>

        {/* 3. INTERACTIVE MAP SECTION SCREEN */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex justify-between items-center select-none">
            <h3 className="font-sans font-bold text-sm text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Map className="w-4 h-4 text-emerald-800" />
              <span>Interactive Campus Guide Map</span>
            </h3>
            <button
              onClick={() => setMapExpanded(!mapExpanded)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
            >
              <span>{mapExpanded ? 'Contract Map Panel' : 'Expand Map'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mapExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {mapExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <InteractiveMap
                  spots={filteredSpots}
                  selectedSpot={selectedSpot}
                  onSelectSpot={(spot) => setSelectedSpot(spot)}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. MAIN CONTROL DECK: FILTER PANEL & GRID OF CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
          
          {/* FILTER PANEL COLUMN */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-600 flex items-center gap-1.5 select-none">
                <ListFilter className="w-4 h-4 text-emerald-800" />
                <span>Specify preferences</span>
              </h3>
              
              {/* Favorites filter toggle */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-xl border transition-all ${
                  showFavoritesOnly
                    ? 'bg-rose-50 border-rose-250 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-rose-600' : ''}`} />
                <span>Saved favorites ({favorites.length})</span>
              </button>
            </div>

            <FilterBar filters={filters} onFiltersChange={(f) => setFilters(f)} />
          </div>

          {/* SPOTS DISPLAY GRID */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex justify-between items-center px-1">
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider select-none">
                Sifting results: {filteredSpots.length} of {spots.length} spaces matched
              </p>
            </div>

            {filteredSpots.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center gap-4.5 shadow-sm max-w-xl mx-auto w-full select-none">
                <span className="text-3xl block">🌀</span>
                <div>
                  <h4 className="font-sans font-bold text-slate-800 text-sm">No campus locations match your query</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Try turning off specific outlet, noise, or favorite limitations in your preference pane to find more spots.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFilters({
                      quietLevel: [],
                      outlets: [],
                      wifiQuality: [],
                      openLate: false,
                      foodNearby: false,
                      searchQuery: '',
                    });
                    setShowFavoritesOnly(false);
                  }}
                  className="bg-emerald-800 border border-emerald-950/15 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl hover:bg-emerald-900 transition-all shadow-sm"
                >
                  Clear Active Preferences
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredSpots.map((spot) => (
                  <SpotCard
                    key={spot.id}
                    spot={spot}
                    reviews={reviews}
                    isFavorite={favorites.includes(spot.id)}
                    onToggleFavorite={() => handleToggleFavorite(spot.id)}
                    onSelect={() => setSelectedSpot(spot)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. FLOATING SPOT DETAILS SIDE-BAR SHADOWED OVERLAY */}
      <AnimatePresence>
        {selectedSpot && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl py-4"
            >
              <SpotDetails
                spot={selectedSpot}
                reviews={reviews}
                isFavorite={favorites.includes(selectedSpot.id)}
                onToggleFavorite={() => handleToggleFavorite(selectedSpot.id)}
                onClose={() => setSelectedSpot(null)}
                currentUser={currentUser}
                onAddReview={handleAddReview}
                onTriggerAuth={() => {
                  setSelectedSpot(null);
                  setShowAuthModal(true);
                }}
                isSupabaseActive={isSupabaseConfigured}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. SUGGEST STUDY SPOT MODAL */}
      <AnimatePresence>
        {showSuggestModal && currentUser && (
          <SuggestSpotModal
            onClose={() => setShowSuggestModal(false)}
            onSubmit={handleSuggestSpotSubmit}
            userEmail={currentUser.email}
          />
        )}
      </AnimatePresence>

      {/* 6. USER AUTHENTICATION DIALOG MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
            isSupabaseActive={isSupabaseConfigured}
            onSendOtp={handleSendOtp}
            onVerifyOtp={handleVerifyOtp}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
