
import React from 'react';
import { Home, Search, MessageSquare, Bell, Settings, Hash, Menu, Plus, ChevronDown, User as UserIcon, LogOut, Shield, Image as ImageIcon, Dices, ExternalLink, Briefcase, Video, DollarSign, Star, Palette } from 'lucide-react';
import { User, StoreItem, StableListing } from '../types';
import Logo from './Logo';
import { APP_LOGO_URL } from '../constants';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userAvatar: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenCreate: () => void;
  users: User[];
  storeItems: StoreItem[];
  stableListings: StableListing[];
  navigateToProfile: (userId: string) => void;
  onViewPublicProfile: () => void;
  onLogout: () => void;
  hasUnreadMessages?: boolean;
  hasUnreadNotifications?: boolean;
  customStyle?: {
    menuBarColor?: string;
    accentColor?: string;
    fontColor?: string;
  };
}

const TopNav: React.FC<TopNavProps> = ({ 
  activeTab, 
  setActiveTab, 
  userAvatar, 
  searchQuery, 
  setSearchQuery, 
  onOpenCreate,
  users,
  storeItems,
  stableListings,
  navigateToProfile,
  onViewPublicProfile,
  onLogout,
  hasUnreadMessages,
  hasUnreadNotifications,
  customStyle
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isGamesSubMenuOpen, setIsGamesSubMenuOpen] = React.useState(false);
  const [isEditProfileSubMenuOpen, setIsEditProfileSubMenuOpen] = React.useState(false);
  const [isMoreVideosSubMenuOpen, setIsMoreVideosSubMenuOpen] = React.useState(false);
  const [isMoreVideosMobileOpen, setIsMoreVideosMobileOpen] = React.useState(false);
  const [isStableSubMenuOpen, setIsStableSubMenuOpen] = React.useState(false);
  const [isStableMobileOpen, setIsStableMobileOpen] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);

  const filteredUsers = searchQuery.length > 1 
    ? users.filter(u => 
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredStoreItems = searchQuery.length > 1
    ? storeItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 3)
    : [];

  const filteredStable = searchQuery.length > 1
    ? stableListings.filter(l => 
        l.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.services.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.city.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const navItems = [
    { id: 'feed', icon: Home, label: 'Home' },
    { id: 'store-management', icon: Briefcase, label: 'Store Mgmt' },
    { id: 'monetization', icon: DollarSign, label: 'Monetize' },
    { id: 'notifications', icon: Bell, label: 'Alerts' },
    { id: 'messages', icon: MessageSquare, label: 'Chat' },
    { id: 'games', icon: Dices, label: 'Gameroom' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav 
      className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-[#c0c0c0]/20 flex items-center justify-between px-4 lg:px-8 z-50 transition-colors duration-500"
      style={{ backgroundColor: customStyle?.menuBarColor || undefined }}
    >
      {/* Left: Brand, Mobile Menu & Search Bar */}
      <div className="flex items-center space-x-2 lg:space-x-4 flex-grow max-w-xl">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white lg:hidden transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center cursor-pointer shrink-0" onClick={() => setActiveTab('feed')}>
          <Logo size="sm" />
        </div>

        {/* Search Bar */}
        <div className="relative group flex flex-grow max-w-[120px] sm:max-w-md ml-2 sm:ml-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#967bb6] transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all text-slate-200 text-xs sm:text-sm chrome-border"
            />
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchQuery.length > 1 && (
            <>
              <div 
                className="fixed inset-0 z-[-1]" 
                onClick={() => setShowResults(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#050505] rounded-2xl border border-[#c0c0c0]/20 shadow-2xl py-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 chrome-border z-50 max-h-[70vh] overflow-y-auto">
                {filteredUsers.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[#967bb6] mb-1">Profiles</div>
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          navigateToProfile(u.id);
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-[#967bb6]/10 transition-all text-left"
                      >
                        <img 
                          src={u.avatar || undefined} 
                          referrerPolicy="no-referrer" 
                          className="w-8 h-8 rounded-lg object-cover" 
                          alt="" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = APP_LOGO_URL;
                          }}
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{u.displayName}</p>
                          <p className="text-[10px] text-slate-500">@{u.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredStoreItems.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Store Items</div>
                    {filteredStoreItems.map(item => (
                      <button
                        key={`store-item-${item.id}`}
                        onClick={() => {
                          // Find the user who owns this item
                          const owner = users.find(u => u.id === item.userId);
                          if (owner) navigateToProfile(owner.id);
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-emerald-500/10 transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                          {item.thumbnailUrl ? (
                            <img 
                              src={item.thumbnailUrl} 
                              referrerPolicy="no-referrer" 
                              className="w-full h-full object-cover" 
                              alt="" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = APP_LOGO_URL;
                              }}
                            />
                          ) : (
                            <Briefcase size={14} className="text-emerald-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[200px]">{item.title}</p>
                          <p className="text-[10px] text-slate-500">${item.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredStable.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">The Stable</div>
                    {filteredStable.map(l => (
                      <button
                        key={l.id}
                        onClick={() => {
                          setActiveTab('stable');
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-amber-500/10 transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Star size={14} className="text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{l.providerName}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{l.services}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredUsers.length === 0 && filteredStoreItems.length === 0 && filteredStable.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No results found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: App Name & Brand */}
      <div className="flex items-center justify-center hidden lg:flex absolute left-1/2 -translate-x-1/2">
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setActiveTab('feed')}>
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#967bb6]/30 shadow-lg shadow-[#967bb6]/20 group-hover:scale-110 transition-transform">
            <Logo size="sm" className="!h-full !w-full !rounded-none !border-none" />
          </div>
          <h1 className="text-xl xl:text-3xl font-black tracking-tighter uppercase chrome-text whitespace-nowrap drop-shadow-[0_0_10px_rgba(150,123,182,0.3)]">
            ShareBares
          </h1>
        </div>
      </div>

      {/* Right: Comprehensive Navigation */}
      <div className="flex items-center space-x-1 md:space-x-3 shrink-0">
        <div className="hidden lg:flex items-center space-x-1 mr-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const hasUnread = (item.id === 'messages' && hasUnreadMessages) || (item.id === 'notifications' && hasUnreadNotifications);
            const badgeColor = item.id === 'messages' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : `${customStyle?.accentColor || '#967bb6'} shadow-[0_0_8px_${customStyle?.accentColor || '#967bb6'}]`;
            const activeTextColor = customStyle?.accentColor || '#967bb6';
            const activeBgColor = `${activeTextColor}0D`; // 5% opacity
            
            return (
              <React.Fragment key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-xl transition-all relative flex items-center space-x-2 group ${
                    isActive 
                    ? 'bg-white/5' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                  style={isActive ? { color: activeTextColor, backgroundColor: activeBgColor } : {}}
                >
                  <div className="relative">
                    <Icon size={18} />
                    {hasUnread && (
                      <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black ${item.id === 'messages' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : ''}`} style={item.id !== 'messages' ? { backgroundColor: activeTextColor, boxShadow: `0 0 8px ${activeTextColor}` } : {}}></div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest hidden xl:inline">{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-lg" style={{ backgroundColor: activeTextColor, boxShadow: `0 0 8px ${activeTextColor}` }}></div>
                  )}
                </button>

                {item.id === 'feed' && (
                  <div className="relative">
                    <button
                      onClick={() => setIsStableSubMenuOpen(!isStableSubMenuOpen)}
                      className={`px-3 py-2 rounded-xl transition-all relative flex items-center space-x-2 group ${
                        activeTab === 'stable' || activeTab === 'join-stable'
                        ? 'bg-white/5' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                      }`}
                      style={activeTab === 'stable' || activeTab === 'join-stable' ? { color: activeTextColor, backgroundColor: activeBgColor } : {}}
                    >
                      <div className="relative">
                        <Briefcase size={18} />
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-widest hidden xl:inline">The Stable</span>
                      <ChevronDown size={14} className={`transition-transform duration-300 ${isStableSubMenuOpen ? 'rotate-180' : ''}`} />
                      {(activeTab === 'stable' || activeTab === 'join-stable') && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-lg" style={{ backgroundColor: activeTextColor, boxShadow: `0 0 8px ${activeTextColor}` }}></div>
                      )}
                    </button>

                    {isStableSubMenuOpen && (
                      <div className="absolute left-0 mt-3 w-48 bg-[#050505] rounded-2xl border border-[#c0c0c0]/20 shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 chrome-border z-[100]">
                        <button 
                          onClick={() => { setActiveTab('stable'); setIsStableSubMenuOpen(false); }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 transition-all ${activeTab === 'stable' ? 'text-[#967bb6] bg-white/5' : 'text-slate-300 hover:bg-[#967bb6]/10 hover:text-[#967bb6]'}`}
                        >
                          <Star size={14} />
                          <span className="text-xs font-bold uppercase tracking-widest">View Stable</span>
                        </button>
                        <button 
                          onClick={() => { setActiveTab('join-stable'); setIsStableSubMenuOpen(false); }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 transition-all ${activeTab === 'join-stable' ? 'text-[#967bb6] bg-white/5' : 'text-slate-300 hover:bg-[#967bb6]/10 hover:text-[#967bb6]'}`}
                        >
                          <Plus size={14} />
                          <span className="text-xs font-bold uppercase tracking-widest">Join Stable</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* More Videos Desktop Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMoreVideosSubMenuOpen(!isMoreVideosSubMenuOpen)}
              className="px-2 xl:px-3 py-2 rounded-xl transition-all relative flex items-center space-x-1 xl:space-x-2 group text-slate-400 hover:text-slate-100 hover:bg-white/5"
            >
              <Video size={18} />
              <span className="text-[9px] xl:text-[10px] uppercase font-black tracking-widest whitespace-nowrap hidden xl:inline">More Videos</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isMoreVideosSubMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreVideosSubMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-[#050505] rounded-2xl border border-[#c0c0c0]/20 shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 chrome-border z-[100]">
                <a 
                  href="https://spankbang.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-4 py-3 text-slate-300 hover:bg-[#967bb6]/10 hover:text-[#967bb6] transition-all border-b border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest">SpankBang</span>
                    <span className="text-[8px] text-[#967bb6] font-black uppercase tracking-widest">Affiliate Link</span>
                  </div>
                  <ExternalLink size={14} />
                </a>
                <a 
                  href="https://xvideos.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-4 py-3 text-slate-300 hover:bg-[#967bb6]/10 hover:text-[#967bb6] transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest">XVideos</span>
                    <span className="text-[8px] text-[#967bb6] font-black uppercase tracking-widest">Affiliate Link</span>
                  </div>
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>

          {/* Game$ Desktop Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsGamesSubMenuOpen(!isGamesSubMenuOpen)}
              className="px-3 py-2 rounded-xl transition-all relative flex items-center space-x-2 group text-slate-400 hover:text-slate-100 hover:bg-white/5"
            >
              <Dices size={18} />
              <span className="text-[10px] uppercase font-black tracking-widest hidden xl:inline">Game$</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isGamesSubMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isGamesSubMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-[#050505] rounded-2xl border border-[#c0c0c0]/20 shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 chrome-border z-[100]">
                <a 
                  href="https://www.crowncoins.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-4 py-3 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all border-b border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest">Crown Coins</span>
                    <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Affiliate Link</span>
                  </div>
                  <ExternalLink size={14} />
                </a>
                <a 
                  href="https://pulse.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-4 py-3 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest">Pulse</span>
                    <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Affiliate Link</span>
                  </div>
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={onOpenCreate}
          className="bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white p-2 lg:px-4 lg:py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#967bb6]/20 transition-all hover:scale-105 active:scale-95 chrome-border flex items-center space-x-2"
        >
          <Plus size={18} />
          <span className="hidden lg:inline">Create</span>
        </button>

        <div className="w-px h-8 bg-white/10 mx-1 hidden lg:block"></div>

        <div className="relative">
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`p-0.5 rounded-2xl border-2 transition-all shrink-0 flex items-center space-x-2 ${isProfileMenuOpen ? 'border-[#967bb6] shadow-lg shadow-[#967bb6]/20' : 'border-transparent hover:border-white/20'}`}
          >
            <img 
              src={userAvatar || APP_LOGO_URL} 
              referrerPolicy="no-referrer" 
              className="w-8 h-8 rounded-[14px] object-cover" 
              alt="Profile" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/bear/400/400';
              }}
            />
            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-[#050505] rounded-2xl border border-[#c0c0c0]/20 shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 chrome-border">
              <div className="relative">
                <button 
                  onClick={() => setIsEditProfileSubMenuOpen(!isEditProfileSubMenuOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-slate-300 hover:bg-[#967bb6]/10 hover:text-[#967bb6] transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <UserIcon size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Edit Profile</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isEditProfileSubMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isEditProfileSubMenuOpen && (
                  <div className="bg-white/5 py-1 animate-in slide-in-from-top-1 duration-200">
                    <button 
                      onClick={() => { onViewPublicProfile(); setIsProfileMenuOpen(false); setIsEditProfileSubMenuOpen(false); }}
                      className="w-full flex items-center space-x-3 px-8 py-2 text-slate-400 hover:text-[#967bb6] transition-all"
                    >
                      <ExternalLink size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">View Public Profile</span>
                    </button>
                    <button 
                      onClick={() => { setActiveTab('more'); setIsProfileMenuOpen(false); setIsEditProfileSubMenuOpen(false); }}
                      className="w-full flex items-center space-x-3 px-8 py-2 text-slate-400 hover:text-[#967bb6] transition-all"
                    >
                      <Plus size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">More</span>
                    </button>
                    <button 
                      onClick={() => { setActiveTab('profile-edit'); setIsProfileMenuOpen(false); setIsEditProfileSubMenuOpen(false); }}
                      className="w-full flex items-center space-x-3 px-8 py-2 text-slate-400 hover:text-[#967bb6] transition-all"
                    >
                      <Settings size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Edit Details</span>
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => { setActiveTab('custom-profile'); setIsProfileMenuOpen(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-[#967bb6]/10 hover:text-[#967bb6] transition-all"
              >
                <Palette size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Custom Profile</span>
              </button>

              <button 
                onClick={() => { setActiveTab('settings'); setIsProfileMenuOpen(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-[#967bb6]/10 hover:text-[#967bb6] transition-all"
              >
                <Settings size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Settings</span>
              </button>
              <div className="h-px bg-white/5 my-1 mx-2"></div>
              <button 
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
              </button>
              <div className="px-4 py-2 text-center">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-700">www.sharebares.com</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bg-[#050505] z-40 lg:hidden border-b border-white/10 shadow-2xl animate-in slide-in-from-top duration-300">
            <div className="p-6 space-y-4">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search profiles, stores, stable..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#967bb6]"
                />

                    {/* Mobile Search Results */}
                    {showResults && searchQuery.length > 1 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#050505] rounded-2xl border border-[#c0c0c0]/20 shadow-2xl py-3 overflow-hidden chrome-border z-50 max-h-[50vh] overflow-y-auto">
                        {filteredUsers.length > 0 && (
                          <div className="mb-4">
                            <div className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[#967bb6] mb-1">Profiles</div>
                            {filteredUsers.map(u => (
                              <button
                                key={`mob-u-${u.id}`}
                                onClick={() => {
                                  navigateToProfile(u.id);
                                  setShowResults(false);
                                  setSearchQuery('');
                                  setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-[#967bb6]/10 transition-all text-left"
                              >
                                <img 
                                  src={u.avatar || undefined} 
                                  referrerPolicy="no-referrer" 
                                  className="w-8 h-8 rounded-lg object-cover" 
                                  alt="" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = APP_LOGO_URL;
                                  }}
                                />
                                <div>
                                  <p className="text-xs font-bold text-white">{u.displayName}</p>
                                  <p className="text-[10px] text-slate-500">@{u.username}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {filteredStoreItems.length > 0 && (
                          <div className="mb-4">
                            <div className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Store Items</div>
                            {filteredStoreItems.map(item => (
                              <button
                                key={`mob-store-item-${item.id}`}
                                onClick={() => {
                                  const owner = users.find(u => u.id === item.userId);
                                  if (owner) navigateToProfile(owner.id);
                                  setShowResults(false);
                                  setSearchQuery('');
                                  setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-emerald-500/10 transition-all text-left"
                              >
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                                  {item.thumbnailUrl ? (
                                    <img 
                                      src={item.thumbnailUrl} 
                                      referrerPolicy="no-referrer" 
                                      className="w-full h-full object-cover" 
                                      alt="" 
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = APP_LOGO_URL;
                                      }}
                                    />
                                  ) : (
                                    <Briefcase size={14} className="text-emerald-500" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white truncate max-w-[200px]">{item.title}</p>
                                  <p className="text-[10px] text-slate-500">${item.price}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {filteredStable.length > 0 && (
                          <div className="mb-2">
                            <div className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">The Stable</div>
                            {filteredStable.map(l => (
                              <button
                                key={`mob-stable-${l.id}`}
                                onClick={() => {
                                  setActiveTab('stable');
                                  setShowResults(false);
                                  setSearchQuery('');
                                  setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-amber-500/10 transition-all text-left"
                              >
                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                  <Star size={14} className="text-amber-500" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">{l.providerName}</p>
                                  <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{l.city}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {filteredUsers.length === 0 && filteredStoreItems.length === 0 && filteredStable.length === 0 && (
                          <div className="px-4 py-8 text-center">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No results found</p>
                          </div>
                        )}
                      </div>
                    )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const hasUnread = (item.id === 'messages' && hasUnreadMessages) || (item.id === 'notifications' && hasUnreadNotifications);
                  const badgeColor = item.id === 'messages' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-[#967bb6] shadow-[0_0_8px_#967bb6]';
                  
                  return (
                    <React.Fragment key={item.id}>
                      <button
                        onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                        className={`flex items-center space-x-4 p-4 rounded-2xl transition-all relative ${
                          isActive 
                          ? 'bg-[#967bb6]/10 text-[#967bb6] border border-[#967bb6]/20' 
                          : 'text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        <div className="relative">
                          <Icon size={24} />
                          {hasUnread && (
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${badgeColor}`}></div>
                          )}
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                      </button>

                      {item.id === 'feed' && (
                        <div className="pt-0">
                          <button
                            onClick={() => setIsStableMobileOpen(!isStableMobileOpen)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all relative ${
                              activeTab === 'stable' || activeTab === 'join-stable'
                              ? 'bg-[#967bb6]/10 text-[#967bb6] border border-[#967bb6]/20' 
                              : 'text-slate-400 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <Briefcase size={24} />
                              <span className="text-sm font-black uppercase tracking-widest">The Stable</span>
                            </div>
                            <ChevronDown size={18} className={`transition-transform duration-300 ${isStableMobileOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isStableMobileOpen && (
                            <div className="mt-2 ml-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                              <button 
                                onClick={() => { setActiveTab('stable'); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'stable' ? 'bg-[#967bb6]/20 text-[#967bb6]' : 'bg-white/5 text-slate-300'}`}
                              >
                                <Star size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">View Stable</span>
                              </button>
                              <button 
                                onClick={() => { setActiveTab('join-stable'); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === 'join-stable' ? 'bg-[#967bb6]/20 text-[#967bb6]' : 'bg-white/5 text-slate-300'}`}
                              >
                                <Plus size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Join Stable</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                <div className="pt-2">
                  <button
                    onClick={() => setIsMoreVideosMobileOpen(!isMoreVideosMobileOpen)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all relative ${
                      isMoreVideosMobileOpen 
                      ? 'bg-[#967bb6]/10 text-[#967bb6] border border-[#967bb6]/20' 
                      : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Video size={24} />
                      <span className="text-sm font-black uppercase tracking-widest">More Videos</span>
                    </div>
                    <ChevronDown size={18} className={`transition-transform duration-300 ${isMoreVideosMobileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMoreVideosMobileOpen && (
                    <div className="mt-2 ml-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <a 
                        href="https://spankbang.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-widest">SpankBang</span>
                          <span className="text-[8px] text-[#967bb6] font-black uppercase tracking-widest">Affiliate Link</span>
                        </div>
                        <ExternalLink size={14} />
                      </a>
                      <a 
                        href="https://xvideos.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-widest">XVideos</span>
                          <span className="text-[8px] text-[#967bb6] font-black uppercase tracking-widest">Affiliate Link</span>
                        </div>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsGamesSubMenuOpen(!isGamesSubMenuOpen)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all relative ${
                      isGamesSubMenuOpen 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Dices size={24} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest">Game$</span>
                    </div>
                    <ChevronDown size={18} className={`transition-transform duration-300 ${isGamesSubMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isGamesSubMenuOpen && (
                    <div className="mt-2 ml-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <a 
                        href="https://www.crowncoins.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-widest">Crown Coins</span>
                          <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Affiliate Link</span>
                        </div>
                        <ExternalLink size={14} />
                      </a>
                      <a 
                        href="https://pulse.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-widest">Pulse</span>
                          <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Affiliate Link</span>
                        </div>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default TopNav;
