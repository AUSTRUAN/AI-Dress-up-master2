import React from 'react';
import { ImageAsset } from '../types';
import { Check, Plus } from 'lucide-react';

interface AssetGridProps {
  assets: ImageAsset[];
  selectedId: string | null;
  onSelect: (asset: ImageAsset) => void;
  onUpload: (file: File) => void;
  uploadLabel?: string;
}

const AssetGrid: React.FC<AssetGridProps> = ({ assets, selectedId, onSelect, onUpload, uploadLabel = "上传图片" }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 p-1">
      {/* Upload Button */}
      <label className="aspect-[3/4] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors group">
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-brand-100 mb-2 transition-colors">
          <Plus size={20} className="text-slate-500 group-hover:text-brand-600" />
        </div>
        <span className="text-xs text-slate-500 font-medium">{uploadLabel}</span>
      </label>

      {/* Assets */}
      {assets.map((asset) => (
        <div 
          key={asset.id}
          onClick={() => onSelect(asset)}
          className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 ${
            selectedId === asset.id 
              ? 'ring-4 ring-brand-500 ring-offset-2' 
              : 'hover:ring-2 hover:ring-brand-200 hover:ring-offset-1'
          }`}
        >
          <img 
            src={asset.url} 
            alt="Asset" 
            className="w-full h-full object-cover bg-slate-100" 
            loading="lazy"
          />
          {selectedId === asset.id && (
            <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center backdrop-blur-[1px]">
              <div className="bg-white rounded-full p-1.5 shadow-md">
                <Check size={16} className="text-brand-600" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AssetGrid;
