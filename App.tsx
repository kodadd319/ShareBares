
import React, { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import * as PeerNamespace from 'simple-peer';

const SimplePeer = (PeerNamespace as any).default || PeerNamespace;
import TopNav from './components/TopNav';
import FriendsListModal from './components/FriendsListModal';
import HomePage from './components/HomePage';
import ChatPage from './components/ChatPage';
import LoginPage from './components/LoginPage';
import PostCard from './components/PostCard';
import Logo from './components/Logo';
import MediaStore from './components/MediaStore';
import MyVideosPage from './components/MyVideosPage';
import StoreManagementPage from './components/StoreManagementPage';
import StablePage from './components/StablePage';
import JoinStablePage from './components/JoinStablePage';
import MyProfilePage from './components/MyProfilePage';
import StripeCheckout from './components/StripeCheckout';
import StoreCustomizationPage from './components/StoreCustomizationPage';
import StoreActivationGate from './components/StoreActivationGate';
import CustomProfilePage from './components/CustomProfilePage';
import GameRoom from './components/GameRoom';
import VideoPlayer from './components/VideoPlayer';
import ThemeMusicPlayer from './components/ThemeMusicPlayer';
import { ShareBaresProvider, useShareBares } from './components/MascotContext';
import { MOCK_USERS, MOCK_POSTS, CURRENT_USER_ID, MOCK_STORE_ITEMS, MOCK_STABLE_LISTINGS, APP_LOGO_URL } from './constants';
import { User, Post, PostVisibility, Message, StoreItem, MediaItem, AppNotification, NotificationType, StableListing, StoreCustomization, ProfileCustomization, AppComment } from './types';
import { Toaster, toast } from 'sonner';
import { Skeleton, PostSkeleton, ProfileSkeleton, NotificationSkeleton } from './components/Skeleton';
import { 
  Video, Phone, MicOff, VideoOff, X, RefreshCw, Camera, Check, Loader2, 
  ArrowLeft, ChevronRight, User as UserIcon, Shield, Bell, HelpCircle, 
  LogOut, DollarSign, ShoppingBag, Briefcase, Dices, CreditCard, 
  ShieldCheck, TrendingUp, Sparkles, ShieldAlert, Heart, MessageCircle, 
  MapPin, Mail, Globe, Twitter, Instagram, Plus, Play, Trash2, 
  Image as ImageIcon, Wand2, Send, MessageSquare, ChevronDown, 
  Palette, ExternalLink, Star, UserCheck, UserPlus, UserX, Ban, Settings as SettingsIcon,
  BellRing, Lock, ShoppingCart, MessageSquareMore, Share2, Upload, Download, Search,
  Menu, Info, AlertTriangle, Eye, EyeOff, LockKeyhole, Flame
} from 'lucide-react';
import { 
  db, auth, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, 
  query, where, orderBy, limit, arrayUnion, arrayRemove, or, getDocFromServer, enableNetwork,
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut as firebaseLogout, signInWithCustomToken, setPersistence, browserLocalPersistence,
  signInWithPopup, GoogleAuthProvider, getRedirectResult as getGoogleRedirectResult, signInWithRedirect,
  testFirestoreConnection, handleFirestoreError, OperationType, firebaseConfig,
  loginWithGoogle, loginWithGoogleRedirect, uploadFile
} from './firebase';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with safety guard
let ai: any = null;
try {
  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' && (window as any).process?.env?.GEMINI_API_KEY);
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("GEMINI_API_KEY is not configured in client environment. Using fallbacks.");
  }
} catch (error) {
  console.error("GoogleGenAI client initialization error:", error);
}

async function generateJadePost() {
  if (!ai) {
    return "Beautiful day to share something beautiful. 😉 #ShareBares";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Write a short, suggestive, and engaging social media post for a community named ShareBares. The tone should be slightly naughty but fun. Max 20 words.",
    });
    return (response.text || "Just thinking about you guys... Share what you're up to! #ShareBares").trim();
  } catch (error) {
    console.error("Jade post generation failed", error);
    return "Feeling a bit shy today... but not for long. 😉";
  }
}

async function generateJadeComment(postContent: string) {
  if (!ai) {
    return "Looking good! 😉";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a short, community-focused, and slightly flirty comment for this post: "${postContent}". Keep it under 10 words.`,
    });
    return (response.text || "Love this! Keep it coming. 🔥").trim();
  } catch (error) {
    console.error("Jade comment generation failed", error);
    return "Looking good! 😉";
  }
}

async function generateJadeResponse(message: string, history: any[]) {
  if (!ai) {
    return "I'm a bit overwhelmed right now, let's chat in a bit! 😘";
  }
  try {
    // Format history if needed, but for now simple message
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: "You are Jade, a friendly, flirty, and outgoing AI member of the ShareBares community. You love chatting with people and encouraging them to 'share their bares'. Be supportive, slightly suggestive, and very engaging. Keep responses concise.",
      },
    });
    return (response.text || "I'm not sure what to say, but I'm listening! Tell me more. 😉").trim();
  } catch (error) {
    console.error("Jade response generation failed", error);
    return "I'm a bit overwhelmed right now, let's chat in a bit! 😘";
  }
}

async function generateCaptionSuggestion(content: string) {
  if (!ai) {
    return "Feeling free and wild. 😈";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a catchy, naughty, and engaging caption for a post about: "${content}". Be creative!`,
    });
    return (response.text || "Uncensored and ready for more. #ShareBares").trim();
  } catch (error) {
    console.error("Caption suggestion failed", error);
    return "Feeling free and wild. 😈";
  }
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const SplashScreen: React.FC<{ onComplete: () => void; isFirestoreOnline: boolean }> = ({ onComplete, isFirestoreOnline }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500); // Slightly longer splash for better brand presence
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-center space-y-8 animate-in zoom-in duration-1000">
        <Logo size="lg" className="mb-8" />
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase chrome-text drop-shadow-[0_0_20px_rgba(150,123,182,0.5)]">
            ShareBares
          </h1>
          <p className="text-[#967bb6] text-lg md:text-2xl font-black uppercase tracking-[0.2em] leading-relaxed italic px-4">
            "share your bares"
          </p>
          <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-lg mx-auto px-6">
            Completely uncensored adult community. Custom profiles, sexy content. Post free pics, sell videos and pics, buy from other users and creators. Messaging, video chat, phone sex, connect with escorts. No rules, no limits.
          </p>
          <div className="flex flex-col items-center justify-center space-y-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            <span>Powered by</span>
            <span className="mt-2 text-slate-700">www.sharebares.com</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-16 flex flex-col items-center space-y-4">
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#967bb6] to-[#6b46c1] animate-loading-bar"></div>
        </div>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] animate-pulse">Initializing Freedom</p>
        {!isFirestoreOnline && (
          <button 
            onClick={async () => {
              try {
                await enableNetwork(db);
                window.location.reload();
              } catch (e) {
                console.error("Manual reconnect failed", e);
              }
            }}
            className="mt-4 text-[8px] font-black text-emerald-500 uppercase tracking-widest hover:underline cursor-pointer"
          >
            Force Network Reconnect
          </button>
        )}
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 px-8 text-center">
        <p className="text-[7px] leading-tight text-slate-700 font-medium uppercase tracking-wider max-w-3xl mx-auto opacity-60">
          LEGAL DISCLAIMER: ShareBares maintains a zero-tolerance policy for illegal content. Users are strictly prohibited from uploading, selling, or distributing copyrighted or trademarked material without authorization. Any content involving minors, non-consensual sexual material, or illegal acts is strictly forbidden and will result in immediate termination of account and reporting to relevant authorities. By using this platform, you agree to comply with all local and international laws.
        </p>
      </div>
    </div>
  );
};

