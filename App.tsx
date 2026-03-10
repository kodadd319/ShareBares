
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
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
import { MOCK_USERS, MOCK_POSTS, CURRENT_USER_ID, MOCK_STORE_ITEMS, MOCK_STABLE_LISTINGS } from './constants';
import { User, Post, PostVisibility, Message, StoreItem, MediaItem, AppNotification, NotificationType, StableListing, StoreCustomization, ProfileCustomization } from './types';
import { 
  Plus, Image as ImageIcon, Send, X, Wand2, MessageSquare, 
  ShieldAlert, AlertCircle, Camera, Check, ArrowLeft, Star, Heart, ShieldCheck,
  Settings as SettingsIcon, Bell, Lock, User as UserIcon, Shield, 
  HelpCircle, LogOut, ChevronRight, ChevronDown, MapPin, Briefcase, Globe, Phone, Mail,
  Instagram, Twitter, ShoppingBag, Trash2, MessageCircle, Video, CreditCard,
  UserPlus, UserCheck, UserX, Users, Flame, Ban, Dices, ExternalLink, Palette, DollarSign,
  TrendingUp, Sparkles
} from 'lucide-react';
import { generateCaptionSuggestion, generateJadeResponse, generateJadePost, generateJadeComment } from './services/geminiService';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-center space-y-8 animate-in zoom-in duration-1000">
        <Logo size="lg" className="scale-150 mb-8" />
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase chrome-text drop-shadow-[0_0_20px_rgba(150,123,182,0.5)]">
            ShareBares
          </h1>
          <p className="text-[#967bb6] text-lg md:text-2xl font-black uppercase tracking-[0.2em] leading-relaxed italic px-4">
            "Post like nobody’s watching, get paid like everyone is."
          </p>
          <div className="flex items-center justify-center space-x-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            <span>Powered by</span>
            <span className="text-[#967bb6]">barebear</span>
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

