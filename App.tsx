
import React, { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import * as PeerNamespace from 'simple-peer';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

const SimplePeer = (PeerNamespace as any).default || PeerNamespace;
import TopNav from './components/TopNav';
import FriendsListModal from './components/FriendsListModal';
import HomePage from './components/HomePage';
import ChatPage from './components/ChatPage';
import LoginPage from './components/LoginPage';
import PostCard from './components/PostCard';
import Logo from './components/Logo';
import MediaStore from './components/MediaStore';
import StoreManagementPage from './components/StoreManagementPage';
import PaymentPage from './components/PaymentPage';
import StablePage from './components/StablePage';
import JoinStablePage from './components/JoinStablePage';
import MyProfilePage from './components/MyProfilePage';
import StoreCustomizationPage from './components/StoreCustomizationPage';
import CustomProfilePage from './components/CustomProfilePage';
import GameRoom from './components/GameRoom';
import { ShareBaresProvider, useShareBares } from './components/MascotContext';
import { MOCK_USERS, MOCK_POSTS, CURRENT_USER_ID, MOCK_STORE_ITEMS, MOCK_STABLE_LISTINGS, APP_LOGO_URL } from './constants';
import { User, Post, PostVisibility, Message, StoreItem, MediaItem, AppNotification, NotificationType, StableListing, StoreCustomization, ProfileCustomization, AppComment } from './types';
import { Toaster, toast } from 'sonner';
import { 
  Plus, Image as ImageIcon, Send, X, Wand2, MessageSquare, 
  ShieldAlert, AlertCircle, Camera, Check, ArrowLeft, Star, Heart, ShieldCheck,
  Settings as SettingsIcon, Bell, Lock, User as UserIcon, Shield, 
  HelpCircle, LogOut, ChevronRight, ChevronDown, MapPin, Briefcase, Globe, Phone, Mail,
  Instagram, Twitter, ShoppingBag, Trash2, MessageCircle, Video, CreditCard,
  UserPlus, UserCheck, UserX, Users, Flame, Ban, Dices, ExternalLink, Palette, DollarSign,
  TrendingUp, RefreshCw, Sparkles, MicOff, VideoOff
} from 'lucide-react';
import { generateCaptionSuggestion, generateJadeResponse, generateJadePost, generateJadeComment } from './services/geminiService';
import { 
  auth, db, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, 
  onAuthStateChanged, loginWithGoogle, loginWithGoogleRedirect, getGoogleRedirectResult, logout as firebaseLogout, handleFirestoreError, OperationType, or,
  setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken,
  firebaseConfig
} from './firebase';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);
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

const ProfileEditPage: React.FC<{ user: User; onSave: (profile: Partial<User>) => void; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
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
  const [stripeConnectId, setStripeConnectId] = useState(user.stripeConnectId || '');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !username) return;
    onSave({
      displayName,
      username,
      bio,
      avatar,
      coverImage: cover,
      isCreator,
      location,
      occupation,
      tagline,
      email,
      phone,
      stripeConnectId,
      socials: {
        twitter,
        instagram,
        website
      }
    });
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
              referrerPolicy="no-referrer" 
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
                referrerPolicy="no-referrer" 
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

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Monetization (Stripe Connect)</label>
          <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
            <div className="flex items-center space-x-3 text-emerald-400 mb-2">
              <DollarSign size={20} />
              <h3 className="font-bold">Creator Payouts</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              To receive 80% of your store sales, enter your Stripe Connect Account ID below. Payments are split automatically by the platform.
            </p>
            <input 
              type="text" 
              value={stripeConnectId}
              onChange={(e) => setStripeConnectId(e.target.value)}
              placeholder="acct_xxxxxxxxxxxxxx"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-slate-100 font-mono text-sm"
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
            className="flex-[2] bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white py-4 rounded-2xl font-black shadow-xl shadow-[#967bb6]/20 transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98] chrome-border"
          >
            Save Changes
            <Check size={20} />
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
          referrerPolicy="no-referrer"
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
            referrerPolicy="no-referrer"
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


