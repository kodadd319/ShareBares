import React from 'react';
import { APP_LOGO_URL } from '../constants';

const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className = '', size = 'md' }) => {
  const [imgSrc, setImgSrc] = React.useState(APP_LOGO_URL);
  const sizeClasses = {
    sm: 'h-10 w-10 md:h-12 md:w-12 rounded-xl',
    md: 'h-32 w-32 md:h-48 md:w-48 rounded-[2rem]',
    lg: 'h-64 w-64 md:h-[28rem] md:w-[28rem] rounded-[3.5rem]'
  };

  const handleImageError = () => {
    const fallback = APP_LOGO_URL;
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  return (
    <div className={`flex items-center justify-center overflow-hidden group relative ${sizeClasses[size]} ${className}`}>
      <img 
        src={imgSrc} 
        className="w-full h-full object-contain transition-all duration-700 group-hover:scale-105 animate-float" 
        alt="ShareBares Logo" 
        referrerPolicy="no-referrer"
        onError={handleImageError}
      />
    </div>
  );
};

export default Logo;
