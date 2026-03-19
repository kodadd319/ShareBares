import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { APP_LOGO_URL } from '../constants';

const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md' }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(localStorage.getItem('share_bares_logo_v14'));
  const [loading, setLoading] = useState(!logoUrl);

  useEffect(() => {
    const generateLogo = async () => {
      if (logoUrl && logoUrl.startsWith('data:image')) return;

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: 'A high-quality 3D animated cartoon logo for "ShareBares". The mascot is a naughty "care bear" style bear named "Bare Bear" with a mischievous expression, smoking a thick cigar. The bear is holding a couple of small photographs in his hand to represent sharing media. Thick, swirling colorful smoke clouds surround and float above the bear. Dark starry night sky with a large glowing moon. Vibrant colors, edgy and detailed. The style is like a modern 3D animated movie. The text "ShareBares" is integrated into the design in a cool, silver/chrome 3D font.',
              },
            ],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const url = `data:image/png;base64,${base64Data}`;
            setLogoUrl(url);
            localStorage.setItem('share_bares_logo_v14', url);
            break;
          }
        }
      } catch (error: any) {
        // Handle quota exceeded error gracefully
        const isQuotaError = 
          error?.status === 429 || 
          error?.message?.includes('429') || 
          error?.message?.includes('RESOURCE_EXHAUSTED') ||
          error?.message?.includes('quota');

        if (isQuotaError) {
          console.warn('AI Logo generation quota exceeded. Using fallback logo.');
        } else {
          console.error('Error generating logo:', error);
        }
        
        // Fallback to APP_LOGO_URL if generation fails
        setLogoUrl(APP_LOGO_URL);
      } finally {
        setLoading(false);
      }
    };

    generateLogo();
  }, [logoUrl]);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-40 w-40',
    lg: 'h-64 w-64'
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-black rounded-2xl animate-pulse`}>
        <div className="w-8 h-8 border-2 border-[#967bb6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-black rounded-2xl overflow-hidden group`}>
      <img 
        src={logoUrl || APP_LOGO_URL} 
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(150,123,182,0.3)] transition-transform duration-700 group-hover:scale-110 animate-float" 
        alt="ShareBares - naughty bear mascot" 
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default Logo;
