import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw,
  FastForward, 
  Rewind,
  PictureInPicture as Pip,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const AnyPlayer = ReactPlayer as any;
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [played, setPlayed] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPip, setIsPip] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    setPlayed(state.played);
    setCurrentTime(state.playedSeconds);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPlayed(val);
    playerRef.current?.seekTo(val, 'fraction');
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const togglePip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPip(!isPip);
  };

  const skip = (seconds: number) => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const currentTimeVal = playerRef.current.getCurrentTime() || 0;
      playerRef.current.seekTo(currentTimeVal + seconds, 'seconds');
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleActivity}
      onClick={clickToPlay ? togglePlay : undefined}
      className={`relative group bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      <div className="w-full h-full relative z-0">
        {AnyPlayer && (
          <AnyPlayer
            ref={playerRef}
            url={src}
            width="100%"
            height="100%"
            playing={isPlaying}
            muted={isMuted}
            volume={volume}
            loop={loop}
            pip={isPip}
            playsinline
            light={poster}
            className="react-player"
            onReady={(player: any) => {
              setIsLoading(false);
              if (player && typeof player.getDuration === 'function') {
                setDuration(player.getDuration());
              }
            }}
            onStart={() => setIsLoading(false)}
            onPlay={() => setIsLoading(false)}
            onPause={() => setIsLoading(false)}
            onProgress={handleProgress}
            onError={(e: any) => {
              console.error("Player Error:", e);
              setError('Video failed to load. The format may not be supported or the link is expired.');
              setIsLoading(false);
            }}
            config={{
              file: {
                attributes: {
                  crossOrigin: "anonymous",
                  preload: "metadata",
                  onWaiting: () => setIsLoading(true),
                  onPlaying: () => setIsLoading(false),
                  onDurationChange: (e: any) => {
                    if (e.target && e.target.duration) {
                      setDuration(e.target.duration);
                    }
                  },
                  style: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }
                }
              }
            } as any}
          />
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10"
          >
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 p-6 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-white font-medium max-w-xs">{error}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setError(null); setIsLoading(true); }}
              className="mt-4 px-6 py-2 bg-white text-black font-black rounded-xl text-xs uppercase"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 transition-opacity duration-300 flex flex-col justify-end ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'} ${!controls ? 'hidden' : ''} z-10`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-3">
          {/* Progress Bar */}
          <div className="relative h-1.5 group/progress cursor-pointer flex items-center">
            <input 
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={played}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#967bb6] transition-all duration-100"
                style={{ width: `${played * 100}%` }}
              />
            </div>
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-[#967bb6] shadow-xl opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${played * 100}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="text-white hover:scale-110 transition-transform"
              >
                {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
              </button>

              <div className="flex items-center gap-2">
                <button onClick={() => skip(-10)} className="text-white/80 hover:text-white"><Rewind size={18} fill="white" /></button>
                <button onClick={() => skip(10)} className="text-white/80 hover:text-white"><FastForward size={18} fill="white" /></button>
              </div>

              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="text-white/80 hover:text-white">
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-20 transition-all h-1 bg-white/20 rounded-full appearance-none accent-white cursor-pointer"
                />
              </div>

              <span className="text-[10px] font-mono font-black text-white/80 tracking-widest">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={togglePip} className={`transition-colors ${isPip ? 'text-[#967bb6]' : 'text-white/80 hover:text-white'}`}>
                <Pip size={20} />
              </button>
              <button onClick={toggleFullscreen} className="text-white/80 hover:text-white">
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Large Center Play Icon */}
      {!isPlaying && showPlayIcon && !error && !isLoading && !poster && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        >
          <div className="w-20 h-20 bg-[#967bb6]/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
            <Play size={40} className="text-white fill-white ml-2" />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VideoPlayer;


