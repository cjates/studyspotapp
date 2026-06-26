import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StudySpot, Review, Favorite, SuggestedSpot, UserProfile } from './types';
import { INITIAL_SPOTS } from './data/initialSpots';

// Retrieve environment credentials - securely fetched from environment variable mappings
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Detect if real Supabase credentials are provided
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let realSupabaseClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    realSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize real Supabase client:', error);
  }
}

/**
 * DATABASE SCHEMA SETUP COMMANDS (PostgreSQL for Supabase SQL Editor):
 * 
 * -- Create Reviews Table
 * create table public.reviews (
 *   id uuid default gen_random_uuid() primary key,
 *   spot_id text not null,
 *   user_email text not null,
 *   user_name text not null,
 *   rating integer not null check (rating >= 1 and rating <= 5),
 *   comment text not null,
 *   quiet_level text not null,
 *   outlets text not null,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Create Favorites Table
 * create table public.favorites (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id text not null,
 *   spot_id text not null,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   unique (user_id, spot_id)
 * );
 * 
 * -- Create Suggested Spots Table
 * create table public.suggested_spots (
 *   id uuid default gen_random_uuid() primary key,
 *   name text not null,
 *   building text not null,
 *   description text not null,
 *   quiet_level text not null,
 *   outlets text not null,
 *   wifi_quality text not null,
 *   open_late boolean not null,
 *   food_nearby boolean not null,
 *   user_email text not null,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Enable Row Level Security (RLS) or add standard policies as required.
 */

// LocalStorage Persistence Fallback Keys
const LOCAL_REVIEWS_KEY = 'study_spot_reviews_v1';
const LOCAL_FAVORITES_KEY = 'study_spot_favorites_v1';
const LOCAL_USER_KEY = 'study_spot_user_v1';

// Seed Initial Mock Reviews to make the UI populated with realistic Tulane ratings immediately!
const SEED_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    spot_id: 'howie-t-1st',
    user_email: 'obialek@tulane.edu',
    user_name: 'Obi-Wan Kenobi',
    rating: 5,
    comment: 'The absolute best place to crank out coursework while staying fueled on PJ\'s nitro cold brew. Highly conversational, so don\'t expect silent reading, but energy is top notch!',
    quiet_level: 'collaborative',
    outlets: 'plentiful',
    created_at: new Date(Date.now() - 24 * 3600 * 1000 * 3).toISOString() // 3 days ago
  },
  {
    id: 'rev-2',
    spot_id: 'howie-t-5th',
    user_email: 'wavemaker@tulane.edu',
    user_name: 'Roll Wave',
    rating: 5,
    comment: 'Strict quiet guidelines on Floor 5 make this my go-to for midterms. The oak views from the windows are spectacular and very calming.',
    quiet_level: 'silent',
    outlets: 'few',
    created_at: new Date(Date.now() - 24 * 3600 * 1000 * 5).toISOString()
  },
  {
    id: 'rev-3',
    spot_id: 'lbc-mezzanine',
    user_email: 'nola_student@tulane.edu',
    user_name: 'Jane Doe',
    rating: 4,
    comment: 'Booths are very spacious for dual monitors. Fast Wi-Fi and awesome to slide downstairs to grab lunch. Can get crowded around noon!',
    quiet_level: 'moderate',
    outlets: 'plentiful',
    created_at: new Date(Date.now() - 24 * 3600 * 1000 * 12).toISOString()
  },
  {
    id: 'rev-4',
    spot_id: 'freeman-lounge',
    user_email: 'freeman_mb@tulane.edu',
    user_name: 'Business Major',
    rating: 4,
    comment: 'Super modern design. Whiteboards are a game changer for modeling complex financial formulas. Outlets are embedded inside the table rims!',
    quiet_level: 'quiet',
    outlets: 'plentiful',
    created_at: new Date(Date.now() - 24 * 3600 * 1000 * 8).toISOString()
  }
];

// Helper to get local data
const getLocalReviews = (): Review[] => {
  const data = localStorage.getItem(LOCAL_REVIEWS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(SEED_REVIEWS));
    return SEED_REVIEWS;
  }
  return JSON.parse(data);
};

const saveLocalReviews = (reviews: Review[]) => {
  localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
};

