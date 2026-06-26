export interface StudySpot {
  id: string;
  name: string;
  building: string;
  description: string;
  quietLevel: 'silent' | 'quiet' | 'moderate' | 'collaborative';
  outlets: 'none' | 'few' | 'plentiful';
  wifiQuality: 'poor' | 'good' | 'excellent';
  openLate: boolean;
  foodNearby: boolean;
  hours: string;
  locationDetails: string;
  lat: number; // real latitude on Tulane Uptown campus
  lng: number; // real longitude on Tulane Uptown campus
  tags: string[];
  imageUrl: string;
}

export interface Review {
  id: string;
  spot_id: string;
  user_email: string;
  user_name: string;
  rating: number;
  comment: string;
  quiet_level: 'silent' | 'quiet' | 'moderate' | 'collaborative';
  outlets: 'none' | 'few' | 'plentiful';
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  spot_id: string;
  created_at: string;
}

export interface Filters {
  quietLevel: ('silent' | 'quiet' | 'moderate' | 'collaborative')[];
  outlets: ('none' | 'few' | 'plentiful')[];
  wifiQuality: ('poor' | 'good' | 'excellent')[];
  openLate: boolean;
  foodNearby: boolean;
  searchQuery: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface SuggestedSpot {
  id?: string;
  name: string;
  building: string;
  description: string;
  quietLevel: 'silent' | 'quiet' | 'moderate' | 'collaborative';
  outlets: 'none' | 'few' | 'plentiful';
  wifiQuality: 'poor' | 'good' | 'excellent';
  openLate: boolean;
  foodNearby: boolean;
  user_email: string;
  created_at?: string;
}
