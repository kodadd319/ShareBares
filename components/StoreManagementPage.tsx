
import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Video, Trash2, Plus, Check, AlertCircle, Lock, ShoppingBag, Edit3, Search, X, Palette, DollarSign, CreditCard, RefreshCw } from 'lucide-react';
import { User, StoreItem } from '../types';
import { StoreItemSkeleton } from './Skeleton';
import { toast } from 'sonner';
import { APP_LOGO_URL } from '../constants';

interface StoreManagementPageProps {
  user: User;
  items: StoreItem[];
  isLoading?: boolean;
  onAddItem: (itemData: Omit<StoreItem, 'id' | 'userId' | 'createdAt'>, files: File[]) => void;
  onUpdateItem: (itemId: string, updates: Partial<StoreItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onGoToCustomization: () => void;
  onUpdateUser?: (updates: Partial<User>) => Promise<void>;
}

const StoreManagementPage: React.FC<StoreManagementPageProps> = ({ 
  user, 
  items,
  isLoading,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onGoToCustomization,
  onUpdateUser
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'edit'>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [type, setType] = useState<'video' | 'picture_pack' | 'other'>('video');
  const [details, setDetails] = useState({
    title: '',
    description: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  
  // Video Duration States
  const [durationMin, setDurationMin] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(0);

  // Edit mode state
  const [searchTitle, setSearchTitle] = useState('');
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [editDetails, setEditDetails] = useState({
    title: '',
    description: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      setUploadError(null);

      if (type === 'video') {
        const videoFile = selectedFiles[0];
        const isVideoMime = videoFile && videoFile.type.startsWith('video');
        const isVideoExtension = videoFile && videoFile.name.match(/\.(mp4|mov|webm|ogg|m4v|avi|mkv|flv|wmv|3gp|MP4|MOV|WEBM|MKV|AVI)$/i);
        
        if (videoFile && (isVideoMime || isVideoExtension)) {
          setFiles([videoFile]);
          
          // Background duration check - only if it's a format the browser can actually play to get metadata
          if (isVideoMime || videoFile.name.match(/\.(mp4|webm|ogg|MP4|WEBM)$/i)) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
              window.URL.revokeObjectURL(video.src);
              const totalSecs = Math.round(video.duration);
              const mins = Math.floor(totalSecs / 60);
              const secs = totalSecs % 60;
              setDurationMin(mins);
              setDurationSec(secs);
              toast.success(`Detected video length: ${mins}m ${secs}s!`);
            };
            video.onerror = () => {
              console.warn('Could not read video metadata for duration check');
              window.URL.revokeObjectURL(video.src);
            };
            video.src = URL.createObjectURL(videoFile);
          }
        } else {
          setUploadError('Please select a valid video file.');
        }
      } else if (type === 'picture_pack') {
        if (selectedFiles.length !== 5) {
          setUploadError('A picture pack must contain exactly 5 photos.');
          setFiles([]);
        } else {
          const allImages = selectedFiles.every(f => f.type.startsWith('image'));
          if (!allImages) {
            setUploadError('All files in a picture pack must be images.');
            setFiles([]);
          } else {
            setFiles(selectedFiles);
          }
        }
      } else {
        setFiles(selectedFiles);
      }
    }
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image')) {
        setThumbnailFile(file);
      } else {
        toast.error('Please select an image for the thumbnail.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !details.title || uploadError) return;

    setIsUploading(true);
    
    const allFiles = thumbnailFile ? [thumbnailFile, ...files] : files;

    const durationInSeconds = (durationMin * 60) + durationSec;
    let computedPrice = 0;
    if (type === 'video') {
      if (durationInSeconds >= 120 && durationInSeconds <= 600) {
        computedPrice = 20;
      } else if (durationInSeconds > 600) {
        computedPrice = 40;
      }
    } else if (type === 'picture_pack') {
      computedPrice = 15;
    }

    try {
      await onAddItem({
        title: details.title,
        description: details.description,
        thumbnailUrl: '', // Handled by App.tsx
        mediaUrls: [], // Handled by App.tsx
        type: type,
        videoDuration: type === 'video' ? durationInSeconds : undefined,
        price: computedPrice > 0 ? computedPrice : undefined
      }, allFiles);

      setFiles([]);
      setThumbnailFile(null);
      setDetails({ title: '', description: '' });
      setDurationMin(0);
      setDurationSec(0);
    } catch (err) {
      console.error('Error during store publish:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = () => {
    const item = items.find(i => i.title.toLowerCase() === searchTitle.toLowerCase());
    if (item) {
      setEditingItem(item);
      setEditDetails({
        title: item.title,
        description: item.description || ''
      });
    } else {
      toast.error('Media item not found with that title.');
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    onUpdateItem(editingItem.id, {
      title: editDetails.title,
      description: editDetails.description
    });

    setEditingItem(null);
    setSearchTitle('');
    toast.success('Item updated successfully!');
  };

  const handleDelete = () => {
    if (!editingItem) return;
    onDeleteItem(editingItem.id);
    setEditingItem(null);
    setSearchTitle('');
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter chrome-text uppercase">Store Management</h1>
          <p className="text-slate-500 mt-2 uppercase text-[10px] tracking-[0.2em] font-bold">Upload and manage your store content</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveMode('upload')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'upload' ? 'bg-[#967bb6] text-white shadow-lg shadow-[#967bb6]/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Upload
          </button>
          <button 
            onClick={() => setActiveMode('edit')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'edit' ? 'bg-[#967bb6] text-white shadow-lg shadow-[#967bb6]/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Edit Items
          </button>
          <button 
            onClick={onGoToCustomization}
            className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500 hover:text-[#967bb6] flex items-center space-x-2"
          >
            <Palette size={14} />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Monetization Subscription Status */}
      <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.02] chrome-border mb-8 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#967bb6]/20 rounded-xl flex items-center justify-center">
              <CreditCard className="text-[#967bb6]" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Store Usage Fee</h2>
              <p className="text-[#967bb6] uppercase text-[9px] tracking-widest font-black">Monthly Store Usage Fee Plan</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-4 py-2 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">ACTIVE & BILLED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-white/5 text-left">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">Billing Amount</span>
            <span className="text-lg font-black text-white font-mono">$15.00 <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">/ month</span></span>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">Billing Interval</span>
            <span className="text-sm font-black text-white uppercase tracking-wider">Subscription Billed (Stripe)</span>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">Testing & Simulation</span>
            <button 
              onClick={async () => {
                const confirmed = window.confirm(
                  "Would you like to simulate a subscription lapse (force reblock)?\n\nThis will instantly lock your store and prompt you to pay the $15.00 monthly fee to resume access."
                );
                if (confirmed && onUpdateUser) {
                  const toastId = toast.loading("Processing subscription lapse simulation...");
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  await onUpdateUser({ isStoreActive: false });
                  toast.success("Subscription has lapsed! Access blocked.", { id: toastId });
                }
              }}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-500 font-bold uppercase text-[9px] tracking-wider py-2.5 px-4 rounded-xl transition-all active:scale-95 text-center flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} />
              <span>Force Reblock (Lapse Sub)</span>
            </button>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 gap-8">
        {activeMode === 'upload' ? (
              <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.02] chrome-border">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-[#967bb6]/20 rounded-xl flex items-center justify-center">
                    <Upload className="text-[#967bb6]" size={20} />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Upload New Content</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Type Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Content Type</label>
                    <div className="grid grid-cols-3 gap-4">
                      {(['video', 'picture_pack', 'other'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setType(t);
                            setFiles([]);
                            setUploadError(null);
                          }}
                          className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            type === t 
                              ? 'bg-[#967bb6] text-white border-[#967bb6] shadow-lg shadow-[#967bb6]/20' 
                              : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {t.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* File Upload Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative h-64 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center cursor-pointer group ${
                        files.length > 0 ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#967bb6]/30'
                      } ${uploadError ? 'border-red-500/50 bg-red-500/5' : ''}`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={type === 'video' ? 'video/*,.mkv,.avi,.wmv,.flv,.3gp,.mov,.mp4,.webm,.m4v,.MP4,.MOV,.WEBM' : type === 'picture_pack' ? 'image/*' : '*/*'}
                        multiple={type === 'picture_pack'}
                        className="hidden"
                      />
                      
                      {files.length > 0 ? (
                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                          <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
                            {type === 'video' ? <Video size={40} className="text-emerald-500" /> : <ImageIcon size={40} className="text-emerald-500" />}
                          </div>
                          <p className="text-white font-black uppercase tracking-widest text-sm mb-1">
                            {type === 'picture_pack' ? `${files.length} Photos Selected` : files[0].name}
                          </p>
                          <p className="text-slate-500 text-[10px] uppercase font-bold">
                            {type === 'picture_pack' 
                              ? `${(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB Total`
                              : `${(files[0].size / (1024 * 1024)).toFixed(2)} MB`
                            } • Click to change
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {type === 'video' ? <Video size={32} className="text-slate-600 group-hover:text-[#967bb6]" /> : <ImageIcon size={32} className="text-slate-600 group-hover:text-[#967bb6]" />}
                          </div>
                          <p className="text-slate-300 font-bold uppercase tracking-widest text-xs mb-2">
                            {type === 'video' ? 'Select Video File' : type === 'picture_pack' ? 'Select 5 Photos' : 'Select Media File'}
                          </p>
                          <p className="text-slate-600 text-[10px] uppercase font-bold">Drag and drop or click to browse device</p>
                        </>
                      )}

                      {uploadError && (
                        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-2 text-red-500 animate-in fade-in slide-in-from-bottom-2">
                          <AlertCircle size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{uploadError}</span>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Upload (Only for Video) */}
                    <div 
                      onClick={() => thumbInputRef.current?.click()}
                      className={`relative h-64 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center cursor-pointer group ${
                        thumbnailFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#967bb6]/30'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={thumbInputRef}
                        onChange={handleThumbChange}
                        accept="image/*"
                        className="hidden"
                      />
                      
                      {thumbnailFile ? (
                        <div className="flex flex-col items-center animate-in zoom-in duration-300 w-full h-full">
                          <div className="w-full h-full rounded-2xl overflow-hidden relative">
                            <img 
                              src={URL.createObjectURL(thumbnailFile)} 
                              alt="Thumbnail" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white font-black uppercase tracking-widest text-xs">Change Thumbnail</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ImageIcon size={32} className="text-slate-600 group-hover:text-[#967bb6]" />
                          </div>
                          <p className="text-slate-300 font-bold uppercase tracking-widest text-xs mb-2">
                            Thumbnail Image {type === 'video' ? '(Required)' : '(Optional)'}
                          </p>
                          <p className="text-slate-600 text-[10px] uppercase font-bold">Show fans what's inside</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Content Title</label>
                    <input 
                      type="text" 
                      required
                      value={details.title}
                      onChange={(e) => setDetails(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Exclusive Summer Set"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all chrome-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      value={details.description}
                      onChange={(e) => setDetails(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell your followers what's included..."
                      className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all h-32 resize-none chrome-border"
                    />
                  </div>

                  {type === 'video' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#967bb6] uppercase tracking-widest ml-1">
                        Video Duration (Monetized tiers are based on length)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl">
                          <input 
                            type="number" 
                            min="0"
                            required
                            value={durationMin || ''}
                            onChange={(e) => setDurationMin(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                            className="w-full bg-transparent border-0 py-4 px-6 text-white text-sm focus:outline-none focus:ring-0"
                          />
                          <span className="absolute right-6 text-[10px] font-black uppercase text-slate-500 tracking-widest pointer-events-none">MINS</span>
                        </div>
                        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl">
                          <input 
                            type="number" 
                            min="0"
                            max="59"
                            required
                            value={durationSec || ''}
                            onChange={(e) => setDurationSec(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                            placeholder="0"
                            className="w-full bg-transparent border-0 py-4 px-6 text-white text-sm focus:outline-none focus:ring-0"
                          />
                          <span className="absolute right-6 text-[10px] font-black uppercase text-slate-500 tracking-widest pointer-events-none">SECS</span>
                        </div>
                      </div>
                      
                      {/* Price split visual aid indicator */}
                      {((durationMin * 60) + durationSec) > 0 && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs font-bold leading-relaxed space-y-2">
                          {((durationMin * 60) + durationSec) < 120 ? (
                            <p className="text-amber-500 uppercase text-[9px] tracking-widest font-black">
                              ⚠️ Under 2 Minutes: Video will be set as FREE / Teaser (not monetized).
                            </p>
                          ): ((durationMin * 60) + durationSec) <= 600 ? (
                            <>
                              <p className="text-emerald-400 uppercase text-[10px] tracking-widest font-black">
                                💰 Monetized Video: $20.00 USD
                              </p>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider space-y-1">
                                <p>• Creator Payout (80%): <span className="text-white font-mono">$16.00</span></p>
                                <p>• Platform Fee (20%): <span className="text-white font-mono">$4.00</span></p>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-emerald-400 uppercase text-[10px] tracking-widest font-black">
                                💰 Premium Video (over 10 mins): $40.00 USD
                              </p>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider space-y-1">
                                <p>• Creator Payout (80%): <span className="text-white font-mono">$32.00</span></p>
                                <p>• Platform Fee (20%): <span className="text-white font-mono">$8.00</span></p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {type === 'picture_pack' && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs font-bold leading-relaxed space-y-2">
                        <p className="text-emerald-400 uppercase text-[10px] tracking-widest font-black">
                          💰 Monetized Picture Pack: $15.00 USD
                        </p>
                        <p className="text-slate-400 text-[9px] uppercase tracking-wider leading-relaxed">
                          Picture bundles are automatically priced at $15 with standard 80/20 platform splitting.
                        </p>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider space-y-1">
                          <p>• Creator Payout (80%): <span className="text-white font-mono">$12.00</span></p>
                          <p>• Platform Fee (20%): <span className="text-white font-mono">$3.00</span></p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={files.length === 0 || !details.title || isUploading || !!uploadError}
                    className="w-full bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#967bb6]/20 transition-all hover:scale-[1.02] active:scale-95 chrome-border disabled:opacity-50 disabled:grayscale flex items-center justify-center space-x-3"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} />
                        <span>Publish to Store</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.02] chrome-border">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-[#967bb6]/20 rounded-xl flex items-center justify-center">
                    <Edit3 className="text-[#967bb6]" size={20} />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Edit Store Items</h2>
                </div>

                {!editingItem ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Search by Title</label>
                      <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="text" 
                          value={searchTitle}
                          onChange={(e) => setSearchTitle(e.target.value)}
                          placeholder="Enter the exact title of the media item..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all chrome-border"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSearch}
                      disabled={!searchTitle}
                      className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
                    >
                      Find Item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/20">
                          <img 
                            src={editingItem.thumbnailUrl} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== APP_LOGO_URL) {
                                target.src = APP_LOGO_URL;
                              }
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{editingItem.title}</p>
                          <p className="text-slate-500 text-[10px] uppercase font-bold">In Store</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setEditingItem(null)}
                        className="p-2 hover:bg-white/10 rounded-xl text-slate-500 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Title</label>
                        <input 
                          type="text" 
                          required
                          value={editDetails.title}
                          onChange={(e) => setEditDetails(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all chrome-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Description</label>
                        <textarea 
                          value={editDetails.description}
                          onChange={(e) => setEditDetails(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all h-32 resize-none chrome-border"
                        />
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <button 
                          type="submit"
                          className="flex-grow bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          Save Changes
                        </button>
                        <button 
                          type="button"
                          onClick={handleDelete}
                          className="bg-red-500/10 text-red-500 border border-red-500/20 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-red-500 hover:text-white active:scale-95 flex items-center justify-center space-x-2"
                        >
                          <Trash2 size={16} />
                          <span>Delete Item</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

        {/* Info Box */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-start space-x-4">
          <div className="p-2 bg-[#967bb6]/10 rounded-lg">
            <AlertCircle size={20} className="text-[#967bb6]" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-tight mb-1">Upload Limits</h4>
            <p className="text-slate-500 text-[10px] uppercase font-bold leading-relaxed">
              Videos are limited to eight minutes in length. Picture packs must contain exactly five photos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreManagementPage;
