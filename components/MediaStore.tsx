import React, { useState } from 'react';
import { ShoppingBag, Play, Image as ImageIcon, DollarSign, ArrowLeft, Briefcase, Shield, Trash2, X, Download, Lock, Check } from 'lucide-react';
import { User, StoreItem, StableListing } from '../types';
import { toast } from 'sonner';
import { StoreItemSkeleton } from './Skeleton';
import { APP_LOGO_URL } from '../constants';
import AdPlaceholder from './AdPlaceholder';
import VideoPlayer from './VideoPlayer';

interface MediaStoreProps {
  user: User; // The store owner
  currentUser: User; // The visitor
  items: StoreItem[];
  stableListings?: StableListing[];
  isOwnStore: boolean;
  isAdmin?: boolean;
  isLoading?: boolean;
  storeOwnerId?: string;
  onBack: () => void;
  onDeleteItem?: (itemId: string) => void;
  onProfileClick?: (userId: string) => void;
  onBuyItem?: (item: StoreItem) => void;
}

const MediaStore: React.FC<MediaStoreProps> = ({ user, currentUser, items, stableListings = [], isOwnStore, isAdmin, isLoading, storeOwnerId, onBack, onDeleteItem, onProfileClick, onBuyItem }) => {
  const customization = user.storeCustomization || {
    backgroundColor: '#000000',
    accentColor: '#967bb6',
    fontFamily: 'Inter',
    fontColor: '#ffffff',
    layout: 'grid'
  };
  const [activeSection, setActiveSection] = useState<'all' | 'videos' | 'packs' | 'other' | 'services'>('all');
  const [activePurchaseItem, setActivePurchaseItem] = useState<StoreItem | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [isSubmitAccess, setIsSubmitAccess] = useState(false);

  const handleConfirmDirectPayment = async () => {
    if (!activePurchaseItem) return;
    if (!paymentRef.trim()) {
      toast.error('Please enter your payment reference, Cash Tag, or transaction ID.');
      return;
    }
    
    setIsSubmitAccess(true);
    const toastId = toast.loading('Submitting payment request to creator...');
    try {
      // Direct user-to-user unlock simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onBuyItem) {
        await onBuyItem(activePurchaseItem);
      }
      setActivePurchaseItem(null);
      setPaymentRef('');
      toast.success('Access confirmed! Media has been unlocked in your permanent collection.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Could not unlock media. Please try again.', { id: toastId });
    } finally {
      setIsSubmitAccess(false);
    }
  };

  const filteredItems = items.filter(item => {
    // If viewing a specific store, filter items not matching that owner
    if (storeOwnerId && item.userId !== storeOwnerId) return false;

    if (activeSection === 'all') return true;
    if (activeSection === 'videos') return item.type === 'video';
    if (activeSection === 'packs') return item.type === 'picture_pack';
    if (activeSection === 'other') return item.type === 'other';
    return true;
  });

  const videos = filteredItems.filter(i => (i.type as string) === 'video');
  const packs = filteredItems.filter(i => i.type === 'picture_pack' || (i.type as string) === 'image' || (i.type as string) === 'pictures');
  const other = filteredItems.filter(i => (i.type as string) === 'other');

  return (
    <div className="min-h-screen pb-20 transition-all duration-500" style={{ backgroundColor: customization.backgroundColor, color: customization.fontColor, fontFamily: customization.fontFamily }}>
      {/* Neon Header */}
      <div className="relative h-64 flex flex-col items-center justify-center overflow-hidden border-b border-white/5" style={{ borderColor: `${customization.accentColor}20` }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${customization.accentColor}20, transparent 70%)` }}></div>
        
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 p-3 rounded-2xl transition-all chrome-border flex items-center space-x-2"
          style={{ backgroundColor: '#000000', color: '#967bb6' }}
        >
          <ArrowLeft size={20} />
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>

        <div className="relative z-10 text-center px-4">
          <h1 
            className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2 animate-pulse cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onProfileClick?.(user.id)}
          >
            <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ color: customization.fontColor, textShadow: `0 0 10px ${customization.accentColor}` }}>
              {user.displayName || user.username}'s
            </span>
          </h1>
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic">
            <span className="drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" style={{ color: customization.fontColor, textShadow: `0 0 20px ${customization.accentColor}` }}>
              Store
            </span>
          </h2>
        </div>
        
        {/* Decorative Grid */}
        <div className="absolute bottom-0 w-full h-px" style={{ background: `linear-gradient(to right, transparent, ${customization.accentColor}, transparent)` }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Placement displaying the user's payment info */}
        {(user.cashAppTag || user.payPalUsername) && (
          <div className="mb-10 p-6 rounded-[2rem] bg-black/40 border border-emerald-500/20 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <DollarSign className="text-emerald-500" size={24} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black uppercase tracking-wider text-white">Direct Creator Payment Info</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Pay this creator directly for media file unlocks with 0% platform cuts</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {user.cashAppTag && (
                <div className="bg-emerald-500/15 border border-emerald-500/30 px-5 py-3 rounded-2xl flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Cash App:</span>
                  <span className="text-xs font-mono font-black text-white">{user.cashAppTag}</span>
                </div>
              )}
              {user.payPalUsername && (
                <div className="bg-blue-500/15 border border-blue-500/30 px-5 py-3 rounded-2xl flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">PayPal:</span>
                  <span className="text-xs font-mono font-black text-white">@{user.payPalUsername}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 space-y-6 md:space-y-0">
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveSection('all')}
              className="px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg"
              style={{ backgroundColor: '#000000', color: '#967bb6', opacity: activeSection === 'all' ? 1 : 0.5 }}
            >
              All Content
            </button>
            <button 
              onClick={() => setActiveSection('videos')}
              className="px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg"
              style={{ backgroundColor: '#000000', color: '#967bb6', opacity: activeSection === 'videos' ? 1 : 0.5 }}
            >
              Videos
            </button>
            <button 
              onClick={() => setActiveSection('packs')}
              className="px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg"
              style={{ backgroundColor: '#000000', color: '#967bb6', opacity: activeSection === 'packs' ? 1 : 0.5 }}
            >
              Packs
            </button>
            <button 
              onClick={() => setActiveSection('other')}
              className="px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg"
              style={{ backgroundColor: '#000000', color: '#967bb6', opacity: activeSection === 'other' ? 1 : 0.5 }}
            >
              Other
            </button>
            {stableListings.length > 0 && (
              <button 
                onClick={() => setActiveSection('services')}
                className="px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg"
                style={{ backgroundColor: '#000000', color: '#967bb6', opacity: activeSection === 'services' ? 1 : 0.5 }}
              >
                Escort Services
              </button>
            )}
          </div>
        </div>

        {/* Content Sections */}
        {!user.isStoreActive && !isOwnStore ? (
          <div className="glass-panel rounded-[3rem] p-20 text-center border-dashed border-white/10 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-slate-700" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Store Opening Soon</h3>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
              {user.displayName || user.username} is currently setting up their storefront.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <StoreItemSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Videos Section */}
            {(activeSection === 'all' || activeSection === 'videos') && (
          <div className="mb-16">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: `${customization.accentColor}20`, color: customization.accentColor }}>
                <Play size={24} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight" style={{ color: customization.fontColor }}>Videos</h3>
              <div className="flex-grow h-px bg-white/5"></div>
            </div>
            
            {videos.length > 0 ? (
              <div className={`grid gap-8 ${
                customization.layout === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                customization.layout === 'list' ? 'grid-cols-1' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {videos.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <StoreCard 
                      item={item} 
                      isAdmin={isAdmin} 
                      isOwnItem={isOwnStore}
                      isPurchased={currentUser.purchasedItemIds?.includes(item.id)}
                      customization={customization} 
                      onDelete={(isOwnStore || isAdmin) ? () => onDeleteItem?.(item.id) : undefined} 
                      onBuy={() => setActivePurchaseItem(item)}
                    />
                    {index === 3 && customization.layout === 'grid' && <AdPlaceholder size="md" className="sm:col-span-2 lg:col-span-1" />}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-[2rem] p-12 text-center border-dashed border-white/10">
                <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No videos available</p>
              </div>
            )}
          </div>
        )}

        {/* Picture Packs Section */}
        {(activeSection === 'all' || activeSection === 'packs') && (
          <div className="mb-16">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: `${customization.accentColor}20`, color: customization.accentColor }}>
                <ImageIcon size={24} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight" style={{ color: customization.fontColor }}>Pictures & Packs</h3>
              <div className="flex-grow h-px bg-white/5"></div>
            </div>
            
            {packs.length > 0 ? (
              <div className={`grid gap-8 ${
                customization.layout === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                customization.layout === 'list' ? 'grid-cols-1' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {packs.map(item => (
                  <StoreCard 
                    key={item.id} 
                    item={item} 
                    isAdmin={isAdmin}
                    isOwnItem={isOwnStore}
                    isPurchased={currentUser.purchasedItemIds?.includes(item.id)}
                    customization={customization} 
                    onDelete={(isOwnStore || isAdmin) ? () => onDeleteItem?.(item.id) : undefined} 
                    onBuy={() => setActivePurchaseItem(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-[2rem] p-12 text-center border-dashed border-white/10">
                <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No picture packs available</p>
              </div>
            )}
          </div>
        )}

        {/* Other Media Section */}
        {(activeSection === 'all' || activeSection === 'other') && (
          <div className="mb-16">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: `${customization.accentColor}20`, color: customization.accentColor }}>
                <ShoppingBag size={24} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight" style={{ color: customization.fontColor }}>Other Media</h3>
              <div className="flex-grow h-px bg-white/5"></div>
            </div>
            
            {other.length > 0 ? (
              <div className={`grid gap-8 ${
                customization.layout === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                customization.layout === 'list' ? 'grid-cols-1' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {other.map(item => (
                  <StoreCard 
                    key={item.id} 
                    item={item} 
                    isAdmin={isAdmin}
                    isOwnItem={isOwnStore}
                    isPurchased={currentUser.purchasedItemIds?.includes(item.id)}
                    customization={customization} 
                    onDelete={(isOwnStore || isAdmin) ? () => onDeleteItem?.(item.id) : undefined} 
                    onBuy={() => setActivePurchaseItem(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-[2rem] p-12 text-center border-dashed border-white/10">
                <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No other media available</p>
              </div>
            )}
          </div>
        )}

        {/* Escort Services Section - Smaller and at the bottom */}
        {(activeSection === 'all' || activeSection === 'services') && stableListings.length > 0 && (
          <div className="mt-24 pt-12 border-t border-white/5">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-2 rounded-xl" style={{ backgroundColor: `${customization.accentColor}20`, color: customization.accentColor }}>
                <Briefcase size={20} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: customization.fontColor }}>Escort Services</h3>
              <div className="flex-grow h-px bg-white/5"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stableListings.map((listing) => (
                <div key={listing.id} className="glass-panel rounded-[2rem] p-5 shadow-xl relative overflow-hidden chrome-border group transition-all duration-500 flex gap-5" style={{ backgroundColor: `${customization.accentColor}05`, borderColor: `${customization.accentColor}20` }}>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                    <img 
                      src={listing.photos?.[0] || listing.avatarUrl} 
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
                  <div className="flex-grow flex flex-col min-w-0">
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-sm font-black tracking-tight uppercase truncate" style={{ color: customization.fontColor }}>{listing.providerName}</h4>
                      </div>
                      <div className="flex items-center space-x-1.5" style={{ color: customization.accentColor }}>
                        <Shield size={10} />
                        <span className="text-[7px] font-black uppercase tracking-widest">Stable Member</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-400 text-[10px] leading-tight line-clamp-2 mb-3">{listing.services}</p>

                    <div className="mt-auto pt-2 border-t border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">{listing.providerGender}</span>
                        <span className="font-bold text-[9px] break-all ml-2" style={{ color: customization.accentColor }}>{listing.contactInfo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )}
  </div>

      {/* Direct User-to-User Payment Flow Modal */}
      {activePurchaseItem && (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl bg-[#0d0d0d] rounded-[3rem] border border-white/10 shadow-2xl p-8 my-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto theme-border text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-emerald-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-white tracking-tight">Direct Access Unlock</h3>
                  <p className="text-[9px] font-black uppercase text-[#967bb6] tracking-widest mt-0.5">Pay the creator directly</p>
                </div>
              </div>
              <button 
                onClick={() => { setActivePurchaseItem(null); setPaymentRef(''); }}
                className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Product Details Card */}
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                <img 
                  src={activePurchaseItem.thumbnailUrl || APP_LOGO_URL} 
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
              <div className="min-w-0 flex-grow">
                <h4 className="text-sm font-black text-white uppercase truncate">{activePurchaseItem.title}</h4>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">
                  {activePurchaseItem.type === 'video' ? 'Video' : activePurchaseItem.type === 'picture_pack' ? 'Picture Pack' : 'Media File'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest block">Price</span>
                <span className="text-xl font-mono font-black text-emerald-400">${activePurchaseItem.price?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            {/* Instruction block */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step 1: Send payment to creator</h5>
              
              {/* Creator credentials */}
              {(!user.cashAppTag && !user.payPalUsername) ? (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-red-400 font-bold text-xs uppercase tracking-wide leading-relaxed">
                    ⚠️ This user has not configured their Cash App tag or PayPal username. Please contact them or try again later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {user.cashAppTag && (
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[8px] font-black uppercase text-emerald-500 tracking-wider block">Option A: Cash App</span>
                        <span className="text-base font-black text-white font-mono mt-0.5 block">{user.cashAppTag}</span>
                      </div>
                      <button 
                        onClick={() => {
                          const tag = user.cashAppTag || '';
                          navigator.clipboard.writeText(tag);
                          toast.success('Cash App tag copied!');
                        }}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-black uppercase text-[9px] tracking-wider rounded-xl transition-all active:scale-95 ml-auto"
                      >
                        Copy Tag
                      </button>
                    </div>
                  )}

                  {user.payPalUsername && (
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-blue-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[8px] font-black uppercase text-blue-400 tracking-wider block">Option B: PayPal</span>
                        <span className="text-base font-black text-white font-mono mt-0.5 block">@{user.payPalUsername}</span>
                      </div>
                      <button 
                        onClick={() => {
                          const un = user.payPalUsername || '';
                          navigator.clipboard.writeText(`https://paypal.me/${un}`);
                          toast.success('PayPal link copied!');
                        }}
                        className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-black uppercase text-[9px] tracking-wider rounded-xl transition-all active:scale-95 ml-auto"
                      >
                        Copy Link
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input reference */}
            {(user.cashAppTag || user.payPalUsername) && (
              <div className="space-y-4 pt-2 border-t border-white/5">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step 2: Submit payment confirmation</h5>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 ml-1">Your payment reference, receipt details, or account name</label>
                  <input 
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. Sent by $JohnDoe / Paypal Ref #123456"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all chrome-border placeholder-white/20 font-bold"
                  />
                  <p className="text-[8px] text-slate-500 font-semibold uppercase leading-relaxed tracking-wider ml-1 mt-1">
                    Please provide the exact sender name or reference so the seller can verify.
                  </p>
                </div>

                {/* Confirm Unlock Button */}
                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    onClick={handleConfirmDirectPayment}
                    disabled={isSubmitAccess}
                    className="w-full bg-[#967bb6] hover:bg-[#856ca5] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-2 animate-pulse"
                  >
                    {isSubmitAccess ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Requesting Access...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>I Have Paid - Unlock Content</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => { setActivePurchaseItem(null); setPaymentRef(''); }}
                    className="w-full bg-white/5 border border-white/10 text-slate-400 hover:text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes neonFlow {
          0%, 100% {
            text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 20px #967bb6, 0 0 30px #967bb6, 0 0 40px #967bb6;
            color: #fff;
          }
          50% {
            text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 40px #6b46c1, 0 0 60px #6b46c1, 0 0 80px #6b46c1;
            color: #f3e8ff;
          }
        }
        @keyframes neonFlowIntense {
          0%, 100% {
            text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #967bb6, 0 0 40px #967bb6, 0 0 70px #967bb6, 0 0 80px #967bb6, 0 0 100px #967bb6;
          }
          50% {
            text-shadow: 0 0 15px #fff, 0 0 30px #fff, 0 0 45px #6b46c1, 0 0 60px #6b46c1, 0 0 90px #6b46c1, 0 0 100px #6b46c1, 0 0 130px #6b46c1;
          }
        }
        .neon-purple-glow {
          animation: neonFlow 3s ease-in-out infinite;
        }
        .neon-purple-glow-intense {
          animation: neonFlowIntense 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

const StoreCard: React.FC<{ item: StoreItem; isAdmin?: boolean; isOwnItem?: boolean; isPurchased?: boolean; customization: any; onDelete?: () => void; onBuy?: () => void }> = ({ item, isAdmin, isOwnItem, isPurchased, customization, onDelete, onBuy }) => {
  const [showFull, setShowFull] = useState(false);
  const canView = isPurchased || isOwnItem || isAdmin;

  const [videoPoster, setVideoPoster] = useState<string | undefined>(item.thumbnailUrl);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canView) return;
    
    item.mediaUrls?.forEach((url, index) => {
      const absoluteUrl = getMediaUrl(url);
      fetch(absoluteUrl)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${item.title.replace(/\s+/g, '_')}_${index + 1}${absoluteUrl.match(/\.[0-9a-z]+$/i)?.[0] || ''}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        })
        .catch(err => {
          console.error('Download failed:', err);
          // Fallback to simple link
          const link = document.createElement('a');
          link.href = absoluteUrl;
          link.target = '_blank';
          link.download = item.title;
          link.click();
        });
    });
  };

  const getMediaUrl = (url: string) => {
    if (!url) return APP_LOGO_URL;
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  const isVideo = item.type === 'video' || (item.mediaUrls?.[0] && (
    item.mediaUrls[0].split('?')[0].match(/\.(mp4|mov|webm|ogg|m4v|avi|mkv|flv|wmv|3gp|MP4|MOV|WEBM|MKV|AVI|3GP|OGG|WMV|FLV|M4V|MPG|MPEG|M2V|ASF|AMV)$/i) || 
    item.mediaUrls[0].toLowerCase().includes('video') ||
    (item.mediaUrls[0].toLowerCase().includes('firebasestorage') && (item.mediaUrls[0].toLowerCase().includes('%2Fvideo') || item.mediaUrls[0].toLowerCase().includes('video%2F') || item.mediaUrls[0].toLowerCase().includes('video')))
  ));

  const isExplicitVideo = item.type === 'video';
  
  const finalIsVideo = isVideo || isExplicitVideo;

  return (
    <div className={`group ${customization.layout === 'list' ? 'flex items-center space-x-8 p-6 rounded-[2.5rem] border border-white/5 bg-white/[0.02]' : ''}`}>
      <div 
        onClick={() => canView ? setShowFull(true) : onBuy?.()}
        className={`relative overflow-hidden border border-white/5 chrome-border bg-[#0a0a0a] transition-all duration-500 ${
          customization.layout === 'list' ? 'w-48 h-48 rounded-3xl shrink-0' : 'aspect-[4/5] rounded-[2rem] mb-4'
        } cursor-pointer`}
      >
        {finalIsVideo && canView ? (
          <div className="w-full h-full relative">
            <VideoPlayer 
              src={getMediaUrl(item.mediaUrls[0])} 
              poster={getMediaUrl(item.thumbnailUrl)}
              className="w-full h-full"
              muted
              autoPlay={false}
              controls={false}
            />
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
              <Play size={32} className="text-white opacity-50" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <img 
              src={getMediaUrl(item.thumbnailUrl)} 
              alt={item.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${canView ? 'group-hover:scale-110' : ''} ${!canView ? 'blur-sm grayscale' : ''}`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== APP_LOGO_URL) {
                  target.src = APP_LOGO_URL;
                }
              }}
            />
            {finalIsVideo && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                <Play size={32} className="text-white opacity-50" />
              </div>
            )}
            {!canView && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                <Lock size={32} className="text-white/30" />
              </div>
            )}
          </div>
        )}
        {!canView && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
            <Lock size={40} className="text-[#967bb6] mb-4 opacity-50" />
            <h5 className="text-white font-black uppercase tracking-widest text-xs mb-2">Locked Content</h5>
            <button 
              onClick={(e) => { e.stopPropagation(); onBuy?.(); }}
              className="px-6 py-3 bg-[#967bb6] text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Unlock Now
            </button>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
        
        <div className="absolute top-4 right-4 flex flex-col space-y-2 items-end">
          <div className="flex flex-col space-y-2 items-end">
            <button 
              onClick={handleDownload}
              className="p-2 bg-black/60 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center space-x-1"
              title="Download"
            >
              <Download size={14} />
              <span className="text-[10px] font-black uppercase">Save</span>
            </button>
          </div>
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
              title={isAdmin ? "Delete Item (Admin)" : "Delete Item"}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {finalIsVideo && (
          <div 
            onClick={() => setShowFull(true)}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110" 
            style={{ backgroundColor: customization.accentColor, boxShadow: `0 0 30px ${customization.accentColor}60` }}
          >
            <Play size={24} className="text-white fill-current ml-1" />
          </div>
        )}

      </div>
      <div className={`px-2 ${customization.layout === 'list' ? 'flex-grow' : ''}`}>
        <h4 
          className="font-black uppercase tracking-tight text-sm mb-1 line-clamp-1 cursor-pointer hover:opacity-80 transition-opacity" 
          style={{ color: customization.fontColor }}
          onClick={() => canView ? setShowFull(true) : onBuy?.()}
        >
          {item.title}
        </h4>
        {item.description && (
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: customization.accentColor }}>
          {item.type === 'video' ? 'Video Content' : item.type === 'picture_pack' ? '5 Picture Pack' : 'Media Content'}
        </p>
      </div>

      {showFull && canView && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-black rounded-[3rem] overflow-hidden chrome-border shadow-2xl flex flex-col">
            <div className="flex-grow overflow-auto p-8 flex flex-wrap items-center justify-center gap-8">
              {item.mediaUrls.map((url, idx) => {
                const absoluteUrl = getMediaUrl(url);
                const isItemVideo = absoluteUrl.split('?')[0].match(/\.(mp4|mov|webm|ogg|m4v|avi|MP4|MOV|WEBM)$/i) || 
                                   absoluteUrl.toLowerCase().includes('video') ||
                                   (absoluteUrl.toLowerCase().includes('firebasestorage') && absoluteUrl.toLowerCase().includes('%2Fvideo'));
                
                return isItemVideo ? (
                  <div key={idx} className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
                    <VideoPlayer 
                      src={absoluteUrl} 
                      poster={getMediaUrl(item.thumbnailUrl)}
                      autoPlay={idx === 0} 
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <img 
                    key={idx} 
                    src={absoluteUrl} 
                    className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl transition-transform hover:scale-[1.02]" 
                    alt={`${item.title} ${idx + 1}`} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== APP_LOGO_URL) {
                        target.src = APP_LOGO_URL;
                      }
                    }}
                  />
                );
              })}
            </div>
            
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
              <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                <h3 className="text-white font-black uppercase tracking-tighter">{item.title}</h3>
              </div>
              
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleDownload}
                  className="p-3 bg-white/10 text-white rounded-2xl hover:bg-emerald-500 transition-all flex items-center space-x-2"
                >
                  <Download size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Download</span>
                </button>
                <button 
                  onClick={() => setShowFull(false)}
                  className="p-3 bg-black/60 text-white rounded-2xl hover:bg-red-500 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaStore;
