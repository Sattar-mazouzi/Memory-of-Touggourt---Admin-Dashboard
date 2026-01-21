
export type AppLanguage = 'ar' | 'en' | 'fr';

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
  category: string; // Stored as lowercase string in DB
  description: LocalizedText;
  imageUrl: string;
  location: Coordinates; 
  featured: boolean;
  rating: number; // Mandatory number from 0 to 5
}

export interface DashboardStats {
  totalPlaces: number;
  featuredPlaces: number;
  categoriesCount: Record<string, number>;
}
