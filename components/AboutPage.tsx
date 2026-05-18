
import React from 'react';
import { 
  Home, Star, ShoppingBag, MessageSquare, 
  DollarSign, Shield, Info, ArrowRight,
  Video, Phone, Image as ImageIcon, Heart,
  Briefcase, CheckCircle2, AlertCircle
} from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
  onNavigate: (tab: string) => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack, onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-16">
        <div className="inline-block p-3 bg-[#967bb6]/20 rounded-2xl mb-6 animate-bounce">
          <Info className="text-[#967bb6]" size={32} />
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase chrome-text mb-4">
          Welcome to ShareBares
        </h1>
        <p className="text-[#967bb6] text-lg md:text-2xl font-black uppercase tracking-[0.3em] italic mb-8">
          "The Ultimate Uncensored Playground"
        </p>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Ready to dive into a world with no rules and no limits? Whether you're here to explore, 
          share your own bares, or build an empire—ShareBares is your stage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        {/* Homepage Feed */}
        <div className="glass-panel rounded-[3rem] p-8 border-[#967bb6]/20 bg-gradient-to-br from-[#967bb6]/10 to-transparent chrome-border group hover:scale-[1.02] transition-all duration-500">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-[#967bb6]/20 transition-colors">
              <Home className="text-[#967bb6]" size={28} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Homepage Feed</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            This is where the magic happens. Post your free pics, engage with the hottest creators, 
            and see what "sharing your bares" is all about! Like, comment, and connect with a community 
            that celebrates freedom.
          </p>
          <button 
            onClick={() => onNavigate('feed')}
            className="flex items-center space-x-2 text-[#967bb6] font-black uppercase text-xs tracking-widest hover:translate-x-2 transition-transform"
          >
            <span>Jump in</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* The Stable */}
        <div className="glass-panel rounded-[3rem] p-8 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent chrome-border group hover:scale-[1.02] transition-all duration-500">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-amber-500/20 transition-colors">
              <Star className="text-amber-500" size={28} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">The Stable</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Looking for something more personal? The Stable is our elite escort service directory. 
            Connect with premium providers for in-person experiences. Directly contact, directly book—no middleman.
          </p>
          <button 
            onClick={() => onNavigate('stable')}
            className="flex items-center space-x-2 text-amber-500 font-black uppercase text-xs tracking-widest hover:translate-x-2 transition-transform"
          >
            <span>Explore The Stable</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Stores & Content */}
        <div className="glass-panel rounded-[3rem] p-8 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent chrome-border group hover:scale-[1.02] transition-all duration-500">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
              <ShoppingBag className="text-emerald-500" size={28} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">User Stores</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Your personal digital boutique. Sell your hottest videos and pics to a global audience. 
            Buy exclusive content from your favorite creators. Your store, your content, your profit.
          </p>
          <button 
            onClick={() => onNavigate('media-store')}
            className="flex items-center space-x-2 text-emerald-500 font-black uppercase text-xs tracking-widest hover:translate-x-2 transition-transform"
          >
            <span>Shop Now</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Messaging & Chat */}
        <div className="glass-panel rounded-[3rem] p-8 border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent chrome-border group hover:scale-[1.02] transition-all duration-500">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
              <MessageSquare className="text-blue-500" size={28} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Global Chat</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Stay connected. Our advanced messaging system supports text, voice, and 4K video streams. 
            Want something more intimate? Start a private video session or phone sex call directly in the app.
          </p>
          <button 
            onClick={() => onNavigate('messages')}
            className="flex items-center space-x-2 text-blue-500 font-black uppercase text-xs tracking-widest hover:translate-x-2 transition-transform"
          >
            <span>Start Chatting</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* The Stable Deeper Explanation */}
      <div className="glass-panel rounded-[4rem] p-12 border-amber-500/20 bg-black/40 chrome-border mb-20 relative overflow-hidden">
        <div className="flex flex-col gap-8">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-amber-500/10 rounded-2xl">
              <Briefcase className="text-amber-500" size={28} />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Inside The Stable</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <p className="text-slate-400 text-sm leading-relaxed italic">
                "The Stable is where professional service providers connect with discerning clients for in-person experiences."
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-slate-300 text-sm">Join by creating an Escort Profile with verified photos.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-slate-300 text-sm">List your location, services, pricing, and contact methods.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></div>
                  <p className="text-slate-300 text-sm">No transaction fees—deal directly with your clients.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-500/5 rounded-[2rem] p-6 border border-amber-500/20 flex flex-col justify-between">
              <div className="flex items-start space-x-3 mb-4">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-2 italic">Legal Disclosure</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
                    All "In-Person Service" transactions are handled directly between the service provider and the client. 
                    ShareBares is a separate entity and serves strictly as a listing platform. ShareBares does not participate in, 
                    nor is it responsible for, any service agreements or transactions. All questions, comments, or complaints 
                    must be directed to the service provider.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('join-stable')}
                className="w-full py-4 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-amber-400 transition-colors"
              >
                Join The Stable Today
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pb-20">
        <h3 className="text-2xl font-black text-white uppercase italic mb-6">Ready to Share Your Bares?</h3>
        <button 
          onClick={onBack}
          className="bg-white text-black px-12 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl hover:scale-105 transition-all chrome-border"
        >
          Let's Go!
        </button>
      </div>
    </div>
  );
};

export default AboutPage;
