import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { APP_LOGO_URL } from '../constants';

const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md' }) => {
  const [logoUrl, setLogoUrl] = useState<string>(localStorage.getItem('app_logo_v2') || APP_LOGO_URL);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateLogo = async () => {
      // Only generate if it's the default or missing
      if (logoUrl !== '/logo.png' && !logoUrl.startsWith('data:image')) return;
      
      try {
        setLoading(true);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const prompt = "A high-quality 3D animated logo for an app named 'ShareBares'. The logo features a sexy, naughty female Care Bear-style mascot with a vibrant blue fur, a mischievous wink, and long eyelashes. She is wearing a black leather harness and has a white heart with a blue flame on her belly. She is sitting in front of a large, glowing full moon with a silver ring around it, surrounded by dark purple and blue clouds under a starry night sky. The text 'ShareBares' is written at the bottom in a bold, silver-metallic 3D font with a blue glow. The style is vibrant, detailed, and professional.";
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }],
          },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData) {
              const url = `data:image/png;base64,${part.inlineData.data}`;
              setLogoUrl(url);
              try {
                localStorage.setItem('app_logo_v3', url);
                // Clear old versions to save space
                Object.keys(localStorage).forEach(key => {
                  if (key.startsWith('app_logo_') && key !== 'app_logo_v3') {
                    localStorage.removeItem(key);
                  }
                });
              } catch (e) {
                console.warn('Failed to cache logo in localStorage:', e);
              }
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error generating logo:', error);
        // Fallback to a seeded picsum image if generation fails
        setLogoUrl('https://picsum.photos/seed/sharebares_logo_v10/1024/1024');
      } finally {
        setLoading(false);
      }
    };

    if (logoUrl === '/logo.png') {
      generateLogo();
    }
  }, [logoUrl]);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-40 w-40',
    lg: 'h-64 w-64'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-black rounded-2xl overflow-hidden group relative`}>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="w-8 h-8 border-2 border-[#967bb6] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : null}
      <img 
        src={logoUrl} 
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(150,123,182,0.3)] transition-transform duration-700 group-hover:scale-110 animate-float" 
        alt="ShareBares - naughty bear mascot" 
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default Logo;
