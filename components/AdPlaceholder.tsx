
import React from 'react';
import { ExternalLink, Info, Image as ImageIcon } from 'lucide-react';
import AdSense from './AdSense';

interface AdPlaceholderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  adSlot?: string;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ size = 'md', className = '', adSlot }) => {
  const heights = {
    sm: 'h-24',
    md: 'h-48',
    lg: 'h-80'
  };

  const adClient = process.env.VITE_ADSENSE_CLIENT_ID;

  if (adClient) {
    return (
      <div className={`w-full ${heights[size]} ${className}`}>
        <AdSense adClient={adClient} adSlot={adSlot} format={size === 'sm' ? 'rectangle' : 'auto'} />
      </div>
    );
  }

  return (
    <div className={`w-full ${heights[size]} bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden relative group flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Sponsored</span>
        <Info size={10} className="text-slate-500" />
      </div>
      
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
        <ImageIcon size={24} className="text-slate-700" />
      </div>
      
      <h4 className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-2">Ad Placement Placeholder</h4>
      <p className="text-slate-600 text-[9px] uppercase tracking-widest max-w-[200px] leading-relaxed">
        Premium advertising space available for creators and brands.
      </p>
      
      <button className="mt-4 flex items-center space-x-2 text-[#967bb6] text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
        <span>Learn More</span>
        <ExternalLink size={10} />
      </button>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/10 rounded-tl-3xl"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/10 rounded-br-3xl"></div>
    </div>
  );
};

export default AdPlaceholder;
