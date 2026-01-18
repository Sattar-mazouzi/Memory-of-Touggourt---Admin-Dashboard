
import React from 'react';
import { 
  Home, 
  MapPin, 
  History, 
  Palmtree, 
  Church, 
  Image as ImageIcon,
  Settings,
  LayoutDashboard,
  Plus
} from 'lucide-react';
import { CategoryType } from './types';

export const COLORS = {
  primary: '#F97316', // Touggourt Orange
  secondary: '#0F172A',
  background: '#F8FAFC',
};

export const CATEGORY_ICONS: Record<CategoryType, React.ReactNode> = {
  [CategoryType.RELIGIOUS]: <Church className="w-6 h-6" />,
  [CategoryType.HISTORICAL]: <History className="w-6 h-6" />,
  [CategoryType.CULTURAL]: <MapPin className="w-6 h-6" />,
  [CategoryType.NATURAL]: <Palmtree className="w-6 h-6" />,
};

export const MOCK_PLACES: any[] = [
  {
    id: '1',
    name: 'Great Mosque',
    location: 'Touggourt Center',
    category: CategoryType.RELIGIOUS,
    description: 'A historical masterpiece of architecture in the heart of Touggourt.',
    imageUrl: 'https://picsum.photos/seed/mosque/800/600',
    featured: true,
  },
  {
    id: '2',
    name: 'Tamazert Oasis',
    location: '43200 Touggourt',
    category: CategoryType.NATURAL,
    description: 'A lush green escape surrounded by the vast Sahara sands.',
    imageUrl: 'https://picsum.photos/seed/oasis/800/600',
    featured: true,
  }
];
