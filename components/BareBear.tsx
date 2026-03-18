import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export type BareBearAction = 'dance' | 'point' | 'wave' | 'wink' | 'sad' | 'surprised';

interface BareBearProps {
  action?: BareBearAction;
  message?: string;
  onClose?: () => void;
  isVisible?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

const BARE_BEAR_BASE_PROMPT = 'A cute, light-blue bear named "barebear" with a mischievous vibe. The bear is wearing a detailed black leather harness. On its white belly is a light-blue glowing heart with a flame inside. The overall aesthetic is premium, sleek, and atmospheric. The bear has a playful and provocative personality.';

const ACTION_PROMPTS: Record<BareBearAction, string> = {
  dance: 'The bear is doing a silly, energetic dance with its arms up and a big mischievous grin.',
  point: 'The bear is pointing its finger towards the left side of the screen with a knowing wink, as if highlighting something important.',
  wave: 'The bear is waving its paw enthusiastically with a friendly and playful expression.',
  wink: 'The bear is giving a playful and provocative wink while leaning slightly forward.',
  sad: 'The bear has a cute, exaggerated sad face with slightly drooping ears, looking disappointed but still adorable.',
  surprised: 'The bear has a wide-eyed, surprised expression with its paws on its cheeks.'
};

const BareBear: React.FC<BareBearProps> = ({ 
  action = 'wink', 
  message, 
  onClose, 
  isVisible = true,
  position = 'bottom-right'
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(localStorage.getItem(`barebear_v2_${action}`));
  const [loading, setLoading] = useState(!imageUrl);

  useEffect(() => {
    if (imageUrl) return;

    const generate = async () => {
      try {
        setLoading(true);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: `${BARE_BEAR_BASE_PROMPT} ${ACTION_PROMPTS[action]}`,
              },
            ],
          },
        });

        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const url = `data:image/png;base64,${part.inlineData.data}`;
              setImageUrl(url);
              try {
                localStorage.setItem(`barebear_v2_${action}`, url);
              } catch (e) {
                console.warn('Failed to cache Bare Bear image in localStorage:', e);
              }
              break;
            }
          }
        } else {
          throw new Error('No image generated in response');
        }
      } catch (error: any) {
        const errorString = JSON.stringify(error);
        const isQuotaError = errorString.includes('429') || errorString.includes('quota') || (error.message && (error.message.includes('429') || error.message.includes('quota')));
        
        if (isQuotaError) {
          console.warn('Bare Bear generation paused: Gemini API quota exceeded. Using fallback mascot.');
        } else {
          console.error('Error generating Bare Bear:', error);
        }
        setImageUrl('https://picsum.photos/seed/barebear_fallback/512/512');
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [action, imageUrl]);

  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 50 }}
          className={`fixed z-[100] flex flex-col items-center ${positionClasses[position]}`}
        >
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-black/80 backdrop-blur-xl border border-[#967bb6]/30 p-4 rounded-2xl shadow-2xl max-w-[250px] relative"
            >
              <p className="text-white text-sm font-bold text-center leading-relaxed">
                {message}
              </p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/80 border-r border-b border-[#967bb6]/30 rotate-45"></div>
            </motion.div>
          )}

          <div className="relative group">
            <div className="w-48 h-48 md:w-64 md:h-64 relative">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full border border-white/10">
                  <div className="w-8 h-8 border-2 border-[#967bb6] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <motion.img
                  animate={action === 'dance' ? {
                    rotate: [0, -5, 5, -5, 0],
                    y: [0, -10, 0, -10, 0],
                  } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  src={imageUrl || undefined}
                  className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(150,123,182,0.4)]"
                  alt="Bare Bear Mascot"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="absolute -top-2 -right-2 p-2 bg-black/50 hover:bg-black/80 rounded-full border border-white/10 text-white transition-all opacity-0 group-hover:opacity-100"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BareBear;
