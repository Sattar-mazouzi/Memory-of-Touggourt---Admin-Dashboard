
export type AppLanguage = 'ar' | 'en' | 'fr';
export type UserRole = 'admin' | 'content manager';

export enum CategoryType {
  RELIGIOUS = 'religion',
  HISTORICAL = 'history',
  CULTURAL = 'culture',
  NATURAL = 'nature',
  HOTELS = 'hotels',
  RESTAURANTS = 'restaurants'
}

/**
 * Normalizes category strings from various sources (DB, old records, different languages)
 * to a standardized internal key defined in CategoryType.
 */
export const normalizeCategoryKey = (raw: string): string => {
  if (!raw) return 'culture';
  const clean = raw.trim().toLowerCase();
  
  // Mapping of common variations to standard keys
  const mapping: Record<string, string> = {
    // English variations
    'religion': 'religion', 'religious': 'religion',
    'history': 'history', 'historical': 'history',
    'culture': 'culture', 'cultural': 'culture',
    'nature': 'nature', 'natural': 'nature',
    'hotels': 'hotels', 'hotel': 'hotels',
    'restaurants': 'restaurants', 'restaurant': 'restaurants',
    
    // Arabic variations
    'ديني': 'religion',
    'تاريخي': 'history',
    'ثقافي': 'culture',
    'طبيعي': 'nature',
    'فنادق': 'hotels',
    'مطاعم': 'restaurants',
    
    // French variations
    'religieux': 'religion',
    'historique': 'history',
    'culturel': 'culture',
    'naturel': 'nature',
    'hôtels': 'hotels',
    'restauration': 'restaurants'
  };

  return mapping[clean] || clean;
};

export interface LocalizedText {
  ar: string;
  en: string;
  fr: string;
}

export type CategoryMap = Record<string, LocalizedText>;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceImages {
  cover: string;
  img1: string;
  img2: string;
  img3: string;
  img4: string;
  img5: string;
}

export interface Place {
  id: string;
  name: LocalizedText;
  address: LocalizedText;
  category: string; 
  description: LocalizedText;
  imageUrl: PlaceImages; 
  location: Coordinates; 
  featured: boolean;
  rating: number; 
  favoritesCount?: number; 
  ratingCount?: number;
}

export interface HeritageData {
  industries: LocalizedText;
  clothing: LocalizedText;
  culinaryArts: LocalizedText;
  folklore: LocalizedText;
  festivals: LocalizedText;
  games: LocalizedText;
}

export interface GalleryData {
  architecture: string;
  camel: string;
  culture: string;
  dunes: string;
  oasis: string;
}

export interface CityArticle {
  id: string;
  name: LocalizedText;
  population: number;
  readingCount?: number; // Added field for analytics
  cover: string;
  location: string; // map image url
  bio: LocalizedText;
  extendedBio: LocalizedText;
  geography: LocalizedText;
  histBio: LocalizedText;
  extendedHistBio: LocalizedText;
  climate: LocalizedText;
  climateandTopography: LocalizedText;
  heritage: HeritageData;
  gallery: GalleryData;
  updatedAt?: any;
}

export interface CityStaff {
  uid: string;
  email: string;
  full_name: string;
  role: UserRole;
  lastLogin?: any;
}

export interface DashboardStats {
  totalPlaces: number;
  featuredPlaces: number;
  totalUsers: number;
  totalVisitors: number;
  totalFavorites: number;
  categoriesCount: Record<string, number>;
}
