import React, { useRef, useState, useEffect } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, Disc } from 'lucide-react';
import { ProfileCustomization } from '../types';
import { toast } from 'sonner';

interface ThemeMusicPlayerProps {
  customization?: ProfileCustomization;
}

const getFileNameFromUrl = (url?: string) => {
  if (!url) return 'Unknown Track';
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split('/');
    const lastPart = parts[parts.length - 1];
    const cleanPart = lastPart.split('?')[0];
    
    // Match common naming patterns from file uploads
    const match = cleanPart.match(/theme_[\d_]+_(.*)/) || cleanPart.match(/theme_(.*)/);
    if (match && match[1]) {
      return match[1];
    }
    return cleanPart || 'Exclusive Theme Track';
  } catch (e) {
    return 'Exclusive Theme Track';
  }
};

const ThemeMusicPlayer: React.FC<ThemeMusicPlayerProps> = ({ customization }) => {
  const audioUrl = customization?.themeSongUrl;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [songName, setSongName] = useState('Theme Track');
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const accentColor = customization?.accentColor || '#967bb6';
  const fontColor = customization?.fontColor || '#ffffff';
  
  useEffect(() => {
    if (audioUrl) {
      setSongName(getFileNameFromUrl(audioUrl));
    }
  }, [audioUrl]);

  // Handle play logic
  const playAudio = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setAutoplayBlocked(false);
    } catch (err: any) {
      console.warn('Autoplay blocked or playback error:', err);
      setAutoplayBlocked(true);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (!audioUrl) return;

    // Reset player state whenever track URL changes
    setIsPlaying(false);
    
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.volume = volume;
    audio.muted = isMuted;
    audioRef.current = audio;

    // Attempt autoplay
    playAudio();

    // Register a global click listener on the entire document
    // If browser auto-play was blocked, any click on the page will unblock and play the music
    const handleGlobalClickForAutoplay = () => {
      if (audioRef.current && audioRef.current.paused) {
        playAudio();
      }
      // Remove listener once we successfully play or make initial attempt
      document.removeEventListener('click', handleGlobalClickForAutoplay);
    };

    document.addEventListener('click', handleGlobalClickForAutoplay);

    return () => {
      document.removeEventListener('click', handleGlobalClickForAutoplay);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  // Adjust volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val > 0 && isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  // Toggle Play
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playAudio();
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = nextMute;
  };

  if (!audioUrl) return null;

  return (
    <div id="theme-music-widget" className="fixed bottom-6 right-6 z-[120] animate-in fade-in slide-in-from-bottom-12 duration-500">
      
      {/* Autoplay block alert - micro floating prompt */}
      {autoplayBlocked && (
        <div 
          onClick={togglePlay}
          className="absolute bottom-full right-0 mb-3 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-2xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap animate-bounce"
        >
          <Music size={12} className="animate-spin" />
          <span>Tap to Unblock Profile Theme Song</span>
        </div>
      )}

      {/* Main Music Widget */}
      <div 
        className="glass-panel py-3 px-4 rounded-[1.75rem] bg-black/80 border border-white/10 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4 max-w-sm"
        style={{ color: fontColor }}
      >
        {/* Disc Rotate and Core representation */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center overflow-hidden border border-white/10">
            <Disc 
              className={`text-slate-400 transition-transform ${isPlaying ? 'animate-spin' : ''}`} 
              style={{ animationDuration: '6s', color: accentColor }} 
              size={20} 
            />
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center gap-[2px] bg-black/30">
                <span className="w-[3px] h-3 bg-emerald-400 rounded-full animate-pulse-slow"></span>
                <span className="w-[3px] h-4 bg-emerald-400 rounded-full animate-pulse-fast"></span>
                <span className="w-[3px] h-2 bg-emerald-400 rounded-full animate-pulse-slow"></span>
              </div>
            )}
          </div>
          
          {/* Metadata */}
          <div className="text-left w-28 sm:w-36 overflow-hidden">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Theme Track</span>
            <span className="text-xs font-bold truncate block select-none uppercase tracking-tight text-white mt-0.5">
              {songName}
            </span>
          </div>
        </div>

        {/* Controls block */}
        <div className="flex items-center gap-2">
          {/* Play/Pause toggle */}
          <button 
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-all active:scale-90"
            style={{ borderColor: `${accentColor}30` }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
          </button>

          {/* Volume control */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-full px-2.5 py-1">
            <button 
              type="button"
              onClick={toggleMute}
              className="text-slate-400 hover:text-white transition-colors active:scale-90"
            >
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-12 h-[3px] bg-white/10 rounded-full accent-[#967bb6] cursor-pointer appearance-none outline-none focus:outline-none"
              style={{ accentColor }}
            />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseSlow {
          0%, 100% { transform: scaleY(1); opacity: 0.8; }
          50% { transform: scaleY(1.5); opacity: 1; }
        }
        @keyframes pulseFast {
          0%, 100% { transform: scaleY(1); opacity: 0.6; }
          50% { transform: scaleY(1.8); opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulseSlow 1.2s ease-in-out infinite;
        }
        .animate-pulse-fast {
          animation: pulseFast 0.7s ease-in-out infinite;
        }
      ` }} />
    </div>
  );
};

export default ThemeMusicPlayer;
