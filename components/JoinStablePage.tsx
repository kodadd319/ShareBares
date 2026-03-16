
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, ArrowLeft, Shield, Lock } from 'lucide-react';
import { useBareBear } from './BareBearContext';
import { StableListing } from '../types';

interface JoinStablePageProps {
  onBack: () => void;
  onGoToMonetization: () => void;
  onSubmit: (listing: Omit<StableListing, 'id' | 'createdAt'>, postToStore: boolean) => void;
  hasPaidStableFee: boolean;
}

const JoinStablePage: React.FC<JoinStablePageProps> = ({ onBack, onGoToMonetization, onSubmit, hasPaidStableFee }) => {
  const [name, setName] = useState('');
  const { showMascot } = useBareBear();

  useEffect(() => {
    showMascot({
      action: 'wink',
      message: "Ready to join the elite? The Stable is where the real money is made! 🐎💰",
      duration: 6000
    });
  }, [showMascot]);

  const [gender, setGender] = useState<'male' | 'female' | 'non-binary' | 'transgender'>('female');
  const [services, setServices] = useState('');
  const [city, setCity] = useState('');
  const [pricing, setPricing] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [importantInfo, setImportantInfo] = useState('');
  const [postToStore, setPostToStore] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (photos.length >= 2) return;
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPhotos(prev => [...prev, url]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !services || !pricing || !contactInfo) return;

    onSubmit({
      providerName: name,
      providerGender: gender,
      services,
      city,
      pricing,
      contactInfo,
      importantInfo,
      photos,
      avatarUrl: photos[0] || 'https://picsum.photos/seed/default/200'
    }, postToStore);
  };

  if (!hasPaidStableFee) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Feed</span>
        </button>

        <div className="glass-panel rounded-[3rem] p-12 text-center border-[#967bb6]/30 bg-[#967bb6]/5 chrome-border relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#967bb6]/10 blur-[100px] pointer-events-none"></div>
          <div className="w-20 h-20 bg-[#967bb6]/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-[#967bb6]" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Must Monetize First</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8 max-w-md mx-auto leading-relaxed">
            Access to "Join The Stable" is blocked. You must pay the "Basic Listing" or "Store Bundle" fee via the Stripe payment link on the monetization page to create your escort service listing.
          </p>
          <button 
            onClick={onGoToMonetization}
            className="bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#967bb6]/20 transition-all hover:scale-105 active:scale-95 chrome-border"
          >
            Go to Monetization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <button 
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back to Feed</span>
      </button>

      <div className="glass-panel rounded-[3rem] p-8 md:p-12 border-[#c0c0c0]/10 shadow-2xl chrome-border">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase chrome-text mb-2">Join The Stable</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Create your escort service (in-person) listing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-3">Name / Title</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your professional name"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 placeholder:text-slate-700"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-3">Gender Identity</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 appearance-none cursor-pointer"
              >
                <option value="female" className="bg-slate-900">Female</option>
                <option value="male" className="bg-slate-900">Male</option>
                <option value="non-binary" className="bg-slate-900">Non-Binary</option>
                <option value="transgender" className="bg-slate-900">Transgender</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-3">City / Location</label>
              <input 
                type="text" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Miami, FL"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 placeholder:text-slate-700"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-3">Escort Services Offered</label>
              <textarea 
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="List your in-person services (e.g. Modeling, Companionship, Massage...)"
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 placeholder:text-slate-700 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-3">Pricing</label>
                <input 
                  type="text" 
                  value={pricing}
                  onChange={(e) => setPricing(e.target.value)}
                  placeholder="e.g. $200/hr"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 placeholder:text-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-3">Contact Info</label>
                <input 
                  type="text" 
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone/Text, Signal, or Email"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-3">Important Info (Optional)</label>
              <input 
                type="text" 
                value={importantInfo}
                onChange={(e) => setImportantInfo(e.target.value)}
                placeholder="e.g. Discretion guaranteed, Travel available..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 placeholder:text-slate-700"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-3">Photos (Max 2)</label>
              <div className="grid grid-cols-2 gap-4">
                {photos.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button 
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {photos.length < 2 && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:text-[#967bb6] hover:border-[#967bb6]/30 transition-all bg-white/5"
                  >
                    <Upload size={24} className="mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Photo</span>
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="pt-4 space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#967bb6] mb-3">Listing Options</label>
              
              <div 
                onClick={() => {
                  if (hasPaidStableFee) {
                    setPostToStore(false);
                  }
                }}
                className={`p-6 rounded-2xl border-2 transition-all ${!postToStore && hasPaidStableFee ? 'border-[#967bb6] bg-[#967bb6]/5' : 'border-white/5 bg-white/5 hover:border-white/20'} ${!hasPaidStableFee ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-white uppercase tracking-tight">Basic Listing</span>
                  <div className="flex items-center space-x-2">
                    {hasPaidStableFee && !postToStore && <Check size={14} className="text-[#967bb6]" />}
                    <span className="text-[#967bb6] font-black">$10.00</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Posts to "The Stable" feed only</p>
              </div>

              <div 
                onClick={() => {
                  if (hasPaidStableFee) {
                    setPostToStore(true);
                  }
                }}
                className={`p-6 rounded-2xl border-2 transition-all ${postToStore && hasPaidStableFee ? 'border-[#967bb6] bg-[#967bb6]/5' : 'border-white/5 bg-white/5 hover:border-white/20'} ${!hasPaidStableFee ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-black text-white uppercase tracking-tight">Store Bundle</span>
                    <div className="bg-emerald-500/20 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Best Value</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasPaidStableFee && postToStore && <Check size={14} className="text-[#967bb6]" />}
                    <span className="text-[#967bb6] font-black">$15.00</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Posts to "The Stable" AND your personal store</p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={!hasPaidStableFee}
              className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98] chrome-border ${
                hasPaidStableFee 
                ? 'bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white shadow-[#967bb6]/20' 
                : 'bg-white/5 text-slate-700 border-white/5 cursor-not-allowed shadow-none'
              }`}
            >
              {!hasPaidStableFee && <Lock size={20} className="mr-2" />}
              Post Listing
              {hasPaidStableFee && <Check className="group-hover:translate-x-1 transition-transform" size={24} />}
            </button>
            {!hasPaidStableFee && (
              <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-4">
                Please select a fee package above to unlock posting
              </p>
            )}
          </div>
        </form>

        <div className="mt-8 flex flex-col items-center justify-center space-y-2 text-slate-600">
          <div className="flex items-center space-x-2">
            <Shield size={14} />
            <p className="text-[10px] font-bold uppercase tracking-widest">All listings are verified by moderators</p>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#967bb6]/60">NSFW content, nudity & sexually explicit material is allowed</p>
        </div>
      </div>
    </div>
  );
};

export default JoinStablePage;
