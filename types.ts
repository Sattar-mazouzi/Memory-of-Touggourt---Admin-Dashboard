
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

export interface Place {
  id: string;
  name: LocalizedText;
  address: LocalizedText;
  category: string; 
  description: LocalizedText;
  imageUrl: string;
  location: Coordinates; 
  featured: boolean;
  rating: number; 
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
  categoriesCount: Record<string, number>;
}
