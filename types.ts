
export type AppLanguage = 'ar' | 'en' | 'fr';

export enum CategoryType {
  RELIGIOUS = 'religion',
  HISTORICAL = 'history',
  CULTURAL = 'culture',
  NATURAL = 'nature'
}

export interface LocalizedText {
  ar: string;
  en: string;
  fr: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: LocalizedText;
  address: LocalizedText;
  category: string; // Stored as lowercase string in DB
  description: LocalizedText;
  imageUrl: string;
  location: Coordinates; // This is the coordinate map in Firestore
  featured: boolean;
  rating?: number;
}

export interface DashboardStats {
  totalPlaces: number;
  featuredPlaces: number;
  categoriesCount: Record<string, number>;
}
