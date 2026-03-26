
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Github, Twitter, Chrome } from 'lucide-react';
import Logo from './Logo';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (displayName: string, username: string, email: string, password: string) => void;
  onSocialLogin: (provider: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, onSocialLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(email, password);
    } else {
      onRegister(displayName, username, email, password);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#967bb6]/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#6b46c1]/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-md w-full glass-panel rounded-[3rem] p-10 border-[#c0c0c0]/10 shadow-2xl relative z-10 chrome-border animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase chrome-text">
            {isLogin ? 'Welcome Back' : 'Join ShareBares'}
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            {isLogin ? 'Login to your account' : 'Meet barebear & create your unique presence'}
          </p>
          <p className="text-[#967bb6]/40 font-black uppercase tracking-[0.3em] text-[8px] mt-2">
            www.sharebares.com
          </p>
        </div>

        <div className="mb-8">
          <button 
            onClick={() => onSocialLogin('google')}
            className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm shadow-xl shadow-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3 group"
          >
            <Chrome size={20} className="text-black" />
            <span>Sign in with Google</span>
          </button>
          
          <div className="relative flex items-center justify-center my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-4 bg-black text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Or use email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Display Name</label>
                <input 
                  type="text" 
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Rivers"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Username</label>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alex_rivers"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all text-slate-200"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Email or Username</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#967bb6] transition-colors" size={18} />
              <input 
                type="text" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com or alex_rivers"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Password</label>
              {isLogin && (
                <button type="button" className="text-[9px] font-black uppercase tracking-widest text-[#967bb6] hover:text-white transition-colors">Forgot?</button>
              )}
            </div>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#967bb6] transition-colors" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all text-slate-200"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-black text-[#967bb6] py-5 rounded-2xl font-black text-lg shadow-xl shadow-[#967bb6]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3 chrome-border group"
          >
            <span>{isLogin ? 'Login Now' : 'Create Account'}</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-10">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-4 bg-black text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Other Options</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onSocialLogin('twitter')}
              className="flex items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
            >
              <Twitter size={20} className="text-slate-400 group-hover:text-white transition-colors" />
            </button>
            <button 
              onClick={() => onSocialLogin('github')}
              className="flex items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
            >
              <Github size={20} className="text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-slate-500 text-xs font-bold">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#967bb6] hover:underline uppercase tracking-widest ml-1"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>

        <div className="mt-12 w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:border-[#967bb6]/50 transition-all chrome-border bg-black/40">
          <a href="https://t.ajrkmx1.com/408699/8780/32516?bo=2779,2778,2777,2776,2775&file_id=616518&po=6533&aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0002" target="_blank" rel="noopener noreferrer" className="block w-full">
            <img 
              src="https://www.imglnkx.com/8780/JM-645_DESIGN-22450_WETTSHIRT2_640360.jpg" 
              className="w-full h-auto object-cover" 
              alt="Featured Content"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
