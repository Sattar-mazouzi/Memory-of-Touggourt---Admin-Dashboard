
import React from 'react';
import { Edit2, Trash2, Star, MapPin, Heart, View, Hash } from 'lucide-react';
import { Place, AppLanguage, CategoryMap } from '../types';
import { translations } from '../translations';

interface PlaceCardProps {
  place: Place;
  currentLang: AppLanguage;
  categories?: CategoryMap;
  onEdit: (place: Place) => void;
  onDelete: (id: string) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, currentLang, categories, onEdit, onDelete }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  const name = place.name?.[currentLang] || place.name?.en || place.name?.ar || 'Unnamed Place';
  const description = place.description?.[currentLang] || place.description?.en || place.description?.ar || '...';
  const address = place.address?.[currentLang] || place.address?.en || place.address?.ar || 'Touggourt';
  
  // Use dynamic category label if map exists, otherwise fallback to ID
  const categoryLabel = categories?.[place.category]?.[currentLang] || place.category;
  
  const displayImage = place.imageUrl?.cover || 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800';
  const has3D = !!place.imageUrl?.['3d_img'];

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative h-48">
        <img 
          src={displayImage} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Order Badge */}
        <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} flex flex-col gap-2`}>
          <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg border border-white/20">
            <Hash size={10} className="text-orange-500" /> {place.order || 1}
          </div>
          
          {place.featured && (
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg w-fit">
              <Star size={12} fill="white" /> {t.featured}
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="bg-white/90 backdrop-blur text-slate-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm w-fit border border-white/50">
              <Star size={12} className="text-orange-500" fill="currentColor" /> 
              {place.rating?.toFixed(1) || '0.0'}
              <span className="text-[10px] text-slate-400 font-medium ml-1">({place.ratingCount || 0})</span>
            </div>
            <div className="bg-white/90 backdrop-blur text-pink-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm w-fit border border-white/50">
              <Heart size={12} fill="currentColor" /> 
              {place.favoritesCount || 0}
            </div>
          </div>
          {has3D && (
            <div className="bg-slate-900/80 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg w-fit border border-white/20">
              <View size={12} className="text-orange-400" />
              3D
            </div>
          )}
        </div>
        
        <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} flex gap-2`}>
          <button 
            onClick={() => onEdit(place)}
            className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-700 hover:text-orange-500 hover:bg-white transition-colors shadow-sm"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(place.id)}
            className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-700 hover:text-red-500 hover:bg-white transition-colors shadow-sm"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-800 text-lg leading-snug line-clamp-1">{name}</h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold uppercase tracking-wider shrink-0 ml-2">
            {categoryLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-sm mb-3">
          <MapPin size={14} />
          <span className="line-clamp-1">{address}</span>
        </div>
        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed h-10">
          {description}
        </p>
      </div>
    </div>
  );
};

export default PlaceCard;