const ProfileCreationPage: React.FC<{ currentUserId: string; initialEmail: string; onComplete: (profile: Partial<User>) => void }> = ({ currentUserId, initialEmail, onComplete }) => {
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
  const [stripeConnectId, setStripeConnectId] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !username) return;
    onComplete({
      id: currentUserId,
      displayName,
      username,
      bio,
      avatar,
      coverImage: cover,
      isCreator,
      location,
      occupation,
      tagline,
      email,
      phone,
      stripeConnectId,
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
              onClick={() => firebaseLogout()}
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
                src={cover || undefined} 
                referrerPolicy="no-referrer" 
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
                  src={avatar || undefined} 
                  referrerPolicy="no-referrer" 
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

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Monetization (Stripe Connect)</label>
            <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
              <div className="flex items-center space-x-3 text-emerald-400 mb-2">
                <DollarSign size={20} />
                <h3 className="font-bold">Creator Payouts</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                To receive 80% of your store sales, enter your Stripe Connect Account ID below.
              </p>
              <input 
                type="text" 
                value={stripeConnectId}
                onChange={(e) => setStripeConnectId(e.target.value)}
                placeholder="acct_xxxxxxxxxxxxxx"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-slate-100 font-mono text-sm"
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
            className="w-full bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-[#967bb6]/20 transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98] chrome-border"
          >
            Save Profile
            <Check className="group-hover:translate-x-1 transition-transform" size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

const MonetizationPage: React.FC<{
  me: User;
  onRequestPayment: (type: 'store' | 'stable', isBundle?: boolean) => void;
  onGoToStoreManager: () => void;
  onTestPayment: () => void;
}> = ({ me, onRequestPayment, onGoToStoreManager, onTestPayment }) => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase chrome-text mb-2">Creator Hub</h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Manage your monetization, earnings, and store instructions</p>
      </div>

      {/* Earnings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 glass-panel rounded-[2.5rem] p-8 border-[#967bb6]/20 bg-gradient-to-br from-[#967bb6]/10 to-transparent chrome-border flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 text-[#967bb6] mb-2">
              <DollarSign size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Total Revenue</span>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter">$0.00</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-2">Available for payout: $0.00</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {me.isAdmin && (
              <button 
                onClick={onTestPayment}
                className="px-8 py-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/30 transition-all"
              >
                Test Payment Flow
              </button>
            )}
            <button 
              disabled={true}
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-500 font-black text-[10px] uppercase tracking-widest cursor-not-allowed opacity-50"
            >
              Request Payout
            </button>
            <button 
              onClick={onGoToStoreManager}
              className="px-8 py-4 rounded-2xl bg-[#967bb6] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#967bb6]/20 hover:scale-105 transition-all"
            >
              Manage Store
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.02] chrome-border flex flex-col justify-center text-center">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-emerald-500" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Account Status</h3>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
            {me.isAdmin ? 'Administrator Access' : me.hasPaidStoreFee ? 'Verified Creator' : 'Standard Account'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Store Activation */}
        <div className="glass-panel rounded-[2.5rem] p-8 border-[#967bb6]/20 flex flex-col h-full bg-[#967bb6]/5 chrome-border relative group hover:border-[#967bb6]/40 transition-all">
          <div className="mb-6">
            <div className="w-12 h-12 bg-[#967bb6]/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingBag className="text-[#967bb6]" size={24} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Store Usage</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">One-time activation fee</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-black text-white">$10.00</span>
          </div>
          <ul className="text-[10px] text-slate-400 space-y-3 mb-8 flex-grow uppercase tracking-widest font-bold">
            <li className="flex items-center space-x-2">
              <Check size={12} className="text-emerald-500" />
              <span>Unlimited Store Uploads</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check size={12} className="text-emerald-500" />
              <span>Paid Content Sales</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check size={12} className="text-emerald-500" />
              <span>Private Media Hosting</span>
            </li>
          </ul>
          <button 
            onClick={() => onRequestPayment('store')}
            disabled={me.hasPaidStoreFee}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all chrome-border ${me.hasPaidStoreFee ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : 'bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white shadow-lg shadow-[#967bb6]/20 hover:scale-105 active:scale-95'}`}
          >
            {me.hasPaidStoreFee ? 'Activated' : 'Activate Store'}
          </button>
        </div>

        {/* The Stable Listing */}
        <div className="glass-panel rounded-[2.5rem] p-8 border-[#967bb6]/20 flex flex-col h-full bg-[#967bb6]/5 chrome-border relative group hover:border-[#967bb6]/40 transition-all">
          <div className="mb-6">
            <div className="w-12 h-12 bg-[#967bb6]/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Briefcase className="text-[#967bb6]" size={24} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">The Stable</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">One-time membership fee</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-black text-white">$10.00</span>
          </div>
          <ul className="text-[10px] text-slate-400 space-y-3 mb-8 flex-grow uppercase tracking-widest font-bold">
            <li className="flex items-center space-x-2">
              <Check size={12} className="text-emerald-500" />
              <span>Professional Listing</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check size={12} className="text-emerald-500" />
              <span>Verified Status</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check size={12} className="text-emerald-500" />
              <span>Escort Services</span>
            </li>
          </ul>
          <button 
            onClick={() => onRequestPayment('stable', false)}
            disabled={me.hasPaidStableFee}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all chrome-border ${me.hasPaidStableFee ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : 'bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white shadow-lg shadow-[#967bb6]/20 hover:scale-105 active:scale-95'}`}
          >
            {me.hasPaidStableFee ? 'Activated' : 'Join The Stable'}
          </button>
        </div>

        {/* Store Bundle */}
        <div className="glass-panel rounded-[2.5rem] p-8 border-[#967bb6]/20 flex flex-col h-full bg-[#967bb6]/5 chrome-border relative group hover:border-emerald-500/40 transition-all">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20 z-10">Best Value</div>
          <div className="mb-6">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Dices className="text-emerald-500" size={24} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Store Bundle</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Escort service listing in The Stable and in your store</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-black text-white">$15.00</span>
          </div>
          <ul className="text-[10px] text-slate-400 space-y-3 mb-8 flex-grow uppercase tracking-widest font-bold">
            <li className="flex items-center space-x-2">
              <Check size={12} className="text-emerald-500" />
              <span>All Stable Features</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check size={12} className="text-emerald-500" />
              <span>double listing exposure</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check size={12} className="text-emerald-500" />
              <span>Save $5.00 Today</span>
            </li>
          </ul>
          <button 
            onClick={() => onRequestPayment('stable', true)}
            disabled={me.hasPaidStableBundle}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all chrome-border ${me.hasPaidStableBundle ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95'}`}
          >
            {me.hasPaidStableBundle ? 'Activated' : 'Get Bundle'}
          </button>
        </div>
      </div>

      {/* Stripe Connect Section */}
      <div className="mt-16 pt-16 border-t border-white/5">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
            <CreditCard className="text-emerald-500" size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Stripe Connect</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Connect your bank account to receive payouts</p>
          </div>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.01] chrome-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <p className="text-slate-400 text-xs leading-relaxed uppercase font-bold tracking-wide mb-4">
                To receive your 80% share of sales, you must provide your Stripe Connect Account ID. This allows us to transfer funds directly to your bank account.
              </p>
              <div className="flex items-center space-x-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck size={14} />
                <span>Secure direct transfers</span>
              </div>
            </div>
            
            <div className="w-full md:w-auto flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stripe Account ID</label>
                <input 
                  type="text"
                  placeholder="acct_..."
                  value={me.stripeConnectId || ''}
                  readOnly
                  className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none w-full md:w-64 chrome-border opacity-70"
                />
              </div>
              <p className="text-[9px] text-slate-600 uppercase font-bold text-center">Update this in your profile settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Paid Guide Section */}
      <div className="mt-16 pt-16 border-t border-white/5">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-[#967bb6]/20 rounded-2xl flex items-center justify-center">
            <HelpCircle className="text-[#967bb6]" size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">How to Get Paid</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Complete guide to content selling & payouts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.01] chrome-border">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center">
              <span className="w-6 h-6 rounded-full bg-[#967bb6] text-white flex items-center justify-center text-[10px] mr-3">1</span>
              Set Up Your Stripe Account
            </h3>
            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-bold">
                We use Stripe to handle all financial transactions securely. To get paid, you must have a Stripe account.
              </p>
              <ol className="space-y-3 text-[10px] text-slate-300 uppercase font-bold tracking-wide list-decimal ml-4">
                <li>Go to <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-[#967bb6] hover:underline">Stripe.com</a> and sign up for a free account.</li>
                <li>Complete your business profile and link your bank account for direct deposits.</li>
                <li>In your Stripe Dashboard, go to <strong>Settings &gt; Account Details</strong>.</li>
                <li>Find your <strong>Account ID</strong> (it starts with <code className="text-[#967bb6]">acct_</code>).</li>
              </ol>
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.01] chrome-border">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center">
              <span className="w-6 h-6 rounded-full bg-[#967bb6] text-white flex items-center justify-center text-[10px] mr-3">2</span>
              Link Account to ShareBares
            </h3>
            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-bold">
                Once you have your Account ID, you need to tell us where to send your money.
              </p>
              <ol className="space-y-3 text-[10px] text-slate-300 uppercase font-bold tracking-wide list-decimal ml-4">
                <li>Go to your <strong>Profile Settings</strong> on ShareBares.</li>
                <li>Find the <strong>Stripe Account ID</strong> field in the Creator section.</li>
                <li>Paste your <code className="text-[#967bb6]">acct_...</code> ID and click <strong>Save Changes</strong>.</li>
                <li>Your account is now linked! You will see it reflected on this page.</li>
              </ol>
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.01] chrome-border">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center">
              <span className="w-6 h-6 rounded-full bg-[#967bb6] text-white flex items-center justify-center text-[10px] mr-3">3</span>
              Start Selling Content
            </h3>
            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-bold">
                Now you're ready to monetize your presence.
              </p>
              <ol className="space-y-3 text-[10px] text-slate-300 uppercase font-bold tracking-wide list-decimal ml-4">
                <li>Activate your store by paying the one-time $10 fee.</li>
                <li>Use the <strong>Store Manager</strong> to upload photos or videos.</li>
                <li>Set a price for each item. We recommend high-quality content.</li>
                <li>Fans can now purchase your items directly from your profile.</li>
              </ol>
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.01] chrome-border">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center">
              <span className="w-6 h-6 rounded-full bg-[#967bb6] text-white flex items-center justify-center text-[10px] mr-3">4</span>
              Automatic Payouts
            </h3>
            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-bold">
                Getting paid is simple and automatic.
              </p>
              <ul className="space-y-3 text-[10px] text-slate-300 uppercase font-bold tracking-wide list-disc ml-4">
                <li>You keep <strong>80%</strong> of every sale you make.</li>
                <li>The remaining 20% covers platform fees and processing.</li>
                <li>Funds are transferred directly to your Stripe account.</li>
                <li>Stripe handles the final payout to your bank account.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sales History Section */}
      <div className="mt-16 pt-16 border-t border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#967bb6]/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="text-[#967bb6]" size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Sales History</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Track your recent content sales</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[2.5rem] border-white/10 bg-white/[0.01] overflow-hidden chrome-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#967bb6]">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#967bb6]">Item</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#967bb6]">Buyer</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#967bb6]">Amount</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#967bb6]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                      <ShoppingBag size={48} className="text-slate-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">No sales recorded yet</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Creator Instructions Section */}
      <div className="mt-16 pt-16 border-t border-white/5">
        <div className="flex items-center space-x-4 mb-12">
          <div className="w-12 h-12 bg-[#967bb6]/20 rounded-2xl flex items-center justify-center">
            <Sparkles className="text-[#967bb6]" size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Creator Guide</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Everything you need to know about selling on ShareBares</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#967bb6] font-black text-sm">01</div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tight mb-2">Activate Your Store</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed uppercase font-bold tracking-wide">
                  Pay the one-time activation fee of $10.00 to unlock your personal media store. This fee covers hosting and platform maintenance for your exclusive content.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#967bb6] font-black text-sm">02</div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tight mb-2">Upload High-Res Media</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed uppercase font-bold tracking-wide">
                  Use the Store Manager to upload pictures and videos. Videos are limited to 8 minutes. We recommend high-resolution content to ensure fan satisfaction.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#967bb6] font-black text-sm">03</div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tight mb-2">Set Your Prices</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed uppercase font-bold tracking-wide">
                  You have full control over your pricing. Whether it's a $5.00 quick clip or a $50.00 exclusive set, you decide what your content is worth.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#967bb6] font-black text-sm">04</div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tight mb-2">Revenue Split (80/20)</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed uppercase font-bold tracking-wide">
                  Creators keep 80% of all sales. ShareBares retains 20% to cover processing fees, security, and platform development.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#967bb6] font-black text-sm">05</div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tight mb-2">Payouts & Security</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed uppercase font-bold tracking-wide">
                  Earnings are tracked in real-time. Payouts can be requested once your balance reaches $50.00. All transactions are secured via Stripe.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#967bb6]/20 border border-[#967bb6]/30 flex items-center justify-center text-[#967bb6] font-black text-sm">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tight mb-2">Creator Pro Tips</h4>
                <ul className="space-y-2">
                  <li className="text-slate-400 text-[10px] leading-relaxed uppercase font-bold tracking-wide flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#967bb6] rounded-full" />
                    Bundle content into "Stable" collections for higher conversion.
                  </li>
                  <li className="text-slate-400 text-[10px] leading-relaxed uppercase font-bold tracking-wide flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#967bb6] rounded-full" />
                    Use high-quality thumbnails to increase click-through rates.
                  </li>
                  <li className="text-slate-400 text-[10px] leading-relaxed uppercase font-bold tracking-wide flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#967bb6] rounded-full" />
                    Promote your store in your bio and posts to drive traffic.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center justify-center space-y-4 text-slate-600">
        <div className="flex items-center space-x-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
          <ShieldCheck className="text-[#967bb6]" size={18} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">All payments processed securely via Stripe</p>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 max-w-md text-center leading-relaxed">
          Fees are one-time only and non-refundable. Your features will be unlocked immediately after successful payment confirmation.
        </p>
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
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isFirestoreOnline, setIsFirestoreOnline] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [hasCreatedProfile, setHasCreatedProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const { showMascot } = useShareBares();

  const [profileTab, setProfileTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stableListings, setStableListings] = useState<StableListing[]>([]);
  const [comments, setComments] = useState<AppComment[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<PostVisibility>(PostVisibility.PUBLIC);
  const [newPostMedia, setNewPostMedia] = useState<File | null>(null);
  const [newPostMediaPreview, setNewPostMediaPreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentType, setPaymentType] = useState<'store' | 'stable' | 'item'>('store');
  const [stableBundleSelected, setStableBundleSelected] = useState(false);
  const [pendingStableListing, setPendingStableListing] = useState<Omit<StableListing, 'id' | 'createdAt' | 'userId'> | null>(null);
  const [pendingStoreItem, setPendingStoreItem] = useState<StoreItem | null>(null);
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
    if (!currentUserId || !auth.currentUser) return;
    
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
  const isAdminUser = meRaw?.isAdmin || meRaw?.email === 'jtothek319@gmail.com' || meRaw?.username === 'jameson319' || currentUserId === 'admin-jtothek319';
  const me = meRaw ? { 
    ...meRaw, 
    isAdmin: isAdminUser,
    isCreator: isAdminUser ? true : (meRaw.isCreator || false),
    hasPaidStoreFee: isAdminUser ? true : (meRaw.hasPaidStoreFee || false),
    hasPaidStableFee: isAdminUser ? true : (meRaw.hasPaidStableFee || false),
    hasPaidStableBundle: isAdminUser ? true : (meRaw.hasPaidStableBundle || false),
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
    purchasedItemIds: meRaw.purchasedItemIds || [],
    settings: meRaw.settings || MOCK_USERS[0].settings
  } : MOCK_USERS[0];

  const currentProfileCustomization = (activeTab === 'profile' || activeTab === 'custom-profile') 
    ? me.profileCustomization 
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [currentMessageInput, setCurrentMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedUserIdRef = useRef<string | null>(null);

  const [useFrontCamera, setUseFrontCamera] = useState(true);

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
        const { getDocFromServer, doc } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'test', 'connection'));
        setIsFirestoreOnline(true);
      } catch (error: any) {
        const errMessage = error.message || String(error);
        if (errMessage.includes('the client is offline') || errMessage.includes('unavailable') || errMessage.includes('network')) {
          setIsFirestoreOnline(false);
          console.error("Firestore connection failed: The client is offline or the backend is unreachable.");
        }
      }
    };
    testConnection();
    const interval = setInterval(testConnection, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPersistence(auth, browserSessionPersistence).catch(err => console.error('Failed to set persistence:', err));

    // Handle redirect result
    getGoogleRedirectResult().then((result) => {
      if (result?.user) {
        console.log('Redirect login successful:', result.user.email);
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
          
          // Check if user profile exists in Firestore
          setIsProfileLoading(true);
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              setHasCreatedProfile(true);
              const userData = userDoc.data() as User;
              // Ensure admin flag and privileges are set for the admin user
              if ((user.email === 'jtothek319@gmail.com' || userData.username === 'jameson319') && (!userData.isAdmin || !userData.isCreator)) {
                console.log('Restoring admin privileges for:', user.email);
                const adminUpdates = {
                  isAdmin: true,
                  isCreator: true,
                  hasPaidStoreFee: true,
                  hasPaidStableFee: true,
                  hasPaidStableBundle: true
                };
                Object.assign(userData, adminUpdates);
                await updateDoc(doc(db, 'users', user.uid), adminUpdates);
              }
              // Sync public profile
              const profileData = {
                id: userData.id,
                username: userData.username,
                displayName: userData.displayName,
                avatar: userData.avatar || null,
                coverImage: userData.coverImage || null,
                bio: userData.bio || null,
                isCreator: userData.isCreator || false,
                subscribersCount: userData.subscribersCount || 0,
                followingCount: userData.followingCount || 0
              };
              await setDoc(doc(db, 'profiles', user.uid), profileData);
            } else {
              setHasCreatedProfile(false);
              // Create default profile if completely missing and not seeding
            }
          } catch (profileError) {
            console.error('Error checking/creating user profile:', profileError);
            setHasCreatedProfile(false);
          } finally {
            setIsProfileLoading(false);
            setIsLoggedIn(true);
          }

          // Seed other mock data if database is empty (non-blocking)
          // Only for the technical administrator to prevent permission errors for others
          const seedData = async () => {
            if (user.email !== 'jtothek319@gmail.com') return;
            try {
              // Ensure Jade exists
              try {
                const jadeDoc = await getDoc(doc(db, 'users', 'ai-jade'));
                if (!jadeDoc.exists()) {
                  const jadeUser = MOCK_USERS.find(u => u.id === 'ai-jade')!;
                  await setDoc(doc(db, 'users', 'ai-jade'), { ...jadeUser, likedPostIds: [] });
                }
              } catch (jadeErr) {
                console.warn('Could not ensure Jade exists:', jadeErr);
              }

              const usersSnap = await getDocs(query(collection(db, 'users'), limit(5)));
              if (usersSnap.size <= 2) {
                for (const mUser of MOCK_USERS) {
                  if (mUser.id !== 'ai-jade' && mUser.email !== user.email) {
                    try {
                      await setDoc(doc(db, 'users', mUser.id), { ...mUser, likedPostIds: [] });
                    } catch (e) {}
                  }
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

              const storeSnap = await getDocs(query(collection(db, 'storeItems'), limit(1)));
              if (storeSnap.empty) {
                for (const item of MOCK_STORE_ITEMS) {
                  try {
                    await setDoc(doc(db, 'storeItems', item.id), item);
                  } catch (e) {}
                }
              }

              const stableSnap = await getDocs(query(collection(db, 'stableListings'), limit(1)));
              if (stableSnap.empty) {
                for (const listing of MOCK_STABLE_LISTINGS) {
                  try {
                    await setDoc(doc(db, 'stableListings', listing.id), listing);
                  } catch (e) {}
                }
              }
            } catch (err) {
              console.error('Seeding failed:', err);
            }
          };
          seedData();
        } else {
          setIsLoggedIn(false);
          setCurrentUserId('');
          setHasCreatedProfile(false);
          setIsProfileLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsAuthReady(true);
      }
    });

    // Fallback: Ensure isAuthReady becomes true if onAuthStateChanged is slow
    const authTimeout = setTimeout(() => {
      console.log('Auth check timed out, forcing isAuthReady to true');
      setIsAuthReady(true);
    }, 5000);

    return () => {
      unsubscribeAuth();
      clearTimeout(authTimeout);
    };
  }, []);

  // Real-time Listeners
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) {
      setUsers([]);
      setPosts([]);
      setStoreItems([]);
      setStableListings([]);
      setComments([]);
      return;
    }

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const updatedUsers = snapshot.docs.map(doc => doc.data() as User);
      setUsers(updatedUsers);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc')), (snapshot) => {
      const updatedPosts = snapshot.docs.map(doc => doc.data() as Post);
      setPosts(updatedPosts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'posts'));

    const unsubStoreItems = onSnapshot(collection(db, 'storeItems'), (snapshot) => {
      const updatedItems = snapshot.docs.map(doc => doc.data() as StoreItem);
      setStoreItems(updatedItems);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'storeItems'));

    const unsubStableListings = onSnapshot(collection(db, 'stableListings'), (snapshot) => {
      const updatedListings = snapshot.docs.map(doc => doc.data() as StableListing);
      setStableListings(updatedListings);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stableListings'));

    const unsubComments = onSnapshot(collection(db, 'comments'), (snapshot) => {
      const updatedComments = snapshot.docs.map(doc => doc.data() as AppComment);
      setComments(updatedComments);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'comments'));

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
    if (!currentUserId || !auth.currentUser) return;

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
    if (!currentUserId || !auth.currentUser) {
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
    if (!isLoggedIn || !auth.currentUser) return;

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
        toast.success('Welcome back!', { id: toastId });
        setActiveTab('feed');
        return;
      } catch (authError: any) {
        console.log('Standard auth failed:', authError.code);
        
        // 2. If standard auth fails because provider is disabled, and it's the admin, try custom flow
        if (authError.code === 'auth/operation-not-allowed' && loginEmail === 'jtothek319@gmail.com') {
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
        if (isInvalidCredential && loginEmail === 'jtothek319@gmail.com' && trimmedPassword === '#Caleb918') {
          console.log('Admin user not found, attempting auto-registration...');
          try {
            await createUserWithEmailAndPassword(auth, loginEmail, trimmedPassword);
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
          toast.success('Account created successfully!', { id: toastId });
        }
      } else {
        await handleSocialLogin('google');
      }
      setActiveTab('profile-edit');
    } catch (error: any) {
      console.error('Registration failed:', error);
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
      await firebaseLogout();
      setIsLoggedIn(false);
      setCurrentUserId('');
      setActiveTab('feed');
      setViewingUserId(null);
      setShowSplash(true);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  const handleProfileUpdate = async (profileData: Partial<User>) => {
    try {
      await setDoc(doc(db, 'users', currentUserId), profileData, { merge: true });
      if (!hasCreatedProfile) setHasCreatedProfile(true);
      setActiveTab('feed');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
    }
  };

  const handleUpdateUser = async (profileData: Partial<User>) => {
    try {
      await setDoc(doc(db, 'users', currentUserId), profileData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('payment_success');
    if (success && currentUserId) {
      if (success === 'store') {
        handleUpdateUser({ hasPaidStoreFee: true });
        setActiveTab('store-management');
        setIsPaying(false);
        addNotification(
          NotificationType.PURCHASE,
          'Store Activated!',
          'Your one-time store fee has been processed. You can now upload paid content.',
        );
      } else if (success === 'stable') {
        handleUpdateUser({ hasPaidStableFee: true });
        setActiveTab('join-stable');
        setIsPaying(false);
        addNotification(
          NotificationType.PURCHASE,
          'Stable Activated!',
          'You now have unlimited access to The Stable.',
        );
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUserId, handleUpdateUser]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPostMedia(file);
      const url = URL.createObjectURL(file);
      setNewPostMediaPreview(url);
    }
  };

  const handlePost = async () => {
    if (!newPostContent.trim() && !newPostMedia) return;
    
    setIsCreating(true);
    let mediaUrl = undefined;
    
    if (newPostMedia) {
      const formData = new FormData();
      formData.append('file', newPostMedia);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          mediaUrl = data.url;
        } else {
          toast.error('Failed to upload media. Please try again.');
          setIsCreating(false);
          return;
        }
      } catch (err) {
        console.error('Failed to upload media:', err);
        toast.error('Error uploading media.');
        setIsCreating(false);
        return;
      }
    }
    
    const postId = `post-${Date.now()}`;
    const newPost: Post = {
      id: postId,
      userId: currentUserId,
      content: newPostContent,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      commentsCount: 0,
      visibility: newPostVisibility,
      mediaUrl: mediaUrl,
      mediaType: mediaUrl ? (
        (newPostMedia?.type.startsWith('video') || 
         mediaUrl.match(/\.(mp4|mov|webm|ogg|m4v|avi)$/i) || 
         mediaUrl.includes('video') ||
         mediaUrl.startsWith('blob:') ||
         mediaUrl.startsWith('data:video/')) ? 'video' : 'image'
      ) : undefined,
    };
    
    try {
      await setDoc(doc(db, 'posts', postId), newPost);
      setNewPostContent('');
      setNewPostVisibility(PostVisibility.PUBLIC);
      setNewPostMedia(null);
      setNewPostMediaPreview(null);
      setIsCreating(false);
      toast.success('Post created successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `posts/${postId}`);
      setIsCreating(false);
      toast.error('Failed to create post. Please try again.');
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
          'New Fan!',
          `${me.displayName} joined your Fan Club!`,
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
    if (me.isAdmin || me.id === item.userId || (me.purchasedItemIds && me.purchasedItemIds.includes(item.id))) {
      // Already owned or admin
      return;
    }
    setPendingStoreItem(item);
    setPaymentType('item');
    setIsPaying(true);
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

    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        pendingFriendRequestsReceived: me.pendingFriendRequestsReceived.filter(id => id !== targetUserId),
        friendIds: [...me.friendIds, targetUserId]
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        pendingFriendRequestsSent: targetUser.pendingFriendRequestsSent.filter(id => id !== currentUserId),
        friendIds: [...targetUser.friendIds, currentUserId]
      });

      addNotification(
        NotificationType.FRIEND_REQUEST,
        'Friend Request Accepted',
        `${me.displayName || 'Someone'} accepted your friend request!`,
        { senderId: currentUserId, userId: targetUserId }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  const handleDeclineFriendRequest = async (targetUserId: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        pendingFriendRequestsReceived: me.pendingFriendRequestsReceived.filter(id => id !== targetUserId)
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        pendingFriendRequestsSent: targetUser.pendingFriendRequestsSent.filter(id => id !== currentUserId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
    }
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
      const updates = { 
        blockedUserIds: [...me.blockedUserIds, targetUserId],
        friendIds: me.friendIds.filter(id => id !== targetUserId),
        fwbIds: me.fwbIds.filter(id => id !== targetUserId)
      };
      await updateDoc(doc(db, 'users', currentUserId), updates);
      addNotification(NotificationType.FOLLOW, 'User Blocked', 'You will no longer see content from this user.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
    }
  };

  const handleUnblockUser = async (targetUserId: string) => {
    try {
      const updates = { 
        blockedUserIds: me.blockedUserIds.filter(id => id !== targetUserId)
      };
      await updateDoc(doc(db, 'users', currentUserId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      const photoId = `photo-${Date.now()}`;
      const newPhoto: MediaItem = {
        id: photoId,
        url: data.url,
        type: 'image',
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

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await updateDoc(doc(db, 'users', currentUserId), { photos: me.photos.filter(p => p.id !== photoId) });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
    }
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
    try {
      await deleteDoc(doc(db, 'storeItems', itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `storeItems/${itemId}`);
    }
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
    const uploadToastId = toast.loading('Uploading media to store...');
    try {
      const mediaUrls: string[] = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          mediaUrls.push(data.url);
        } else {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed with status ${res.status}`);
        }
      }

      if (mediaUrls.length === 0) {
        throw new Error('No files were successfully uploaded.');
      }

      const itemId = `si-${Date.now()}`;
      const newItem: StoreItem = {
        id: itemId,
        userId: currentUserId,
        ...itemData,
        thumbnailUrl: mediaUrls[0], // Use first uploaded item as thumb
        mediaUrls: mediaUrls,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'storeItems', itemId), newItem);
      
      const newMediaItems: MediaItem[] = mediaUrls.map((url, index) => ({
        id: `${itemId}-${index}`,
        url,
        type: itemData.type === 'video' ? 'video' : 'image',
        createdAt: new Date().toISOString(),
        isNSFW: true
      }));
      
      const updatedStoreUploads = [...(me.storeUploads || []), ...newMediaItems];
      await updateDoc(doc(db, 'users', currentUserId), { 
        storeUploads: updatedStoreUploads,
        hasPaidStoreFee: true // Just to be sure
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

  const handleCreateStableListing = async (listingData: Omit<StableListing, 'id' | 'createdAt' | 'userId'>, postToStore: boolean, photoFiles: File[]) => {
    if (!me.hasPaidStableFee && !me.isAdmin) {
      setPendingStableListing(listingData);
      setStableBundleSelected(postToStore);
      setPaymentType('stable');
      setIsPaying(true);
      return;
    }

    try {
      const uploadedPhotos: string[] = [];
      
      for (const file of photoFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedPhotos.push(data.url);
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
      
      await setDoc(doc(db, 'stableListings', listingId), newListing);

      if (postToStore) {
        const itemId = `si-stable-${Date.now()}`;
        const newStoreItem: StoreItem = {
          id: itemId,
          userId: currentUserId,
          title: `${listingData.providerName} - Stable Listing`,
          description: listingData.services,
          price: parseFloat(listingData.pricing.replace(/[^0-9.]/g, '')) || 0,
          thumbnailUrl: newListing.avatarUrl,
          mediaUrls: newListing.photos,
          type: 'other',
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

  const handlePaymentSuccess = async () => {
    setIsPaying(false);
    
    try {
      let updates: Partial<User> = {};
      let successMessage = '';
      
      if (paymentType === 'store') {
        updates = { hasPaidStoreFee: true };
        successMessage = 'Your store has been activated! You can now upload items.';
        setActiveTab('store-management');
      } else if (paymentType === 'stable') {
        const isBundle = stableBundleSelected;
        updates = { 
          hasPaidStableFee: true, 
          hasPaidStableBundle: isBundle || (me.hasPaidStableBundle || false)
        };
        
        if (pendingStableListing) {
          const listingId = `sl-${Date.now()}`;
          const newListing: StableListing = {
            id: listingId,
            userId: currentUserId,
            ...pendingStableListing,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'stableListings', listingId), newListing);

          if (isBundle) {
            const itemId = `si-stable-${Date.now()}`;
            const newStoreItem: StoreItem = {
              id: itemId,
              userId: currentUserId,
              title: `${pendingStableListing.providerName} - Stable Listing`,
              description: pendingStableListing.services,
              price: parseFloat(pendingStableListing.pricing.replace(/[^0-9.]/g, '')) || 0,
              thumbnailUrl: pendingStableListing.avatarUrl || pendingStableListing.photos?.[0] || '',
              mediaUrls: pendingStableListing.photos || [pendingStableListing.avatarUrl || ''],
              type: 'other',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'storeItems', itemId), newStoreItem);
          }
          setActiveTab('stable');
        } else {
          setActiveTab('join-stable');
        }
        
        successMessage = isBundle 
          ? 'Your Store Bundle has been processed. Your listing is live in the feed and your store.'
          : 'Your one-time stable fee has been processed. Your listing is now live.';
      } else if (paymentType === 'item' && pendingStoreItem) {
        const currentPurchased = me.purchasedItemIds || [];
        updates = { 
          purchasedItemIds: [...currentPurchased, pendingStoreItem.id] 
        };
      
        // Notify seller
        const sellerId = pendingStoreItem.userId;
        const msgId = `msg-notif-${Date.now()}`;
        const notification: AppNotification = {
          id: msgId,
          userId: sellerId,
          type: NotificationType.PURCHASE,
          title: 'New Sale!',
          message: `${me.displayName || 'Someone'} purchased "${pendingStoreItem.title}" from your store for $${pendingStoreItem.price}`,
          timestamp: new Date().toISOString(),
          isRead: false,
          storeItemId: pendingStoreItem.id
        };
        await setDoc(doc(db, 'notifications', msgId), notification);
        
        successMessage = `You have successfully purchased ${pendingStoreItem.title}`;
      }
      setPendingStoreItem(null);
      setIsPaying(false);

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'users', currentUserId), updates);
      }

      addNotification(
        NotificationType.SYSTEM,
        'Payment Successful!',
        successMessage
      );
      
      setPendingStableListing(null);
      setPendingStoreItem(null);
      setStableBundleSelected(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
    }
  };

  const generateAICaption = async () => {
    setAiGenerating(true);
    const suggestion = await generateCaptionSuggestion(newPostContent || "post ideas");
    setNewPostContent(suggestion);
    setAiGenerating(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedUserId) return;
    
    const messageId = `msg-${Date.now()}`;
    const newMessage: Message = {
      id: messageId,
      senderId: currentUserId,
      receiverId: selectedUserId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    };

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
          await setDoc(doc(db, 'messages', jadeMsgId), jadeMsg);
        }, 2000 + Math.random() * 3000);
      }
    } catch (error) {
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
      users={users}
      posts={posts}
      comments={comments}
      searchQuery={searchQuery}
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
      users={users}
      chatMessages={chatMessages}
      selectedUserId={selectedUserId}
      notifications={appNotifications
        .filter(n => n.type === NotificationType.MESSAGE && !n.isRead)
        .map(n => n.senderId!)
      }
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
          <audio src={custom.themeSongUrl} autoPlay loop />
        )}
        <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8">
      {/* Header Section: Cover & Avatar Integration */}
      <div className="relative mb-24">
        <div className="h-[350px] md:h-[450px] rounded-[3rem] overflow-hidden border border-white/10 relative group shadow-2xl">
          <img 
            src={user.coverImage || undefined} 
            referrerPolicy="no-referrer" 
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
                  referrerPolicy="no-referrer" 
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
                  {me.fwbIds.includes(user.id) && (
                    <div className="flex items-center space-x-1 border border-[#967bb6]/40 px-3 py-1 rounded-xl shadow-[0_0_20px_rgba(150,123,182,0.3)] bg-[#967bb6]/10 text-[#967bb6]" title="Private FWB Partner">
                      <Flame size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">FWB Partner: {me.id === user.id ? 'Private List' : me.displayName}</span>
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
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1">Fans</p>
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
                <span>{(user.fanIds || []).includes(currentUserId) ? 'In Fan Club' : 'Join Fan Club'}</span>
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
              {me.friendIds.includes(user.id) ? (
                <button 
                  onClick={() => handleUnfriend(user.id)}
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border flex items-center space-x-2"
                  style={profileButtonStyle}
                >
                  <UserCheck size={18} />
                  <span>Friends</span>
                </button>
              ) : me.pendingFriendRequestsSent.includes(user.id) ? (
                <button 
                  onClick={() => handleDeclineFriendRequest(user.id)}
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest backdrop-blur-sm transition-all border flex items-center space-x-2"
                  style={profileButtonStyle}
                >
                  <UserPlus size={18} />
                  <span>Request Sent</span>
                </button>
              ) : me.pendingFriendRequestsReceived.includes(user.id) ? (
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
              {me.fwbIds.includes(user.id) ? (
                <button 
                  onClick={() => handleUnfwb(user.id)}
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border flex items-center space-x-2"
                  style={profileButtonStyle}
                >
                  <Flame size={18} />
                  <span>FWB</span>
                </button>
              ) : me.pendingFwbRequestsSent.includes(user.id) ? (
                <button 
                  className="px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest backdrop-blur-sm transition-all border flex items-center space-x-2 cursor-not-allowed"
                  style={profileButtonStyle}
                >
                  <Flame size={18} />
                  <span>FWB Sent</span>
                </button>
              ) : me.pendingFwbRequestsReceived.includes(user.id) ? (
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
          {me.isAdmin && !isOwnProfile && (
            <button 
              onClick={() => handleBanUser(user.id)}
              className="p-3.5 rounded-2xl shadow-lg transition-all chrome-border"
              style={profileButtonStyle}
              title="Ban User (Admin Only)"
            >
              <Ban size={18} />
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
                      comments={comments}
                      users={users}
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
                      <img 
                        src={photo.url} 
                        referrerPolicy="no-referrer" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt="" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = APP_LOGO_URL;
                        }}
                      />
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

  if (showSplash || !isAuthReady) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <SplashScreen onComplete={handleSplashComplete} />
    </motion.div>
  );

  if (!isLoggedIn) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <LoginPage 
        onLogin={handleLogin} 
        onRegister={handleRegister}
        onSocialLogin={handleSocialLogin}
      />
    </motion.div>
  );

  if (isProfileLoading) return (
    <SplashScreen onComplete={handleSplashComplete} />
  );

  if (!hasCreatedProfile) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ProfileCreationPage 
        currentUserId={currentUserId}
        initialEmail={auth.currentUser?.email || ''} 
        onComplete={handleProfileUpdate} 
      />
    </motion.div>
  );

  if (isPaying) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <PaymentPage 
        amount={
          isNaN(paymentType === 'store' ? 10.00 : 
          paymentType === 'stable' ? (stableBundleSelected ? 15.00 : 10.00) :
          (pendingStoreItem?.price || 0)) ? 0 :
          (paymentType === 'store' ? 10.00 : 
          paymentType === 'stable' ? (stableBundleSelected ? 15.00 : 10.00) :
          (pendingStoreItem?.price || 0))
        } 
        itemName={
          paymentType === 'store' ? "One-Time Store Activation Fee" : 
          paymentType === 'stable' ? (stableBundleSelected ? "Stable Store Bundle Fee" : "One-Time Stable Access Fee") :
          (pendingStoreItem?.title || "Store Item")
        } 
        destinationAccountId={
          paymentType === 'item' && pendingStoreItem 
            ? users.find(u => u.id === pendingStoreItem.userId)?.stripeConnectId 
            : undefined
        }
        paymentLink={
          paymentType === 'store' 
            ? "https://buy.stripe.com/aFaaEXby27yzbPH28i8k800" 
            : paymentType === 'stable'
              ? (stableBundleSelected 
                  ? "https://buy.stripe.com/4gM7sL9pUf116vnfZ88k802" 
                  : "https://buy.stripe.com/00w6oH45A3ij6vn4gq8k801")
              : undefined
        }
        successTitle={
          paymentType === 'store' ? "Store Activated" : 
          paymentType === 'stable' ? "The Stable Activated" :
          "Item Unlocked"
        }
        successMessage={
          paymentType === 'store' ? "Your store has been activated" : 
          paymentType === 'stable' ? (stableBundleSelected ? "Your Store Bundle is now active" : "You now have unlimited access to The Stable") :
          `You have successfully purchased ${pendingStoreItem?.title}`
        }
        onSuccess={handlePaymentSuccess}
        onCancel={() => {
          setIsPaying(false);
          setPendingStableListing(null);
          setPendingStoreItem(null);
          setStableBundleSelected(false);
        }}
      />
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black text-slate-300">
      {/* Offline Banner */}
      {!isFirestoreOnline && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1 px-4 text-center animate-pulse sticky top-0 z-[100] flex items-center justify-center gap-4">
          <span>Firestore is offline. Some features may be unavailable.</span>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-red-600 px-2 py-0.5 rounded font-black hover:bg-slate-100 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      <TopNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userAvatar={me.avatar} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCreate={() => setIsCreating(true)}
        users={users}
        storeItems={storeItems}
        stableListings={stableListings}
        navigateToProfile={navigateToProfile}
        navigateToStore={navigateToStore}
        currentUserId={currentUserId}
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
        {activeTab === 'profile' && renderProfile(me, true)}
        {activeTab === 'user-profile' && viewingUserId && (
          renderProfile(users.find(u => u.id === viewingUserId), (viewingUserId === currentUserId) && !isViewingAsPublic)
        )}
        {activeTab === 'profile-edit' && (
          <ProfileEditPage 
            user={me} 
            onSave={handleProfileUpdate} 
            onCancel={() => setActiveTab('profile')} 
          />
        )}
        {activeTab === 'custom-profile' && (
          <CustomProfilePage 
            user={me} 
            onSave={(customization) => {
              handleUpdateUser({ profileCustomization: customization });
              setActiveTab('profile');
            }} 
            onBack={() => setActiveTab('profile')} 
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPage 
            me={me} 
            onEditProfile={() => setActiveTab('profile-edit')} 
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            setConfirmAction={setConfirmAction}
          />
        )}
        {activeTab === 'media-store' && viewingUserId && (
          <MediaStore 
            user={users.find(u => u.id === viewingUserId) || me}
            items={storeItems}
            stableListings={stableListings.filter(l => l.userId === viewingUserId)}
            isOwnStore={viewingUserId === currentUserId}
            isAdmin={me.isAdmin}
            purchasedItemIds={me.purchasedItemIds || []}
            storeOwnerId={viewingUserId}
            onBack={() => setActiveTab('user-profile')}
            onPurchase={handlePurchaseItem}
            onDeleteItem={handleDeleteStoreItem}
            onAddItem={handleAddItemToStore}
            onProfileClick={navigateToProfile}
          />
        )}
        {activeTab === 'store-management' && (
          <StoreManagementPage 
            user={me}
            items={storeItems.filter(i => i.userId === currentUserId)}
            onAddItem={handleAddItemToStore}
            onUpdateItem={handleUpdateStoreItem}
            onDeleteItem={handleDeleteStoreItem}
            onGoToMonetization={() => setActiveTab('monetization')}
            onGoToCustomization={() => setActiveTab('store-customization')}
          />
        )}
        {activeTab === 'store-customization' && (
          <StoreCustomizationPage 
            user={me}
            onSave={handleStoreCustomizationUpdate}
            onCancel={() => setActiveTab('store-management')}
          />
        )}
        {activeTab === 'monetization' && (
          <MonetizationPage 
            me={me} 
            onRequestPayment={(type, isBundle) => {
              setPaymentType(type);
              if (type === 'stable') setStableBundleSelected(!!isBundle);
              setIsPaying(true);
            }}
            onGoToStoreManager={() => setActiveTab('store-management')}
            onTestPayment={() => {
              setPaymentType('store');
              handlePaymentSuccess();
            }}
          />
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
              {appNotifications.length > 0 ? (
                appNotifications.map(notif => {
                  let Icon = Bell;
                  if (notif.type === NotificationType.MESSAGE) Icon = MessageSquare;
                  if (notif.type === NotificationType.PURCHASE) Icon = ShoppingBag;
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
        {activeTab === 'join-stable' && (
          <JoinStablePage 
            onBack={() => setActiveTab('feed')} 
            onGoToMonetization={() => setActiveTab('monetization')}
            onSubmit={handleCreateStableListing} 
            hasPaidStableFee={me.hasPaidStableFee || me.isAdmin}
          />
        )}
        {activeTab === 'games' && (
          <GameRoom 
            user={me} 
            socket={socket} 
            users={users} 
            setActiveTab={setActiveTab} 
          />
        )}
        {activeTab === 'more' && (
          <MyProfilePage 
            me={me}
            users={users}
            onUploadPhoto={handleUploadPhoto}
            onDeletePhoto={handleDeletePhoto}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onRejectFriendRequest={handleDeclineFriendRequest}
            onDeleteFriend={handleUnfriend}
            onBlockUser={handleBlockUser}
            onSendFwbRequest={handleSendFwbRequest}
            onAcceptFwbRequest={handleAcceptFwbRequest}
            onRejectFwbRequest={handleDeclineFwbRequest}
            onUnblockUser={handleUnblockUser}
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
                    <video src={newPostMediaPreview} className="w-full h-full object-cover" controls />
                  ) : (
                    <img 
                      src={newPostMediaPreview} 
                      referrerPolicy="no-referrer" 
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
                    className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"
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

                <div className="flex space-x-2 bg-white/5 p-1 rounded-full border border-white/5">
                  <button 
                    onClick={() => setNewPostVisibility(PostVisibility.PUBLIC)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${newPostVisibility === PostVisibility.PUBLIC ? 'bg-[#967bb6] text-white shadow-lg' : 'text-slate-600'}`}
                  >Public</button>
                  <button 
                    onClick={() => setNewPostVisibility(PostVisibility.PRIVATE)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${newPostVisibility === PostVisibility.PRIVATE ? 'bg-[#967bb6] text-white shadow-lg' : 'text-slate-400'}`}
                  >Private</button>
                </div>
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
                  accept="image/*,video/*" 
                />
              </div>
              <button 
                onClick={handlePost}
                className="bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white px-8 py-3 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl shadow-[#967bb6]/20 transition-all flex items-center space-x-2 chrome-border"
              >
                <span>Post</span>
                <Send size={18} />
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
          allUsers={users}
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
