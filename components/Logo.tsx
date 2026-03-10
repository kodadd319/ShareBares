import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md' }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(localStorage.getItem('share_bares_logo_v2'));
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
                text: 'A professional high-quality logo for a social media app called "ShareBares". The mascot is "barebear", a cute but edgy bear that slightly resembles a Care Bear but with a provocative and mischievous vibe. The bear is wearing a stylish black harness and has a playful wink. The bear is sitting on a glowing full moon. The background is a dark, starry night sky with subtle nebula colors (purples and blues). The typography "ShareBares" is bold, modern, and clean. The overall aesthetic is premium, sleek, and atmospheric.',
              },
            ],
          },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const url = `data:image/png;base64,${part.inlineData.data}`;
            setLogoUrl(url);
            localStorage.setItem('share_bares_logo_v2', url);
            break;
          }
        }
      } catch (error) {
        console.error('Error generating logo:', error);
        // Fallback to a placeholder if generation fails
        setLogoUrl('https://picsum.photos/seed/barebear/512/512');
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
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <img 
        src={logoUrl || ''} 
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(150,123,182,0.3)]" 
        alt="ShareBares - barebear mascot" 
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default Logo;
