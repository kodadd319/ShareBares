import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { APP_LOGO_URL } from '../constants';

const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-40 w-40',
    lg: 'h-64 w-64'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-black rounded-2xl overflow-hidden group`}>
      <img 
        src={APP_LOGO_URL} 
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(150,123,182,0.3)] transition-transform duration-700 group-hover:scale-110 animate-float" 
        alt="ShareBares - naughty bear mascot" 
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default Logo;