const getLocalFavorites = (): Favorite[] => {
  const data = localStorage.getItem(LOCAL_FAVORITES_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalFavorites = (favorites: Favorite[]) => {
  localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(favorites));
};

// Expose high-level fully unified database and auth interfaces
export const studySpotService = {
  // --- AUTH SECTOR ---
  getCurrentUser: async () => {
    if (isSupabaseConfigured && realSupabaseClient) {
      const { data: { user }, error } = await realSupabaseClient.auth.getUser();
      if (!error && user) {
        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Tulane Student'
        };
      }
    }
    // Fallback Local Storage User Session
    const userStr = localStorage.getItem(LOCAL_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },



  sendOtp: async (email: string): Promise<boolean> => {
    if (isSupabaseConfigured && realSupabaseClient) {
      const { error } = await realSupabaseClient.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });
      if (error) throw error;
      return true;
    }
    return true;
  },

  verifyOtp: async (email: string, token: string, name?: string): Promise<UserProfile> => {
    if (isSupabaseConfigured && realSupabaseClient) {
      const { data, error } = await realSupabaseClient.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) throw error;
      if (data.user) {
        if (name && !data.user.user_metadata?.name) {
          await realSupabaseClient.auth.updateUser({
            data: { name }
          });
        }
        const userObj: UserProfile = {
          id: data.user.id,
          email: data.user.email || '',
          name: name || data.user.user_metadata?.name || email.split('@')[0]
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));
        return userObj;
      }
    }

    // Offline local Storage verify code fallback
    const mockUser: UserProfile = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      email,
      name: name || email.split('@')[0].toUpperCase() || 'Tulane Student'
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
    return mockUser;
  },

  signOut: async () => {
    if (isSupabaseConfigured && realSupabaseClient) {
      await realSupabaseClient.auth.signOut();
    }
    localStorage.removeItem(LOCAL_USER_KEY);
  },

  // --- STUDY SPOTS SECTOR ---
  getSpots: async (): Promise<StudySpot[]> => {
    // Current spots from local static file (and can map dynamic fields if desired)
    return INITIAL_SPOTS;
  },

  // --- REVIEWS SECTOR ---
  getReviews: async (spotId?: string): Promise<Review[]> => {
    if (isSupabaseConfigured && realSupabaseClient) {
      let query = realSupabaseClient.from('reviews').select('*');
      if (spotId) {
        query = query.eq('spot_id', spotId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        return data as Review[];
      }
      console.error('Supabase query error, defaulting to local reviews storage:', error);
    }
    
    // Fallback
    const local = getLocalReviews();
    if (spotId) {
      return local.filter(r => r.spot_id === spotId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return local.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addReview: async (review: Omit<Review, 'id' | 'created_at'>): Promise<Review> => {
    const newReview: Review = {
      ...review,
      id: `rev-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && realSupabaseClient) {
      const { data, error } = await realSupabaseClient
        .from('reviews')
        .insert([{
          spot_id: review.spot_id,
          user_email: review.user_email,
          user_name: review.user_name,
          rating: review.rating,
          comment: review.comment,
          quiet_level: review.quiet_level,
          outlets: review.outlets
        }])
        .select();

      if (!error && data && data[0]) {
        return data[0] as Review;
      }
      console.error('Supabase review insertion failed, saving locally:', error);
    }

    // Fallback
    const reviews = getLocalReviews();
    reviews.unshift(newReview);
    saveLocalReviews(reviews);
    return newReview;
  },

  // --- FAVORITES SECTOR ---
  getFavorites: async (userId: string): Promise<string[]> => {
    if (isSupabaseConfigured && realSupabaseClient) {
      const { data, error } = await realSupabaseClient
        .from('favorites')
        .select('spot_id')
        .eq('user_id', userId);
      
      if (!error && data) {
        return data.map(item => item.spot_id);
      }
    }

    // Fallback
    const favorites = getLocalFavorites();
    return favorites.filter(f => f.user_id === userId).map(f => f.spot_id);
  },

  toggleFavorite: async (userId: string, spotId: string): Promise<string[]> => {
    if (isSupabaseConfigured && realSupabaseClient) {
      // Check existing
      const { data: existing } = await realSupabaseClient
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('spot_id', spotId)
        .maybeSingle();

      if (existing) {
        // Delete
        await realSupabaseClient.from('favorites').delete().eq('id', existing.id);
      } else {
        // Add
        await realSupabaseClient.from('favorites').insert([{ user_id: userId, spot_id: spotId }]);
      }

      // Re-fetch
      const { data: latest } = await realSupabaseClient
        .from('favorites')
        .select('spot_id')
        .eq('user_id', userId);
      
      if (latest) {
        return latest.map(item => item.spot_id);
      }
    }

    // Fallback
    const favorites = getLocalFavorites();
    const index = favorites.findIndex(f => f.user_id === userId && f.spot_id === spotId);
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push({
        id: `fav-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        spot_id: spotId,
        created_at: new Date().toISOString()
      });
    }
    saveLocalFavorites(favorites);
    return favorites.filter(f => f.user_id === userId).map(f => f.spot_id);
  },

  // --- SUGGEST SPOT SECTOR ---
  suggestSpot: async (spot: Omit<SuggestedSpot, 'id' | 'created_at'>): Promise<SuggestedSpot> => {
    const newSpot: SuggestedSpot = {
      ...spot,
      id: `sug-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && realSupabaseClient) {
      const { data, error } = await realSupabaseClient
        .from('suggested_spots')
        .insert([{
          name: spot.name,
          building: spot.building,
          description: spot.description,
          quiet_level: spot.quietLevel,
          outlets: spot.outlets,
          wifi_quality: spot.wifiQuality,
          open_late: spot.openLate,
          food_nearby: spot.foodNearby,
          user_email: spot.user_email
        }])
        .select();

      if (!error && data && data[0]) {
        const d = data[0];
        return {
          id: d.id,
          name: d.name,
          building: d.building,
          description: d.description,
          quietLevel: d.quiet_level,
          outlets: d.outlets,
          wifiQuality: d.wifi_quality,
          openLate: d.open_late,
          foodNearby: d.food_nearby,
          user_email: d.user_email,
          created_at: d.created_at
        };
      }
      console.error('Supabase spot suggestion insertion failed, saving locally:', error);
    }

    // Fallback LocalStorage
    const local = localStorage.getItem('study_spot_suggested_v1');
    const list = local ? JSON.parse(local) : [];
    list.unshift(newSpot);
    localStorage.setItem('study_spot_suggested_v1', JSON.stringify(list));
    return newSpot;
  }
};
