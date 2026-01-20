
import React from 'react';
import { 
  MapPin, 
  History, 
  Palmtree, 
  Church
} from 'lucide-react';
import { CategoryType } from './types';

export const COLORS = {
  primary: '#F97316', // Touggourt Orange
  secondary: '#0F172A',
  background: '#F8FAFC',
};

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'religion': <Church className="w-6 h-6" />,
  'history': <History className="w-6 h-6" />,
  'culture': <MapPin className="w-6 h-6" />,
  'nature': <Palmtree className="w-6 h-6" />,
};

export const MOCK_PLACES: any[] = []; // Not used as we fetch from Firebase
