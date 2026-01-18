
export enum CategoryType {
  RELIGIOUS = 'RELIGIOUS',
  HISTORICAL = 'HISTORICAL',
  CULTURAL = 'CULTURAL',
  NATURAL = 'NATURAL'
}

export interface Place {
  id: string;
  name: string;
  location: string;
  category: CategoryType;
  description: string;
  imageUrl: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  featured: boolean;
  rating?: number;
}

export interface DashboardStats {
  totalPlaces: number;
  featuredPlaces: number;
  categoriesCount: Record<CategoryType, number>;
}
