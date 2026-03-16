
import React, { useState } from 'react';
import { ArrowLeft, Save, Music, Layout, Palette, Type, Image as ImageIcon } from 'lucide-react';
import { User, ProfileCustomization } from '../types';

interface CustomProfilePageProps {
  user: User;
  onSave: (customization: ProfileCustomization) => void;
  onBack: () => void;
}

const WALLPAPERS = [
  { id: 'none', name: 'None', url: '' },
  { id: 'camo', name: 'Camo', url: 'https://www.transparenttextures.com/patterns/camo.png' },
  { id: 'carbon', name: 'Carbon Fiber', url: 'https://www.transparenttextures.com/patterns/carbon-fibre.png' },
  { id: 'stars', name: 'ShareBares Stars', url: 'https://www.transparenttextures.com/patterns/stardust.png' },
  { id: 'grid', name: 'Digital Grid', url: 'https://www.transparenttextures.com/patterns/grid-me.png' },
  { id: 'circuit', name: 'Cyber Circuit', url: 'https://www.transparenttextures.com/patterns/circuit-board.png' },
  { id: 'honeycomb', name: 'Neon Hex', url: 'https://www.transparenttextures.com/patterns/hexellence.png' },
  { id: 'noise', name: 'Static Glitch', url: 'https://www.transparenttextures.com/patterns/broken-noise.png' },
  { id: 'wood', name: 'Dark Wood', url: 'https://www.transparenttextures.com/patterns/dark-wood.png' },
  { id: 'leather', name: 'Black Leather', url: 'https://www.transparenttextures.com/patterns/black-leather.png' },
  { id: 'denim', name: 'Dark Denim', url: 'https://www.transparenttextures.com/patterns/dark-denim.png' },
  { id: 'marble', name: 'White Marble', url: 'https://www.transparenttextures.com/patterns/white-diamond.png' },
];

const FONTS = [
  { id: 'sans', name: 'Modern Sans', value: 'Inter, sans-serif' },
  { id: 'serif', name: 'Elegant Serif', value: 'Playfair Display, serif' },
  { id: 'mono', name: 'Tech Mono', value: 'JetBrains Mono, monospace' },
  { id: 'display', name: 'Bold Display', value: 'Anton, sans-serif' },
  { id: 'cursive', name: 'Script', value: 'Cormorant Garamond, serif' },
  { id: 'retro', name: 'Retro Pixel', value: '"Press Start 2P", system-ui' },
  { id: 'futuristic', name: 'Cyber Future', value: '"Orbitron", sans-serif' },
  { id: 'handwritten', name: 'Handwritten', value: '"Permanent Marker", cursive' },
];

const LAYOUTS = [
  { id: 'default', name: 'Standard Feed', description: 'Classic social layout' },
  { id: 'bento', name: 'Bento Grid', description: 'Modern modular grid' },
  { id: 'minimal', name: 'Minimalist', description: 'Clean and focused' },
  { id: 'sidebar', name: 'Dual Column', description: 'Content with sidebar' },
  { id: 'magazine', name: 'Magazine', description: 'Editorial style' },
  { id: 'gallery', name: 'Visual Gallery', description: 'Focus on media first' },
  { id: 'timeline', name: 'Vertical Timeline', description: 'Chronological story' },
  { id: 'cards', name: 'Masonry Cards', description: 'Dynamic card grid' },
];

