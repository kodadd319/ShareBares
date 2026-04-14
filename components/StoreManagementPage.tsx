
import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Video, Trash2, Plus, Check, AlertCircle, Lock, ShoppingBag, DollarSign, Edit3, Search, X, Palette } from 'lucide-react';
import { User, StoreItem } from '../types';
import { toast } from 'sonner';

interface StoreManagementPageProps {
  user: User;
  items: StoreItem[];
  onAddItem: (itemData: Omit<StoreItem, 'id' | 'userId' | 'createdAt'>, files: File[]) => void;
  onUpdateItem: (itemId: string, updates: Partial<StoreItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onGoToMonetization: () => void;
  onGoToCustomization: () => void;
}

const StoreManagementPage: React.FC<StoreManagementPageProps> = ({ 
  user, 
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onGoToMonetization,
  onGoToCustomization
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'edit'>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [type, setType] = useState<'video' | 'picture_pack' | 'other'>('video');
  const [details, setDetails] = useState({
    title: '',
    description: '',
    price: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit mode state
  const [searchTitle, setSearchTitle] = useState('');
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [editDetails, setEditDetails] = useState({
    title: '',
    description: '',
    price: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      setUploadError(null);

      if (type === 'video') {
        const videoFile = selectedFiles[0];
        if (videoFile && videoFile.type.startsWith('video')) {
          // Check duration
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            if (video.duration > 480) { // 8 minutes = 480 seconds
              setUploadError('Video must be 8 minutes or less.');
              setFiles([]);
            } else {
              setFiles([videoFile]);
            }
          };
          video.src = URL.createObjectURL(videoFile);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !details.title || !details.price || uploadError) return;

    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      onAddItem({
        title: details.title,
        description: details.description,
        price: parseFloat(details.price),
        thumbnailUrl: '', // Handled by App.tsx
        mediaUrls: [], // Handled by App.tsx
        type: type
      }, files);

      setFiles([]);
      setDetails({ title: '', description: '', price: '' });
      setIsUploading(false);
    }, 1000);
  };

  const handleSearch = () => {
    const item = items.find(i => i.title.toLowerCase() === searchTitle.toLowerCase());
    if (item) {
      setEditingItem(item);
      setEditDetails({
        title: item.title,
        description: item.description || '',
        price: item.price.toString()
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
      description: editDetails.description,
      price: parseFloat(editDetails.price)
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
          <p className="text-slate-500 mt-2 uppercase text-[10px] tracking-[0.2em] font-bold">Upload and manage your paid content</p>
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

      <div className="grid grid-cols-1 gap-8">
        {!user.hasPaidStoreFee && !user.isAdmin ? (
          <div className="glass-panel rounded-[2.5rem] p-12 text-center border-[#967bb6]/30 bg-[#967bb6]/5 chrome-border relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#967bb6]/10 blur-[100px] pointer-events-none"></div>
            <div className="w-20 h-20 bg-[#967bb6]/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Lock size={40} className="text-[#967bb6]" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Must Monetize First</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8 max-w-md mx-auto leading-relaxed">
              Access to the Store Manager is blocked. You must pay the store fee on the monetization page to unlock your store.
            </p>
            <button 
              onClick={onGoToMonetization}
              className="bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#967bb6]/20 transition-all hover:scale-105 active:scale-95 chrome-border"
            >
              Go to Monetization
            </button>
          </div>
        ) : (
          <>
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
                      accept={type === 'video' ? 'video/*' : type === 'picture_pack' ? 'image/*' : '*/*'}
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

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Price (USD)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          required
                          value={details.price}
                          onChange={(e) => setDetails(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="9.99"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all chrome-border"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      value={details.description}
                      onChange={(e) => setDetails(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell your fans what's included in this purchase..."
                      className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all h-32 resize-none chrome-border"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={files.length === 0 || !details.title || !details.price || isUploading || !!uploadError}
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
                              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${editingItem.id}/100`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{editingItem.title}</p>
                          <p className="text-slate-500 text-[10px] uppercase font-bold">${editingItem.price}</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Price (USD)</label>
                          <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                            <input 
                              type="number" 
                              step="0.01"
                              required
                              value={editDetails.price}
                              onChange={(e) => setEditDetails(prev => ({ ...prev, price: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all chrome-border"
                            />
                          </div>
                        </div>
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
          </>
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
