
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

export interface LocalizedText {
  ar: string;
  en: string;
  fr: string;
}

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
  favoritesCount?: number; // New field for analytics
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
