import React from 'react';
import { Video, Image as ImageIcon, ShoppingBag, ArrowLeft, Play, ExternalLink, Info, X, Download } from 'lucide-react';
import { User, StoreItem } from '../types';
import VideoPlayer from './VideoPlayer';
import { motion, AnimatePresence } from 'motion/react';

interface MyVideosPageProps {
  user: User;
  purchasedItems: StoreItem[];
  onBack: () => void;
  onExploreStore: () => void;
}

const MyVideosPage: React.FC<MyVideosPageProps> = ({ user, purchasedItems, onBack, onExploreStore }) => {
  const [selectedItem, setSelectedItem] = React.useState<StoreItem | null>(null);

  const videos = purchasedItems.filter(item => item.type === 'video');
  const picturePacks = purchasedItems.filter(item => item.type === 'picture_pack');
  const others = purchasedItems.filter(item => item.type !== 'video' && item.type !== 'picture_pack');

  const getMediaUrl = (url: string) => {
    if (!url) return '/logo.png';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      {/* Header */}
      <div className="relative h-48 flex items-center justify-center border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#967bb6]/10 to-transparent"></div>
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 group z-10"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit Library</span>
        </button>

        <div className="text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
            My <span className="text-[#967bb6]">Vault</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Your Purchased Media Collection</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {purchasedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
              <ShoppingBag size={40} className="text-slate-700" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Your collection is empty</h2>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest max-w-md mb-10 leading-relaxed">
              Purchased videos and picture bundles from creators will appear here for permanent access.
            </p>
            <button 
              onClick={onExploreStore}
              className="px-10 py-4 bg-[#967bb6] text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(150,123,182,0.3)] hover:scale-105 active:scale-95 transition-all"
            >
              Explore the Store
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Videos Section */}
            {videos.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-[#967bb6]/20 rounded-xl flex items-center justify-center text-[#967bb6]">
                    <Video size={20} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight italic">Videos</h2>
                  <div className="flex-grow h-px bg-white/5"></div>
                  <span className="text-[10px] font-mono text-slate-500">{videos.length} Files</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedItem(item)}
                      className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 chrome-border cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <img 
                        src={getMediaUrl(item.thumbnailUrl)} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={item.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-[#967bb6]/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                          <Play size={24} className="text-white fill-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-sm font-black uppercase tracking-tight text-white line-clamp-1">{item.title}</h3>
                        <p className="text-[8px] text-[#967bb6] font-bold uppercase tracking-widest mt-1">Purchased & Verified</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Picture Bundles Section */}
            {picturePacks.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-[#967bb6]/20 rounded-xl flex items-center justify-center text-[#967bb6]">
                    <ImageIcon size={20} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight italic">Picture Bundles</h2>
                  <div className="flex-grow h-px bg-white/5"></div>
                  <span className="text-[10px] font-mono text-slate-500">{picturePacks.length} Packs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {picturePacks.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedItem(item)}
                      className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 chrome-border cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <img 
                        src={getMediaUrl(item.thumbnailUrl)} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={item.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                      <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                        <ImageIcon size={10} className="text-[#967bb6]" />
                        <span className="text-[8px] font-black uppercase tracking-widest">{item.mediaUrls.length} Shots</span>
                      </div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-sm font-black uppercase tracking-tight text-white line-clamp-1">{item.title}</h3>
                        <p className="text-[8px] text-[#967bb6] font-bold uppercase tracking-widest mt-1">Full Pack Unlocked</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Other Media Section */}
            {others.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-[#967bb6]/20 rounded-xl flex items-center justify-center text-[#967bb6]">
                    <ShoppingBag size={20} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight italic">Other Media</h2>
                  <div className="flex-grow h-px bg-white/5"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {others.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedItem(item)}
                      className="group relative p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 hover:border-[#967bb6]/30 cursor-pointer transition-all flex flex-col items-center text-center"
                    >
                      <div className="w-16 h-16 bg-[#967bb6]/10 rounded-2xl flex items-center justify-center mb-4 text-[#967bb6]">
                        <ShoppingBag size={32} />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-tight text-white mb-2">{item.title}</h3>
                      <button className="text-[8px] text-slate-500 font-bold uppercase tracking-widest hover:text-[#967bb6] transition-colors">View Details</button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Media Viewer Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col p-4 md:p-8"
          >
            <div className="flex items-center justify-between mb-8 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#967bb6]/20 rounded-2xl text-[#967bb6]">
                  {selectedItem.type === 'video' ? <Video size={20} /> : <ImageIcon size={20} />}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">{selectedItem.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#967bb6]">Verified Access</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-4 bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center gap-2 group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Close</span>
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow flex flex-col min-h-0 relative">
              <div className="flex-grow overflow-y-auto space-y-8 pb-32">
                {selectedItem.mediaUrls.map((url, idx) => {
                  const absoluteUrl = getMediaUrl(url);
                  const isItemVideo = absoluteUrl.split('?')[0].match(/\.(mp4|mov|webm|ogg|m4v|avi|MP4|MOV|WEBM)$/i) || 
                                     absoluteUrl.toLowerCase().includes('video') ||
                                     (absoluteUrl.toLowerCase().includes('firebasestorage') && absoluteUrl.toLowerCase().includes('%2Fvideo'));
                  
                  return (
                    <div key={idx} className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                      {isItemVideo ? (
                        <div className="w-full max-w-5xl aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 chrome-border">
                          <VideoPlayer 
                            src={absoluteUrl} 
                            poster={getMediaUrl(selectedItem.thumbnailUrl)}
                            controls={true}
                            autoPlay={idx === 0}
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="relative group max-w-5xl">
                          <img 
                            src={absoluteUrl} 
                            className="w-full h-auto rounded-[2.5rem] shadow-2xl transition-transform duration-500 hover:scale-[1.01]" 
                            alt={`${selectedItem.title} ${idx + 1}`}
                          />
                          <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/10 pointer-events-none"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-none z-20">
                <div className="flex items-center gap-6 pointer-events-auto">
                  <div className="p-4 bg-white/5 rounded-3xl backdrop-blur-md border border-white/10 flex items-center gap-4">
                    <Info size={20} className="text-[#967bb6]" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#967bb6] mb-0.5">Content Info</p>
                      <p className="text-[9px] text-slate-400 font-bold max-w-xs">{selectedItem.description || "No description provided by creator."}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                  <a 
                    href={getMediaUrl(selectedItem.mediaUrls[0])} 
                    download
                    className="flex items-center gap-3 px-8 py-4 bg-white text-black font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <Download size={18} />
                    Download Main File
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .chrome-border {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.05),
                      0 10px 30px -10px rgba(0,0,0,0.5);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}} />
    </div>
  );
};

export default MyVideosPage;
