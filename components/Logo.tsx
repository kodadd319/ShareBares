import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md' }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(localStorage.getItem('share_bares_logo_v11'));
  const [loading, setLoading] = useState(!logoUrl);

  useEffect(() => {
    if (logoUrl) return;

    const generate = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: 'A high-quality professional logo for "ShareBares". The mascot is a cute, light-blue bear with a mischievous wink and a purple eye. The bear is wearing a detailed black leather harness. On its white belly is a light-blue glowing heart with a flame inside. The bear is sitting on a large, glowing full moon. The background is a dark, starry night sky with purple and dark blue clouds. Below the bear, the text "ShareBares" is written in a bold, silver/chrome 3D font. The overall style is premium, sleek, and atmospheric. This is the official original logo design.',
              },
            ],
          },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const url = `data:image/png;base64,${part.inlineData.data}`;
            setLogoUrl(url);
            try {
              localStorage.setItem('share_bares_logo_v11', url);
            } catch (e) {
              console.warn('Failed to cache logo in localStorage:', e);
            }
            break;
          }
        }
      } catch (error: any) {
        const errorString = JSON.stringify(error);
        const isQuotaError = errorString.includes('429') || errorString.includes('quota') || (error.message && (error.message.includes('429') || error.message.includes('quota')));
        
        if (isQuotaError) {
          console.warn('Logo generation paused: Gemini API quota exceeded. Using fallback logo.');
        } else {
          console.error('Error generating logo:', error);
        }
        // Fallback to a reliable placeholder if generation fails
        setLogoUrl('https://images.unsplash.com/photo-1534278931827-8a259344abe7?q=80&w=512&h=512&auto=format&fit=crop');
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [logoUrl]);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-40 w-40',
    lg: 'h-64 w-64'
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        <div className="w-8 h-8 border-2 border-[#967bb6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-black`}>
      <img 
        src={logoUrl || undefined} 
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(150,123,182,0.3)]" 
        alt="ShareBares - barebear mascot" 
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default Logo;
