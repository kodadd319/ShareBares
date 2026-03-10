
import React, { useState } from 'react';
import { User, StoreCustomization } from '../types';
import { Palette, Type, Layout, Check, ArrowLeft, RefreshCw } from 'lucide-react';

interface StoreCustomizationPageProps {
  user: User;
  onSave: (customization: StoreCustomization) => void;
  onCancel: () => void;
}

const StoreCustomizationPage: React.FC<StoreCustomizationPageProps> = ({ user, onSave, onCancel }) => {
  const [customization, setCustomization] = useState<StoreCustomization>(user.storeCustomization || {
    backgroundColor: '#000000',
    accentColor: '#967bb6',
    fontFamily: 'Inter',
    fontColor: '#ffffff',
    layout: 'grid'
  });

  const fontOptions = [
    { name: 'Modern Sans', value: 'Inter' },
    { name: 'Classic Serif', value: 'Playfair Display' },
    { name: 'Technical Mono', value: 'JetBrains Mono' },
    { name: 'Bold Display', value: 'Space Grotesk' }
  ];

  const layoutOptions = [
    { id: 'grid', name: 'Classic Grid', description: 'Standard 2-column grid layout' },
    { id: 'list', name: 'Detailed List', description: 'Full-width items with descriptions' },
    { id: 'bento', name: 'Bento Box', description: 'Dynamic masonry-style grid' }
  ];

  const colorPresets = [
    { bg: '#000000', accent: '#967bb6', text: '#ffffff', name: 'ShareBares' },
    { bg: '#0f172a', accent: '#38bdf8', text: '#f8fafc', name: 'Ocean' },
    { bg: '#18181b', accent: '#f43f5e', text: '#fafafa', name: 'Crimson' },
    { bg: '#050505', accent: '#10b981', text: '#ecfdf5', name: 'Emerald' },
    { bg: '#1c1917', accent: '#f59e0b', text: '#fffbeb', name: 'Amber' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onCancel}
            className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter chrome-text uppercase">Customize Store</h1>
            <p className="text-slate-500 mt-1 uppercase text-[10px] tracking-[0.2em] font-bold">Define your store's visual identity</p>
          </div>
        </div>
        
        <button 
          onClick={() => onSave(customization)}
          className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
        >
          <Check size={18} />
          <span>Apply Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-8">
          {/* Presets */}
          <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.02] chrome-border">
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="text-[#967bb6]" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Color Presets</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setCustomization(prev => ({
                    ...prev,
                    backgroundColor: preset.bg,
                    accentColor: preset.accent,
                    fontColor: preset.text
                  }))}
                  className="p-3 rounded-2xl border border-white/10 hover:border-white/30 transition-all text-left flex flex-col space-y-2 bg-black/20"
                >
                  <div className="flex space-x-1">
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: preset.bg }}></div>
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: preset.accent }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.02] chrome-border">
            <div className="flex items-center space-x-3 mb-6">
              <RefreshCw className="text-[#967bb6]" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Manual Colors</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Background</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color" 
                    value={customization.backgroundColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={customization.backgroundColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Accent</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color" 
                    value={customization.accentColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={customization.accentColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.02] chrome-border">
            <div className="flex items-center space-x-3 mb-6">
              <Type className="text-[#967bb6]" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Typography</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {fontOptions.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setCustomization(prev => ({ ...prev, fontFamily: font.value }))}
                    className={`p-4 rounded-2xl border transition-all text-left ${
                      customization.fontFamily === font.value 
                        ? 'border-[#967bb6] bg-[#967bb6]/10 text-white' 
                        : 'border-white/10 bg-black/20 text-slate-400 hover:border-white/30'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    <span className="text-sm font-bold">{font.name}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Text Color</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color" 
                    value={customization.fontColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, fontColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={customization.fontColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, fontColor: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-white/[0.02] chrome-border">
            <div className="flex items-center space-x-3 mb-6">
              <Layout className="text-[#967bb6]" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Layout Style</h2>
            </div>
            <div className="space-y-3">
              {layoutOptions.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setCustomization(prev => ({ ...prev, layout: layout.id as any }))}
                  className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                    customization.layout === layout.id 
                      ? 'border-[#967bb6] bg-[#967bb6]/10' 
                      : 'border-white/10 bg-black/20 hover:border-white/30'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-black uppercase tracking-tight ${customization.layout === layout.id ? 'text-white' : 'text-slate-300'}`}>
                      {layout.name}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">{layout.description}</p>
                  </div>
                  {customization.layout === layout.id && <Check size={20} className="text-[#967bb6]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="sticky top-24 h-fit">
          <div className="glass-panel rounded-[3rem] p-1 border-white/10 bg-white/5 chrome-border overflow-hidden">
            <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-black/40">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Preview</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
              </div>
            </div>
            
            <div 
              className="p-8 min-h-[500px] transition-all duration-500"
              style={{ 
                backgroundColor: customization.backgroundColor,
                color: customization.fontColor,
                fontFamily: customization.fontFamily
              }}
            >
              <div className="mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2" style={{ color: customization.fontColor }}>
                  {user.displayName}'s Store
                </h3>
                <div className="h-1 w-12 rounded-full" style={{ backgroundColor: customization.accentColor }}></div>
              </div>

              {customization.layout === 'grid' && (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-[3/4] rounded-2xl border border-white/10 bg-white/5 p-3 flex flex-col justify-end">
                      <div className="h-4 w-2/3 bg-white/10 rounded mb-2"></div>
                      <div className="h-3 w-1/3 bg-white/10 rounded" style={{ backgroundColor: `${customization.accentColor}20`, color: customization.accentColor }}></div>
                    </div>
                  ))}
                </div>
              )}

              {customization.layout === 'list' && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-4 p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="w-16 h-16 rounded-xl bg-white/10 shrink-0"></div>
                      <div className="flex-grow">
                        <div className="h-4 w-1/2 bg-white/10 rounded mb-2"></div>
                        <div className="h-3 w-1/4 bg-white/10 rounded"></div>
                      </div>
                      <div className="h-8 w-16 rounded-lg" style={{ backgroundColor: customization.accentColor }}></div>
                    </div>
                  ))}
                </div>
              )}

              {customization.layout === 'bento' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-end">
                    <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                  </div>
                  <div className="aspect-[1/2] rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-end row-span-2">
                    <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                  </div>
                  <div className="aspect-square rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-end">
                    <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreCustomizationPage;
