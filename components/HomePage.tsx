
import React from 'react';
import { User, Post } from '../types';
import PostCard from './PostCard';
import AdPlaceholder from './AdPlaceholder';
import { Star, TrendingUp, Users, ChevronRight, Sparkles } from 'lucide-react';

interface HomePageProps {
  me: User;
  users: User[];
  posts: Post[];
  searchQuery: string;
  onSelectUser: (userId: string) => void;
  onLikePost?: (post: Post) => void;
  onCommentPost?: (post: Post) => void;
  onProfileClick?: (userId: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  me, 
  users, 
  posts, 
  searchQuery, 
  onSelectUser, 
  onLikePost,
  onCommentPost,
  onProfileClick
}) => {
  const otherUsers = users.filter(u => u.id !== me.id);
  
  // Filter posts: only show posts from other users for the "Home" experience
  const feedPosts = posts
    .filter(p => p.userId !== me.id)
    .filter(p => !searchQuery || p.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const featuredCreators = otherUsers.slice(0, 5);
  const suggestedFollows = otherUsers.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Main Feed */}
      <div className="lg:col-span-8 space-y-8">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1a1a1a] to-black border border-white/5 p-8 chrome-border shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#967bb6]/10 blur-[100px] -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 text-[#967bb6] mb-2">
              <Sparkles size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Welcome Back</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-4 chrome-text">
              HELLO, {me.displayName.split(' ')[0].toUpperCase()}!
            </h1>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed">
              Check out what's happening in your network. New exclusive content from your favorite creators is waiting.
            </p>
          </div>
        </div>

        {/* Featured Creators Horizontal Scroll */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center space-x-2">
              <Star size={18} className="text-[#967bb6]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Featured Creators</h2>
            </div>
            <button className="text-[10px] font-bold text-slate-500 hover:text-[#967bb6] transition-colors flex items-center uppercase tracking-widest">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            {featuredCreators.map(user => (
              <div 
                key={user.id} 
                onClick={() => onProfileClick?.(user.id)}
                className="flex-shrink-0 w-40 glass-panel rounded-3xl p-4 border-[#c0c0c0]/10 hover:border-[#967bb6]/30 transition-all cursor-pointer group chrome-border"
              >
                <div className="relative mb-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border-2 border-black shadow-xl group-hover:scale-105 transition-transform">
                    <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                  </div>
                  {user.isCreator && (
                    <div className="absolute -bottom-1 -right-1 bg-[#967bb6] text-white p-1 rounded-lg shadow-lg">
                      <Star size={10} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-white truncate uppercase tracking-tighter">{user.displayName}</p>
                  <p className="text-[9px] text-[#967bb6] font-bold">@{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main Feed */}
        <section className="space-y-6">
          <div className="flex items-center space-x-2 mb-6 px-2">
            <TrendingUp size={18} className="text-[#967bb6]" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Recent Activity</h2>
          </div>
          
          {feedPosts.length > 0 ? (
            <div className="space-y-6">
              {feedPosts.map((post, index) => {
                const author = users.find(u => u.id === post.userId)!;
                return (
                  <React.Fragment key={post.id}>
                    <PostCard 
                      post={post} 
                      author={author} 
                      isMe={false} 
                      isAdmin={me.isAdmin}
                      isFan={author.fanIds?.includes(me.id)}
                      onLike={() => onLikePost?.(post)}
                      onComment={() => onCommentPost?.(post)}
                      onProfileClick={onProfileClick}
                    />
                    {index === 1 && <AdPlaceholder size="md" />}
                  </React.Fragment>
                );
              })}
              {/* Another Ad Placement at the bottom of the feed */}
              <AdPlaceholder size="md" className="mt-8" />
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-white/10">
              <Users size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No posts found in this category</p>
            </div>
          )}
        </section>
      </div>

      {/* Right Column: Sidebar */}
      <div className="lg:col-span-4 space-y-8 hidden lg:block">
        {/* Suggested to Follow */}
        <div className="glass-panel rounded-[2rem] border-[#c0c0c0]/10 p-6 chrome-border sticky top-24">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#967bb6] mb-6">Who to Follow</h3>
          <div className="space-y-6">
            {suggestedFollows.map(user => (
              <div key={user.id} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onProfileClick?.(user.id)}>
                  <img src={user.avatar} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate group-hover:text-[#967bb6] transition-colors uppercase tracking-tighter">{user.displayName}</p>
                    <p className="text-[10px] text-slate-500">@{user.username}</p>
                  </div>
                </div>
                <button className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#967bb6] hover:text-white transition-all border border-white/5">
                  Follow
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
            Show More
          </button>
        </div>

        <AdPlaceholder size="lg" />

        {/* Stats Card */}
        <div className="glass-panel rounded-[2rem] border-[#c0c0c0]/10 p-6 chrome-border bg-gradient-to-br from-[#967bb6]/5 to-transparent">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#967bb6] mb-4">Your Network</h3>
          <div className="grid grid-cols-1 gap-4">
            <div 
              className="bg-black/40 rounded-2xl p-4 border border-white/5 cursor-pointer hover:bg-black/60 transition-all group"
              onClick={() => onProfileClick?.(me.id)}
            >
              <p className="text-xl font-black text-white group-hover:text-[#967bb6] transition-colors">{me.friendIds.length}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest group-hover:text-white transition-colors">Friends</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
