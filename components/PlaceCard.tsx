
import React from 'react';
import { Edit2, Trash2, Star, MapPin } from 'lucide-react';
import { Place } from '../types';

interface PlaceCardProps {
  place: Place;
  onEdit: (place: Place) => void;
  onDelete: (id: string) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative h-48">
        <img 
          src={place.imageUrl} 
          alt={place.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {place.featured && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Star size={12} fill="white" /> Featured
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={() => onEdit(place)}
            className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-700 hover:text-orange-500 hover:bg-white transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(place.id)}
            className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-700 hover:text-red-500 hover:bg-white transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-800 text-lg">{place.name}</h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
            {place.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-sm mb-3">
          <MapPin size={14} />
          <span>{place.location}</span>
        </div>
        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
          {place.description}
        </p>
      </div>
    </div>
  );
};

export default PlaceCard;