const AgeVerificationGate: React.FC<{ onVerify: () => void }> = ({ onVerify }) => {
  return (
    <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border-[#c0c0c0]/20 shadow-2xl shadow-[#967bb6]/10 text-center animate-in fade-in zoom-in duration-300 chrome-border">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        <p className="text-[#967bb6] font-bold uppercase tracking-[0.2em] text-xs mb-6">Adults Only • NSFW Content</p>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
          <div className="flex items-start space-x-3 text-[#967bb6] mb-4">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">Unrestricted Adult Content</p>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            By entering, you confirm that you are at least 18 years old. This site contains unrestricted adult material, including nudity and sexually explicit content, which is allowed throughout the platform.
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <button 
            onClick={onVerify}
            className="w-full bg-black text-[#967bb6] py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#967bb6]/20 transition-all active:scale-[0.98] chrome-border"
          >
            Enter
          </button>
          <button 
            onClick={() => window.location.href = 'https://www.google.com'}
            className="w-full bg-white/5 hover:bg-white/10 text-slate-400 py-4 rounded-2xl font-bold transition-all"
          >
            Leave
          </button>
        </div>
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
  isCalling: boolean;
  type: 'voice' | 'video';
}> = ({ call, callAccepted, myVideo, userVideo, stream, remoteStream, onAnswer, onHangup, isCalling, type }) => {
  useEffect(() => {
    if (myVideo.current && stream) myVideo.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (userVideo.current && remoteStream) userVideo.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <div className="relative w-full aspect-video bg-white/5 rounded-[3rem] overflow-hidden chrome-border shadow-2xl mb-8 flex items-center justify-center">
          {type === 'video' ? (
            <>
              {callAccepted ? (
                <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
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
          {!callAccepted && !isCalling && (
            <button 
              onClick={onAnswer}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-500/20 hover:scale-110 transition-all"
            >
              <Phone size={32} />
            </button>
          )}
          <button 
            onClick={onHangup}
            className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/20 hover:scale-110 transition-all"
          >
            <X size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileEditPage: React.FC<{ user: User; onSave: (profile: Partial<User>) => void; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [cover, setCover] = useState(user.coverImage);
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
          <div className="h-44 w-full rounded-2xl overflow-hidden bg-white/5 relative group border border-white/5">
            <img src={cover} className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" alt="Cover" />
            <input 
              type="file" 
              ref={coverInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleCoverUpload} 
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <button 
                type="button" 
                onClick={() => coverInputRef.current?.click()} 
                className="bg-[#967bb6] p-3 rounded-full text-white shadow-xl hover:scale-110 transition-all chrome-border"
              >
                <Camera size={24} />
              </button>
            </div>
          </div>

          <div className="absolute -bottom-16 left-8 group">
            <div className="w-32 h-32 rounded-3xl border-4 border-black bg-black overflow-hidden relative shadow-2xl chrome-border">
              <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
              <input 
                type="file" 
                ref={avatarInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                 <button 
                  type="button" 
                  onClick={() => avatarInputRef.current?.click()} 
                  className="bg-[#967bb6] p-2 rounded-lg text-white"
                 >
                   <Camera size={18} />
                 </button>
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
}> = ({ me, onEditProfile, onLogout, onUpdateUser }) => {
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
                onClick={() => alert('Password reset link sent to your email.')}
                className="text-[#967bb6] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Update
              </button>
            </div>
          </div>
          <div className="p-6 bg-red-500/5">
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to delete your account? This action is irreversible.')) {
                  onLogout();
                }
              }}
              className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-400 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
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
    </div>
  );
};

const ProfileCreationPage: React.FC<{ onComplete: (profile: Partial<User>) => void }> = ({ onComplete }) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('https://picsum.photos/seed/default/200');
  const [cover, setCover] = useState('https://picsum.photos/seed/defaultcover/800/300');
  const [isCreator, setIsCreator] = useState(false);
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [tagline, setTagline] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [stripeConnectId, setStripeConnectId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !username) return;
    onComplete({
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

          <div className="relative mb-28">
            <div className="h-44 w-full rounded-2xl overflow-hidden bg-white/5 relative group border border-white/5">
              <img src={cover} className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" alt="Cover" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <button 
                  type="button" 
                  onClick={() => setCover(`https://picsum.photos/seed/${Math.random()}/800/300`)} 
                  className="bg-[#967bb6] p-3 rounded-full text-white shadow-xl hover:scale-110 transition-all chrome-border"
                >
                  <Camera size={24} />
                </button>
              </div>
            </div>

            <div className="absolute -bottom-16 left-8 group">
              <div className="w-32 h-32 rounded-3xl border-4 border-black bg-black overflow-hidden relative shadow-2xl chrome-border">
                <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                   <button 
                    type="button" 
                    onClick={() => setAvatar(`https://picsum.photos/seed/${Math.random()}/200`)} 
                    className="bg-[#967bb6] p-2 rounded-lg text-white"
                   >
                     <Camera size={18} />
                   </button>
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
}> = ({ me, onRequestPayment, onGoToStoreManager }) => {
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
              <span>In person services</span>
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
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">In person services listing in The Stable and in your store</p>
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

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#967bb6] font-black text-sm">06</div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tight mb-2">The Stable Advantage</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed uppercase font-bold tracking-wide">
                  Joining "The Stable" gives you a verified badge and puts you in our professional directory for in-person services, significantly increasing your visibility.
                </p>
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

const App: React.FC = () => {
  const { showPrompt, install, dismiss } = usePWA();
  const [showSplash, setShowSplash] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>(CURRENT_USER_ID);
  const [hasCreatedProfile, setHasCreatedProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [profileTab, setProfileTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [storeItems, setStoreItems] = useState<StoreItem[]>(MOCK_STORE_ITEMS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [stableListings, setStableListings] = useState<StableListing[]>(MOCK_STABLE_LISTINGS);
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
  const [pendingStableListing, setPendingStableListing] = useState<Omit<StableListing, 'id' | 'createdAt'> | null>(null);
  const [pendingStoreItem, setPendingStoreItem] = useState<StoreItem | null>(null);
  const [isJadeTyping, setIsJadeTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isViewingAsPublic, setIsViewingAsPublic] = useState(false);

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
  
  const meRaw = users.find(u => u.id === currentUserId)!;
  const me = { ...meRaw, isAdmin: meRaw.isAdmin || meRaw.email === 'jtothek319@gmail.com' };

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
  const connectionRef = useRef<Peer.Instance | null>(null);

  // Messaging state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({
    'creator-1': [
      { id: '1', senderId: 'creator-1', receiverId: 'me-123', text: 'Hey Alex! Thanks for the sub.', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ],
    'creator-2': [
      { id: '1', senderId: 'creator-2', receiverId: 'me-123', text: 'Did you check out my latest unboxing?', timestamp: new Date(Date.now() - 7200000).toISOString() }
    ]
  });
  const [currentMessageInput, setCurrentMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedUserIdRef = useRef<string | null>(null);

  const callUser = useCallback((id: string, type: 'voice' | 'video') => {
    setCallType(type);
    setIsCalling(true);
    
    navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true }).then((currentStream) => {
      setStream(currentStream);
      const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

      peer.on('signal', (data) => {
        socket?.emit('call_user', {
          userToCall: id,
          signalData: data,
          from: currentUserId,
          name: me.displayName,
          type
        });
      });

      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      connectionRef.current = peer;
    });
  }, [socket, currentUserId, me]);

  const answerCall = useCallback(() => {
    setCallAccepted(true);
    setCallType(call?.type || 'voice');

    navigator.mediaDevices.getUserMedia({ video: call?.type === 'video', audio: true }).then((currentStream) => {
      setStream(currentStream);
      const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });

      peer.on('signal', (data) => {
        socket?.emit('answer_call', { signal: data, to: call?.from });
      });

      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      peer.signal(call?.signal);
      connectionRef.current = peer;
    });
  }, [socket, call]);

  const leaveCall = useCallback(() => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
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

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  // Jade AI Activity Loop
  useEffect(() => {
    if (!isLoggedIn) return;

    const jadeActivity = setInterval(async () => {
      const roll = Math.random();
      
      // 10% chance to post something new
      if (roll < 0.1) {
        const content = await generateJadePost();
        const newPost: Post = {
          id: `jade-post-${Date.now()}`,
          userId: 'ai-jade',
          content: content,
          createdAt: new Date().toISOString(),
          likes: Math.floor(Math.random() * 500),
          commentsCount: 0,
          visibility: PostVisibility.PUBLIC,
          mediaUrl: `https://picsum.photos/seed/jade_${Date.now()}/800/1000`,
          mediaType: 'image',
        };
        setPosts(prev => [newPost, ...prev]);
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

  const addNotification = (type: NotificationType, title: string, message: string, data?: Partial<AppNotification>) => {
    const newNotification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...data
    };

    setAppNotifications(prev => [newNotification, ...prev]);

    // Browser Push Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('Notification:', title, message);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('payment_success');
    if (success) {
      if (success === 'store') {
        setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, hasPaidStoreFee: true } : u));
        setActiveTab('store-management');
        setIsPaying(false);
        addNotification(
          NotificationType.PURCHASE,
          'Store Activated!',
          'Your one-time store fee has been processed. You can now upload paid content.',
        );
      } else if (success === 'stable') {
        setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, hasPaidStableFee: true } : u));
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
  }, [currentUserId]);

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
      newSocket.emit('identify', currentUserId);
    });

    newSocket.on('message_history', (history: Message[]) => {
      setChatMessages(prev => {
        const newMessages = { ...prev };
        history.forEach(msg => {
          const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
          if (!newMessages[otherId]) newMessages[otherId] = [];
          // Avoid duplicates
          if (!newMessages[otherId].find(m => m.id === msg.id)) {
            newMessages[otherId].push(msg);
          }
        });
        return newMessages;
      });
    });

    newSocket.on('receive_message', (message: Message) => {
      setChatMessages(prev => {
        const otherId = message.senderId === currentUserId ? message.receiverId : message.senderId;
        return {
          ...prev,
          [otherId]: [...(prev[otherId] || []), message]
        };
      });

      // Add notification
      if (selectedUserIdRef.current !== message.senderId && message.senderId !== currentUserId) {
        const sender = users.find(u => u.id === message.senderId);
        addNotification(
          NotificationType.MESSAGE,
          `New message from ${sender?.displayName || 'Someone'}`,
          message.text,
          { senderId: message.senderId }
        );
      }
    });

    newSocket.on('message_sent', (message: Message) => {
      setChatMessages(prev => {
        const otherId = message.receiverId;
        return {
          ...prev,
          [otherId]: [...(prev[otherId] || []), message]
        };
      });
    });

    // Call Signaling
    newSocket.on('incoming_call', ({ from, name, signal, type }) => {
      setCall({ isReceivingCall: true, from, name, signal, type });
    });

    newSocket.on('call_accepted', (signal) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    });

    newSocket.on('call_ended', () => {
      setCallEnded(true);
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      // Reset state
      setCall(null);
      setCallAccepted(false);
      setCallEnded(false);
      setIsCalling(false);
      setStream(null);
      setRemoteStream(null);
    });

    return () => {
      newSocket.close();
    };
  }, [currentUserId, users]);

  useEffect(() => {
    if (selectedUserId) {
      // Mark messages as read by clearing notifications from this sender
      setAppNotifications(prev => prev.map(n => 
        (n.type === NotificationType.MESSAGE && n.senderId === selectedUserId) 
        ? { ...n, isRead: true } 
        : n
      ));
    }
  }, [selectedUserId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUserId, chatMessages]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      setAppNotifications(prev => prev.map(n => n.type !== NotificationType.MESSAGE ? { ...n, isRead: true } : n));
    }
  }, [activeTab]);

  const handleLogin = (email: string, password: string) => {
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      if (user.isBanned) {
        alert("Your account has been banned for misconduct.");
        return;
      }
      setCurrentUserId(user.id);
      setIsLoggedIn(true);
      setHasCreatedProfile(true);
      return;
    }

    // Default login for demo if no user found (optional, but keep for compatibility)
    if (email && password) {
      setIsLoggedIn(true);
      if (me.username && me.displayName && me.bio) {
        setHasCreatedProfile(true);
      } else {
        setHasCreatedProfile(false);
      }
    }
  };

  const handleRegister = (displayName: string, username: string, email: string, password: string) => {
    // Check if email or username already exists
    if (users.find(u => u.email === email || u.username === username)) {
      alert("Email or username already exists.");
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      displayName,
      email,
      password,
      isBanned: false,
      avatar: `https://picsum.photos/seed/${username}/200`,
      coverImage: `https://picsum.photos/seed/${username}_cover/800/300`,
      bio: '',
      isCreator: false,
      isAdmin: email === 'jtothek319@gmail.com',
      subscribersCount: 0,
      followingCount: 0,
      friendIds: [],
      pendingFriendRequestsSent: [],
      pendingFriendRequestsReceived: [],
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
      }
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsLoggedIn(true);
    setHasCreatedProfile(false);
    setActiveTab('profile-edit');
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Social login with ${provider}`);
    // For demo, just log them in as a random user or create one
    const demoUser = users[Math.floor(Math.random() * users.length)];
    setCurrentUserId(demoUser.id);
    setIsLoggedIn(true);
    setHasCreatedProfile(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('feed');
    setViewingUserId(null);
    setIsVerified(false);
    setShowSplash(true);
  };

  const handleProfileUpdate = (profileData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, ...profileData } : u));
    if (!hasCreatedProfile) setHasCreatedProfile(true);
    setActiveTab('feed');
  };

  const handleUpdateUser = (profileData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, ...profileData } : u));
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPostMedia(file);
      const url = URL.createObjectURL(file);
      setNewPostMediaPreview(url);
    }
  };

  const handlePost = () => {
    if (!newPostContent.trim() && !newPostMedia) return;
    
    const newPost: Post = {
      id: `post-${Date.now()}`,
      userId: currentUserId,
      content: newPostContent,
      createdAt: new Date().toISOString(),
      likes: 0,
      commentsCount: 0,
      visibility: newPostVisibility,
      mediaUrl: newPostMediaPreview || 'https://picsum.photos/seed/' + Math.random() + '/800/600',
      mediaType: newPostMedia?.type.startsWith('video') ? 'video' : 'image',
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setIsCreating(false);
    setNewPostVisibility(PostVisibility.PUBLIC);
    setNewPostMedia(null);
    setNewPostMediaPreview(null);
  };

  const handleToggleFan = (targetUserId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === targetUserId) {
        const fanIds = u.fanIds || [];
        const isFan = fanIds.includes(currentUserId);
        const newFanIds = isFan 
          ? fanIds.filter(id => id !== currentUserId)
          : [...fanIds, currentUserId];
        
        if (!isFan) {
          addNotification(
            NotificationType.FOLLOW,
            'New Fan!',
            `${me.displayName} joined your Fan Club!`,
            { senderId: currentUserId }
          );
        }
        
        return { ...u, fanIds: newFanIds };
      }
      return u;
    }));
  };

  const handleLikePost = (post: Post, likerId: string = currentUserId) => {
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p));
    
    const liker = users.find(u => u.id === likerId);
    const author = users.find(u => u.id === post.userId);
    
    if (author && author.id !== likerId) {
      addNotification(
        NotificationType.LIKE,
        'New Like!',
        `${liker?.displayName || 'Someone'} liked your post: "${post.content.substring(0, 20)}..."`,
        { postId: post.id, senderId: likerId }
      );

      // If liking Jade's post, she might respond with a message or like back
      if (author.id === 'ai-jade' && likerId === currentUserId && Math.random() < 0.3) {
        setTimeout(() => {
          addNotification(
            NotificationType.MESSAGE,
            'Jade Vixen',
            'Thanks for the love, babe. 🖤 Check your DMs.',
            { senderId: 'ai-jade' }
          );
        }, 2000);
      }
    }
  };

  const handleCommentPost = async (post: Post, commenterId: string = currentUserId, text?: string) => {
    let commentText = text;
    if (!commentText && commenterId === currentUserId) {
      commentText = prompt('Enter your comment:') || undefined;
    }
    
    if (!commentText) return;

    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, commentsCount: p.commentsCount + 1 } : p));
    
    const commenter = users.find(u => u.id === commenterId);
    const author = users.find(u => u.id === post.userId);
    
    if (author && author.id !== commenterId) {
      addNotification(
        NotificationType.COMMENT,
        'New Comment!',
        `${commenter?.displayName || 'Someone'} commented on your post: "${post.content.substring(0, 20)}..."`,
        { postId: post.id, senderId: commenterId }
      );

      // If commenting on Jade's post as the current user, she responds
      if (author.id === 'ai-jade' && commenterId === currentUserId) {
        const jadeComment = await generateJadeComment(commentText);
        setTimeout(() => {
          handleCommentPost(post, 'ai-jade', jadeComment);
        }, 3000);
      }
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

  const handleSendFriendRequest = (targetUserId: string) => {
    if (targetUserId === currentUserId) return;
    
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { ...u, pendingFriendRequestsSent: [...u.pendingFriendRequestsSent, targetUserId] };
      }
      if (u.id === targetUserId) {
        addNotification(
          NotificationType.FOLLOW,
          'Friend Request',
          `${me.displayName || 'Someone'} sent you a friend request!`,
          { senderId: currentUserId }
        );
        return { ...u, pendingFriendRequestsReceived: [...u.pendingFriendRequestsReceived, currentUserId] };
      }
      return u;
    }));
  };

  const handleAcceptFriendRequest = (targetUserId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { 
          ...u, 
          pendingFriendRequestsReceived: u.pendingFriendRequestsReceived.filter(id => id !== targetUserId),
          friendIds: [...u.friendIds, targetUserId]
        };
      }
      if (u.id === targetUserId) {
        addNotification(
          NotificationType.FOLLOW,
          'Friend Request Accepted',
          `${me.displayName || 'Someone'} accepted your friend request!`,
          { senderId: currentUserId }
        );
        return { 
          ...u, 
          pendingFriendRequestsSent: u.pendingFriendRequestsSent.filter(id => id !== currentUserId),
          friendIds: [...u.friendIds, currentUserId]
        };
      }
      return u;
    }));
  };

  const handleDeclineFriendRequest = (targetUserId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { 
          ...u, 
          pendingFriendRequestsReceived: u.pendingFriendRequestsReceived.filter(id => id !== targetUserId)
        };
      }
      if (u.id === targetUserId) {
        return { 
          ...u, 
          pendingFriendRequestsSent: u.pendingFriendRequestsSent.filter(id => id !== currentUserId)
        };
      }
      return u;
    }));
  };

  const handleUnfriend = (targetUserId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { ...u, friendIds: u.friendIds.filter(id => id !== targetUserId) };
      }
      if (u.id === targetUserId) {
        return { ...u, friendIds: u.friendIds.filter(id => id !== currentUserId) };
      }
      return u;
    }));
  };

  const handleSendFwbRequest = (targetUserId: string) => {
    if (targetUserId === currentUserId) return;
    
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
    
    if (currentSentCount >= 2) {
      alert("You have reached your limit of 2 FWB requests per month. Your limit resets on " + new Date(currentResetDate).toLocaleDateString());
      return;
    }

    if (me.pendingFwbRequestsSent.includes(targetUserId) || me.fwbIds.includes(targetUserId)) {
      alert("You have already sent a request to this user or are already FWB.");
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { 
          ...u, 
          pendingFwbRequestsSent: [...u.pendingFwbRequestsSent, targetUserId],
          fwbRequestsSentCount: currentSentCount + 1,
          fwbRequestsResetDate: currentResetDate
        };
      }
      if (u.id === targetUserId) {
        addNotification(
          NotificationType.FOLLOW,
          'FWB Request',
          `Someone sent you a private FWB request!`,
          { senderId: currentUserId }
        );
        return { ...u, pendingFwbRequestsReceived: [...u.pendingFwbRequestsReceived, currentUserId] };
      }
      return u;
    }));
  };

  const handleAcceptFwbRequest = (targetUserId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { 
          ...u, 
          pendingFwbRequestsReceived: u.pendingFwbRequestsReceived.filter(id => id !== targetUserId),
          fwbIds: [...u.fwbIds, targetUserId]
        };
      }
      if (u.id === targetUserId) {
        addNotification(
          NotificationType.FOLLOW,
          'FWB Request Accepted',
          `Your private FWB request was accepted!`,
          { senderId: currentUserId }
        );
        return { 
          ...u, 
          pendingFwbRequestsSent: u.pendingFwbRequestsSent.filter(id => id !== currentUserId),
          fwbIds: [...u.fwbIds, currentUserId]
        };
      }
      return u;
    }));
  };

  const handleDeclineFwbRequest = (targetUserId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { 
          ...u, 
          pendingFwbRequestsReceived: u.pendingFwbRequestsReceived.filter(id => id !== targetUserId)
        };
      }
      if (u.id === targetUserId) {
        return { 
          ...u, 
          pendingFwbRequestsSent: u.pendingFwbRequestsSent.filter(id => id !== currentUserId)
        };
      }
      return u;
    }));
  };

  const handleUnfwb = (targetUserId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { ...u, fwbIds: u.fwbIds.filter(id => id !== targetUserId) };
      }
      if (u.id === targetUserId) {
        return { ...u, fwbIds: u.fwbIds.filter(id => id !== currentUserId) };
      }
      return u;
    }));
  };

  const handleBlockUser = (targetUserId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { 
          ...u, 
          blockedUserIds: [...u.blockedUserIds, targetUserId],
          friendIds: u.friendIds.filter(id => id !== targetUserId),
          fwbIds: u.fwbIds.filter(id => id !== targetUserId)
        };
      }
      return u;
    }));
    addNotification(NotificationType.FOLLOW, 'User Blocked', 'You will no longer see content from this user.');
  };

  const handleUnblockUser = (targetUserId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
        return { ...u, blockedUserIds: u.blockedUserIds.filter(id => id !== targetUserId) };
      }
      return u;
    }));
  };

  const handleUploadPhoto = (photo: Omit<MediaItem, 'id' | 'createdAt'>) => {
    const newPhoto: MediaItem = {
      ...photo,
      id: `photo-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, photos: [newPhoto, ...u.photos] } : u));
    addNotification(NotificationType.FOLLOW, 'Photo Uploaded', 'Your new photo is now live on your profile.');
  };

  const handleDeletePhoto = (photoId: string) => {
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, photos: u.photos.filter(p => p.id !== photoId) } : u));
  };

  const handleDeletePost = (postId: string) => {
    if (!me.isAdmin) return;
    if (confirm('Are you sure you want to remove this post?')) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const handleDeleteStoreItem = (itemId: string) => {
    const item = storeItems.find(i => i.id === itemId);
    if (!item) return;
    
    const isOwner = item.userId === currentUserId;
    if (!me.isAdmin && !isOwner) return;
    
    if (confirm('Are you sure you want to remove this store item?')) {
      setStoreItems(prev => prev.filter(i => i.id !== itemId));
    }
  };

  const handleUpdateStoreItem = (itemId: string, updates: Partial<StoreItem>) => {
    setStoreItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleStoreCustomizationUpdate = (customization: StoreCustomization) => {
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, storeCustomization: customization } : u));
    setActiveTab('store-management');
    addNotification(
      NotificationType.FOLLOW,
      'Store Customized!',
      'Your store visual appearance has been updated successfully.'
    );
  };

  const handleBanUser = (userId: string) => {
    if (!me.isAdmin) return;
    if (confirm('Are you sure you want to BAN this user? They will no longer be able to log in.')) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: true } : u));
      if (viewingUserId === userId) {
        setActiveTab('feed');
      }
    }
  };

  const handleAddItemToStore = (itemData: Omit<StoreItem, 'id' | 'userId' | 'createdAt'>, file: File) => {
    const newItem: StoreItem = {
      id: `si-${Date.now()}`,
      userId: currentUserId,
      ...itemData,
      thumbnailUrl: URL.createObjectURL(file),
      mediaUrl: URL.createObjectURL(file),
      createdAt: new Date().toISOString()
    };
    setStoreItems(prev => [newItem, ...prev]);
    addNotification(
      NotificationType.PURCHASE,
      'Item Added!',
      `Your item "${itemData.title}" has been added to your store.`,
    );
  };

  const handleCreateStableListing = (listingData: Omit<StableListing, 'id' | 'createdAt'>, postToStore: boolean) => {
    if (!me.hasPaidStableFee && !me.isAdmin) {
      setPendingStableListing(listingData);
      setStableBundleSelected(postToStore);
      setPaymentType('stable');
      setIsPaying(true);
      return;
    }

    const newListing: StableListing = {
      id: `sl-${Date.now()}`,
      userId: currentUserId,
      ...listingData,
      createdAt: new Date().toISOString()
    };
    setStableListings(prev => [newListing, ...prev]);

    if (postToStore) {
      const newStoreItem: StoreItem = {
        id: `si-stable-${Date.now()}`,
        userId: currentUserId,
        title: `${listingData.providerName} - Stable Listing`,
        description: listingData.services,
        price: parseFloat(listingData.pricing.replace(/[^0-9.]/g, '')) || 0,
        thumbnailUrl: listingData.avatarUrl || listingData.photos?.[0] || '',
        mediaUrl: listingData.photos?.[0] || listingData.avatarUrl || '',
        type: 'image',
        createdAt: new Date().toISOString()
      };
      setStoreItems(prev => [newStoreItem, ...prev]);
    }

    setActiveTab('stable');
  };

  const handlePaymentSuccess = () => {
    if (paymentType === 'store') {
      setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, hasPaidStoreFee: true } : u));
      setIsPaying(false);
      setActiveTab('store-management');
      
      addNotification(
        NotificationType.PURCHASE,
        'Store Activated!',
        'Your one-time store fee has been processed. You can now upload paid content.',
      );
    } else if (paymentType === 'stable') {
      const isBundle = stableBundleSelected;
      setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, hasPaidStableFee: true, hasPaidStableBundle: isBundle || u.hasPaidStableBundle } : u));
      
      if (pendingStableListing) {
        const newListing: StableListing = {
          id: `sl-${Date.now()}`,
          userId: currentUserId,
          ...pendingStableListing,
          createdAt: new Date().toISOString()
        };
        setStableListings(prev => [newListing, ...prev]);

        if (isBundle) {
          const newStoreItem: StoreItem = {
            id: `si-stable-${Date.now()}`,
            userId: currentUserId,
            title: `${pendingStableListing.providerName} - Stable Listing`,
            description: pendingStableListing.services,
            price: parseFloat(pendingStableListing.pricing.replace(/[^0-9.]/g, '')) || 0,
            thumbnailUrl: pendingStableListing.avatarUrl || pendingStableListing.photos?.[0] || '',
            mediaUrl: pendingStableListing.photos?.[0] || pendingStableListing.avatarUrl || '',
            type: 'image',
            createdAt: new Date().toISOString()
          };
          setStoreItems(prev => [newStoreItem, ...prev]);
        }

        setPendingStableListing(null);
        setStableBundleSelected(false);
      }
      
      setIsPaying(false);
      if (pendingStableListing) {
        setActiveTab('stable');
      } else {
        setActiveTab('join-stable');
      }

      addNotification(
        NotificationType.PURCHASE,
        'The Stable Activated!',
        isBundle 
          ? 'Your Store Bundle has been processed. Your listing is live in the feed and your store.'
          : 'Your one-time stable fee has been processed. Your listing is now live.',
      );
    } else if (paymentType === 'item' && pendingStoreItem) {
      setUsers(prev => prev.map(u => u.id === currentUserId ? { 
        ...u, 
        purchasedItemIds: [...(u.purchasedItemIds || []), pendingStoreItem.id] 
      } : u));
      
      const seller = users.find(u => u.id === pendingStoreItem.userId);
      if (seller) {
        addNotification(
          NotificationType.PURCHASE,
          'Item Purchased!',
          `${me.displayName || 'Someone'} purchased "${pendingStoreItem.title}" from your store for $${pendingStoreItem.price}`,
          { storeItemId: pendingStoreItem.id }
        );
      }
      setPendingStoreItem(null);
      setIsPaying(false);
    }
  };

  const generateAICaption = async () => {
    setAiGenerating(true);
    const suggestion = await generateCaptionSuggestion(newPostContent || "post ideas");
    setNewPostContent(suggestion);
    setAiGenerating(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedUserId || !socket) return;
    
    socket.emit('send_message', {
      senderId: currentUserId,
      receiverId: selectedUserId,
      text: text
    });

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
      setTimeout(() => {
        setIsJadeTyping(false);
        socket.emit('send_message', {
          senderId: 'ai-jade',
          receiverId: currentUserId,
          text: responseText
        });
      }, 2000 + Math.random() * 3000);
    }
  };

  const handleDeleteConversation = (userId: string) => {
    setChatMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[userId];
      return newMessages;
    });
    if (selectedUserId === userId) {
      setSelectedUserId(null);
    }
  };

  const renderFeed = () => (
    <HomePage 
      me={me}
      users={users}
      posts={posts}
      searchQuery={searchQuery}
      onSelectUser={navigateToProfile}
      onLikePost={handleLikePost}
      onCommentPost={handleCommentPost}
      onProfileClick={navigateToProfile}
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

    const renderProfile = (user: User, isOwnProfile: boolean) => {
    const custom = user.profileCustomization;
    const fontStyles: Record<string, string> = {
      sans: 'font-sans',
      serif: 'font-serif',
      mono: 'font-mono',
      display: 'font-display',
      cursive: 'font-cursive',
    };

    const accentColor = custom?.accentColor || '#967bb6';
    const buttonColor = custom?.buttonColor || '#967bb6';
    const fontColor = custom?.fontColor || '#ffffff';

    const profileButtonStyle = {
      backgroundColor: '#000000',
      color: '#967bb6'
    };

    return (
      <div 
        className={`min-h-screen transition-all duration-500 ${custom?.fontType ? fontStyles[custom.fontType] : ''}`}
        style={{ 
          backgroundColor: custom?.backgroundColor || '#050505',
          backgroundImage: custom?.backgroundWallpaper ? `url(${custom.backgroundWallpaper})` : 'none',
          backgroundRepeat: 'repeat',
          color: fontColor
        }}
      >
        {custom?.themeSongUrl && (
          <audio src={custom.themeSongUrl} autoPlay loop />
        )}
        <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8">
      {/* Header Section: Cover & Avatar Integration */}
      <div className="relative mb-24">
        <div className="h-[350px] md:h-[450px] rounded-[3rem] overflow-hidden border border-white/10 relative group shadow-2xl">
          <img src={user.coverImage} className="w-full h-full object-cover opacity-70 transition-transform duration-1000 group-hover:scale-105" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          
          {/* Stats Overlay on Cover */}
          <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-end space-x-6">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] border-4 border-black overflow-hidden shadow-2xl bg-black chrome-border shrink-0 relative z-10">
                <img src={user.avatar} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="pb-2">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase chrome-text drop-shadow-2xl" style={{ color: fontColor }}>{user.displayName}</h1>
                  {stableListings.some(l => l.userId === user.id) && (
                    <div className="flex items-center space-x-1 border border-white/20 px-3 py-1 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]" title="Stable Member - In person services" style={{ backgroundColor: '#000000', color: '#967bb6' }}>
                      <Briefcase size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Stable Member</span>
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
        custom?.layout === 'minimal' ? 'grid-cols-1 max-w-3xl mx-auto' : 
        custom?.layout === 'bento' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
        custom?.layout === 'magazine' ? 'grid-cols-1 lg:grid-cols-12' :
        'grid-cols-1 lg:grid-cols-12'
      }`}>
        {/* Sidebar: About & Info */}
        {(custom?.layout === 'default' || custom?.layout === 'sidebar' || custom?.layout === 'magazine' || !custom?.layout) && (
          <div className={`${
            custom?.layout === 'magazine' ? 'lg:col-span-4' : 'lg:col-span-4'
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
          custom?.layout === 'minimal' ? 'col-span-1' :
          custom?.layout === 'bento' ? 'col-span-full' :
          custom?.layout === 'magazine' ? 'lg:col-span-8' :
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
              <div className={`${custom?.layout === 'bento' ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'space-y-8'}`}>
                {posts.filter(p => p.userId === user.id).length > 0 ? (
                  posts.filter(p => p.userId === user.id).map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      author={user} 
                      isMe={isOwnProfile} 
                      isAdmin={me.isAdmin} 
                      onLike={() => handleLikePost(post)}
                      onComment={() => handleCommentPost(post)}
                      onProfileClick={navigateToProfile}
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
                custom?.layout === 'bento' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
              }`}>
                {user.photos.length > 0 ? (
                  user.photos.map(photo => (
                    <div key={photo.id} className="aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/5 group cursor-pointer relative chrome-border shadow-2xl">
                      <img src={photo.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
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

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (!isVerified) return <AgeVerificationGate onVerify={() => setIsVerified(true)} />;
  if (!isLoggedIn) return (
    <LoginPage 
      onLogin={handleLogin} 
      onRegister={handleRegister}
      onSocialLogin={handleSocialLogin}
    />
  );
  if (!hasCreatedProfile) return <ProfileCreationPage onComplete={handleProfileUpdate} />;
  if (isPaying) return (
    <PaymentPage 
      amount={
        paymentType === 'store' ? 10.00 : 
        paymentType === 'stable' ? (stableBundleSelected ? 15.00 : 10.00) :
        (pendingStoreItem?.price || 0)
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
  );

  return (
    <div className="min-h-screen bg-black text-slate-300">
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

      <main className={`${activeTab === 'messages' ? '' : 'pb-24'} pt-16`}>
        {activeTab === 'feed' && renderFeed()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'profile' && renderProfile(me, true)}
        {activeTab === 'user-profile' && viewingUserId && (
          renderProfile(users.find(u => u.id === viewingUserId)!, (viewingUserId === currentUserId) && !isViewingAsPublic)
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
            onLogout={() => setIsLoggedIn(false)}
            onUpdateUser={handleUpdateUser}
          />
        )}
        {activeTab === 'media-store' && viewingUserId && (
          <MediaStore 
            user={users.find(u => u.id === viewingUserId)!}
            items={storeItems.filter(i => i.userId === viewingUserId)}
            stableListings={stableListings.filter(l => l.userId === viewingUserId)}
            isOwnStore={viewingUserId === currentUserId}
            isAdmin={me.isAdmin}
            purchasedItemIds={me.purchasedItemIds || []}
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
            onGoToStoreManager={() => setActiveTab('store-management')}
            onRequestPayment={(type, isBundle) => {
              setPaymentType(type);
              if (type === 'stable') setStableBundleSelected(!!isBundle);
              setIsPaying(true);
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
                      onClick={() => notif.senderId && navigateToProfile(notif.senderId)}
                      className={`p-6 rounded-3xl border transition-all flex items-start space-x-4 cursor-pointer ${notif.isRead ? 'bg-white/5 border-white/5 opacity-60' : 'bg-[#967bb6]/5 border-[#967bb6]/20 shadow-lg shadow-[#967bb6]/5'}`}
                    >
                      <div className={`p-3 rounded-2xl shrink-0 ${notif.isRead ? 'bg-white/5 text-slate-500' : 'bg-[#967bb6]/20 text-[#967bb6]'}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-sm font-black uppercase tracking-tight ${notif.isRead ? 'text-slate-400' : 'text-white'}`}>{notif.title}</h3>
                          <span className="text-[10px] text-slate-600 font-bold">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-slate-500' : 'text-slate-300'}`}>{notif.message}</p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-[#967bb6] rounded-full mt-2 shadow-[0_0_8px_#967bb6]"></div>
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

      {activeTab !== 'messages' && (
        <button 
          onClick={() => setIsCreating(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-tr from-[#967bb6] to-[#6b46c1] rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all z-[60] chrome-border shadow-[#967bb6]/30"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      )}

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
                    <img src={newPostMediaPreview} className="w-full h-full object-cover" alt="Preview" />
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
    </div>
  );
};

export default App;