const CustomProfilePage: React.FC<CustomProfilePageProps> = ({ user, onSave, onBack }) => {
  const [config, setConfig] = useState<ProfileCustomization>(user.profileCustomization || {
    backgroundColor: '#050505',
    menuBarColor: '#050505',
    fontColor: '#ffffff',
    fontType: 'sans',
    buttonColor: '#967bb6',
    accentColor: '#967bb6',
    layout: 'default',
    backgroundWallpaper: '',
    themeSongUrl: '',
  });

  const [musicFileName, setMusicFileName] = useState<string>('');

  const handleReset = () => {
    const defaultConfig: ProfileCustomization = {
      backgroundColor: '#050505',
      menuBarColor: '#050505',
      fontColor: '#ffffff',
      fontType: 'sans',
      buttonColor: '#967bb6',
      accentColor: '#967bb6',
      layout: 'default',
      backgroundWallpaper: '',
      themeSongUrl: '',
    };
    setConfig(defaultConfig);
    setMusicFileName('');
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMusicFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig(prev => ({ ...prev, themeSongUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back to Profile</span>
      </button>

      <div className="glass-panel rounded-[3rem] p-8 md:p-12 border-[#c0c0c0]/10 shadow-2xl chrome-border">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase chrome-text mb-2">Custom Profile</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Design your unique presence on ShareBares</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Colors & Visuals */}
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-[#967bb6]">
                <Palette size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest">Colors & Background</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Background Color</label>
                  <input 
                    type="color" 
                    value={config.backgroundColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Menu Bar Color</label>
                  <input 
                    type="color" 
                    value={config.menuBarColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, menuBarColor: e.target.value }))}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Button Color</label>
                  <input 
                    type="color" 
                    value={config.buttonColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, buttonColor: e.target.value }))}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Accent Color</label>
                  <input 
                    type="color" 
                    value={config.accentColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-[#967bb6]">
                <ImageIcon size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest">Wallpaper Overlay</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {WALLPAPERS.map(wp => (
                  <button
                    key={wp.id}
                    onClick={() => setConfig(prev => ({ ...prev, backgroundWallpaper: wp.url }))}
                    className={`p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                      config.backgroundWallpaper === wp.url 
                      ? 'bg-black text-[#967bb6] border-[#967bb6]' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {wp.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-[#967bb6]">
                <Type size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest">Typography</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Font Color</label>
                  <input 
                    type="color" 
                    value={config.fontColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, fontColor: e.target.value }))}
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {FONTS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setConfig(prev => ({ ...prev, fontType: f.id }))}
                      className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                        config.fontType === f.id 
                        ? 'bg-[#967bb6]/20 border-[#967bb6] text-white' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                      style={{ fontFamily: f.value }}
                    >
                      <span className="text-sm">{f.name}</span>
                      <span className="text-[10px] opacity-50">Aa Bb Cc</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Layout & Music */}
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-[#967bb6]">
                <Layout size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest">Profile Layout</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {LAYOUTS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setConfig(prev => ({ ...prev, layout: l.id as any }))}
                    className={`p-4 rounded-2xl border text-left transition-all group ${
                      config.layout === l.id 
                      ? 'bg-black border-[#967bb6] shadow-lg shadow-[#967bb6]/10' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className={`text-xs font-black uppercase tracking-widest ${config.layout === l.id ? 'text-white' : 'text-slate-300'}`}>{l.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{l.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-[#967bb6]">
                <Music size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest">Theme Song</h3>
              </div>
              <div className="p-8 rounded-[2rem] border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-center group hover:border-[#967bb6]/50 transition-all">
                <div className="w-16 h-16 bg-[#967bb6]/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Music className="text-[#967bb6]" size={32} />
                </div>
                <p className="text-xs font-bold text-white uppercase tracking-widest mb-2">Upload Theme Music</p>
                <p className="text-[10px] text-slate-500 max-w-[200px]">MP3 or WAV files. Plays automatically when users view your profile.</p>
                
                <label className="mt-6 cursor-pointer">
                  <span className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
                    {musicFileName ? 'Change File' : 'Select File'}
                  </span>
                  <input type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
                </label>
                
                {musicFileName && (
                  <div className="mt-4 flex items-center space-x-2 text-emerald-400">
                    <Music size={12} />
                    <span className="text-[10px] font-bold truncate max-w-[150px]">{musicFileName}</span>
                  </div>
                )}
              </div>
            </section>

            <div className="pt-8 space-y-4">
              <button 
                onClick={() => onSave(config)}
                className="w-full bg-black text-[#967bb6] py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-[#967bb6]/20 transition-all flex items-center justify-center gap-3 group transform active:scale-[0.98] chrome-border"
              >
                <span>Save & Apply</span>
                <Save className="group-hover:translate-x-1 transition-transform" size={24} />
              </button>
              
              <button 
                onClick={handleReset}
                className="w-full bg-white/5 hover:bg-white/10 text-slate-400 py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all border border-white/10 transform active:scale-[0.98]"
              >
                Reset to Default
              </button>

              <p className="text-center text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] mt-4">
                Changes will be visible to all visitors immediately
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomProfilePage;
