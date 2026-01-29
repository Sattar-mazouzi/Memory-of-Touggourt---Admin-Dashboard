
import React from 'react';
import { Edit2, Trash2, Image as ImageIcon, Youtube } from 'lucide-react';
import { GalleryItem, AppLanguage } from '../types';
import { translations } from '../translations';

interface GalleryCardProps {
  item: GalleryItem;
  currentLang: AppLanguage;
  onEdit: (item: GalleryItem) => void;
  onDelete: (id: string) => void;
}

const GalleryCard: React.FC<GalleryCardProps> = ({ item, currentLang, onEdit, onDelete }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  const title = item.title?.[currentLang] || item.title?.en || 'Untitled Gallery';
  
  // Find first available image for cover
  const displayImage = Object.values(item.images).find(url => !!url) || 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800';
  
  const imageCount = Object.values(item.images).filter(url => !!url).length;
  const videoCount = Object.values(item.videos).filter(url => !!url).length;

  return (
    <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="relative h-48">
        <img 
          src={displayImage} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} flex flex-col gap-2`}>
          <div className="flex gap-2">
            <div className="bg-white/90 backdrop-blur text-slate-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-white/50">
              <ImageIcon size={12} className="text-orange-500" /> 
              {imageCount}
            </div>
            {videoCount > 0 && (
              <div className="bg-white/90 backdrop-blur text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-white/50">
                <Youtube size={12} fill="currentColor" /> 
                {videoCount}
              </div>
            )}
          </div>
        </div>
        <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} flex gap-2`}>
          <button 
            onClick={() => onEdit(item)}
            className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-700 hover:text-orange-500 hover:bg-white transition-colors shadow-sm"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-700 hover:text-red-500 hover:bg-white transition-colors shadow-sm"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-bold text-slate-800 text-lg leading-snug line-clamp-2">{title}</h3>
      </div>
    </div>
  );
};

export default GalleryCard;
