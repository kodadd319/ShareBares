import React, { useRef, useState, useEffect, useMemo } from 'react';
import ReactPlayer from 'react-player';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RefreshCcw, 
  FastForward, 
  Rewind,
  PictureInPicture as Pip
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Inject Hls into window for ReactPlayer to pick up
if (typeof window !== 'undefined') {
  (window as any).Hls = Hls;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  showPlayIcon?: boolean;
  clickToPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  poster, 
  className = '', 
  autoPlay = false, 
  loop = false, 
  muted = false,
  controls = true,
  showPlayIcon = true,
  clickToPlay = true
}) => {
  const Player = (ReactPlayer as any).default || ReactPlayer;
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pip, setPip] = useState(false);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmounted = useRef(false);
  const lastPlayRequestTime = useRef<number>(0);

  useEffect(() => {
    isUnmounted.current = false;
    const handleFullscreenChange = () => {
      if (isUnmounted.current) return;
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      isUnmounted.current = true;
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      
      // Explicitly stop playing on unmount
      if (playerRef.current) {
        try {
          const internalPlayer = playerRef.current.getInternalPlayer();
          if (internalPlayer) {
            if (typeof internalPlayer.pause === 'function') {
              internalPlayer.pause();
            }
            // For native HTMLMediaElement, clear src to prevent interruption errors
            if (internalPlayer instanceof HTMLMediaElement) {
              internalPlayer.removeAttribute('src');
              internalPlayer.load();
            }
          }
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const playerConfig = useMemo(() => ({
    file: {
      forceVideo: true,
      hlsOptions: {
        enableWorker: true,
        lowLatencyMode: true,
      },
      attributes: {
        controlsList: 'nodownload',
        poster: poster,
        playsInline: true,
        onWaiting: () => {
          if (isUnmounted.current) return;
          setIsLoading(true);
        },
        onPlaying: () => {
          if (isUnmounted.current) return;
          setIsLoading(false);
        },
      }
    }
  }), [poster]);

  useEffect(() => {
    // Reset play state when source changes
    setIsReady(false);
    setIsPlaying(autoPlay);
    setError(null);
    setIsLoading(true);
  }, [src, autoPlay]);

  useEffect(() => {
    setIsMuted(muted);
  }, [muted]);

  const handleMouseMove = () => {
    if (isUnmounted.current) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isUnmounted.current || !isReady) return;
    
    // Throttle play requests to prevent "interrupted by pause" errors
    const now = Date.now();
    if (now - lastPlayRequestTime.current < 200) return;
    lastPlayRequestTime.current = now;
    
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnmounted.current) return;
    setIsMuted(!isMuted);
  };

  const togglePip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnmounted.current) return;
    setPip(!pip);
  };

  const handleProgress = (state: { played: number; loaded: number; playedSeconds: number; loadedSeconds: number }) => {
    if (isUnmounted.current) return;
    if (!seeking) {
      setPlayed(state.played);
      setLoaded(state.loaded);
      setPlayedSeconds(state.playedSeconds);
    }
    if (duration === 0 && playerRef.current) {
      const d = typeof playerRef.current.getDuration === 'function' ? playerRef.current.getDuration() : 0;
      if (d > 0) setDuration(d);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUnmounted.current) return;
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    if (isUnmounted.current) return;
    setSeeking(true);
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    if (isUnmounted.current) return;
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat((e.target as HTMLInputElement).value));
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const skipForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(playedSeconds + 10);
    }
  };

  const skipBackward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(Math.max(0, playedSeconds - 10));
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group overflow-hidden bg-black flex items-center justify-center rounded-xl shadow-2xl ${className}`}
      style={{ aspectRatio: '16/9' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={clickToPlay ? togglePlay : undefined}
    >
      <Player
        ref={playerRef}
        url={src}
        playing={isPlaying}
        muted={isMuted}
        volume={volume}
        loop={loop}
        pip={pip}
        playbackRate={1.0}
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        poster={poster}
        onProgress={handleProgress as any}
        onReady={() => {
          if (isUnmounted.current) return;
          setIsReady(true);
          setIsLoading(false);
          if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
            setDuration(playerRef.current.getDuration());
          }
        }}
        onEnded={() => {
          if (isUnmounted.current) return;
          setIsPlaying(false);
        }}
        onError={(e) => {
          if (isUnmounted.current) return;
          setError(`Error playing video. Format may not be supported by your browser. ${e}`);
        }}
        config={playerConfig as any}
      />

      {/* Loading & Buffer State */}
      <AnimatePresence>
        {isLoading && !error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-20 pointer-events-none"
          >
            <RefreshCcw className="w-12 h-12 text-white animate-spin opacity-80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 p-8 text-center"
          >
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-sm">
              <p className="text-white font-medium mb-4 leading-relaxed">{error}</p>
              <button 
                onClick={(e) => { 
                   e.stopPropagation();
                   if (isUnmounted.current) return;
                   setError(null); 
                   setIsLoading(true);
                   setTimeout(() => {
                     if (isUnmounted.current) return;
                     setIsLoading(false);
                   }, 2000);
                }}
                className="px-6 py-2 bg-white text-black font-bold rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Controls Overlay */}
      {controls && !error && (
        <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none flex flex-col justify-end ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 opacity-70"></div>
          
          <div className="relative p-4 md:p-6 space-y-4 pointer-events-auto">
            {/* Progress Bar Container */}
            <div className="relative h-1.5 group/progress cursor-pointer flex items-center">
              {/* Loaded Background */}
              <div 
                className="absolute inset-y-0 left-0 bg-white/20 rounded-full"
                style={{ width: `${loaded * 100}%` }}
              ></div>
              
              {/* Progress Slider */}
              <input
                type="range"
                min={0}
                max={0.999999}
                step="any"
                value={played}
                onMouseDown={handleSeekMouseDown}
                onChange={handleSeekChange}
                onMouseUp={handleSeekMouseUp}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              {/* Track Background */}
              <div className="absolute inset-y-0 w-full bg-white/10 rounded-full h-1 group-hover/progress:h-1.5 transition-all"></div>
              
              {/* Active Progress */}
              <div 
                className="absolute inset-y-0 left-0 bg-[#967bb6] rounded-full h-1 group-hover/progress:h-1.5 transition-all"
                style={{ width: `${played * 100}%` }}
              ></div>
              
              {/* Handle */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity transform -translate-x-1/2 border-2 border-[#967bb6]"
                style={{ left: `${played * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 md:space-x-5">
                <button 
                  onClick={togglePlay}
                  className="p-2 hover:bg-white/20 rounded-full transition-all text-white backdrop-blur-sm"
                >
                  {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                </button>

                <div className="flex items-center space-x-1">
                  <button 
                    onClick={skipBackward}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/90"
                    title="Back 10s"
                  >
                    <Rewind size={20} fill="currentColor" />
                  </button>
                  <button 
                    onClick={skipForward}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/90"
                    title="Forward 10s"
                  >
                    <FastForward size={20} fill="currentColor" />
                  </button>
                </div>

                <div className="group flex items-center space-x-2">
                  <button 
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/90"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step="any"
                    value={volume}
                    onChange={(e) => {
                      if (isUnmounted.current) return;
                      setVolume(parseFloat(e.target.value));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-0 group-hover:w-20 overflow-hidden transition-all duration-300 h-1 bg-white/30 rounded-full appearance-none accent-white cursor-pointer"
                  />
                </div>

                <div className="text-xs font-bold text-white/90 font-mono tracking-wider tabular-nums">
                  {formatTime(played * duration)} <span className="text-white/40 mx-1">/</span> {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                 <button 
                  onClick={togglePip}
                  className={`p-2 hover:bg-white/20 rounded-full transition-colors ${pip ? 'text-[#967bb6]' : 'text-white/90'}`}
                  title="Picture in Picture"
                >
                  <Pip size={20} />
                </button>
                
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/90"
                >
                  {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Center Large Play Icon (visible when paused and controls are hidden) */}
      {!isPlaying && !isLoading && !error && showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 shadow-2xl"
          >
            <Play size={40} className="text-white fill-current ml-1" />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