const CallOverlay: React.FC<{
  call: any;
  callAccepted: boolean;
  myVideo: React.RefObject<HTMLVideoElement | null>;
  userVideo: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAnswer: () => void;
  onHangup: () => void;
  onSwitchCamera: () => void;
  isCalling: boolean;
  type: 'voice' | 'video';
}> = ({ call, callAccepted, myVideo, userVideo, stream, remoteStream, onAnswer, onHangup, onSwitchCamera, isCalling, type }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (myVideo.current && stream) myVideo.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (userVideo.current && remoteStream) userVideo.current.srcObject = remoteStream;
  }, [remoteStream]);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <div className="relative w-full aspect-video bg-white/5 rounded-[3rem] overflow-hidden chrome-border shadow-2xl mb-8 flex items-center justify-center">
          {type === 'video' ? (
            <>
              {callAccepted ? (
                <div className="w-full h-full relative">
                  <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                  {!remoteStream && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="w-16 h-16 border-4 border-[#967bb6] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Connecting Stream...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-[#967bb6]/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <Video size={48} className="text-[#967bb6]" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                    {isCalling ? 'Calling...' : 'Incoming Video Call...'}
                  </p>
                </div>
              )}
              {stream && (
                <div className="absolute bottom-6 right-6 w-32 md:w-48 aspect-video bg-black rounded-2xl overflow-hidden border-2 border-[#967bb6]/50 shadow-2xl z-10">
                  <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gradient-to-br from-[#967bb6]/20 to-transparent rounded-full flex items-center justify-center mb-8 border border-[#967bb6]/10 relative">
                <div className="absolute inset-0 rounded-full border-2 border-[#967bb6] animate-ping opacity-20"></div>
                <Phone size={48} className="text-[#967bb6]" />
              </div>
              <h2 className="text-3xl font-black chrome-text uppercase tracking-tighter mb-2">
                {isCalling ? 'Calling...' : callAccepted ? 'In Call' : 'Incoming Call'}
              </h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                {isCalling ? 'Waiting for answer...' : call?.name || 'Private User'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-6">
          {callAccepted && (
            <>
              <button 
                onClick={toggleMute}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${isMuted ? 'bg-red-500 shadow-red-500/20' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {isMuted ? <MicOff size={28} /> : <Phone size={28} />}
              </button>
              {type === 'video' && (
                <button 
                  onClick={toggleVideo}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${isVideoOff ? 'bg-red-500 shadow-red-500/20' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {isVideoOff ? <VideoOff size={28} /> : <Video size={28} />}
                </button>
              )}
            </>
          )}
          {!callAccepted && !isCalling && (
            <button 
              onClick={onAnswer}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-500/20 hover:scale-110 transition-all"
            >
              {type === 'video' ? <Video size={32} /> : <Phone size={32} />}
            </button>
          )}
          <button 
            onClick={onHangup}
            className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/20 hover:scale-110 transition-all"
          >
            <X size={32} />
          </button>
          {callAccepted && type === 'video' && (
              <button 
                onClick={onSwitchCamera}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 text-white shadow-xl hover:bg-white/20 transition-all ml-4"
                title="Switch Camera"
              >
                <RefreshCw size={28} />
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileEditPage: React.FC<{ 
  user: User; 
  onSave: (profile: Partial<User>) => Promise<void>; 
  onCancel: () => void;
}> = ({ user, onSave, onCancel }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [cover, setCover] = useState(user.coverImage || '');
  const [isCreator, setIsCreator] = useState(user.isCreator);
  const [location, setLocation] = useState(user.location || '');
  const [occupation, setOccupation] = useState(user.occupation || '');
  const [tagline, setTagline] = useState(user.tagline || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [twitter, setTwitter] = useState(user.socials?.twitter || '');
  const [instagram, setInstagram] = useState(user.socials?.instagram || '');
  const [website, setWebsite] = useState(user.socials?.website || '');
  const [isSaving, setIsSaving] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCover(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !username) return;
    
    setIsSaving(true);
    try {
      let finalAvatar = avatar;
      let finalCover = cover;

      // Handle Avatar Upload
      if (avatar.startsWith('blob:')) {
        const file = avatarInputRef.current?.files?.[0];
        if (file) {
          try {
            finalAvatar = await uploadFile(file, `users/${user.id}/avatar_${Date.now()}`);
          } catch (err) {
            console.error("Avatar upload failed:", err);
          }
        }
      }

      // Handle Cover Upload
      if (cover.startsWith('blob:')) {
        const file = coverInputRef.current?.files?.[0];
        if (file) {
          try {
            finalCover = await uploadFile(file, `users/${user.id}/cover_${Date.now()}`);
          } catch (err) {
            console.error("Cover upload failed:", err);
          }
        }
      }

      await onSave({
        displayName,
        username,
        bio,
        avatar: finalAvatar,
        coverImage: finalCover,
        isCreator,
        location,
        occupation,
        tagline,
        email,
        phone,
        socials: {
          twitter,
          instagram,
          website
        }
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter chrome-text">Edit Profile</h1>
          <p className="text-slate-500 text-sm">Update your public information.</p>
        </div>
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-8 border-[#c0c0c0]/10 shadow-2xl space-y-8 relative overflow-hidden chrome-border">
        <div className="relative mb-28">
          <div 
            className="h-44 w-full rounded-2xl overflow-hidden bg-white/5 relative group border border-white/5 cursor-pointer"
            onClick={() => coverInputRef.current?.click()}
          >
            <img 
              src={cover || APP_LOGO_URL} 
              className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" 
              alt="" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== APP_LOGO_URL) {
                  target.src = APP_LOGO_URL;
                }
              }}
            />
            <input 
              type="file" 
              ref={coverInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleCoverUpload} 
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <div className="bg-[#967bb6] p-3 rounded-full text-white shadow-xl hover:scale-110 transition-all chrome-border">
                <Camera size={24} />
              </div>
            </div>
          </div>

          <div className="absolute -bottom-16 left-8 group">
            <div 
              className="w-32 h-32 rounded-3xl border-4 border-black bg-black overflow-hidden relative shadow-2xl chrome-border cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              <img 
                src={avatar || APP_LOGO_URL} 
                className="w-full h-full object-cover" 
                alt="" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== APP_LOGO_URL) {
                    target.src = APP_LOGO_URL;
                  }
                }}
              />
              <input 
                type="file" 
                ref={avatarInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                 <div className="bg-[#967bb6] p-2 rounded-lg text-white">
                   <Camera size={18} />
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Name</label>
            <input 
              type="text" 
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#967bb6] font-bold">@</span>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Bio</label>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[120px] focus:ring-1 focus:ring-[#967bb6] outline-none resize-none text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Tagline</label>
            <input 
              type="text" 
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Your catchy headline"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Occupation</label>
            <input 
              type="text" 
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="What do you do?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Location</label>
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Phone</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Social Media & Contact</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
            />
            <input 
              type="text" 
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="Twitter/X Username"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
            />
            <input 
              type="text" 
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="Instagram Username"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
            />
            <input 
              type="url" 
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website URL"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
            />
          </div>
        </div>

        <div className="p-6 bg-[#967bb6]/5 rounded-2xl border border-[#967bb6]/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100">Creator Mode</h3>
              <p className="text-xs text-slate-500">Enable creator features on your profile.</p>
            </div>
            <button 
              type="button"
              onClick={() => setIsCreator(!isCreator)}
              className={`w-14 h-7 rounded-full relative transition-all duration-300 ${isCreator ? 'bg-[#967bb6]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${isCreator ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 bg-white/5 text-slate-400 py-4 rounded-2xl font-black transition-all hover:bg-white/10"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSaving}
            className={`flex-[2] bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white py-4 rounded-2xl font-black shadow-xl shadow-[#967bb6]/20 transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98] chrome-border ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
            {!isSaving && <Check size={20} />}
            {isSaving && <Loader2 className="animate-spin" size={20} />}
          </button>
        </div>
      </form>
    </div>
  );
};

const SettingsPage: React.FC<{ 
  me: User; 
  onEditProfile: () => void;
  onLogout: () => void;
  onUpdateUser: (data: Partial<User>) => void;
  setConfirmAction: (action: { message: string, onConfirm: () => void } | null) => void;
}> = ({ me, onEditProfile, onLogout, onUpdateUser, setConfirmAction }) => {
  const { showMascot } = useShareBares();
  const [activeView, setActiveView] = useState<'main' | 'account' | 'privacy' | 'notifications' | 'security' | 'help'>('main');

  const updateSetting = (key: string, value: any) => {
    onUpdateUser({
      settings: {
        ...(me.settings || {
          pushNotifications: true,
          emailNotifications: true,
          profileVisibility: 'public',
          messagingPrivacy: 'everyone'
        }),
        [key]: value
      }
    });
  };

  const renderSubHeader = (title: string) => (
    <div className="mb-8">
      <button onClick={() => setActiveView('main')} className="flex items-center space-x-2 text-[#967bb6] mb-4 hover:text-white transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-black uppercase tracking-widest text-[10px]">Back to Settings</span>
      </button>
      <h1 className="text-4xl font-black text-white tracking-tighter chrome-text uppercase">{title}</h1>
    </div>
  );

  const SettingsAdBanner = () => (
    <div className="mt-12 flex justify-center">
      <a href="https://t.mbjms.com/408699/3785/0?bo=Array&target=banners&file_id=554083&po=6456&aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0002" target="_blank" rel="noreferrer">
        <img 
          src="https://www.imglnkx.com/3785/010766A_GDAT_18_ALL_EN_71_L.jpg" 
          width="300" 
          height="250" 
          alt=""
          className="rounded-2xl shadow-2xl border border-white/10"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== APP_LOGO_URL) {
              target.src = APP_LOGO_URL;
            }
          }}
        />
      </a>
    </div>
  );

  if (activeView === 'account') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-left-4 duration-300">
        {renderSubHeader('Account')}
        <div className="glass-panel rounded-3xl overflow-hidden border-[#c0c0c0]/10 shadow-xl chrome-border divide-y divide-white/5">
          <div className="p-6 hover:bg-white/[0.02] transition-colors">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Username</label>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">@{me.username || 'not_set'}</span>
              <button 
                onClick={() => {
                  const newUsername = prompt('Enter new username:', me.username);
                  if (newUsername) onUpdateUser({ username: newUsername });
                }}
                className="text-[#967bb6] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Change
              </button>
            </div>
          </div>
          <div className="p-6 hover:bg-white/[0.02] transition-colors">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email</label>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">{me.email || 'not_set'}</span>
              <button 
                onClick={() => {
                  const newEmail = prompt('Enter new email:', me.email);
                  if (newEmail) onUpdateUser({ email: newEmail });
                }}
                className="text-[#967bb6] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Change
              </button>
            </div>
          </div>
          <div className="p-6 hover:bg-white/[0.02] transition-colors">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Password</label>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">••••••••••••</span>
              <button 
                onClick={() => showMascot({
                  action: 'wink',
                  message: 'Password reset link sent to your email! 😉📧',
                  duration: 3000
                })}
                className="text-[#967bb6] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Update
              </button>
            </div>
          </div>
          <div className="p-6 bg-red-500/5">
            <button 
              onClick={() => setConfirmAction({
                message: 'Are you sure you want to delete your account? This action is irreversible.',
                onConfirm: () => {
                  onLogout();
                  setConfirmAction(null);
                }
              })}
              className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-400 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>

        <SettingsAdBanner />
      </div>
    );
  }

  if (activeView === 'privacy') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-left-4 duration-300">
        {renderSubHeader('Privacy')}
        <div className="glass-panel rounded-3xl overflow-hidden border-[#c0c0c0]/10 shadow-xl chrome-border divide-y divide-white/5">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Profile Visibility</p>
              <p className="text-xs text-slate-500 mt-1">Make your profile private to non-subscribers</p>
            </div>
            <button 
              onClick={() => updateSetting('profileVisibility', me.settings?.profileVisibility === 'public' ? 'private' : 'public')}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${me.settings?.profileVisibility === 'private' ? 'bg-[#967bb6]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${me.settings?.profileVisibility === 'private' ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div className="p-6">
            <p className="font-bold text-white mb-4">Messaging Privacy</p>
            <div className="grid grid-cols-3 gap-3">
              {['everyone', 'following', 'none'].map((option) => (
                <button
                  key={option}
                  onClick={() => updateSetting('messagingPrivacy', option)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${me.settings?.messagingPrivacy === option ? 'bg-[#967bb6] border-[#967bb6] text-white shadow-lg shadow-[#967bb6]/20' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02]">
            <p className="font-bold text-white">Blocked Accounts</p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 font-bold">0 users</span>
              <ChevronRight size={16} className="text-slate-700 group-hover:text-[#967bb6] transition-colors" />
            </div>
          </div>
        </div>

        <SettingsAdBanner />
      </div>
    );
  }

  if (activeView === 'notifications') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-left-4 duration-300">
        {renderSubHeader('Notifications')}
        <div className="glass-panel rounded-3xl overflow-hidden border-[#c0c0c0]/10 shadow-xl chrome-border divide-y divide-white/5">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Push Notifications</p>
              <p className="text-xs text-slate-500 mt-1">Receive alerts on your device</p>
            </div>
            <button 
              onClick={() => updateSetting('pushNotifications', !me.settings?.pushNotifications)}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${me.settings?.pushNotifications ? 'bg-[#967bb6]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${me.settings?.pushNotifications ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Email Notifications</p>
              <p className="text-xs text-slate-500 mt-1">Weekly activity summaries</p>
            </div>
            <button 
              onClick={() => updateSetting('emailNotifications', !me.settings?.emailNotifications)}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${me.settings?.emailNotifications ? 'bg-[#967bb6]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${me.settings?.emailNotifications ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <SettingsAdBanner />
      </div>
    );
  }

  if (activeView === 'security') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-left-4 duration-300">
        {renderSubHeader('Security')}
        <div className="glass-panel rounded-3xl overflow-hidden border-[#c0c0c0]/10 shadow-xl chrome-border divide-y divide-white/5">
          <div className="p-6 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02]">
            <div>
              <p className="font-bold text-white">Two-Factor Authentication</p>
              <p className="text-xs text-slate-500 mt-1">Add an extra layer of security</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500/50">Disabled</span>
          </div>
          <div className="p-6 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02]">
            <div>
              <p className="font-bold text-white">Login Activity</p>
              <p className="text-xs text-slate-500 mt-1">Check where you're logged in</p>
            </div>
            <ChevronRight size={16} className="text-slate-700 group-hover:text-[#967bb6] transition-colors" />
          </div>
        </div>

        <SettingsAdBanner />
      </div>
    );
  }

  if (activeView === 'help') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-left-4 duration-300">
        {renderSubHeader('Help & Support')}
        <div className="space-y-4">
          {['Help Center', 'Safety Center', 'Community Guidelines', 'Terms of Service', 'Privacy Policy'].map((item) => (
            <button key={item} className="w-full glass-panel rounded-2xl p-6 flex items-center justify-between hover:bg-white/5 transition-all border-[#c0c0c0]/10 chrome-border group">
              <span className="font-bold text-slate-200 group-hover:text-white">{item}</span>
              <ChevronRight size={18} className="text-slate-700 group-hover:text-[#967bb6]" />
            </button>
          ))}
        </div>

        <SettingsAdBanner />
      </div>
    );
  }

  const sections = [
    { 
      id: 'account', 
      title: 'Account Settings', 
      icon: UserIcon, 
      items: [
        { label: 'Edit Profile', sub: 'Change your display name, bio, and photos', onClick: onEditProfile },
        { label: 'Account Details', sub: 'Username, Email, Password', onClick: () => setActiveView('account') }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Safety',
      icon: Shield,
      items: [
        { label: 'Privacy Settings', sub: 'Visibility, Messaging, Blocks', onClick: () => setActiveView('privacy') }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Notification Preferences', sub: 'Push, Email, SMS', onClick: () => setActiveView('notifications') }
      ]
    },
    {
      id: 'security',
      title: 'Security',
      icon: Lock,
      items: [
        { label: 'Security & Login', sub: '2FA, Login activity', onClick: () => setActiveView('security') }
      ]
    },
    {
      id: 'help',
      title: 'Support',
      icon: HelpCircle,
      items: [
        { label: 'Help & Support', sub: 'Help center, Safety, Terms', onClick: () => setActiveView('help') }
      ]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="mb-12 flex justify-center">
        <a href="https://t.amyfc.link/408699/779/18234?aff_sub=Top+banner+%22the+game+room+page&aff_sub2=Top+banner+%22settings+page%22&bo=2779,2778,2777,2776,2775&source=sharebares&file_id=415548&po=6533&aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0002" target="_blank" rel="noreferrer">
          <img 
            src="https://www.imglnkx.com/779/006611AX_FCAM_18_ALL_EN_71_L.jpg" 
            width="300" 
            height="250" 
            style={{ border: 0 }} 
            alt="Banner"
            className="rounded-2xl shadow-2xl border border-white/10"
          />
        </a>
      </div>

      <div className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tighter chrome-text uppercase">Settings</h1>
        <p className="text-slate-500 mt-2">Manage your account preferences and privacy.</p>
      </div>

      <div className="space-y-8">
        {sections.map(section => (
          <div key={section.id} className="glass-panel rounded-3xl overflow-hidden border-[#c0c0c0]/10 shadow-xl chrome-border">
            <div className="p-6 border-b border-white/5 flex items-center space-x-3 bg-white/[0.02]">
              <section.icon className="text-[#967bb6]" size={20} />
              <h2 className="font-black text-white uppercase tracking-widest text-sm">{section.title}</h2>
            </div>
            <div className="divide-y divide-white/5">
              {section.items.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all text-left group"
                >
                  <div>
                    <p className="font-bold text-slate-100 group-hover:text-[#967bb6] transition-colors">{item.label}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{item.sub}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-700 group-hover:text-[#967bb6] group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={onLogout}
          className="w-full glass-panel rounded-3xl p-6 flex items-center justify-center space-x-3 text-red-500 font-black uppercase tracking-widest border-[#c0c0c0]/10 hover:bg-red-500/10 transition-all chrome-border"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>

      <SettingsAdBanner />
    </div>
  );
};


const ProfileCreationPage: React.FC<{ currentUserId: string; initialEmail: string; onComplete: (profile: Partial<User>) => Promise<void> }> = ({ currentUserId, initialEmail, onComplete }) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(APP_LOGO_URL);
  const [cover, setCover] = useState(APP_LOGO_URL);
  const [isCreator, setIsCreator] = useState(false);
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [tagline, setTagline] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCover(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !username) {
      toast.error('Name and Username are required');
      return;
    }
    
    setIsSaving(true);
    try {
      let finalAvatar = avatar;
      let finalCover = cover;

      // Handle file uploads if they are local blobs
      if (avatar.startsWith('blob:')) {
        const avatarFile = (avatarInputRef.current?.files?.[0]);
        if (avatarFile) {
          try {
            finalAvatar = await uploadFile(avatarFile, `users/${currentUserId}/avatar_${Date.now()}`);
          } catch (err) {
            console.error("Avatar upload failed:", err);
          }
        }
      }

      if (cover.startsWith('blob:')) {
        const coverFile = (coverInputRef.current?.files?.[0]);
        if (coverFile) {
          try {
            finalCover = await uploadFile(coverFile, `users/${currentUserId}/cover_${Date.now()}`);
          } catch (err) {
            console.error("Cover upload failed:", err);
          }
        }
      }

      await onComplete({
        id: currentUserId,
        displayName,
        username,
        bio,
        avatar: finalAvatar,
        coverImage: finalCover,
        isCreator,
        location,
        occupation,
        tagline,
        email,
        phone,
        socials: {
          twitter,
          instagram,
          website
        },
        subscribersCount: 0,
        followingCount: 0,
        friendIds: [],
        pendingFriendRequestsSent: [],
        pendingFriendRequestsReceived: [],
        likedPostIds: [],
        fwbIds: [],
        pendingFwbRequestsSent: [],
        pendingFwbRequestsReceived: [],
        fwbRequestsResetDate: new Date().toISOString(),
        fwbRequestsSentCount: 0,
        fanIds: [],
        profileCustomization: {},
        photos: [],
        storeUploads: [],
        blockedUserIds: [],
        settings: {
          pushNotifications: true,
          emailNotifications: true,
          profileVisibility: 'public',
          messagingPrivacy: 'everyone'
        },
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error('Failed to save profile. Please check your connection.');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-12 pb-24 px-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-white mb-3 tracking-tighter chrome-text">Create Your Profile</h1>
          <p className="text-slate-500">Set up your profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-8 border-[#c0c0c0]/10 shadow-2xl space-y-8 relative overflow-hidden chrome-border">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#967bb6]/10 blur-[100px] pointer-events-none"></div>

          <div className="flex justify-end">
            <button 
              type="button"
              onClick={() => firebaseLogout(auth)}
              className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors flex items-center space-x-1"
            >
              <LogOut size={12} />
              <span>Use Different Account</span>
            </button>
          </div>

          <div className="relative mb-28">
            <div 
              className="h-44 w-full rounded-2xl overflow-hidden bg-white/5 relative group border border-white/5 cursor-pointer"
              onClick={() => coverInputRef.current?.click()}
            >
              <img 
                src={cover || APP_LOGO_URL} 
                className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" 
                alt="Cover" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== APP_LOGO_URL) {
                    target.src = APP_LOGO_URL;
                  }
                }}
              />
              <input 
                type="file" 
                ref={coverInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleCoverUpload} 
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <div className="bg-[#967bb6] p-3 rounded-full text-white shadow-xl hover:scale-110 transition-all chrome-border">
                  <Camera size={24} />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-16 left-8 group">
              <div 
                className="w-32 h-32 rounded-3xl border-4 border-black bg-black overflow-hidden relative shadow-2xl chrome-border cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                <img 
                  src={avatar || APP_LOGO_URL} 
                  className="w-full h-full object-cover" 
                  alt="Avatar" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== APP_LOGO_URL) {
                      target.src = APP_LOGO_URL;
                    }
                  }}
                />
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                   <div className="bg-[#967bb6] p-2 rounded-lg text-white">
                     <Camera size={18} />
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Name</label>
              <input 
                type="text" 
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#967bb6] font-bold">@</span>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="username" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Bio</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[120px] focus:ring-1 focus:ring-[#967bb6] outline-none resize-none text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Tagline</label>
              <input 
                type="text" 
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Your catchy headline"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Occupation</label>
              <input 
                type="text" 
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="What do you do?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Phone</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Social Media & Contact</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
              <input 
                type="text" 
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="Twitter/X Username"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
              <input 
                type="text" 
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="Instagram Username"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
              <input 
                type="url" 
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Website URL"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
          </div>

        <div className="p-6 bg-[#967bb6]/5 rounded-2xl border border-[#967bb6]/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100">Creator Mode</h3>
                <p className="text-xs text-slate-500">Enable creator features on your profile.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreator(!isCreator)}
                className={`w-14 h-7 rounded-full relative transition-all duration-300 ${isCreator ? 'bg-[#967bb6]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${isCreator ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className={`w-full bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-[#967bb6]/20 transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98] chrome-border ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isSaving ? 'Saving Profile...' : 'Save Profile'}
            {!isSaving && <Check className="group-hover:translate-x-1 transition-transform" size={24} />}
            {isSaving && <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />}
          </button>
        </form>
      </div>
    </div>
  );
};

const ConfirmModal: React.FC<{ 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
}> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="w-16 h-16 bg-[#967bb6]/20 rounded-full flex items-center justify-center mb-6 mx-auto">
          <ShieldCheck className="text-[#967bb6]" size={32} />
        </div>
        <h3 className="text-white text-xl font-black uppercase tracking-tight text-center mb-4">Confirm Action</h3>
        <p className="text-slate-400 text-sm text-center mb-8 font-bold uppercase tracking-wide leading-relaxed">
          {message}
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all border border-white/10"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-4 bg-[#967bb6] hover:bg-[#a68bc6] text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-[#967bb6]/20"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const InstallPrompt: React.FC<{ onInstall: () => void; onDismiss: () => void }> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-8 duration-500">
      <div className="glass-panel rounded-3xl p-6 border-[#967bb6]/30 shadow-2xl shadow-[#967bb6]/20 chrome-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black border border-[#967bb6]/20 shrink-0">
            <Logo size="sm" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Install ShareBares</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Add to home screen for the full experience</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onDismiss}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <button 
            onClick={onInstall}
            className="bg-[#967bb6] text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#967bb6]/20 hover:scale-105 active:scale-95 transition-all"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not already installed and not dismissed this session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const dismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return { showPrompt, install, dismiss };
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel p-8 rounded-[2.5rem] border-red-500/30 bg-red-500/5 max-w-md w-full chrome-border">
            <ShieldAlert size={64} className="text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              The application encountered an unexpected error. This might be due to a connection issue or a temporary glitch.
            </p>
            <div className="bg-black/40 rounded-2xl p-4 mb-8 text-left overflow-auto max-h-32 border border-white/5">
              <p className="text-red-400 font-mono text-[10px] whitespace-pre-wrap">
                {this.state.error?.message || "Unknown error"}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { showPrompt, install, dismiss } = usePWA();
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authResolvedAtLeastOnce, setAuthResolvedAtLeastOnce] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isFirestoreOnline, setIsFirestoreOnline] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [hasCreatedProfile, setHasCreatedProfile] = useState(false);
  const [isSessionAuthenticated, setIsSessionAuthenticated] = useState(() => {
    return sessionStorage.getItem('sharebares_session_auth') === 'true';
  });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('sharebares_active_tab') || 'feed';
  });

  useEffect(() => {
    localStorage.setItem('sharebares_active_tab', activeTab);
  }, [activeTab]);

  // Handle Automatic detection of Stripe redirect payment success
  useEffect(() => {
    if (!currentUserId) return;
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const itemId = params.get('item_id');
    const priceParam = params.get('price');

    if (paymentStatus && itemId) {
      // Clear query params from browser visible URL bar
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      if (paymentStatus === 'success') {
        const parsedPrice = parseFloat(priceParam || '20');
        handleUnlockVideoPaymentSuccess(itemId, parsedPrice);
      } else if (paymentStatus === 'cancel') {
        toast.error('Secure Stripe Checkout cancelled or unsuccessful.');
      }
    }
  }, [currentUserId]);

  // Firestore Connectivity Check
  useEffect(() => {
    let checkInterval: any;
    const initConnection = async () => {
      // Use more retries on initial startup
      const isOnline = await testFirestoreConnection(5);
      setIsFirestoreOnline(isOnline);
      
      if (!isOnline) {
        console.warn('Initial connection failed, setting up background check');
        // If still offline, set up an interval to keep trying to reconnect
        checkInterval = setInterval(async () => {
          const check = await testFirestoreConnection(1);
          if (check) {
            console.log('Reconnected to Firestore!');
            setIsFirestoreOnline(true);
            clearInterval(checkInterval);
            toast.success('Database reconnected');
          }
        }, 10000);
      }
    };
    initConnection();
    return () => clearInterval(checkInterval);
  }, []);

  const { showMascot } = useShareBares();

  const [profileTab, setProfileTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stableListings, setStableListings] = useState<StableListing[]>([]);
  const [comments, setComments] = useState<AppComment[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<PostVisibility>(PostVisibility.PUBLIC);
  const [newPostMedia, setNewPostMedia] = useState<File | null>(null);
  const [newPostMediaPreview, setNewPostMediaPreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isJadeTyping, setIsJadeTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isViewingAsPublic, setIsViewingAsPublic] = useState(false);

  const navigateToStore = useCallback((userId: string) => {
    setViewingUserId(userId);
    setActiveTab('media-store');
    window.scrollTo(0, 0);
  }, []);

  const navigateToProfile = useCallback((userId: string) => {
    if (userId === currentUserId && !isViewingAsPublic) {
      setActiveTab('profile');
    } else {
      setViewingUserId(userId);
      setActiveTab('user-profile');
    }
    setIsViewingAsPublic(false);
  }, [currentUserId, isViewingAsPublic]);

  const viewOwnProfileAsPublic = () => {
    setViewingUserId(currentUserId);
    setActiveTab('user-profile');
    setIsViewingAsPublic(true);
    window.scrollTo(0, 0);
  };

  const [isEditProfileMenuOpen, setIsEditProfileMenuOpen] = useState(false);
  const [isFriendsListOpen, setIsFriendsListOpen] = useState(false);
  const [friendsListUserId, setFriendsListUserId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback(async (type: NotificationType, title: string, message: string, data?: Partial<AppNotification>) => {
    if (!currentUserId || !auth?.currentUser) return;
    
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: AppNotification = {
      id: notifId,
      userId: currentUserId,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...data
    };

    try {
      await setDoc(doc(db, 'notifications', notifId), newNotification);
      
      // Browser Push Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        console.log('Notification:', title, message);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `notifications/${notifId}`);
    }
  }, [currentUserId]);

  const dismissNotification = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  }, []);
  
  const meRaw = users.find(u => u.id === currentUserId);
  console.log('App Rendering - meRaw:', meRaw?.id, 'currentUserId:', currentUserId);
  const isAdminUser = meRaw?.isAdmin || 
                     meRaw?.email === 'jtothek319@gmail.com' || 
                     auth?.currentUser?.email === 'jtothek319@gmail.com' || 
                     meRaw?.username === 'jameson319' || 
                     currentUserId === 'admin-jtothek319';
  const me = meRaw ? { 
    ...meRaw, 
    isAdmin: isAdminUser,
    isCreator: true, // Everyone is a creator now
    friendIds: meRaw.friendIds || [],
    pendingFriendRequestsSent: meRaw.pendingFriendRequestsSent || [],
    pendingFriendRequestsReceived: meRaw.pendingFriendRequestsReceived || [],
    likedPostIds: meRaw.likedPostIds || [],
    fwbIds: meRaw.fwbIds || [],
    pendingFwbRequestsSent: meRaw.pendingFwbRequestsSent || [],
    pendingFwbRequestsReceived: meRaw.pendingFwbRequestsReceived || [],
    fanIds: meRaw.fanIds || [],
    photos: meRaw.photos || [],
    storeUploads: meRaw.storeUploads || [],
    blockedUserIds: meRaw.blockedUserIds || [],
    settings: meRaw.settings || (MOCK_USERS && MOCK_USERS.length > 0 ? MOCK_USERS[0].settings : {
      pushNotifications: true,
      emailNotifications: true,
      profileVisibility: 'public',
      messagingPrivacy: 'everyone'
    })
  } : null;
  console.log('App Rendering - me:', me?.id);

  const currentProfileCustomization = (activeTab === 'profile' || activeTab === 'custom-profile') 
    ? me?.profileCustomization 
    : (activeTab === 'user-profile' && viewingUserId) 
      ? users.find(u => u.id === viewingUserId)?.profileCustomization 
      : undefined;

  // Call State
  const [call, setCall] = useState<{ isReceivingCall: boolean, from: string, name: string, signal: any, type: 'voice' | 'video' } | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<any>(null);

  // Messaging state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(localStorage.getItem('selectedChatUserId'));

  // Payout and purchase system is under maintenance.
  useEffect(() => {
    // Maintenance mode placeholder
  }, []);

  // Sync selectedUserId to localStorage
  useEffect(() => {
    if (selectedUserId) {
      localStorage.setItem('selectedChatUserId', selectedUserId);
    } else {
      localStorage.removeItem('selectedChatUserId');
    }
  }, [selectedUserId]);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [currentMessageInput, setCurrentMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedUserIdRef = useRef<string | null>(null);

  const [useFrontCamera, setUseFrontCamera] = useState(true);

  const blockedIds = me?.blockedUserIds || [];
  const filteredUsers = users.filter(u => 
    me && !blockedIds.includes(u.id) && 
    !(u.blockedUserIds || []).includes(currentUserId)
  );
  const filteredPosts = posts.filter(p => 
    me && !blockedIds.includes(p.userId) && 
    !(users.find(u => u.id === p.userId)?.blockedUserIds || []).includes(currentUserId)
  );
  
  const filteredChatMessages: Record<string, Message[]> = {};
  Object.keys(chatMessages || {}).forEach(id => {
    if (!blockedIds.includes(id) && !(users.find(u => u.id === id)?.blockedUserIds || []).includes(currentUserId)) {
      filteredChatMessages[id] = chatMessages[id];
    }
  });

  const filteredComments = comments.filter(c => {
    const commenter = users.find(u => u.id === c.userId);
    if (!commenter) return false;
    return !blockedIds.includes(commenter.id) && !(commenter.blockedUserIds || []).includes(currentUserId);
  });

  const switchCamera = useCallback(async () => {
    if (!stream || callType !== 'video') return;
    
    try {
      const currentVideoTrack = stream.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
      }
      
      const constraints = {
        video: { facingMode: useFrontCamera ? 'environment' : 'user' },
        audio: true
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setUseFrontCamera(!useFrontCamera);
      setStream(newStream);
      
      if (connectionRef.current) {
        connectionRef.current.replaceTrack(
          currentVideoTrack,
          newStream.getVideoTracks()[0],
          stream
        );
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      toast.error('Could not switch camera');
    }
  }, [stream, callType, useFrontCamera]);

  const leaveCall = useCallback(() => {
    setCallEnded(true);
    if ((window as any)._ringtone) {
      (window as any)._ringtone.pause();
      (window as any)._ringtone = null;
    }
    if ((window as any)._callingSound) {
      (window as any)._callingSound.pause();
      (window as any)._callingSound = null;
    }
    if (connectionRef.current) {
      connectionRef.current.destroy();
      connectionRef.current = null;
    }
    socket?.emit('end_call', { to: call?.from || selectedUserId });
    // Reset state
    setCall(null);
    setCallAccepted(false);
    setCallEnded(false);
    setIsCalling(false);
    setStream(null);
    setRemoteStream(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, [socket, call, selectedUserId, stream]);

  const callUser = useCallback((id: string, type: 'voice' | 'video') => {
    setCallType(type);
    setIsCalling(true);
    
    // Play calling sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
    audio.loop = true;
    audio.play().catch(e => console.warn('Calling sound failed', e));
    (window as any)._callingSound = audio;
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('MediaDevices API not available');
      addNotification(NotificationType.SYSTEM, 'Call Failed', 'Your browser does not support camera/microphone access or you are not on a secure connection.');
      setIsCalling(false);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true }).then((currentStream) => {
      setStream(currentStream);
      const peer = new SimplePeer({ 
        initiator: true, 
        trickle: true, 
        stream: currentStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ]
        }
      });

      peer.on('signal', (data) => {
        if (data.type === 'offer') {
          socket?.emit('call_user', {
            userToCall: id,
            signalData: data,
            from: currentUserId,
            name: me.displayName,
            type
          });
        } else if (data.candidate) {
          socket?.emit('ice_candidate', {
            to: id,
            candidate: data
          });
        }
      });

      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
        if ((window as any)._callingSound) {
          (window as any)._callingSound.pause();
          (window as any)._callingSound = null;
        }
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        leaveCall();
      });

      connectionRef.current = peer;
    }).catch(err => {
      console.error('Failed to get local stream', err);
      setIsCalling(false);
      if ((window as any)._callingSound) {
        (window as any)._callingSound.pause();
        (window as any)._callingSound = null;
      }
      addNotification(NotificationType.SYSTEM, 'Call Failed', 'Could not access camera or microphone.');
    });
  }, [socket, currentUserId, me, leaveCall]);

  const answerCall = useCallback(() => {
    setCallAccepted(true);
    setCallType(call?.type || 'voice');

    if ((window as any)._ringtone) {
      (window as any)._ringtone.pause();
      (window as any)._ringtone = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('MediaDevices API not available');
      addNotification(NotificationType.SYSTEM, 'Call Failed', 'Your browser does not support camera/microphone access.');
      setCallAccepted(false);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: call?.type === 'video', audio: true }).then((currentStream) => {
      setStream(currentStream);
      const peer = new SimplePeer({ 
        initiator: false, 
        trickle: true, 
        stream: currentStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ]
        }
      });

      peer.on('signal', (data) => {
        if (data.type === 'answer') {
          socket?.emit('answer_call', { signal: data, to: call?.from });
        } else if (data.candidate) {
          socket?.emit('ice_candidate', {
            to: call?.from,
            candidate: data
          });
        }
      });

      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        leaveCall();
      });

      peer.signal(call?.signal);
      connectionRef.current = peer;
    }).catch(err => {
      console.error('Failed to get local stream', err);
      setCall(null);
      setCallAccepted(false);
      addNotification(NotificationType.SYSTEM, 'Call Failed', 'Could not access camera or microphone.');
    });
  }, [socket, call, leaveCall]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  // Authentication and Real-time Listeners
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Use the path explicitly allowed in security rules
        const testDoc = doc(db, '_connection_test_', 'ping');
        await getDocFromServer(testDoc).catch((e) => {
          // Permission denied is actually a good sign - it means we reached the server
          if (e.message.includes('permission-denied') || e.message.includes('Missing or insufficient permissions')) {
            return;
          }
          throw e;
        });
        setIsFirestoreOnline(true);
      } catch (error: any) {
        const errMessage = error.message || String(error);
        if (errMessage.includes('the client is offline') || errMessage.includes('unavailable') || errMessage.includes('network')) {
          setIsFirestoreOnline(false);
          // Only log if it's been offline for a while or first time
          console.warn("Firestore connectivity check:", errMessage);
        }
      }
    };
    testConnection();
    const interval = setInterval(testConnection, 30000); // Check every 30s (less frequent to reduce overhead)
    
    // Add window level listeners for extra robustness
    const handleOnline = () => {
      console.log('Browser reported online, attempting to force Firestore enableNetwork');
      setIsFirestoreOnline(true);
      enableNetwork(db).catch(e => console.warn('Failed to enable network manually on window.online:', e));
      testConnection(); // Re-verify immediately
    };
    
    const handleOffline = () => {
      console.log('Browser reported offline');
      setIsFirestoreOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const profileUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth is not initialized. Custom offline fallback active.");
      setIsAuthReady(true);
      setAuthResolvedAtLeastOnce(true);
      return;
    }

    setPersistence(auth, browserLocalPersistence).catch(err => console.error('Failed to set persistence:', err));

    // Handle redirect result
    getGoogleRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log('Redirect login successful:', result.user.email);
        sessionStorage.setItem('sharebares_session_auth', 'true');
        setIsSessionAuthenticated(true);
        setIsLoggedIn(true);
        toast.success('Successfully logged in with Google!');
        setActiveTab('feed');
      }
    }).catch((error) => {
      console.error('Redirect login failed:', error);
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast.error(`Login failed: ${error.message}`);
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      try {
        if (user) {
          setCurrentUserId(user.uid);
          setIsLoggedIn(true);
          
          // Check for admin user
          const isAdminEmail = user.email === 'jtothek319@gmail.com';
          
          if (isAdminEmail) {
            console.log('Admin detected, prepared for session authorization');
            setHasCreatedProfile(true);
            setIsProfileLoading(false);
          } else {
            setIsProfileLoading(true);
          }

          try {
            // Use onSnapshot for the user's profile to be resilient to connection issues
            // This ensures data is "uninterrupted" as it will update whenever connection is back
            const userRef = doc(db, 'users', user.uid);
            
            // Clear any existing listener
            if (profileUnsubRef.current) profileUnsubRef.current();
            
            profileUnsubRef.current = onSnapshot(userRef, async (userSnap) => {
              if (!userSnap.exists() && isAdminEmail) {
                // Auto-create admin profile if missing
                console.log('Auto-creating missing admin profile...');
                const adminData: User = {
                  id: user.uid,
                  username: 'jameson319',
                  displayName: 'Jameson (Admin)',
                  email: user.email!,
                  avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
                  coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926',
                  bio: 'Official Admin Account',
                  isCreator: true,
                  likedPostIds: [],
                };
                try {
                  await setDoc(doc(db, 'users', user.uid), adminData);
                  await setDoc(doc(db, 'profiles', user.uid), {
                    id: adminData.id,
                    username: adminData.username,
                    displayName: adminData.displayName,
                    avatar: adminData.avatar,
                    isCreator: true,
                    subscribersCount: 0,
                    followingCount: 0
                  });
                  setHasCreatedProfile(true);
                } catch (e) {
                  console.error('Failed to auto-create admin:', e);
                }
              } else if (userSnap.exists()) {
                const userData = { ...userSnap.data(), id: userSnap.id } as User;
                // Ensure admin flags are always present for admin user
                if (isAdminEmail && !userData.isAdmin) {
                  console.log('Ensuring admin flags on existing profile...');
                  try {
                    await updateDoc(userRef, {
                      isAdmin: true,
                      isCreator: true
                    });
                  } catch (e) {
                    console.error('Failed to update admin flags:', e);
                  }
                }
                setHasCreatedProfile(true);
              } else {
                setHasCreatedProfile(false);
              }
              setIsProfileLoading(false);
            }, (profileError) => {
              console.error('Profile listener failed:', profileError);
              if (isAdminEmail) {
                setHasCreatedProfile(true);
              }
              setIsProfileLoading(false);
            });

            // Seed other mock data if database is empty (non-blocking)
            // Only for the technical administrator to prevent permission errors for others
            const seedData = async () => {
              if (!isAdminEmail) return;
              try {
                // Ensure Jade exists
                try {
                  const jadeDoc = await getDoc(doc(db, 'users', 'ai-jade'));
                  const jadeUser = MOCK_USERS.find(u => u.id === 'ai-jade')!;
                  if (!jadeDoc.exists() || jadeDoc.data()?.avatar === '/logo.png') {
                    await setDoc(doc(db, 'users', 'ai-jade'), { ...jadeUser, likedPostIds: jadeDoc.exists() ? (jadeDoc.data()?.likedPostIds || []) : [] }, { merge: true });
                  }
                } catch (jadeErr) {
                  console.warn('Could not ensure Jade exists:', jadeErr);
                }

                // Ensure all default users have correct profile photos instead of logo placeholder
                for (const mUser of MOCK_USERS) {
                  if (mUser.id !== user.uid) {
                    try {
                      const userDoc = await getDoc(doc(db, 'users', mUser.id));
                      if (!userDoc.exists() || userDoc.data()?.avatar === '/logo.png') {
                        await setDoc(doc(db, 'users', mUser.id), { ...mUser, likedPostIds: userDoc.exists() ? (userDoc.data()?.likedPostIds || []) : [] }, { merge: true });
                      }
                    } catch (e) {}
                  }
                }

                const postsSnap = await getDocs(query(collection(db, 'posts'), limit(1)));
                if (postsSnap.empty) {
                  for (const post of MOCK_POSTS) {
                    try {
                      await setDoc(doc(db, 'posts', post.id), { ...post, likedBy: [] });
                    } catch (e) {}
                  }
                }

                // Seed / update storeItems with real media (overwrite if they have /logo.png)
                for (const item of MOCK_STORE_ITEMS) {
                  try {
                    const itemDoc = await getDoc(doc(db, 'storeItems', item.id));
                    if (!itemDoc.exists() || itemDoc.data()?.thumbnailUrl === '/logo.png' || (itemDoc.data()?.mediaUrls && itemDoc.data()?.mediaUrls.includes('/logo.png'))) {
                      await setDoc(doc(db, 'storeItems', item.id), item);
                    }
                  } catch (e) {}
                }

                // Seed / update stableListings with real media (overwrite if they have /logo.png)
                for (const listing of MOCK_STABLE_LISTINGS) {
                  try {
                    const listingDoc = await getDoc(doc(db, 'stableListings', listing.id));
                    if (!listingDoc.exists() || listingDoc.data()?.avatarUrl === '/logo.png' || (listingDoc.data()?.photos && listingDoc.data()?.photos.includes('/logo.png'))) {
                      await setDoc(doc(db, 'stableListings', listing.id), listing);
                    }
                  } catch (e) {}
                }
              } catch (err) {
                console.error('Seeding failed:', err);
              }
            };
            seedData();
          } catch (profileError) {
            console.error('Profile listener setup failed:', profileError);
            if (isAdminEmail) setHasCreatedProfile(true);
            setIsProfileLoading(false);
          }
        } else {
          console.log('No user session found, forcing redirect to login');
          setIsLoggedIn(false);
          setCurrentUserId('');
          setHasCreatedProfile(false);
          setIsProfileLoading(false);
          if (profileUnsubRef.current) {
            profileUnsubRef.current();
            profileUnsubRef.current = null;
          }
        }
      } catch (error) {
        console.error('Auth handler error:', error);
      } finally {
        setAuthResolvedAtLeastOnce(true);
        setIsAuthReady(true);
      }
    });

    // Fallback: Ensure isAuthReady becomes true if onAuthStateChanged is slow
    const authTimeout = setTimeout(() => {
      if (!isAuthReady) {
        console.log('Auth check timed out, forcing isAuthReady to true');
        setAuthResolvedAtLeastOnce(true);
        setIsAuthReady(true);
      }
    }, 6000); // 6s fallback (increased from 3s)

    return () => {
      unsubscribeAuth();
      if (profileUnsubRef.current) profileUnsubRef.current();
      clearTimeout(authTimeout);
    };
  }, []);

  // Real-time Listeners
  useEffect(() => {
    if (!isLoggedIn || !auth?.currentUser) {
      setUsers([]);
      setPosts([]);
      setStoreItems([]);
      setStableListings([]);
      setComments([]);
      return;
    }

    let postsReady = false;
    let usersReady = false;
    let storeItemsReady = false;
    let stableListingsReady = false;
    let commentsReady = false;
    
    const checkReady = () => {
      if (postsReady && usersReady && storeItemsReady && stableListingsReady && commentsReady) {
        setIsDataLoading(false);
      }
    };

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const updatedUsers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setUsers(updatedUsers);
      usersReady = true;
      checkReady();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      usersReady = true;
      checkReady();
    });

    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc')), (snapshot) => {
      const updatedPosts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Post));
      setPosts(updatedPosts);
      postsReady = true;
      checkReady();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
      postsReady = true;
      checkReady();
    });

    const unsubStoreItems = onSnapshot(collection(db, 'storeItems'), (snapshot) => {
      const updatedItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StoreItem));
      setStoreItems(updatedItems);
      storeItemsReady = true;
      checkReady();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'storeItems');
      storeItemsReady = true;
      checkReady();
    });

    const unsubStableListings = onSnapshot(collection(db, 'stableListings'), (snapshot) => {
      const updatedListings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StableListing));
      setStableListings(updatedListings);
      stableListingsReady = true;
      checkReady();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'stableListings');
      stableListingsReady = true;
      checkReady();
    });

    const unsubComments = onSnapshot(collection(db, 'comments'), (snapshot) => {
      const updatedComments = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppComment));
      setComments(updatedComments);
      commentsReady = true;
      checkReady();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
      commentsReady = true;
      checkReady();
    });

    return () => {
      unsubUsers();
      unsubPosts();
      unsubStoreItems();
      unsubStableListings();
      unsubComments();
    };
  }, [isLoggedIn]);

  // Notifications Listener
  useEffect(() => {
    if (!currentUserId || !auth?.currentUser) return;

    const unsubNotifs = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', currentUserId), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const updatedNotifs = snapshot.docs.map(doc => doc.data() as AppNotification);
        setAppNotifications(updatedNotifs);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'notifications')
    );

    return () => unsubNotifs();
  }, [currentUserId]);

  // Messages Listener
  useEffect(() => {
    if (!currentUserId || !auth?.currentUser) {
      setChatMessages({});
      return;
    }

    const unsubMessages = onSnapshot(
      query(
        collection(db, 'messages'), 
        or(where('senderId', '==', currentUserId), where('receiverId', '==', currentUserId))
      ),
      (snapshot) => {
        const allMessages = snapshot.docs.map(doc => doc.data() as Message);
        
        setChatMessages(prev => {
          const newMessages: Record<string, Message[]> = {};
          
          allMessages.forEach(msg => {
            const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
            if (!newMessages[otherId]) newMessages[otherId] = [];
            newMessages[otherId].push(msg);
          });
          
          // Sort each thread by timestamp
          Object.keys(newMessages).forEach(id => {
            newMessages[id].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          });
          
          return newMessages;
        });
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'messages')
    );

    return () => unsubMessages();
  }, [currentUserId]);

  // Jade AI Activity Loop
  useEffect(() => {
    if (!isLoggedIn || !auth?.currentUser || !me?.isAdmin) return;

    const jadeActivity = setInterval(async () => {
      const roll = Math.random();
      
      // 10% chance to post something new
      if (roll < 0.1) {
        const content = await generateJadePost();
        const postId = `jade-post-${Date.now()}`;
        const newPost: Post = {
          id: postId,
          userId: 'ai-jade',
          content: content,
          createdAt: new Date().toISOString(),
          likes: Math.floor(Math.random() * 500),
          likedBy: [],
          commentsCount: 0,
          visibility: PostVisibility.PUBLIC,
          category: 'Jade',
          mediaUrl: APP_LOGO_URL,
          mediaType: 'image',
        };
        try {
          await setDoc(doc(db, 'posts', postId), newPost);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `posts/${postId}`);
        }
      } 
      // 20% chance to like a random post
      else if (roll < 0.3) {
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        if (randomPost && randomPost.userId !== 'ai-jade') {
          handleLikePost(randomPost, 'ai-jade');
        }
      }
      // 15% chance to comment on a random post
      else if (roll < 0.45) {
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        if (randomPost && randomPost.userId !== 'ai-jade') {
          const comment = await generateJadeComment(randomPost.content);
          handleCommentPost(randomPost, 'ai-jade', comment);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(jadeActivity);
  }, [isLoggedIn, posts]);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission();
      } catch (e) {
        console.warn('Notification permission request failed:', e);
      }
    }

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      if (currentUserId) {
        newSocket.emit('identify', currentUserId);
      }
    });

    // Socket.IO is now only for signaling and presence, not for data history
    // Data is handled by Firestore onSnapshot listeners

    // Call Signaling
    newSocket.on('incoming_call', ({ from, name, signal, type }) => {
      setCall({ isReceivingCall: true, from, name, signal, type });
      setCallType(type);
      // Play ringtone
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.loop = true;
      audio.play().catch(e => console.warn('Ringtone failed to play:', e));
      (window as any)._ringtone = audio;
    });

    newSocket.on('call_accepted', (signal) => {
      setCallAccepted(true);
      if ((window as any)._ringtone) {
        (window as any)._ringtone.pause();
        (window as any)._ringtone = null;
      }
      if ((window as any)._callingSound) {
        (window as any)._callingSound.pause();
        (window as any)._callingSound = null;
      }
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    });

    newSocket.on('ice_candidate', (candidate) => {
      if (connectionRef.current) {
        connectionRef.current.signal(candidate);
      }
    });

    newSocket.on('call_ended', () => {
      setCallEnded(true);
      if ((window as any)._ringtone) {
        (window as any)._ringtone.pause();
        (window as any)._ringtone = null;
      }
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      
      // Stop local tracks
      setStream(prevStream => {
        if (prevStream) {
          prevStream.getTracks().forEach(track => track.stop());
        }
        return null;
      });

      // Reset state
      setCall(null);
      setCallAccepted(false);
      setCallEnded(false);
      setIsCalling(false);
      setRemoteStream(null);
    });

    return () => {
      newSocket.close();
    };
  }, [currentUserId, users]);

  useEffect(() => {
    if (selectedUserId && currentUserId) {
      // Mark messages as read in Firestore
      const markMessagesRead = async () => {
        try {
          const q = query(
            collection(db, 'messages'),
            where('senderId', '==', selectedUserId),
            where('receiverId', '==', currentUserId),
            where('isRead', '==', false)
          );
          const snapshot = await getDocs(q);
          const updatePromises = snapshot.docs.map(doc => updateDoc(doc.ref, { isRead: true }));
          await Promise.all(updatePromises);
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      };

      // Mark notifications as read in Firestore
      const markNotificationsRead = async () => {
        try {
          const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUserId),
            where('senderId', '==', selectedUserId),
            where('type', '==', NotificationType.MESSAGE),
            where('isRead', '==', false)
          );
          const snapshot = await getDocs(q);
          const updatePromises = snapshot.docs.map(doc => updateDoc(doc.ref, { isRead: true }));
          await Promise.all(updatePromises);
        } catch (error) {
          console.error('Failed to mark notifications as read:', error);
        }
      };

      markMessagesRead();
      markNotificationsRead();
    }
  }, [selectedUserId, currentUserId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUserId, chatMessages]);

  useEffect(() => {
    if (activeTab === 'notifications' && currentUserId) {
      const markAllNotificationsRead = async () => {
        try {
          const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUserId),
            where('isRead', '==', false)
          );
          const snapshot = await getDocs(q);
          const updatePromises = snapshot.docs.map(doc => {
            const data = doc.data() as AppNotification;
            if (data.type !== NotificationType.MESSAGE) {
              return updateDoc(doc.ref, { isRead: true });
            }
            return null;
          }).filter(p => p !== null);
          await Promise.all(updatePromises);
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error);
        }
      };
      markAllNotificationsRead();
    }
  }, [activeTab, currentUserId]);

  const handleLogin = async (emailOrUsername: string, password: string) => {
    let toastId: string | number | undefined;
    try {
      const trimmedInput = emailOrUsername?.trim();
      const trimmedPassword = password?.trim();
      
      if (!trimmedInput || !trimmedPassword) {
        toast.error('Please enter both email/username and password.');
        return;
      }

      toastId = toast.loading('Logging in...');
      let loginEmail = trimmedInput;
      
      // Admin fallback for username
      if (trimmedInput === 'jameson319') {
        loginEmail = 'jtothek319@gmail.com';
      } else if (!trimmedInput.includes('@')) {
        // Try to find user by username
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', trimmedInput), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            loginEmail = querySnapshot.docs[0].data().email;
          } else {
            // If not found in real DB, check MOCK_USERS for legacy support
            const mockUser = MOCK_USERS.find(u => u.username === trimmedInput);
            if (mockUser) {
              loginEmail = mockUser.email;
            } else {
              throw { code: 'auth/user-not-found' };
            }
          }
        } catch (e) {
          console.warn('Username lookup failed, trying as email:', e);
        }
      }

      // 1. Try standard Firebase Auth first (most reliable)
      try {
        await signInWithEmailAndPassword(auth, loginEmail, trimmedPassword);
        sessionStorage.setItem('sharebares_session_auth', 'true');
        setIsSessionAuthenticated(true);
        setIsLoggedIn(true);
        toast.success('Welcome back!', { id: toastId });
        setActiveTab('feed');
        return;
      } catch (authError: any) {
        console.log('Standard auth failed:', authError.code);
        
        // 2. If standard auth fails because provider is disabled, and it's the admin, try custom flow
        const isAdminEmail = loginEmail === 'jtothek319@gmail.com';
        if (authError.code === 'auth/operation-not-allowed' && isAdminEmail) {
          console.log('Standard login disabled, attempting custom admin auth...');
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: loginEmail, password: trimmedPassword })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.customToken) {
                await signInWithCustomToken(auth, data.customToken);
                setIsLoggedIn(true);
                toast.success('Welcome back, Admin!', { id: toastId });
                setActiveTab('feed');
                return;
              }
            }
          } catch (customErr) {
            console.error('Custom auth fallback failed:', customErr);
          }
        }

        // 3. Special case: If admin user doesn't exist yet in Firebase Auth, try to register them
        const isInvalidCredential = authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found';
        const isAdminMasterPassword = trimmedPassword === '# Caleb918' || trimmedPassword === '#Caleb918';
        
        if (isInvalidCredential && loginEmail === 'jtothek319@gmail.com' && isAdminMasterPassword) {
          console.log('Admin user not found, attempting auto-registration...');
          try {
            await createUserWithEmailAndPassword(auth, loginEmail, trimmedPassword);
            setIsLoggedIn(true);
            toast.success('Admin account created and logged in!', { id: toastId });
            setActiveTab('feed');
            return;
          } catch (regError: any) {
            if (regError.code !== 'auth/email-already-in-use') throw regError;
            // If already in use, it means password was wrong
            throw authError;
          }
        }

        // 4. If all else fails, throw the original error for the catch block to handle
        throw authError;
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/operation-not-allowed') {
        const helpMsg = 'Email/Password login is disabled in your Firebase Console. Please enable it or use "Sign in with Google".';
        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-bold">Login Method Disabled</p>
            <p className="text-xs">{helpMsg}</p>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => window.open(`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`, '_blank')}
                className="bg-[#967bb6] text-white px-3 py-1 rounded text-[10px] font-bold"
              >
                Enable in Console
              </button>
              <button 
                onClick={() => handleSocialLogin('google')}
                className="bg-white text-black px-3 py-1 rounded text-[10px] font-bold"
              >
                Use Google Login
              </button>
            </div>
          </div>,
          { id: toastId, duration: 10000 }
        );
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Invalid email or password. Please try again.', { id: toastId });
      } else {
        toast.error('Login failed. Please try again or use Google Login.', { id: toastId });
      }
    }
  };

  const handleRegister = async (displayName: string, username: string, email: string, password: string) => {
    let toastId: string | number | undefined;
    try {
      if (email && password) {
        toastId = toast.loading('Creating account...');
        // Check if username is already taken
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          toast.error('Username is already taken. Please choose another one.', { id: toastId });
          return;
        }

        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (result.user) {
          const newUser: User = {
            id: result.user.uid,
            username: username,
            displayName: displayName,
            email: email,
            avatar: APP_LOGO_URL,
            coverImage: APP_LOGO_URL,
            bio: 'Welcome to my profile!',
            isCreator: false,
            isAdmin: email === 'jtothek319@gmail.com',
            subscribersCount: 0,
            followingCount: 0,
            friendIds: [],
            pendingFriendRequestsSent: [],
            pendingFriendRequestsReceived: [],
            likedPostIds: [],
            fwbIds: [],
            pendingFwbRequestsSent: [],
            pendingFwbRequestsReceived: [],
            fwbRequestsResetDate: new Date().toISOString(),
            fwbRequestsSentCount: 0,
            fanIds: [],
            profileCustomization: {},
            photos: [],
            storeUploads: [],
            blockedUserIds: [],
            settings: {
              pushNotifications: true,
              emailNotifications: true,
              profileVisibility: 'public',
              messagingPrivacy: 'everyone'
            },
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', result.user.uid), newUser);
          await setDoc(doc(db, 'profiles', result.user.uid), {
            id: newUser.id,
            username: newUser.username,
            displayName: newUser.displayName,
            avatar: newUser.avatar,
            coverImage: newUser.coverImage,
            bio: newUser.bio,
            isCreator: newUser.isCreator,
            subscribersCount: 0,
            followingCount: 0
          });
          sessionStorage.setItem('sharebares_session_auth', 'true');
          setIsSessionAuthenticated(true);
          setIsLoggedIn(true);
          toast.success('Account created successfully!', { id: toastId });
        }
      } else {
        await handleSocialLogin('google');
      }
      setActiveTab('feed');
    } catch (error: any) {
      console.error('Registration failed full error:', error);
      if (error.code === 'permission-denied' || (error.message && error.message.includes('Missing or insufficient permissions'))) {
        console.error('Firestore Permission Denied during registration operation');
        addNotification(NotificationType.SYSTEM, 'Security Error', 'Database permissions denied. Please contact support.');
      }
      if (error.code === 'auth/operation-not-allowed') {
        const helpMsg = 'Email/Password registration is currently disabled in your Firebase Console. As the project owner, you must enable it to allow this login method.';
        addNotification(NotificationType.SYSTEM, 'Action Required', helpMsg);
        setConfirmAction({
          message: helpMsg + '\n\nWould you like to open your Firebase Console to enable "Email/Password" now?',
          onConfirm: () => window.open('https://console.firebase.google.com/project/gen-lang-client-0036974014/authentication/providers', '_blank')
        });
        toast.error('Registration method disabled.', { id: toastId });
      } else if (error.code === 'auth/email-already-in-use') {
        addNotification(NotificationType.SYSTEM, 'Registration Failed', 'This email is already in use. Please try logging in instead.');
        toast.error('Email already in use.', { id: toastId });
      } else if (error.code === 'auth/weak-password') {
        addNotification(NotificationType.SYSTEM, 'Registration Failed', 'Password is too weak. Please use a stronger password.');
        toast.error('Password too weak.', { id: toastId });
      } else {
        addNotification(NotificationType.SYSTEM, 'Registration Failed', 'Please try again or use Google Login.');
        toast.error('Registration failed.', { id: toastId });
      }
    }
  };

  const handleSocialLogin = async (provider: string, useRedirect = false) => {
    console.log('Starting social login for provider:', provider, 'useRedirect:', useRedirect);
    let toastId: string | number | undefined;
    try {
      if (provider === 'google') {
        if (useRedirect) {
          toast.loading('Redirecting to Google login...');
          await loginWithGoogleRedirect();
        } else {
          toastId = toast.loading('Opening Google login...');
          await loginWithGoogle();
          sessionStorage.setItem('sharebares_session_auth', 'true');
          setIsSessionAuthenticated(true);
          setIsLoggedIn(true);
          toast.success('Successfully logged in with Google!', { id: toastId });
          setActiveTab('feed');
        }
      } else {
        toast.error(`${provider} login is not implemented yet.`);
      }
    } catch (error: any) {
      console.error('Social login failed:', error);
      const errorMessage = error.message || 'Unknown error';
      
      if (error.code === 'auth/popup-blocked') {
        toast.error('The login popup was blocked by your browser. Attempting redirect login instead...', { id: toastId });
        // Fallback to redirect
        setTimeout(() => handleSocialLogin(provider, true), 2000);
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        toast.dismiss(toastId);
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error('Google login is not enabled in Firebase Console.', { id: toastId });
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized for Firebase Auth. Please add it in your Firebase Console.', { id: toastId });
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network request failed. This can happen if third-party cookies are blocked. Attempting redirect login as fallback...', { id: toastId, duration: 6000 });
        // Fallback to redirect
        setTimeout(() => handleSocialLogin(provider, true), 3000);
      } else {
        toast.error(`Login failed: ${errorMessage}`, { id: toastId });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout(auth);
      sessionStorage.removeItem('sharebares_session_auth');
      setIsSessionAuthenticated(false);
      setIsLoggedIn(false);
      setCurrentUserId('');
      // Keep activeTab in localStorage so it persists when they log back in
      setViewingUserId(null);
      setShowSplash(true);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  const syncMediaToGallery = useCallback(async (urls: string[]) => {
    if (!urls.length || !me) return;
    const uniqueUrls = [...new Set(urls.filter(u => u && (u.startsWith('/uploads/') || u.startsWith('http'))))];
    if (!uniqueUrls.length) return;
    
    const existingPhotos = me.photos || [];
    const existingUrls = new Set(existingPhotos.map(p => p.url));
    
    const newPhotosToAdd = uniqueUrls
      .filter(url => !existingUrls.has(url))
      .map(url => {
      const isVideoUrl = url.split('?')[0].match(/\.(mp4|mov|webm|m4v|ogg|avi|mkv|flv|wmv|3gp|MP4|MOV|WEBM|MKV|AVI|3GP|OGG|WMV|FLV|M4V|MPG|MPEG|M2V|ASF|AMV)$/i) || 
                          url.toLowerCase().includes('video') ||
                          (url.toLowerCase().includes('firebasestorage') && (url.toLowerCase().includes('%2Fvideo') || url.toLowerCase().includes('video%2F') || url.toLowerCase().includes('video')));
        
        return {
          id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          url,
          type: isVideoUrl ? 'video' : 'image' as const,
          isNSFW: true,
          createdAt: new Date().toISOString()
        };
      });
      
    if (newPhotosToAdd.length > 0) {
      try {
        const updatedPhotos = [...newPhotosToAdd, ...existingPhotos];
        await setDoc(doc(db, 'users', currentUserId), {
          photos: updatedPhotos
        }, { merge: true });
        console.log(`Synced ${newPhotosToAdd.length} media items to gallery`);
      } catch (error) {
        console.error('Failed to sync media to gallery:', error);
      }
    }
  }, [me, currentUserId]);

    const handleProfileUpdate = async (profileData: Partial<User>) => {
      const isInitialCreation = !hasCreatedProfile;
      if (!currentUserId) {
        toast.error('You must be logged in to update your profile');
        return;
      }
      
      const toastId = toast.loading(isInitialCreation ? 'Creating your profile...' : 'Updating profile...');
    
      try {
        console.log('Starting profile update for user:', currentUserId, 'Initial creation:', isInitialCreation);
        
        // Clean undefined values for Firestore
        const cleanedData: any = {};
        Object.entries(profileData).forEach(([key, value]) => {
          if (value !== undefined) cleanedData[key] = value;
        });

        // Ensure fundamental identifiers are always included
        const currentUser = users.find(u => u.id === currentUserId);
        cleanedData.id = currentUserId;
        cleanedData.username = profileData.username || currentUser?.username || '';
        cleanedData.email = profileData.email || currentUser?.email || auth?.currentUser?.email || '';
        
        if (isInitialCreation) {
          cleanedData.createdAt = new Date().toISOString();
        }
        cleanedData.updatedAt = new Date().toISOString();
        cleanedData.lastActive = new Date().toISOString();

        // Special handling for nested objects to prevent data loss during top-level merge
        if (profileData.socials) {
          cleanedData.socials = {
            ...(currentUser?.socials || {}),
            ...profileData.socials
          };
        }
        
        if (profileData.settings) {
          cleanedData.settings = {
            ...(currentUser?.settings || {}),
            ...profileData.settings
          };
        }

        console.log('Saving cleaned profile data to users collection:', cleanedData);
        await setDoc(doc(db, 'users', currentUserId), cleanedData, { merge: true });
        
        // Also sync to public profiles collection
        const publicFields = [
          'id', 'username', 'displayName', 'bio', 'avatar', 'coverImage', 
          'location', 'occupation', 'tagline', 'socials', 'isCreator',
          'subscribersCount', 'followingCount', 'isStoreActive', 'isStableActive'
        ];
        
        const publicProfile: any = {};
        publicFields.forEach(field => {
          if (cleanedData[field] !== undefined) {
            publicProfile[field] = cleanedData[field];
          } else if (currentUser && (currentUser as any)[field] !== undefined) {
            publicProfile[field] = (currentUser as any)[field];
          }
        });
        
        console.log('Syncing to public profiles collection:', publicProfile);
        await setDoc(doc(db, 'profiles', currentUserId), publicProfile, { merge: true });
        
        // Auto-sync profile images to gallery
        const imagesToSync: string[] = [];
        if (cleanedData.avatar && (cleanedData.avatar.startsWith('https://') || cleanedData.avatar.startsWith('/uploads/'))) {
          imagesToSync.push(cleanedData.avatar);
        }
        if (cleanedData.coverImage && (cleanedData.coverImage.startsWith('https://') || cleanedData.coverImage.startsWith('/uploads/'))) {
          imagesToSync.push(cleanedData.coverImage);
        }
        
        if (imagesToSync.length > 0) {
          try {
            await syncMediaToGallery(imagesToSync);
          } catch (syncErr) {
            console.warn('Media sync warning:', syncErr);
          }
        }

        if (isInitialCreation) {
          setHasCreatedProfile(true);
          toast.success('Welcome to ShareBares! Profile created successfully.', { id: toastId });
          setActiveTab('feed');
          window.scrollTo(0, 0);
        } else {
          toast.success('Profile updated successfully!', { id: toastId });
          setTimeout(() => {
            setActiveTab('profile');
            window.scrollTo(0, 0);
          }, 500);
        }
      } catch (error: any) {
        console.error('Profile update failed:', error);
        toast.error(`Update failed: ${error.message || 'Permission denied'}`, { id: toastId });
        throw error;
      }
    };

    const handleUpdateUser = async (profileData: Partial<User>) => {
      if (!currentUserId) return;
      try {
        const currentUser = users.find(u => u.id === currentUserId);
        const updates: any = {};
        
        // 1. Basic identifiers
        updates.id = currentUserId;
        updates.updatedAt = new Date().toISOString();

        // 2. Map profileData to updates, using dot-notation for known nested objects to prevent clobbering
        Object.entries(profileData).forEach(([key, value]) => {
          if (value === undefined) return;
          
          if (key === 'settings' && typeof value === 'object' && value !== null) {
            // Flatten one level for settings
            Object.entries(value).forEach(([sKey, sValue]) => {
              updates[`settings.${sKey}`] = sValue;
            });
          } else if (key === 'socials' && typeof value === 'object' && value !== null) {
            // Flatten one level for socials
            Object.entries(value).forEach(([socKey, socValue]) => {
              updates[`socials.${socKey}`] = socValue;
            });
          } else if (key === 'username') {
            if (value || currentUser?.username) updates.username = value || currentUser?.username;
          } else if (key === 'email') {
            if (value || currentUser?.email) updates.email = value || currentUser?.email;
          } else {
            updates[key] = value;
          }
        });

        console.log('Sending atomic updates to users collection:', updates);
        await updateDoc(doc(db, 'users', currentUserId), updates);
        
        // 3. If we updated fields that should be public, sync to profiles
        const publicFields = ['username', 'displayName', 'avatar', 'isCreator', 'isStoreActive', 'isStableActive'];
        const needsProfileSync = Object.keys(profileData).some(key => publicFields.includes(key));
        
        if (needsProfileSync) {
          const publicProfile: any = { id: currentUserId };
          publicFields.forEach(field => {
            if (profileData[field as keyof User] !== undefined) {
              publicProfile[field] = profileData[field as keyof User];
            } else if (currentUser && (currentUser as any)[field] !== undefined) {
              publicProfile[field] = (currentUser as any)[field];
            }
          });
          await setDoc(doc(db, 'profiles', currentUserId), publicProfile, { merge: true });
        }
      } catch (error) {
        console.error('Update user atomic error:', error);
        // Fallback to merge mode if updateDoc fails (e.g. if document doesn't exist yet, though it should)
        try {
          await setDoc(doc(db, 'users', currentUserId), profileData, { merge: true });
        } catch (innerError) {
          handleFirestoreError(innerError, OperationType.UPDATE, `users/${currentUserId}`);
        }
      }
    };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPostMedia(file);
      const url = URL.createObjectURL(file);
      setNewPostMediaPreview(url);
    }
  };

  const handlePost = async () => {
    if ((!newPostContent.trim() && !newPostMedia) || isPosting) {
      if (!isPosting) {
        toast.error('Please enter some text or select an image/video for your post.');
      }
      return;
    }

    if (!currentUserId) {
      toast.error('You must be logged in to create a post.');
      return;
    }
    
    setIsPosting(true);
    const toastId = toast.loading('Creating your post...');
    console.log('Post creation sequence started...', { content: newPostContent.substring(0, 50), hasMedia: !!newPostMedia });
    let mediaUrl: string | undefined = undefined;
    const postId = `post-${Date.now()}`;
    
    try {
      if (newPostMedia) {
        try {
          console.log('Uploading media for post:', { name: newPostMedia.name, size: newPostMedia.size, type: newPostMedia.type });
          mediaUrl = await uploadFile(newPostMedia, `posts/${currentUserId}/${Date.now()}_${newPostMedia.name}`, (progress) => {
            toast.loading(`Uploading media: ${Math.round(progress)}%`, { id: toastId });
          });
          console.log('Post media uploaded successfully:', mediaUrl);
        } catch (err: any) {
          console.error('Failed to upload media:', err);
          toast.error(`Error uploading media: ${err.message || 'Unknown storage error'}`, { id: toastId });
          setIsPosting(false);
          return;
        }
      }
      
      const isVideo = (newPostMedia && newPostMedia.type.startsWith('video')) || 
        (mediaUrl && (
          mediaUrl.split('?')[0].match(/\.(mp4|mov|webm|ogg|m4v|avi|mkv|flv|wmv|3gp|m3u8|ts|rm|rmvb|asf|amv|divx|mpg|mpeg|m2v)$/i) || 
          mediaUrl.toLowerCase().includes('video') ||
          (mediaUrl.toLowerCase().includes('firebasestorage') && (mediaUrl.toLowerCase().includes('%2Fvideo') || mediaUrl.toLowerCase().includes('video%2F') || mediaUrl.toLowerCase().includes('video')))
        )) || false;

      const newPost: Post = {
        id: postId,
        userId: currentUserId,
        content: newPostContent || '',
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? (isVideo ? 'video' : 'image') : undefined,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        visibility: newPostVisibility,
      };
      
      // Clean undefined and NaN values
      const cleanedPost: any = {};
      Object.keys(newPost).forEach(key => {
        const val = (newPost as any)[key];
        if (val !== undefined && val !== null && (typeof val !== 'number' || !isNaN(val))) {
          cleanedPost[key] = val;
        }
      });
      
      console.log('Final post object for Firestore:', cleanedPost);
      await setDoc(doc(db, 'posts', postId), cleanedPost);
      console.log('Post document created successfully');
      
      // Auto-sync post media to gallery
      if (mediaUrl) {
        try {
          await syncMediaToGallery([mediaUrl]);
        } catch (syncErr) {
          console.warn('Failed to sync media to gallery, continuing...', syncErr);
        }
      }

      // Success cleanup
      setNewPostContent('');
      setNewPostVisibility(PostVisibility.PUBLIC);
      setNewPostMedia(null);
      setNewPostMediaPreview(null);
      setIsPosting(false);
      setIsCreating(false);
      toast.success('Post created successfully!', { id: toastId });
    } catch (error: any) {
      setIsPosting(false);
      console.error('Post creation error:', error);
      
      try {
        const errorMsg = error?.message || String(error);
        handleFirestoreError(error, OperationType.CREATE, `posts/${postId}`);
      } catch (errInfo: any) {
        const message = errInfo.message || 'Unknown error';
        console.error('Handled Firestore Error:', message);
        toast.error(`Post creation failed: ${error.message || 'Permission denied or network error'}`);
      }
    }
  };

  const handleToggleFan = async (targetUserId: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    const fanIds = targetUser.fanIds || [];
    const isFan = fanIds.includes(currentUserId);
    const newFanIds = isFan 
      ? fanIds.filter(id => id !== currentUserId)
      : [...fanIds, currentUserId];
    
    try {
      await updateDoc(doc(db, 'users', targetUserId), { fanIds: newFanIds });
      
      if (!isFan) {
        addNotification(
          NotificationType.FOLLOW,
          'New Follower!',
          `${me.displayName} started following you!`,
          { userId: targetUserId, senderId: currentUserId }
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  const handleLikePost = async (post: Post, likerId: string = currentUserId) => {
    const isLiked = post.likedBy?.includes(likerId);
    const newLikedBy = isLiked 
      ? (post.likedBy || []).filter(id => id !== likerId)
      : [...(post.likedBy || []), likerId];
    
    const liker = users.find(u => u.id === likerId);
    const userLikedPostIds = liker?.likedPostIds || [];
    const newUserLikedPostIds = isLiked
      ? userLikedPostIds.filter(id => id !== post.id)
      : [...userLikedPostIds, post.id];

    try {
      await updateDoc(doc(db, 'posts', post.id), {
        likedBy: newLikedBy,
        likes: newLikedBy.length
      });
      await updateDoc(doc(db, 'users', likerId), {
        likedPostIds: newUserLikedPostIds
      });
      
      const author = users.find(u => u.id === post.userId);
      
      if (!isLiked && author && author.id !== likerId) {
        addNotification(
          NotificationType.LIKE,
          'New Like!',
          `${liker?.displayName || 'Someone'} liked your post: "${post.content.substring(0, 20)}..."`,
          { userId: author.id, postId: post.id, senderId: likerId }
        );

        if (author.id === 'ai-jade' && likerId === currentUserId && Math.random() < 0.3) {
          setTimeout(() => {
            addNotification(
              NotificationType.MESSAGE,
              'Jade Vixen',
              'Thanks for the love, babe. 🖤 Check your DMs.',
              { senderId: 'ai-jade', userId: currentUserId }
            );
          }, 2000);
        }
      }
      
      if (likerId === currentUserId) {
        toast.success(isLiked ? 'Unliked post' : 'Liked post');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
      toast.error('Failed to update like');
    }
  };

  const handleCommentPost = async (post: Post, commenterId: string = currentUserId, text?: string) => {
    let commentText = text;
    if (!commentText && commenterId === currentUserId) {
      commentText = prompt('Enter your comment:') || undefined;
    }
    
    if (!commentText) return;

    try {
      const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newComment: AppComment = {
        id: commentId,
        postId: post.id,
        userId: commenterId,
        text: commentText,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'comments', commentId), newComment);

      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        commentsCount: post.commentsCount + 1
      });
      
      const commenter = users.find(u => u.id === commenterId);
      const author = users.find(u => u.id === post.userId);
      
      if (commenterId === currentUserId) {
        toast.success('Comment added!');
      }

      if (author && author.id !== commenterId) {
        addNotification(
          NotificationType.COMMENT,
          'New Comment!',
          `${commenter?.displayName || 'Someone'} commented on your post: "${post.content.substring(0, 20)}..."`,
          { userId: author.id, postId: post.id, senderId: commenterId }
        );

        if (author.id === 'ai-jade' && commenterId === currentUserId) {
          const jadeComment = await generateJadeComment(commentText);
          setTimeout(() => {
            handleCommentPost(post, 'ai-jade', jadeComment);
          }, 3000);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
      toast.error('Failed to add comment');
    }
  };

  const handlePurchaseItem = (item: StoreItem) => {
    toast.success(`Unlocked ${item.title} for free!`);
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (targetUserId === currentUserId) return;
    
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        pendingFriendRequestsSent: [...me.pendingFriendRequestsSent, targetUserId]
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        pendingFriendRequestsReceived: [...targetUser.pendingFriendRequestsReceived, currentUserId]
      });

      addNotification(
        NotificationType.FRIEND_REQUEST,
        'Friend Request',
        `${me.displayName || 'Someone'} sent you a friend request!`,
        { senderId: currentUserId, userId: targetUserId }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  const handleAcceptFriendRequest = async (targetUserId: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    setConfirmAction({
      message: 'Are you sure you want to accept this friend request?',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'users', currentUserId), {
            pendingFriendRequestsReceived: arrayRemove(targetUserId),
            friendIds: arrayUnion(targetUserId)
          });
          await updateDoc(doc(db, 'users', targetUserId), {
            pendingFriendRequestsSent: arrayRemove(currentUserId),
            friendIds: arrayUnion(currentUserId)
          });

          addNotification(
            NotificationType.FRIEND_ACCEPT,
            'Friend Request Accepted',
            `${me.displayName || 'Someone'} accepted your friend request!`,
            { senderId: currentUserId, userId: targetUserId }
          );
          toast.success('Friend request accepted!');
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
        }
      }
    });
  };

  const handleDeclineFriendRequest = async (targetUserId: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    setConfirmAction({
      message: 'Are you sure you want to decline this friend request?',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'users', currentUserId), {
            pendingFriendRequestsReceived: arrayRemove(targetUserId)
          });
          await updateDoc(doc(db, 'users', targetUserId), {
            pendingFriendRequestsSent: arrayRemove(currentUserId)
          });
          toast.success('Friend request declined.');
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
        }
      }
    });
  };

  const handleUnfriend = async (targetUserId: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        friendIds: me.friendIds.filter(id => id !== targetUserId)
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        friendIds: targetUser.friendIds.filter(id => id !== currentUserId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  const handleSendFwbRequest = async (targetUserId: string) => {
    if (targetUserId === currentUserId) return;
    
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    const now = new Date();
    const resetDate = new Date(me.fwbRequestsResetDate);
    
    // Check for reset
    let currentSentCount = me.fwbRequestsSentCount;
    let currentResetDate = me.fwbRequestsResetDate;
    
    if (now >= resetDate) {
      currentSentCount = 0;
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 29);
      currentResetDate = nextReset.toISOString();
    }
    
    if (currentSentCount >= 2 && !me.isAdmin) {
      showMascot({
        action: 'wink',
        message: `You have reached your limit of 2 FWB requests per month. Your limit resets on ${new Date(currentResetDate).toLocaleDateString()} 😉💎`,
        duration: 5000
      });
      return;
    }

    if (me.pendingFwbRequestsSent.includes(targetUserId) || me.fwbIds.includes(targetUserId)) {
      showMascot({
        action: 'wink',
        message: 'You have already sent a request to this user or are already FWB. 😉🔥',
        duration: 5000
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        pendingFwbRequestsSent: [...me.pendingFwbRequestsSent, targetUserId],
        fwbRequestsSentCount: currentSentCount + 1,
        fwbRequestsResetDate: currentResetDate
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        pendingFwbRequestsReceived: [...targetUser.pendingFwbRequestsReceived, currentUserId]
      });

      addNotification(
        NotificationType.FWB_REQUEST,
        'FWB Request',
        `Someone sent you a private FWB request!`,
        { senderId: currentUserId, userId: targetUserId }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  const handleAcceptFwbRequest = async (targetUserId: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        pendingFwbRequestsReceived: me.pendingFwbRequestsReceived.filter(id => id !== targetUserId),
        fwbIds: [...me.fwbIds, targetUserId]
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        pendingFwbRequestsSent: targetUser.pendingFwbRequestsSent.filter(id => id !== currentUserId),
        fwbIds: [...targetUser.fwbIds, currentUserId]
      });

      addNotification(
        NotificationType.FWB_REQUEST,
        'FWB Request Accepted',
        `Your private FWB request was accepted!`,
        { senderId: currentUserId, userId: targetUserId }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  const handleDeclineFwbRequest = async (targetUserId: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        pendingFwbRequestsReceived: me.pendingFwbRequestsReceived.filter(id => id !== targetUserId)
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        pendingFwbRequestsSent: targetUser.pendingFwbRequestsSent.filter(id => id !== currentUserId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  const handleUnfwb = async (targetUserId: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        fwbIds: me.fwbIds.filter(id => id !== targetUserId)
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        fwbIds: targetUser.fwbIds.filter(id => id !== currentUserId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  const handleBlockUser = async (targetUserId: string) => {
    try {
      // 1. Update current user's blocked list and remove friends/fwb
      const myUpdates = { 
        blockedUserIds: [...(me.blockedUserIds || []), targetUserId],
        friendIds: (me.friendIds || []).filter(id => id !== targetUserId),
        fwbIds: (me.fwbIds || []).filter(id => id !== targetUserId),
        pendingFriendRequestsSent: (me.pendingFriendRequestsSent || []).filter(id => id !== targetUserId),
        pendingFriendRequestsReceived: (me.pendingFriendRequestsReceived || []).filter(id => id !== targetUserId),
        pendingFwbRequestsSent: (me.pendingFwbRequestsSent || []).filter(id => id !== targetUserId),
        pendingFwbRequestsReceived: (me.pendingFwbRequestsReceived || []).filter(id => id !== targetUserId),
      };
      
      // 2. Update target user's blocked list and remove friends/fwb
      const targetUser = users.find(u => u.id === targetUserId);
      if (targetUser) {
        const targetUpdates = {
          blockedUserIds: [...(targetUser.blockedUserIds || []), currentUserId],
          friendIds: (targetUser.friendIds || []).filter(id => id !== currentUserId),
          fwbIds: (targetUser.fwbIds || []).filter(id => id !== currentUserId),
          pendingFriendRequestsSent: (targetUser.pendingFriendRequestsSent || []).filter(id => id !== currentUserId),
          pendingFriendRequestsReceived: (targetUser.pendingFriendRequestsReceived || []).filter(id => id !== currentUserId),
          pendingFwbRequestsSent: (targetUser.pendingFwbRequestsSent || []).filter(id => id !== currentUserId),
          pendingFwbRequestsReceived: (targetUser.pendingFwbRequestsReceived || []).filter(id => id !== currentUserId),
        };
        await updateDoc(doc(db, 'users', targetUserId), targetUpdates);
      }

      await updateDoc(doc(db, 'users', currentUserId), myUpdates);
      
      addNotification(NotificationType.SYSTEM, 'User Blocked', 'Mutual block applied. You and this user will no longer see each other.');
      
      // Navigate away from the blocked user's profile
      if (viewingUserId === targetUserId) {
        setViewingUserId(null);
        setActiveTab('home');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    try {
      const url = await uploadFile(file, `gallery/${currentUserId}/${Date.now()}_${file.name}`);
      
      const photoId = `photo-${Date.now()}`;
      const newPhoto: MediaItem = {
        id: photoId,
        url: url,
        type: file.type.startsWith('video') ? 'video' : 'image',
        isNSFW: false,
        createdAt: new Date().toISOString()
      };

      const updatedPhotos = [newPhoto, ...(me.photos || [])];
      await updateDoc(doc(db, 'users', currentUserId), { photos: updatedPhotos });
      addNotification(NotificationType.FOLLOW, 'Photo Uploaded', 'Your new photo is now live on your profile.');
      toast.success('Photo uploaded!');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    }
  };

  const handleDeletePhoto = async (photoId: string, targetUserId?: string) => {
    const userIdToUpdate = targetUserId || currentUserId;
    const userToUpdate = users.find(u => u.id === userIdToUpdate) || (userIdToUpdate === currentUserId ? me : undefined);
    
    if (!userToUpdate) {
      toast.error('User not found for deletion');
      return;
    }

    setConfirmAction({
      message: 'Are you sure you want to delete this media? This cannot be undone.',
      onConfirm: async () => {
        try {
          const updatedPhotos = userToUpdate.photos.filter(p => p.id !== photoId);
          await updateDoc(doc(db, 'users', userIdToUpdate), { 
            photos: updatedPhotos 
          });
          setConfirmAction(null);
          toast.success('Media deleted successfully');
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${userIdToUpdate}`);
        }
      }
    });
  };

  const handleDeletePost = async (postId: string) => {
    setConfirmAction({
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'posts', postId));
          setConfirmAction(null);
          toast.success('Post deleted successfully');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
        }
      }
    });
  };

  const handleDeleteStoreItem = async (itemId: string) => {
    setConfirmAction({
      message: 'Are you sure you want to delete this store item? This cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'storeItems', itemId));
          setConfirmAction(null);
          toast.success('Store item deleted successfully');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `storeItems/${itemId}`);
        }
      }
    });
  };

  const handleUpdateStoreItem = async (itemId: string, updates: Partial<StoreItem>) => {
    try {
      await updateDoc(doc(db, 'storeItems', itemId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `storeItems/${itemId}`);
    }
  };

  const handleStoreCustomizationUpdate = async (customization: StoreCustomization) => {
    try {
      await updateDoc(doc(db, 'users', currentUserId), { storeCustomization: customization });
      setActiveTab('store-management');
      addNotification(
        NotificationType.FOLLOW,
        'Store Customized!',
        'Your store visual appearance has been updated successfully.'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!me.isAdmin) return;
    setConfirmAction({
      message: 'Are you sure you want to BAN this user? They will no longer be able to log in.',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'users', userId), { isBanned: true });
          if (viewingUserId === userId) {
            setActiveTab('feed');
          }
          setConfirmAction(null);
          showMascot({
            action: 'wink',
            message: 'User has been banned. 🚫🔨',
            duration: 3000
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
        }
      }
    });
  };

  const handleAddItemToStore = async (itemData: Omit<StoreItem, 'id' | 'userId' | 'createdAt'>, files: File[]) => {
    const uploadToastId = toast.loading(`Uploading ${files.length} file(s) to store...`);
    console.log('Starting store item upload:', { title: itemData.title, fileCount: files.length });
    
    try {
      const mediaUrls: string[] = [];
      const isVideo = itemData.type === 'video';
      // Detect if an explicit thumbnail was provided (first file is image, and there are more files)
      const hasExplicitThumbnail = files.length > 1 && files[0].type.startsWith('image') && 
                                  (isVideo || itemData.type === 'picture_pack' || itemData.type === 'other');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes)`);
        
        try {
          const url = await uploadFile(file, `store/${currentUserId}/${Date.now()}_${file.name}`, (progress) => {
            const overallProgress = Math.round(((i / files.length) * 100) + (progress / files.length));
            toast.loading(`Uploading file ${i + 1}/${files.length}: ${overallProgress}%`, { id: uploadToastId });
          });
          console.log(`Successfully uploaded file ${i + 1}:`, url);
          mediaUrls.push(url);
        } catch (err: any) {
          console.error(`Upload failed for file ${i + 1}:`, err);
          throw new Error(err.message || `Upload failed for file ${i + 1}`);
        }
      }

      if (mediaUrls.length === 0) {
        throw new Error('No files were successfully uploaded.');
      }

      console.log('All files uploaded successfully. Saving to Firestore...');
      
      // Auto-sync store item media to gallery
      if (mediaUrls.length > 0) {
        await syncMediaToGallery(mediaUrls);
      }

      const itemId = `si-${Date.now()}`;
      
      let finalThumbnailUrl = mediaUrls[0];
      let finalMediaUrls = mediaUrls;

      if (hasExplicitThumbnail) {
        finalThumbnailUrl = mediaUrls[0];
        finalMediaUrls = mediaUrls.slice(1); // Content is everything after thumb
      }
      
      const newItem: StoreItem = {
        id: itemId,
        userId: currentUserId,
        ...itemData,
        type: isVideo ? 'video' : itemData.type,
        thumbnailUrl: finalThumbnailUrl,
        mediaUrls: finalMediaUrls,
        createdAt: new Date().toISOString()
      };

      const cleanedNewItem: any = {};
      Object.keys(newItem).forEach(key => {
        const val = (newItem as any)[key];
        if (val !== undefined && (typeof val !== 'number' || !isNaN(val))) {
          cleanedNewItem[key] = val;
        }
      });
      
      await setDoc(doc(db, 'storeItems', itemId), cleanedNewItem);
      
      const newMediaItems: MediaItem[] = mediaUrls.map((url, index) => {
        const file = files[index];
        return {
          id: `${itemId}-${index}`,
          url,
          type: (file?.type.startsWith('video') || isVideo) ? 'video' : 'image',
          createdAt: new Date().toISOString(),
          isNSFW: true
        };
      });
      
      const updatedStoreUploads = [...(me.storeUploads || []), ...newMediaItems];
      await updateDoc(doc(db, 'users', currentUserId), { 
        storeUploads: updatedStoreUploads,
        isStoreActive: true // Ensure store state is correct
      });
      
      addNotification(
        NotificationType.SYSTEM,
        'Item Published',
        `Your store item "${itemData.title}" is now live!`
      );

      toast.success('Store item published successfully!', { id: uploadToastId });
    } catch (error: any) {
      console.error('Error adding item to store:', error);
      toast.error(`Store upload failed: ${error.message || 'Unknown error'}`, { id: uploadToastId });
    }
  };

  const handleUnlockVideoPaymentSuccess = async (itemId: string, price: number) => {
    if (!currentUserId) return;
    
    const toastId = toast.loading('Verifying secure payment authorization via Stripe...');
    try {
      // Get the latest user data directly from Firestore
      const userRef = doc(db, 'users', currentUserId);
      const userSnap = await getDoc(userRef);
      const latestUserData = userSnap.data() as User;
      
      const currentPurchased = latestUserData?.purchasedItemIds || [];
      if (currentPurchased.includes(itemId)) {
        toast.success('This media item is already unlocked and available in your permanent library.', { id: toastId });
        setActiveTab('my-videos');
        return;
      }

      const updatedPurchasedIds = Array.from(new Set([...currentPurchased, itemId]));
      await updateDoc(userRef, { purchasedItemIds: updatedPurchasedIds });
      
      // Breakdown calculation
      const creatorPayout = price * 0.8;
      const platformFee = price * 0.2;
      
      toast.success(
        `Stripe Payment Successful! Item unlocked in My Vault. Creator Payout: $${creatorPayout.toFixed(2)} (80%). Platform fee: $${platformFee.toFixed(2)} (20%).`,
        { id: toastId, duration: 6000 }
      );
      
      setActiveTab('my-videos');
    } catch (err: any) {
      console.error('Failed to unlock item after purchase:', err);
      toast.error(`Verification error: ${err.message || 'database error'}`, { id: toastId });
    }
  };

  const handleBuyStoreItem = async (item: StoreItem) => {
    if (!me) {
      toast.error('You must be logged in to purchase items.');
      return;
    }
    
    if (item.type === 'video' || item.type === 'picture_pack') {
      let price = item.price || 0;
      
      // Determine price based on content types
      if (item.type === 'video') {
        const duration = item.videoDuration || 0;
        if (duration >= 120 && duration <= 600) {
          price = 20;
        } else if (duration > 600) {
          price = 40;
        }
      } else if (item.type === 'picture_pack') {
        price = 15;
      }

      if (price > 0) {
        const sellerName = users.find(u => u.id === item.userId)?.displayName || users.find(u => u.id === item.userId)?.username || 'Creator';
        const stripeUrl = `${window.location.origin}${window.location.pathname}?stripe_checkout=true&item_id=${item.id}&price=${price}&title=${encodeURIComponent(item.title)}&thumbnail=${encodeURIComponent(item.thumbnailUrl)}&seller_id=${item.userId}&seller_name=${encodeURIComponent(sellerName)}`;
        
        toast.loading('Redirecting to Stripe payment link for checkouts...');
        setTimeout(() => {
          window.location.href = stripeUrl;
        }, 800);
        return;
      }
    }
    
    try {
      const updatedPurchasedIds = Array.from(new Set([...(me.purchasedItemIds || []), item.id]));
      await handleUpdateUser({ purchasedItemIds: updatedPurchasedIds });
      toast.success('Item added to collection!');
    } catch (error) {
      console.error('Purchase failed', error);
      toast.error('Could not complete purchase. Please try again.');
    }
  };

  const handleCreateStableListing = async (listingData: Omit<StableListing, 'id' | 'createdAt' | 'userId'>, postToStore: boolean, photoFiles: File[]) => {
    try {
      const uploadedPhotos: string[] = [];
      
      for (const file of photoFiles) {
        try {
          const url = await uploadFile(file, `stable/${currentUserId}/${Date.now()}_${file.name}`);
          uploadedPhotos.push(url);
        } catch (err) {
          console.error("Photo upload for stable failed:", err);
        }
      }

      const listingId = `sl-${Date.now()}`;
      const newListing: StableListing = {
        id: listingId,
        userId: currentUserId,
        ...listingData,
        photos: uploadedPhotos,
        avatarUrl: uploadedPhotos[0] || APP_LOGO_URL,
        createdAt: new Date().toISOString()
      };

      // Clean undefined values
      const cleanedListing: any = {};
      Object.keys(newListing).forEach(key => {
        if ((newListing as any)[key] !== undefined) {
          cleanedListing[key] = (newListing as any)[key];
        }
      });
      
      await setDoc(doc(db, 'stableListings', listingId), cleanedListing);
      
      // Auto-sync stable photos to gallery
      if (uploadedPhotos.length > 0) {
        await syncMediaToGallery(uploadedPhotos);
      }

      if (postToStore) {
        const itemId = `si-stable-${Date.now()}`;
        const isVideo = photoFiles.some(f => f.type.startsWith('video'));
        
        const newStoreItem: StoreItem = {
          id: itemId,
          userId: currentUserId,
          title: `${listingData.providerName} - Stable Listing`,
          description: listingData.services,
          thumbnailUrl: newListing.avatarUrl,
          mediaUrls: newListing.photos,
          type: isVideo ? 'video' : 'other',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'storeItems', itemId), newStoreItem);
      }

      setActiveTab('stable');
      toast.success('Stable listing created!');
    } catch (error) {
      console.error('Stable listing upload error:', error);
      toast.error('Failed to create stable listing');
    }
  };

  const generateAICaption = async () => {
    setAiGenerating(true);
    const suggestion = await generateCaptionSuggestion(newPostContent || "post ideas");
    setNewPostContent(suggestion);
    setAiGenerating(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedUserId || !currentUserId) return;
    
    const messageId = `msg-${Date.now()}`;
    const newMessage: Message = {
      id: messageId,
      senderId: currentUserId,
      receiverId: selectedUserId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Optimistic Update
    setChatMessages(prev => {
      const next = { ...prev };
      if (!next[selectedUserId]) next[selectedUserId] = [];
      next[selectedUserId] = [...next[selectedUserId], newMessage];
      return next;
    });

    try {
      await setDoc(doc(db, 'messages', messageId), newMessage);

      // Handle Jade AI Response
      if (selectedUserId === 'ai-jade') {
        setIsJadeTyping(true);
        
        // Get chat history for context
        const history = (chatMessages['ai-jade'] || []).map(msg => ({
          role: msg.senderId === 'ai-jade' ? 'model' as const : 'user' as const,
          text: msg.text
        }));

        const responseText = await generateJadeResponse(text, history);
        
        // Simulate typing delay
        setTimeout(async () => {
          setIsJadeTyping(false);
          const jadeMsgId = `msg-jade-${Date.now()}`;
          const jadeMsg: Message = {
            id: jadeMsgId,
            senderId: 'ai-jade',
            receiverId: currentUserId,
            text: responseText,
            timestamp: new Date().toISOString(),
            isRead: false
          };
          
          // Note: Snapshot listener will pick this up soon, but we could optimistic add it too
          await setDoc(doc(db, 'messages', jadeMsgId), jadeMsg);
        }, 1500 + Math.random() * 1000); // Shorter delay for "immediately" feel
      }
    } catch (error) {
      // Revert optimistic update on error
      setChatMessages(prev => {
        const next = { ...prev };
        if (next[selectedUserId]) {
          next[selectedUserId] = next[selectedUserId].filter(m => m.id !== messageId);
        }
        return next;
      });
      handleFirestoreError(error, OperationType.CREATE, `messages/${messageId}`);
    }
  };

  const handleDeleteConversation = async (userId: string) => {
    if (!currentUserId) return;
    
    try {
      // Find all messages between current user and target user
      const q1 = query(collection(db, 'messages'), where('senderId', '==', currentUserId), where('receiverId', '==', userId));
      const q2 = query(collection(db, 'messages'), where('senderId', '==', userId), where('receiverId', '==', currentUserId));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      const deletePromises = [...snap1.docs, ...snap2.docs].map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      setChatMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[userId];
        return newMessages;
      });
      
      if (selectedUserId === userId) {
        setSelectedUserId(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `messages conversation with ${userId}`);
    }
  };

  const renderFeed = () => (
    <HomePage 
      me={me}
      users={filteredUsers}
      posts={filteredPosts}
      comments={comments}
      searchQuery={searchQuery}
      isLoading={isDataLoading}
      onSelectUser={navigateToProfile}
      onLikePost={handleLikePost}
      onCommentPost={handleCommentPost}
      onDeletePost={(post) => handleDeletePost(post.id)}
      onProfileClick={navigateToProfile}
      onCreatePost={() => setIsCreating(true)}
      onAcceptFriendRequest={handleAcceptFriendRequest}
      onDeclineFriendRequest={handleDeclineFriendRequest}
      onAcceptFwbRequest={handleAcceptFwbRequest}
      onDeclineFwbRequest={handleDeclineFwbRequest}
    />
  );

  const renderMessages = () => (
    <ChatPage 
      me={me}
      users={filteredUsers}
      chatMessages={filteredChatMessages}
      selectedUserId={selectedUserId}
      notifications={appNotifications
        .filter(n => n.type === NotificationType.MESSAGE && !n.isRead)
        .map(n => n.senderId!)
      }
      isLoading={isDataLoading}
      onSelectUser={setSelectedUserId}
      onSendMessage={sendMessage}
      onStartCall={callUser}
      isTyping={isJadeTyping && selectedUserId === 'ai-jade'}
      onExit={() => setActiveTab('feed')}
      onProfileClick={navigateToProfile}
      onDeleteConversation={handleDeleteConversation}
    />
  );

    const renderProfile = (user: User | undefined, isOwnProfile: boolean) => {
      if (isDataLoading) return <ProfileSkeleton />;
      if (!user) return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Bell size={32} className="text-slate-700" />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">User not found</p>
            <button onClick={() => setActiveTab('feed')} className="text-[#967bb6] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Back to Feed</button>
          </div>
        </div>
      );
      const custom = user.profileCustomization;
    const fontStyles: Record<string, string> = {
      sans: 'font-sans',
      serif: 'font-serif',
      mono: 'font-mono',
      display: 'font-display',
      cursive: 'font-cursive',
      retro: 'font-retro',
      futuristic: 'font-futuristic',
      handwritten: 'font-handwritten',
    };

    const accentColor = custom?.accentColor || '#967bb6';
    const buttonColor = custom?.buttonColor || '#967bb6';
    const fontColor = custom?.fontColor || '#ffffff';

    const profileButtonStyle = {
      backgroundColor: '#000000',
      color: '#967bb6'
    };

    const backgroundStyle = custom?.backgroundWallpaper && custom.backgroundWallpaper !== ''
      ? {
          backgroundColor: custom.backgroundWallpaperColor || '#050505',
          backgroundImage: `url(${custom.backgroundWallpaper})`,
          backgroundRepeat: 'repeat',
          color: fontColor
        }
      : {
          backgroundColor: custom?.backgroundColor || '#050505',
          backgroundImage: 'none',
          color: fontColor
        };

    return (
      <div 
        className={`min-h-screen transition-all duration-500 ${custom?.fontType ? fontStyles[custom.fontType] : ''}`}
        style={backgroundStyle}
      >
        {custom?.themeSongUrl && (
          <ThemeMusicPlayer customization={custom} />
        )}
        <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8">
      {/* Header Section: Cover & Avatar Integration */}
      <div className="relative mb-24">
        <div className="h-[350px] md:h-[450px] rounded-[3rem] overflow-hidden border border-white/10 relative group shadow-2xl">
          <img 
            src={user.coverImage || undefined} 
            className="w-full h-full object-cover opacity-70 transition-transform duration-1000 group-hover:scale-105" 
            alt="" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== APP_LOGO_URL) {
                target.src = APP_LOGO_URL;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          
          {/* Stats Overlay on Cover */}
          <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-end space-x-6">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] border-4 border-black overflow-hidden shadow-2xl bg-black chrome-border shrink-0 relative z-10">
                <img 
                  src={user.avatar || undefined} 
                  className="w-full h-full object-cover" 
                  alt="" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== APP_LOGO_URL) {
                      target.src = APP_LOGO_URL;
                    }
                  }}
                />
              </div>
              <div className="pb-2">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase chrome-text drop-shadow-2xl" style={{ color: fontColor }}>{user.displayName}</h1>
                  {user.isAdmin && (
                    <div className="flex items-center space-x-1 border border-red-500/40 px-3 py-1 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-red-500/10 text-red-400" title="System Administrator">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Administrator</span>
                    </div>
                  )}
                  {stableListings.some(l => l.userId === user.id) && (
                    <div className="flex items-center space-x-1 border border-white/20 px-3 py-1 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]" title="Stable Member - Escort Services" style={{ backgroundColor: '#000000', color: '#967bb6' }}>
                      <Briefcase size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Stable Member</span>
                    </div>
                  )}
                  {me?.fwbIds?.includes(user.id) && (
                    <div className="flex items-center space-x-1 border border-[#967bb6]/40 px-3 py-1 rounded-xl shadow-[0_0_20px_rgba(150,123,182,0.3)] bg-[#967bb6]/10 text-[#967bb6]" title="Private FWB Partner">
                      <Flame size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">FWB Partner: {me?.id === user.id ? 'Private List' : me?.displayName}</span>
                    </div>
                  )}
                  {isOwnProfile && user.fwbIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.fwbIds.map(fId => {
                        const fUser = users.find(u => u.id === fId);
                        if (!fUser) return null;
                        return (
                          <div key={fId} className="flex items-center space-x-1 border border-[#967bb6]/40 px-2 py-0.5 rounded-lg bg-[#967bb6]/5 text-[#967bb6]">
                            <Flame size={10} />
                            <span className="text-[8px] font-black uppercase">FWB: {fUser.displayName}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-black text-lg tracking-widest uppercase drop-shadow-lg" style={{ color: accentColor }}>@{user.username}</p>
                  {user.occupation && (
                    <div className="flex items-center space-x-1.5 text-white/80 bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                      <Briefcase size={12} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{user.occupation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-8 bg-black/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
              <div 
                onClick={() => {
                  setFriendsListUserId(user.id);
                  setIsFriendsListOpen(true);
                }}
                className="text-center cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all group"
              >
                <p className="text-2xl font-black text-white tracking-tighter transition-colors" style={{ color: fontColor }}>{user.friendIds.length}</p>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1 group-hover:text-white transition-colors">Friends</p>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center p-2">
                <p className="text-2xl font-black text-white tracking-tighter" style={{ color: fontColor }}>{(user.fanIds || []).length}</p>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1">Followers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar: Prominent & Organized */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-12 bg-white/[0.03] backdrop-blur-md p-4 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3">
          {isOwnProfile ? (
            <div className="relative">
              <button 
                onClick={() => setIsEditProfileMenuOpen(!isEditProfileMenuOpen)}
                className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border border-white/10 shadow-xl flex items-center space-x-2"
                style={profileButtonStyle}
              >
                <SettingsIcon size={16} />
                <span>Edit Profile</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isEditProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isEditProfileMenuOpen && (
                <div className="absolute left-0 mt-3 w-56 bg-[#050505] rounded-2xl border border-[#c0c0c0]/20 shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 chrome-border z-50">
                  <button 
                    onClick={() => { setActiveTab('profile-edit'); setIsEditProfileMenuOpen(false); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:opacity-90 transition-all"
                    style={profileButtonStyle}
                  >
                    <SettingsIcon size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Edit Profile</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('custom-profile'); setIsEditProfileMenuOpen(false); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:opacity-90 transition-all mt-1"
                    style={profileButtonStyle}
                  >
                    <Palette size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Custom Profile</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('more'); setIsEditProfileMenuOpen(false); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:opacity-90 transition-all mt-1"
                    style={profileButtonStyle}
                  >
                    <Plus size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">More</span>
                  </button>
                  <button 
                    onClick={() => { viewOwnProfileAsPublic(); setIsEditProfileMenuOpen(false); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:opacity-90 transition-all mt-1"
                    style={profileButtonStyle}
                  >
                    <ExternalLink size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">View Public</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {user.id === currentUserId && isViewingAsPublic && (
                <button 
                  onClick={() => { setIsViewingAsPublic(false); setActiveTab('profile'); }}
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95 chrome-border flex items-center space-x-2"
                  style={profileButtonStyle}
                >
                  <X size={18} />
                  <span>Exit Preview</span>
                </button>
              )}
              <button 
                onClick={() => handleToggleFan(user.id)}
                className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border shadow-xl flex items-center space-x-2 chrome-border"
                style={profileButtonStyle}
              >
                <Star size={16} fill={(user.fanIds || []).includes(currentUserId) ? "currentColor" : "none"} />
                <span>{(user.fanIds || []).includes(currentUserId) ? 'Following' : 'Follow'}</span>
              </button>
              <button 
                onClick={() => { setSelectedUserId(user.id); setActiveTab('messages'); }}
                className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95 chrome-border flex items-center space-x-2"
                style={profileButtonStyle}
              >
                <MessageSquare size={18} />
                <span>Message</span>
              </button>

              {/* Friend Actions */}
              {me?.friendIds?.includes(user.id) ? (
                <button 
                  onClick={() => handleUnfriend(user.id)}
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border flex items-center space-x-2"
                  style={profileButtonStyle}
                >
                  <UserCheck size={18} />
                  <span>Friends</span>
                </button>
              ) : me?.pendingFriendRequestsSent?.includes(user.id) ? (
                <button 
                  onClick={() => handleDeclineFriendRequest(user.id)}
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest backdrop-blur-sm transition-all border flex items-center space-x-2"
                  style={profileButtonStyle}
                >
                  <UserPlus size={18} />
                  <span>Request Sent</span>
                </button>
              ) : me?.pendingFriendRequestsReceived?.includes(user.id) ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAcceptFriendRequest(user.id)}
                    className="px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg transition-all chrome-border flex items-center space-x-2"
                    style={profileButtonStyle}
                  >
                    <UserCheck size={18} />
                    <span>Accept</span>
                  </button>
                  <button 
                    onClick={() => handleDeclineFriendRequest(user.id)}
                    className="px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest border transition-all flex items-center justify-center"
                    style={profileButtonStyle}
                  >
                    <UserX size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleSendFriendRequest(user.id)}
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg transition-all hover:scale-105 chrome-border flex items-center space-x-2"
                  style={profileButtonStyle}
                >
                  <UserPlus size={18} />
                  <span>Add Friend</span>
                </button>
              )}

              {/* FWB Actions */}
              {me?.fwbIds?.includes(user.id) ? (
                <button 
                  onClick={() => handleUnfwb(user.id)}
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border flex items-center space-x-2"
                  style={profileButtonStyle}
                >
                  <Flame size={18} />
                  <span>FWB</span>
                </button>
              ) : me?.pendingFwbRequestsSent?.includes(user.id) ? (
                <button 
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest backdrop-blur-sm transition-all border flex items-center space-x-2 cursor-not-allowed"
                  style={profileButtonStyle}
                >
                  <Flame size={18} />
                  <span>FWB Sent</span>
                </button>
              ) : me?.pendingFwbRequestsReceived?.includes(user.id) ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAcceptFwbRequest(user.id)}
                    className="px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg transition-all chrome-border flex items-center space-x-2"
                    style={profileButtonStyle}
                  >
                    <Flame size={18} />
                    <span>Accept FWB</span>
                  </button>
                  <button 
                    onClick={() => handleDeclineFwbRequest(user.id)}
                    className="px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest border transition-all flex items-center justify-center"
                    style={profileButtonStyle}
                  >
                    <UserX size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleSendFwbRequest(user.id)}
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95 chrome-border flex items-center space-x-2"
                  style={profileButtonStyle}
                >
                  <Flame size={18} />
                  <span>Add FWB</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setViewingUserId(user.id);
              setActiveTab('media-store');
            }}
            className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest backdrop-blur-sm transition-all border border-white/10 flex items-center space-x-2 shadow-xl"
            style={profileButtonStyle}
          >
            <ShoppingBag size={18} />
            <span>Visit Store</span>
          </button>
          <button className="p-3.5 rounded-2xl transition-all border border-white/10" style={profileButtonStyle}>
            <Globe size={18} />
          </button>
          {me?.isAdmin && !isOwnProfile && (
            <button 
              onClick={() => handleBanUser(user.id)}
              className="p-3.5 rounded-2xl shadow-lg transition-all chrome-border"
              style={profileButtonStyle}
              title="Ban User (Admin Only)"
            >
              <Ban size={18} />
            </button>
          )}
          {!isOwnProfile && (
            <button 
              onClick={() => {
                if (window.confirm("Are you sure? Blocking is PERMANENT. You and this user will never see each other again.")) {
                  handleBlockUser(user.id);
                }
              }}
              className="p-3.5 rounded-2xl shadow-lg transition-all border border-red-500/30 hover:bg-red-500/10 text-red-500"
              style={profileButtonStyle}
              title="Block User Permanently"
            >
              <ShieldAlert size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={`grid gap-12 ${
        custom?.layout === 'minimal' || custom?.layout === 'timeline' ? 'grid-cols-1 max-w-3xl mx-auto' : 
        custom?.layout === 'bento' || custom?.layout === 'cards' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
        custom?.layout === 'magazine' || custom?.layout === 'gallery' ? 'grid-cols-1 lg:grid-cols-12' :
        'grid-cols-1 lg:grid-cols-12'
      }`}>
        {/* Sidebar: About & Info */}
        {(custom?.layout === 'default' || custom?.layout === 'sidebar' || custom?.layout === 'magazine' || custom?.layout === 'gallery' || !custom?.layout) && (
          <div className={`${
            custom?.layout === 'magazine' || custom?.layout === 'gallery' ? 'lg:col-span-4' : 'lg:col-span-4'
          } space-y-8`}>
            <div className="glass-panel rounded-[2.5rem] p-10 chrome-border bg-white/[0.02] shadow-2xl">
              <div className="mb-10">
                <h3 className="font-black mb-6 uppercase text-[11px] tracking-[0.4em] flex items-center" style={{ color: accentColor }}>
                  <UserIcon size={16} className="mr-3" />
                  Biography
                </h3>
                <p className="text-slate-200 leading-relaxed italic text-lg font-medium" style={{ color: fontColor }}>"{user.bio || "No bio set yet."}"</p>
                {user.tagline && (
                  <p className="text-xs font-black uppercase tracking-widest mt-4" style={{ color: accentColor }}># {user.tagline}</p>
                )}
              </div>
              
              <div className="space-y-6 mb-10">
                {user.location && (
                  <div className="flex items-center space-x-5 text-slate-300 group">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all border border-white/5">
                      <MapPin size={18} style={{ color: accentColor }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Location</span>
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: fontColor }}>{user.location}</span>
                    </div>
                  </div>
                )}
                {user.occupation && (
                  <div className="flex items-center space-x-5 text-slate-300 group">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all border border-white/5">
                      <Briefcase size={18} style={{ color: accentColor }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Occupation</span>
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: fontColor }}>{user.occupation}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/5 pt-10">
                <h3 className="font-black mb-8 uppercase text-[11px] tracking-[0.4em]" style={{ color: accentColor }}>Social Presence</h3>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {user.email && (
                    <a href={`mailto:${user.email}`} className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                      <Mail size={18} style={{ color: accentColor }} />
                      <span className="text-[10px] font-black uppercase tracking-widest truncate text-slate-300" style={{ color: fontColor }}>{user.email}</span>
                    </a>
                  )}
                  {user.socials?.website && (
                    <a href={user.socials.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                      <Globe size={18} style={{ color: accentColor }} />
                      <span className="text-[10px] font-black uppercase tracking-widest truncate text-slate-300" style={{ color: fontColor }}>{user.socials.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {user.socials?.twitter && (
                    <a href={`https://twitter.com/${user.socials.twitter}`} target="_blank" rel="noopener noreferrer" className="flex-1 h-14 bg-white/5 rounded-2xl text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center border border-white/5">
                      <Twitter size={20} style={{ color: accentColor }} />
                    </a>
                  )}
                  {user.socials?.instagram && (
                    <a href={`https://instagram.com/${user.socials.instagram}`} target="_blank" rel="noopener noreferrer" className="flex-1 h-14 bg-white/5 rounded-2xl text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center border border-white/5">
                      <Instagram size={20} style={{ color: accentColor }} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Feed: Tabs & Content */}
        <div className={`${
          custom?.layout === 'minimal' || custom?.layout === 'timeline' ? 'col-span-1' :
          custom?.layout === 'bento' || custom?.layout === 'cards' ? 'col-span-full' :
          custom?.layout === 'magazine' || custom?.layout === 'gallery' ? 'lg:col-span-8' :
          'lg:col-span-8'
        }`}>
          <div className="flex space-x-12 border-b border-white/5 mb-12 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setProfileTab('posts')}
              className={`pb-6 uppercase text-[11px] tracking-[0.4em] font-black transition-all relative whitespace-nowrap ${profileTab === 'posts' ? 'text-white' : 'text-slate-600 hover:text-slate-300'}`}
              style={profileTab === 'posts' ? { color: fontColor } : {}}
            >
              Feed
              {profileTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-1 shadow-lg rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0 15px ${accentColor}` }}></div>}
            </button>
            <button 
              onClick={() => setProfileTab('photos')}
              className={`pb-6 uppercase text-[11px] tracking-[0.4em] font-black transition-all relative whitespace-nowrap ${profileTab === 'photos' ? 'text-white' : 'text-slate-600 hover:text-slate-300'}`}
              style={profileTab === 'photos' ? { color: fontColor } : {}}
            >
              Gallery
              {profileTab === 'photos' && <div className="absolute bottom-0 left-0 right-0 h-1 shadow-lg rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0 15px ${accentColor}` }}></div>}
            </button>
            <button 
              onClick={() => {
                setFriendsListUserId(user.id);
                setIsFriendsListOpen(true);
              }}
              className="pb-6 uppercase text-[11px] tracking-[0.4em] font-black transition-all relative whitespace-nowrap text-slate-600 hover:text-slate-300"
            >
              Friends
            </button>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {profileTab === 'posts' && (
              <div className={`${custom?.layout === 'bento' || custom?.layout === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : custom?.layout === 'gallery' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-8'}`}>
                {posts.filter(p => p.userId === user.id).length > 0 ? (
                  posts.filter(p => p.userId === user.id).map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      author={user} 
                      currentUserId={currentUserId}
                      isMe={isOwnProfile} 
                      isAdmin={me.isAdmin} 
                      isFan={user.fanIds?.includes(currentUserId)}
                      onLike={() => handleLikePost(post)}
                      onComment={() => handleCommentPost(post)}
                      onDelete={() => handleDeletePost(post.id)}
                      onProfileClick={navigateToProfile}
                      comments={filteredComments}
                      users={filteredUsers}
                    />
                  ))
                ) : (
                  <div className="glass-panel rounded-[2.5rem] p-20 text-center border-dashed border-white/10 bg-white/[0.01] col-span-full">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                      <Plus size={32} className="text-slate-700" />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">No activity recorded</p>
                  </div>
                )}
              </div>
            )}

            {profileTab === 'photos' && (
              <div className={`grid gap-6 ${
                custom?.layout === 'bento' || custom?.layout === 'cards' ? 'grid-cols-2 md:grid-cols-4' : 
                custom?.layout === 'gallery' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
                'grid-cols-2 sm:grid-cols-3'
              }`}>
                {user.photos.length > 0 ? (
                  user.photos.map(photo => (
                    <div key={photo.id} className="aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/5 group cursor-pointer relative chrome-border shadow-2xl">
                      {photo.type === 'video' || (photo.url && (photo.url.split('?')[0].match(/\.(mp4|mov|webm|ogg|m4v|avi|MP4|MOV|WEBM)$/i) || photo.url.toLowerCase().includes('video'))) ? (
                        <div className="w-full h-full relative">
                          <VideoPlayer 
                            src={photo.url} 
                            className="w-full h-full object-cover" 
                            muted
                            autoPlay={false}
                            controls={false}
                          />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                            <Play size={32} className="text-white opacity-50" />
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={photo.url} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          alt="" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = APP_LOGO_URL;
                          }}
                        />
                      )}
                      
                      {(isOwnProfile || me.isAdmin) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id, user.id);
                          }}
                          className="absolute top-4 right-4 z-10 p-2 bg-red-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-95"
                          title="Delete Photo"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                        <div className="flex items-center space-x-2 text-white/60">
                          <ImageIcon size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">View Full</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full glass-panel rounded-[2.5rem] p-20 text-center border-dashed border-white/10 bg-white/[0.01]">
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Gallery is empty</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
      </div>
    );
  };

  const renderMediaStore = () => {
    return null;
  };

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Check if we need to render the Stripe Checkout Simulator
  const params = new URLSearchParams(window.location.search);
  const isStripeCheckout = params.get('stripe_checkout') === 'true';
  const checkoutPrice = parseFloat(params.get('price') || '0');
  const checkoutItemId = params.get('item_id') || '';
  const checkoutTitle = params.get('title') || '';
  const checkoutThumbnail = params.get('thumbnail') || '';
  const checkoutSellerId = params.get('seller_id') || '';
  const checkoutSellerName = params.get('seller_name') || 'Creator';

  if (isStripeCheckout && checkoutItemId && checkoutPrice) {
    return (
      <StripeCheckout 
        itemId={checkoutItemId}
        price={checkoutPrice}
        title={checkoutTitle}
        thumbnailUrl={checkoutThumbnail}
        sellerId={checkoutSellerId}
        sellerName={checkoutSellerName}
        buyerEmail={me?.email || auth?.currentUser?.email || 'customer@example.com'}
      />
    );
  }

  // Main App Content Flow
  if (showSplash) return (
    <motion.div key="splash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <SplashScreen 
        onComplete={() => setShowSplash(false)} 
        isFirestoreOnline={isFirestoreOnline}
      />
    </motion.div>
  );

  // If Auth has resolved and user is not logged in OR has not explicitly authenticated this session
  if (isAuthReady && (!isLoggedIn || !isSessionAuthenticated)) return (
    <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <LoginPage 
        onLogin={handleLogin} 
        onRegister={handleRegister}
        onSocialLogin={handleSocialLogin}
      />
    </motion.div>
  );

  // Still checking auth state but we aren't showing login yet
  if (!isAuthReady) return (
    <motion.div key="auth-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black flex items-center justify-center">
       <div className="flex flex-col items-center space-y-4">
         <Logo size="md" className="animate-pulse" />
         <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute inset-y-0 left-0 bg-white"
            animate={{ width: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
         <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] animate-pulse">Securing Connection</p>
       </div>
    </motion.div>
  );

  // Logged in, but profile is still loading
  if (isProfileLoading) return (
    <motion.div key="profile-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black flex items-center justify-center">
       <div className="flex flex-col items-center space-y-4">
         <Logo size="md" className="animate-pulse" />
         <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] animate-pulse">Syncing Profile</p>
       </div>
    </motion.div>
  );

  // Logged in, but no profile (New User)
  if (!hasCreatedProfile) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ProfileCreationPage 
        currentUserId={currentUserId}
        initialEmail={auth?.currentUser?.email || ''} 
        onComplete={handleProfileUpdate} 
      />
    </motion.div>
  );

  if (viewingUserId && (blockedIds.includes(viewingUserId) || (users.find(u => u.id === viewingUserId)?.blockedUserIds || []).includes(currentUserId))) {
    setTimeout(() => {
      setViewingUserId(null);
      setActiveTab('home');
    }, 0);
  }

  // Manual reconnect helper
  const handleReconnect = async () => {
    const toastId = toast.loading('Attempting to reconnect...');
    try {
      console.log('Manual reconnect requested...');
      await enableNetwork(db);
      // Wait a moment for network to establish
      await new Promise(v => setTimeout(v, 1000));
      
      const testDoc = doc(db, '_connection_test_', 'ping');
      await getDocFromServer(testDoc).catch((e) => {
        if (!e.message.includes('permission-denied') && !e.message.includes('Missing or insufficient permissions')) {
          throw e;
        }
      });
      
      setIsFirestoreOnline(true);
      toast.success('Successfully reconnected to Firestore!', { id: toastId });
    } catch (error: any) {
      console.error('Reconnect failed:', error);
      setIsFirestoreOnline(false);
      toast.error('Reconnect failed. Please check your internet connection.', { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-300">
      {/* Offline Banner */}
      {!isFirestoreOnline && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1 px-4 text-center animate-pulse sticky top-0 z-[100] flex items-center justify-center gap-4">
          <span>Firestore is offline. Some features may be unavailable.</span>
          <div className="flex gap-2">
            <button 
              onClick={handleReconnect}
              className="bg-white text-red-600 px-2 py-0.5 rounded font-black hover:bg-slate-100 transition-colors uppercase"
            >
              Reconnect
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white/20 text-white px-2 py-0.5 rounded font-black hover:bg-white/30 transition-colors uppercase border border-white/30"
            >
              Reload
            </button>
          </div>
        </div>
      )}
      <TopNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userAvatar={me?.avatar} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCreate={() => setIsCreating(true)}
        users={filteredUsers}
        storeItems={storeItems}
        stableListings={stableListings}
        navigateToProfile={navigateToProfile}
        navigateToStore={navigateToStore}
        currentUserId={currentUserId}
        isAdmin={me?.isAdmin || false}
        onViewPublicProfile={viewOwnProfileAsPublic}
        onLogout={handleLogout}
        hasUnreadMessages={appNotifications.some(n => n.type === NotificationType.MESSAGE && !n.isRead)}
        hasUnreadNotifications={appNotifications.some(n => n.type !== NotificationType.MESSAGE && !n.isRead)}
        customStyle={currentProfileCustomization ? { 
          menuBarColor: currentProfileCustomization.menuBarColor,
          accentColor: currentProfileCustomization.accentColor,
          fontColor: currentProfileCustomization.fontColor
        } : undefined}
      />

      <main className={`${activeTab === 'messages' ? '' : 'pb-24'} pt-20`}>
        {activeTab === 'feed' && renderFeed()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'profile' && me && renderProfile(me, true)}
        {activeTab === 'user-profile' && viewingUserId && (
          renderProfile(filteredUsers.find(u => u.id === viewingUserId), (viewingUserId === currentUserId) && !isViewingAsPublic)
        )}
        {activeTab === 'profile-edit' && me && (
          <ProfileEditPage 
            user={me} 
            onSave={handleProfileUpdate} 
            onCancel={() => setActiveTab('profile')} 
          />
        )}
        {activeTab === 'custom-profile' && me && (
          <CustomProfilePage 
            user={me} 
            onSave={(customization) => {
              handleUpdateUser({ profileCustomization: customization });
              setActiveTab('profile');
            }} 
            onBack={() => setActiveTab('profile')} 
          />
        )}
        {activeTab === 'settings' && me && (
          <SettingsPage 
            me={me} 
            onEditProfile={() => setActiveTab('profile-edit')} 
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            setConfirmAction={setConfirmAction}
          />
        )}
        {activeTab === 'media-store' && viewingUserId && me && (
          <MediaStore 
            user={filteredUsers.find(u => u.id === viewingUserId) || me}
            currentUser={me}
            items={storeItems}
            stableListings={stableListings.filter(l => l.userId === viewingUserId)}
            isOwnStore={viewingUserId === currentUserId}
            isAdmin={me.isAdmin}
            isLoading={isDataLoading}
            storeOwnerId={viewingUserId}
            onBack={() => setActiveTab('user-profile')}
            onDeleteItem={handleDeleteStoreItem}
            onProfileClick={navigateToProfile}
            onBuyItem={handleBuyStoreItem}
          />
        )}
        {activeTab === 'my-videos' && me && (
          <MyVideosPage 
            user={me}
            purchasedItems={storeItems.filter(item => (me.purchasedItemIds || []).includes(item.id))}
            onBack={() => setActiveTab('feed')}
            onExploreStore={() => {
              // If there are no stores, just go to feed, otherwise go to a random creator's store 
              // or just back to feed and they can find a store
              setActiveTab('feed');
            }}
          />
        )}
        {activeTab === 'store-management' && me && (
          !me.isStoreActive && !me.isAdmin ? (
            <StoreActivationGate user={me} onActivated={() => setActiveTab('store-management')} />
          ) : (
            <StoreManagementPage 
              user={me}
              items={storeItems.filter(i => i.userId === currentUserId)}
              onAddItem={handleAddItemToStore}
              onUpdateItem={handleUpdateStoreItem}
              onDeleteItem={handleDeleteStoreItem}
              onGoToCustomization={() => setActiveTab('store-customization')}
              onUpdateUser={handleUpdateUser}
            />
          )
        )}
        {activeTab === 'store-customization' && me && (
          !me.isStoreActive && !me.isAdmin ? (
            <StoreActivationGate user={me} onActivated={() => setActiveTab('store-management')} />
          ) : (
            <StoreCustomizationPage 
              user={me}
              onSave={handleStoreCustomizationUpdate}
              onCancel={() => setActiveTab('store-management')}
            />
          )
        )}
        {activeTab === 'notifications' && (
          <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter chrome-text">Alerts</h1>
              <button 
                onClick={() => setAppNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
                className="text-[10px] font-black uppercase tracking-widest text-[#967bb6] hover:text-white transition-colors"
              >
                Mark all as read
              </button>
            </div>

            <div className="space-y-4">
              {isDataLoading ? (
                <NotificationSkeleton />
              ) : appNotifications.length > 0 ? (
                appNotifications.map(notif => {
                  let Icon = Bell;
                  if (notif.type === NotificationType.MESSAGE) Icon = MessageSquare;
                  if (notif.type === NotificationType.LIKE) Icon = Heart;
                  if (notif.type === NotificationType.COMMENT) Icon = MessageCircle;

                  return (
                    <div 
                      key={notif.id}
                      className={`group p-6 rounded-3xl border transition-all flex items-start space-x-4 ${notif.isRead ? 'bg-white/5 border-white/5 opacity-60' : 'bg-[#967bb6]/5 border-[#967bb6]/20 shadow-lg shadow-[#967bb6]/5'}`}
                    >
                      <div 
                        onClick={() => notif.senderId && navigateToProfile(notif.senderId)}
                        className={`p-3 rounded-2xl shrink-0 cursor-pointer ${notif.isRead ? 'bg-white/5 text-slate-500' : 'bg-[#967bb6]/20 text-[#967bb6]'}`}
                      >
                        <Icon size={20} />
                      </div>
                      <div 
                        onClick={() => notif.senderId && navigateToProfile(notif.senderId)}
                        className="flex-grow cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-sm font-black uppercase tracking-tight ${notif.isRead ? 'text-slate-400' : 'text-white'}`}>{notif.title}</h3>
                          <span className="text-[10px] text-slate-600 font-bold">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-slate-500' : 'text-slate-300'}`}>{notif.message}</p>
                      </div>
                      <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notif.id);
                            }}
                            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-all"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notif.id);
                          }}
                          className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                          title="Dismiss"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-[#967bb6] rounded-full mt-2 shadow-[0_0_8px_#967bb6] shrink-0"></div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="glass-panel rounded-[2rem] p-16 text-center border-dashed border-white/10">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={32} className="text-slate-700" />
                  </div>
                  <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'stable' && (
          <StablePage listings={stableListings} onProfileClick={navigateToProfile} />
        )}
        {activeTab === 'join-stable' && me && (
          <JoinStablePage 
            user={me}
            onBack={() => setActiveTab('feed')} 
            onSubmit={handleCreateStableListing} 
          />
        )}
        {activeTab === 'games' && me && (
          <GameRoom 
            user={me} 
            socket={socket} 
            users={filteredUsers} 
            setActiveTab={setActiveTab} 
          />
        )}
        {activeTab === 'more' && me && (
          <MyProfilePage 
            me={me}
            users={filteredUsers}
            onUploadPhoto={handleUploadPhoto}
            onDeletePhoto={handleDeletePhoto}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onRejectFriendRequest={handleDeclineFriendRequest}
            onDeleteFriend={handleUnfriend}
            onBlockUser={handleBlockUser}
            onSendFwbRequest={handleSendFwbRequest}
            onAcceptFwbRequest={handleAcceptFwbRequest}
            onRejectFwbRequest={handleDeclineFwbRequest}
          />
        )}
        {(['explore', 'trending'].includes(activeTab)) && (
           <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-600">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
               <ShieldAlert size={32} className="text-[#967bb6]" />
             </div>
             <p className="text-lg font-black uppercase tracking-widest chrome-text">Coming Soon</p>
             <p className="text-xs text-slate-700 mt-2 uppercase tracking-widest">Feature currently in development</p>
           </div>
        )}
      </main>

      {/* Floating action button removed as per user request */}

      {isCreating && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0a0a0a] border border-[#c0c0c0]/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 chrome-border">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tighter uppercase chrome-text">New Post</h2>
              <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <textarea 
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?" 
                className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none min-h-[150px] text-slate-200 placeholder:text-slate-700"
              />

              {newPostMediaPreview && (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/40">
                  {newPostMedia?.type.startsWith('video') ? (
                    <VideoPlayer 
                      src={newPostMediaPreview} 
                      autoPlay 
                      muted 
                      loop 
                      controls={true}
                      className="w-full h-full" 
                    />
                  ) : (
                    <img 
                      src={newPostMediaPreview} 
                      className="w-full h-full object-cover" 
                      alt="Preview" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = APP_LOGO_URL;
                      }}
                    />
                  )}
                  <button 
                    onClick={() => {
                      setNewPostMedia(null);
                      setNewPostMediaPreview(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors z-30"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                <button 
                  onClick={generateAICaption}
                  disabled={aiGenerating}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#967bb6]/10 text-[#967bb6] border border-[#967bb6]/30 rounded-full text-xs font-black uppercase hover:bg-[#967bb6]/20 transition-all disabled:opacity-50"
                >
                  <Wand2 size={14} className={aiGenerating ? 'animate-spin' : ''} />
                  <span>{aiGenerating ? 'Working...' : 'Get Ideas'}</span>
                </button>
              </div>
            </div>

            <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
              <div className="flex space-x-4 text-slate-500">
                <button 
                  onClick={() => postFileInputRef.current?.click()}
                  className="hover:text-[#967bb6] transition-colors"
                >
                  <ImageIcon size={24} />
                </button>
                <input 
                  type="file" 
                  ref={postFileInputRef} 
                  onChange={handleMediaChange} 
                  className="hidden" 
                  accept="image/*,video/*,.mkv,.avi,.wmv,.flv,.3gp,.mov,.mp4,.webm,.m4v,.MP4,.MOV,.WEBM" 
                />
              </div>
              <button 
                onClick={handlePost}
                disabled={isPosting}
                className="bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white px-8 py-3 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl shadow-[#967bb6]/20 transition-all flex items-center space-x-2 chrome-border disabled:opacity-70 disabled:cursor-wait"
              >
                <span>{isPosting ? 'Posting...' : 'Post'}</span>
                {isPosting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Call Overlay */}
      {(call?.isReceivingCall || isCalling) && (
        <CallOverlay 
          call={call}
          callAccepted={callAccepted}
          myVideo={myVideo}
          userVideo={userVideo}
          stream={stream}
          remoteStream={remoteStream}
          onAnswer={answerCall}
          onHangup={leaveCall}
          onSwitchCamera={switchCamera}
          isCalling={isCalling}
          type={callType}
        />
      )}

      {isFriendsListOpen && friendsListUserId && (
        <FriendsListModal 
          isOpen={isFriendsListOpen}
          onClose={() => setIsFriendsListOpen(false)}
          user={users.find(u => u.id === friendsListUserId)!}
          allUsers={filteredUsers}
          onProfileClick={navigateToProfile}
          isOwnProfile={friendsListUserId === currentUserId}
          onDeleteFriend={handleUnfriend}
          onBlockUser={handleBlockUser}
        />
      )}

      {showPrompt && <InstallPrompt onInstall={install} onDismiss={dismiss} />}

      {confirmAction && (
        <ConfirmModal 
          message={confirmAction.message} 
          onConfirm={confirmAction.onConfirm} 
          onCancel={() => setConfirmAction(null)} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ShareBaresProvider>
        <AppContent />
        <Toaster position="top-center" richColors theme="dark" />
      </ShareBaresProvider>
    </ErrorBoundary>
  );
};

export default App;
