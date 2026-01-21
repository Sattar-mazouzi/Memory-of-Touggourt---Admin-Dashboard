
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
