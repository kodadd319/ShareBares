
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, ArrowLeft, Shield, Lock, Video } from 'lucide-react';
import { useShareBares } from './MascotContext';
import { StableListing, User } from '../types';
import { APP_LOGO_URL, STABLE_MEMBERSHIP_LINK } from '../constants';
import PaymentGate from './PaymentGate';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

interface JoinStablePageProps {
  user: User;
  onBack: () => void;
  onSubmit: (listing: Omit<StableListing, 'id' | 'createdAt' | 'userId'>, postToStore: boolean, photoFiles: File[]) => void;
}

const JoinStablePage: React.FC<JoinStablePageProps> = ({ user, onBack, onSubmit }) => {
  const [name, setName] = useState('');
  const { showMascot } = useShareBares();
  const [isActivated, setIsActivated] = useState(user.isStableActive || false);

  const handlePaymentSuccess = async () => {
    // In a real app, this would be verified server-side
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      isStableActive: true,
      stableActivationDate: new Date().toISOString()
    }, { merge: true });
    
    // Also update public profile
    const profileRef = doc(db, 'profiles', user.id);
    await setDoc(profileRef, {
      isStableActive: true
    }, { merge: true });
    
    setIsActivated(true);
    toast.success('Stable Membership Activated! You can now post your listing.');
  };

  useEffect(() => {
    if (isActivated) {
      showMascot({
        action: 'wink',
        message: "Ready to join the elite? The Stable is where the real action is! 🐎🔥",
        duration: 6000
      });
    }
  }, [showMascot, isActivated]);

  const [gender, setGender] = useState<'male' | 'female' | 'non-binary' | 'transgender'>('female');

  if (!isActivated && !user.isAdmin) {
    return (
      <div className="py-12">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors mb-8 group ml-4"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>
        <PaymentGate 
          title="The Stable Membership"
          description="Elite Escort Directory Access"
          amount={15}
          paymentLink={STABLE_MEMBERSHIP_LINK}
          onSuccess={handlePaymentSuccess}
          features={[
            'Official Stable Listing',
            'In-Person Service Exposure',
            'Verified Provider Badge',
            'Unlimited Listing Edits',
            'Direct Contact Messaging',
            'Featured in "The Stable" Tab'
          ]}
        />
      </div>
    );
  }

  const [services, setServices] = useState('');
  const [city, setCity] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [importantInfo, setImportantInfo] = useState('');
  const [postToStore, setPostToStore] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (photoFiles.length >= 2) return;
      const file = e.target.files[0];
      setPhotoFiles(prev => [...prev, file]);
      const url = URL.createObjectURL(file);
      setPreviews(prev => [...prev, url]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !services || !contactInfo) return;

    onSubmit({
      providerName: name,
      providerGender: gender,
      services,
      city,
      contactInfo,
      importantInfo,
      photos: [], // Will be populated by parent after upload
      avatarUrl: APP_LOGO_URL // Will be populated by parent after upload
    }, postToStore, photoFiles);
  };

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
              <div className="md:col-span-2">
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
                {previews.map((url, index) => {
                  const isVideo = photoFiles[index]?.type.startsWith('video') || 
                    url.split('?')[0].match(/\.(mp4|mov|webm|ogg|m4v|avi|mkv|flv|wmv|3gp|MP4|MOV|WEBM|MKV|AVI|3GP|OGG|WMV|FLV|M4V)$/i) ||
                    url.toLowerCase().includes('video') ||
                    (url.toLowerCase().includes('firebasestorage') && (url.toLowerCase().includes('%2Fvideo') || url.toLowerCase().includes('video%2F') || url.toLowerCase().includes('video')));
                  
                  return (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                      {isVideo ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                           <Video className="text-white opacity-50" size={32} />
                           <span className="absolute bottom-2 left-2 text-[8px] font-black uppercase tracking-widest text-white bg-black/40 px-2 py-0.5 rounded">Video</span>
                        </div>
                      ) : (
                        <img 
                          src={url} 
                          className="w-full h-full object-cover" 
                          alt="" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== APP_LOGO_URL) {
                              target.src = APP_LOGO_URL;
                            }
                          }}
                        />
                      )}
                      <button 
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
                {previews.length < 2 && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:text-[#967bb6] hover:border-[#967bb6]/30 transition-all bg-white/5"
                  >
                    <Upload size={24} className="mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">Upload Photo or Video</span>
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*,video/*,.mkv,.avi,.wmv,.flv,.3gp"
                className="hidden"
              />
            </div>

            <div className="pt-4 space-y-4 text-center">
               <p className="text-[10px] text-[#967bb6] uppercase tracking-[0.2em] font-black">Official Stable Membership - $15</p>
               <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Secure your place in the elite directory</p>
            </div>
          </div>

          <div className="pt-6 space-y-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
              <Shield size={18} className="text-[#967bb6] shrink-0 mt-1" />
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white mb-1">Official Service Disclosure</h3>
                <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
                  All "In-Person Service" transactions are handled directly between the service provider and the client. 
                  ShareBares is a separate entity and serves strictly as a listing platform. ShareBares does not participate in, 
                  nor is it responsible for, any service agreements or transactions. All questions, comments, or complaints 
                  must be directed to the service provider.
                </p>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98] chrome-border bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white shadow-[#967bb6]/20"
            >
              Post Listing
              <Check className="group-hover:translate-x-1 transition-transform" size={24} />
            </button>
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
