import React from 'react';
import { APP_LOGO_URL } from '../constants';

const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className = '', size = 'md' }) => {
  const [imgSrc, setImgSrc] = React.useState(APP_LOGO_URL);
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-40 w-40',
    lg: 'h-64 w-64'
  };

  const handleImageError = () => {
    const fallback = APP_LOGO_URL;
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  return (
    <div className={`flex items-center justify-center bg-black/50 overflow-hidden group relative rounded-[2rem] border border-[#967bb6]/10 ${sizeClasses[size]} ${className}`}>
      <img 
        src={imgSrc} 
        className="w-[85%] h-[85%] object-contain drop-shadow-[0_0_20px_rgba(150,123,182,0.4)] transition-all duration-700 group-hover:scale-110 animate-float" 
        alt="ShareBares Mascot" 
        referrerPolicy="no-referrer"
        onError={handleImageError}
      />
    </div>
  );
};

export default Logo;
