
import React, { useState } from 'react';
import { Check, ArrowLeft, Camera, Globe, Mail, Phone, MapPin, Briefcase, Tag, CreditCard } from 'lucide-react';
import { User } from '../types';

interface EditProfilePageProps {
  user: User;
  onSave: (updatedUser: Partial<User>) => void;
  onBack: () => void;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({ user, onSave, onBack }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [tagline, setTagline] = useState(user.tagline || '');
  const [occupation, setOccupation] = useState(user.occupation || '');
  const [location, setLocation] = useState(user.location || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [twitter, setTwitter] = useState(user.socials?.twitter || '');
  const [instagram, setInstagram] = useState(user.socials?.instagram || '');
  const [website, setWebsite] = useState(user.socials?.website || '');
  const [isCreator, setIsCreator] = useState(user.isCreator);
  const [avatar, setAvatar] = useState(user.avatar);
  const [coverImage, setCoverImage] = useState(user.coverImage);
  const [stripeConnectId, setStripeConnectId] = useState(user.stripeConnectId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      displayName,
      username,
      bio,
      tagline,
      occupation,
      location,
      phone,
      email,
      socials: {
        twitter,
        instagram,
        website
      },
      isCreator,
      avatar,
      coverImage,
      stripeConnectId
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back</span>
      </button>

      <div className="glass-panel rounded-[3rem] p-8 md:p-12 border-[#c0c0c0]/10 shadow-2xl chrome-border">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase chrome-text mb-2">Edit Profile</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Update your personal information and presence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center">
                <Camera size={14} className="mr-2" />
                Profile Avatar URL
              </label>
              <div className="flex items-center space-x-4">
                <img 
                  src={avatar} 
                  className="w-16 h-16 rounded-2xl object-cover border border-white/10" 
                  alt="Avatar Preview" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/bare-bear-logo.png';
                  }}
                />
                <input 
                  type="url" 
                  value={avatar || ''}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..." 
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 text-sm"
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center">
                <Camera size={14} className="mr-2" />
                Cover Image URL
              </label>
              <div className="flex items-center space-x-4">
                <img 
                  src={coverImage} 
                  className="w-16 h-16 rounded-2xl object-cover border border-white/10" 
                  alt="Cover Preview" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/bare-bear-logo.png';
                  }}
                />
                <input 
                  type="url" 
                  value={coverImage || ''}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..." 
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Display Name</label>
              <input 
                type="text" 
                required
                value={displayName || ''}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#967bb6] font-bold">@</span>
                <input 
                  type="text" 
                  required
                  value={username || ''}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="username" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Bio</label>
            <textarea 
              value={bio || ''}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[100px] focus:ring-1 focus:ring-[#967bb6] outline-none resize-none text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center">
                <Tag size={12} className="mr-2" />
                Tagline
              </label>
              <input 
                type="text" 
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Your catchy headline"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center">
                <Briefcase size={12} className="mr-2" />
                Occupation
              </label>
              <input 
                type="text" 
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="What do you do?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center">
                <MapPin size={12} className="mr-2" />
                Location
              </label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center">
                <Phone size={12} className="mr-2" />
                Phone
              </label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Social Media & Contact</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="url" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Website URL"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">@</span>
                <input 
                  type="text" 
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="Twitter/X Username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">@</span>
                <input 
                  type="text" 
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram Username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#967bb6]/5 rounded-2xl border border-[#967bb6]/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 uppercase tracking-tight">Creator Mode</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Enable creator features on your profile.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreator(!isCreator)}
                className={`w-14 h-7 rounded-full relative transition-all duration-300 ${isCreator ? 'bg-[#967bb6]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${isCreator ? 'left-8' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center">
                <CreditCard size={12} className="mr-2" />
                Stripe Account ID (acct_...)
              </label>
              <input 
                type="text" 
                value={stripeConnectId}
                onChange={(e) => setStripeConnectId(e.target.value)}
                placeholder="acct_1234567890"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 text-sm"
              />
              <p className="text-[9px] text-slate-600 uppercase font-bold">Find this in your Stripe Dashboard under Settings &gt; Account Details</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              className="flex-grow bg-black text-[#967bb6] py-5 rounded-2xl font-black text-lg shadow-xl shadow-[#967bb6]/20 transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98] chrome-border"
            >
              Save Changes
              <Check className="group-hover:translate-x-1 transition-transform" size={24} />
            </button>
            <button 
              type="button"
              onClick={onBack}
              className="sm:w-1/3 bg-white/5 hover:bg-white/10 text-slate-500 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
