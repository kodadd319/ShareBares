import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { APP_LOGO_URL } from '../constants';

const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md' }) => {
  const [logoUrl, setLogoUrl] = useState<string>(localStorage.getItem('barebear_logo_v2') || APP_LOGO_URL);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generateLogo = async () => {
      // If we already have a generated logo or a non-picsum logo, don't regenerate unless it's the default
      if (logoUrl && logoUrl.startsWith('data:image')) return;
      
      // If it's the default picsum logo, we should try to generate a real mascot logo
      if (logoUrl === APP_LOGO_URL || !logoUrl) {
        try {
          setIsGenerating(true);
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                {
                  text: 'A high-quality 3D animated female bear mascot named "Bare Bear". She has vibrant blue fur, long eyelashes, and a mischievous, seductive expression with a wink. She wears a black leather harness and has a white heart with a blue flame on her belly. The style is modern 3D animation (Pixar/Dreamworks style). Edgy, detailed, and vibrant. This is for a professional app logo. The image should contain NO TEXT or words.',
                },
              ],
            },
          });

          const parts = response.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData) {
                const url = `data:image/png;base64,${part.inlineData.data}`;
                setLogoUrl(url);
                localStorage.setItem('barebear_logo_v2', url);
                break;
              }
            }
          }
        } catch (error) {
          console.error('Error generating logo:', error);
          // Fallback to stable mascot if generation fails
          setLogoUrl(APP_LOGO_URL);
        } finally {
          setIsGenerating(false);
        }
      }
    };

    generateLogo();
  }, [logoUrl]);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-40 w-40',
    lg: 'h-64 w-64'
  };

  const handleImageError = () => {
    // If the image fails to load, try to generate it
    setLogoUrl(APP_LOGO_URL); // This will trigger the useEffect to generate
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-black rounded-2xl overflow-hidden group relative`}>
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="w-8 h-8 border-2 border-[#967bb6] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img 
        src={logoUrl} 
        className={`w-full h-full object-contain drop-shadow-[0_0_15px_rgba(150,123,182,0.3)] transition-transform duration-700 group-hover:scale-110 animate-float ${isGenerating ? 'opacity-50' : 'opacity-100'}`} 
        alt="ShareBares - Bare Bear mascot" 
        referrerPolicy="no-referrer"
        onError={handleImageError}
      />
    </div>
  );
};

export default Logo;
