import React, { useState } from 'react';
import { ShoppingBag, Play, Image as ImageIcon, DollarSign, ArrowLeft, Briefcase, Shield, Trash2, Plus, X, Upload, Check, Download, AlertCircle } from 'lucide-react';
import { User, StoreItem, StableListing } from '../types';
import AdPlaceholder from './AdPlaceholder';

interface MediaStoreProps {
  user: User;
  items: StoreItem[];
  stableListings?: StableListing[];
  isOwnStore: boolean;
  isAdmin?: boolean;
  purchasedItemIds?: string[];
  onBack: () => void;
  onPurchase?: (item: StoreItem) => void;
  onDeleteItem?: (itemId: string) => void;
  onAddItem?: (item: Omit<StoreItem, 'id' | 'userId' | 'createdAt'>, files: File[]) => void;
  onProfileClick?: (userId: string) => void;
}

const MediaStore: React.FC<MediaStoreProps> = ({ user, items, stableListings = [], isOwnStore, isAdmin, purchasedItemIds = [], onBack, onPurchase, onDeleteItem, onAddItem, onProfileClick }) => {
  const customization = user.storeCustomization || {
    backgroundColor: '#000000',
    accentColor: '#967bb6',
    fontFamily: 'Inter',
    fontColor: '#ffffff',
    layout: 'grid'
  };
  const [activeSection, setActiveSection] = useState<'all' | 'videos' | 'packs' | 'other' | 'services'>('all');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('10.00');
  const [newItemFiles, setNewItemFiles] = useState<File[]>([]);
  const [newItemType, setNewItemType] = useState<'video' | 'picture_pack' | 'other'>('video');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      setUploadError(null);

      if (newItemType === 'video') {
        const videoFile = selectedFiles[0];
        if (videoFile && videoFile.type.startsWith('video')) {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            if (video.duration > 480) {
              setUploadError('Video must be 8 minutes or less.');
              setNewItemFiles([]);
            } else {
              setNewItemFiles([videoFile]);
            }
          };
          video.src = URL.createObjectURL(videoFile);
        } else {
          setUploadError('Please select a valid video file.');
        }
      } else if (newItemType === 'picture_pack') {
        if (selectedFiles.length !== 5) {
          setUploadError('A picture pack must contain exactly 5 photos.');
          setNewItemFiles([]);
        } else {
          const allImages = selectedFiles.every(f => f.type.startsWith('image'));
          if (!allImages) {
            setUploadError('All files in a picture pack must be images.');
            setNewItemFiles([]);
          } else {
            setNewItemFiles(selectedFiles);
          }
        }
      } else {
        setNewItemFiles(selectedFiles);
      }
    }
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemFiles.length === 0 || !newItemTitle || !newItemPrice || uploadError) return;
    
    onAddItem?.({
      title: newItemTitle,
      description: newItemDescription,
      price: parseFloat(newItemPrice),
      thumbnailUrl: '', // Will be handled by parent
      mediaUrls: [], // Will be handled by parent
      type: newItemType
    }, newItemFiles);

    setIsAddingItem(false);
    setNewItemTitle('');
    setNewItemDescription('');
    setNewItemPrice('10.00');
    setNewItemFiles([]);
    setUploadError(null);
  };

  const filteredItems = items.filter(item => {
    if (activeSection === 'all') return true;
    if (activeSection === 'videos') return item.type === 'video';
    if (activeSection === 'packs') return item.type === 'picture_pack';
    if (activeSection === 'other') return item.type === 'other';
    return true;
  });

  const videos = filteredItems.filter(i => i.type === 'video');
  const packs = filteredItems.filter(i => i.type === 'picture_pack');
  const other = filteredItems.filter(i => i.type === 'other');
  const pictures = filteredItems.filter(i => i.type === 'image' as any); // Legacy support if any

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

          {isOwnStore && (
            <button 
              onClick={() => setIsAddingItem(true)}
              className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center space-x-2 chrome-border"
              style={{ backgroundColor: '#000000', color: '#967bb6' }}
            >
              <Plus size={18} />
              <span>Add New Item</span>
            </button>
          )}
        </div>

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
                      isPurchased={purchasedItemIds.includes(item.id) || isOwnStore}
                      customization={customization} 
                      onPurchase={() => onPurchase?.(item)} 
                      onDelete={() => onDeleteItem?.(item.id)} 
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
              <h3 className="text-2xl font-black uppercase tracking-tight" style={{ color: customization.fontColor }}>Picture Packs</h3>
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
                    isPurchased={purchasedItemIds.includes(item.id) || isOwnStore}
                    customization={customization} 
                    onPurchase={() => onPurchase?.(item)} 
                    onDelete={() => onDeleteItem?.(item.id)} 
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
                    isPurchased={purchasedItemIds.includes(item.id) || isOwnStore}
                    customization={customization} 
                    onPurchase={() => onPurchase?.(item)} 
                    onDelete={() => onDeleteItem?.(item.id)} 
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
                    />
                  </div>
                  <div className="flex-grow flex flex-col min-w-0">
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-sm font-black tracking-tight uppercase truncate" style={{ color: customization.fontColor }}>{listing.providerName}</h4>
                        <span className="font-black text-[10px]" style={{ color: customization.accentColor }}>{listing.pricing}</span>
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
                      <p className="text-[6px] font-black uppercase tracking-[0.2em] text-slate-600 text-center italic">
                        Only serious inquiries
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add New Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0a0a0a] border border-[#c0c0c0]/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 chrome-border">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-[#967bb6]/10 to-transparent">
              <div>
                <h2 className="text-2xl font-black tracking-tighter uppercase text-white">Add Store Item</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Upload paid media to your store</p>
              </div>
              <button onClick={() => setIsAddingItem(false)} className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddItemSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-2">Content Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['video', 'picture_pack', 'other'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setNewItemType(t);
                          setNewItemFiles([]);
                          setUploadError(null);
                        }}
                        className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                          newItemType === t 
                            ? 'bg-[#967bb6] text-white border-[#967bb6]' 
                            : 'bg-white/5 text-slate-500 border-white/10'
                        }`}
                      >
                        {t.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-2">Item Title</label>
                  <input 
                    type="text" 
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="e.g. Exclusive Video Set #1"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:ring-1 focus:ring-[#967bb6] outline-none text-slate-100 placeholder:text-slate-700 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-2">Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:ring-1 focus:ring-[#967bb6] outline-none text-slate-100 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-2">Media File</label>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full h-[50px] rounded-2xl border-2 border-dashed flex items-center justify-center transition-all ${newItemFiles.length > 0 ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400' : 'border-white/10 bg-white/5 text-slate-500 hover:border-[#967bb6]/30'} ${uploadError ? 'border-red-500/50 bg-red-500/5' : ''}`}
                    >
                      {newItemFiles.length > 0 ? (
                        <div className="flex items-center space-x-2">
                          <Check size={16} />
                          <span className="text-[10px] font-black uppercase truncate max-w-[100px]">
                            {newItemType === 'picture_pack' ? `${newItemFiles.length} Photos` : newItemFiles[0].name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Upload size={16} />
                          <span className="text-[10px] font-black uppercase">Select File</span>
                        </div>
                      )}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={newItemType === 'video' ? 'video/*' : newItemType === 'picture_pack' ? 'image/*' : '*/*'}
                      multiple={newItemType === 'picture_pack'}
                      className="hidden"
                    />
                  </div>
                </div>

                {uploadError && (
                  <div className="flex items-center space-x-2 text-red-500 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{uploadError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-2">Description (Optional)</label>
                  <textarea 
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Describe what's in this item..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:ring-1 focus:ring-[#967bb6] outline-none text-slate-100 placeholder:text-slate-700 text-sm resize-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={newItemFiles.length === 0 || !newItemTitle || !!uploadError}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] chrome-border disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                style={{ backgroundColor: '#000000', color: '#967bb6' }}
              >
                Publish to Store
              </button>
            </form>
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

const StoreCard: React.FC<{ item: StoreItem; isAdmin?: boolean; isPurchased?: boolean; customization: any; onPurchase?: () => void; onDelete?: () => void }> = ({ item, isAdmin, isPurchased, customization, onPurchase, onDelete }) => {
  const [showFull, setShowFull] = useState(false);
  const canView = isAdmin || isPurchased;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    item.mediaUrls.forEach((url, index) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.title}_${index + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className={`group ${customization.layout === 'list' ? 'flex items-center space-x-8 p-6 rounded-[2.5rem] border border-white/5 bg-white/[0.02]' : ''}`}>
      <div 
        onClick={() => canView && setShowFull(true)}
        className={`relative overflow-hidden border border-white/5 chrome-border bg-[#0a0a0a] transition-all duration-500 ${
          customization.layout === 'list' ? 'w-48 h-48 rounded-3xl shrink-0' : 'aspect-[4/5] rounded-[2rem] mb-4'
        } ${canView ? 'cursor-pointer' : ''}`}
      >
        <img 
          src={canView ? item.mediaUrls[0] : item.thumbnailUrl} 
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!canView ? 'blur-sm grayscale' : ''}`} 
          alt={item.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
        
        <div className="absolute top-4 right-4 flex flex-col space-y-2 items-end">
          {!canView && (
            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center space-x-1">
              <DollarSign size={12} style={{ color: customization.accentColor }} />
              <span className="text-white font-black text-sm">{item.price}</span>
            </div>
          )}
          {canView && (
            <div className="flex flex-col space-y-2 items-end">
              <div className="bg-emerald-500/80 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center space-x-1">
                <Check size={12} className="text-white" />
                <span className="text-white font-black text-[10px] uppercase tracking-widest">Unlocked</span>
              </div>
              <button 
                onClick={handleDownload}
                className="p-2 bg-black/60 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center space-x-1"
                title="Download"
              >
                <Download size={14} />
                <span className="text-[10px] font-black uppercase">Save</span>
              </button>
            </div>
          )}
          {isAdmin && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="p-2 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
              title="Delete Item (Admin)"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {(item.type === 'video' || canView) && (
          <div className={`absolute inset-0 flex items-center justify-center ${canView ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            {item.type === 'video' ? (
              <div 
                onClick={() => canView && setShowFull(true)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl ${canView ? 'cursor-pointer hover:scale-110' : ''}`} 
                style={{ backgroundColor: customization.accentColor, boxShadow: `0 0 30px ${customization.accentColor}60` }}
              >
                <Play size={24} className="text-white fill-current ml-1" />
              </div>
            ) : isAdmin ? (
              <div className="bg-emerald-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest">
                Admin View Enabled
              </div>
            ) : null}
          </div>
        )}

        {!canView && (
          <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button 
              onClick={onPurchase}
              className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-xl"
              style={{ backgroundColor: '#000000', color: '#967bb6' }}
            >
              Unlock Now
            </button>
          </div>
        )}
      </div>
      <div className={`px-2 ${customization.layout === 'list' ? 'flex-grow' : ''}`}>
        <h4 className="font-black uppercase tracking-tight text-sm mb-1 line-clamp-1" style={{ color: customization.fontColor }}>{item.title}</h4>
        {item.description && (
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: customization.accentColor }}>
          {item.type === 'video' ? 'Video Content' : item.type === 'picture_pack' ? '5 Picture Pack' : 'Media Content'}
        </p>
        {customization.layout === 'list' && !canView && (
          <button 
            onClick={onPurchase}
            className="mt-4 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105"
            style={{ backgroundColor: '#000000', color: '#967bb6' }}
          >
            Unlock Now
          </button>
        )}
      </div>

      {showFull && canView && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-black rounded-[3rem] overflow-hidden chrome-border shadow-2xl flex flex-col">
            <div className="flex-grow overflow-auto p-8 flex flex-wrap items-center justify-center gap-4">
              {item.type === 'video' ? (
                <video src={item.mediaUrls[0]} controls autoPlay className="max-w-full max-h-full object-contain" />
              ) : (
                item.mediaUrls.map((url, idx) => (
                  <img key={idx} src={url} className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl" alt={`${item.title} ${idx + 1}`} />
                ))
              )}
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
