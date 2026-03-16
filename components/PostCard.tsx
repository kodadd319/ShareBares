
import React, { useState } from 'react';
import { Post, PostVisibility, User } from '../types';
import { Heart, MessageCircle, Eye, Star, Trash2, Lock } from 'lucide-react';
import { useBareBear } from './BareBearContext';

interface PostCardProps {
  post: Post;
  author: User;
  isMe: boolean;
  isAdmin?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onDelete?: () => void;
  onProfileClick?: (userId: string) => void;
  isFan?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, author, isMe, isAdmin, isFan, onLike, onComment, onDelete, onProfileClick }) => {
  const [liked, setLiked] = useState(false);
  const { showMascot } = useBareBear();
  
  const handleLike = () => {
    if (!liked && onLike) onLike();
    setLiked(!liked);
  };
  
  const getVisibilityLabel = (visibility: PostVisibility) => {
    switch (visibility) {
      case PostVisibility.PRIVATE: return 'Private';
      default: return 'Public';
    }
  };

  const isLocked = post.visibility === PostVisibility.PRIVATE && !isMe && !isAdmin && !isFan;

  const handleLockedClick = () => {
    showMascot({
      action: 'wink',
      message: `Want to see what's behind the curtain? Join ${author.displayName}'s Fan Club to unlock this! 😉💎`,
      duration: 5000
    });
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden mb-6 shadow-xl transition-all hover:border-[#967bb6]/40 chrome-border">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative cursor-pointer" onClick={() => onProfileClick?.(author.id)}>
            <img src={author.avatar} alt={author.displayName} className="w-10 h-10 rounded-full border border-[#967bb6]/30" />
            {author.isCreator && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#967bb6] border-2 border-black rounded-full flex items-center justify-center shadow-sm">
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            )}
          </div>
          <div className="cursor-pointer" onClick={() => onProfileClick?.(author.id)}>
            <h3 className="font-semibold text-slate-100 hover:text-[#967bb6] transition-colors">{author.displayName}</h3>
            <p className="text-xs text-slate-400">@{author.username} • {new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete Post (Admin)"
            >
              <Trash2 size={16} />
            </button>
          )}
          <div className="bg-white/5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-[#967bb6] border border-[#967bb6]/20">
            {getVisibilityLabel(post.visibility)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`px-4 pb-3 ${isLocked ? 'blur-md select-none pointer-events-none' : ''}`}>
        <p className="text-slate-200 leading-relaxed">{post.content}</p>
      </div>

      {/* Media */}
      <div 
        className="relative aspect-video bg-black flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={isLocked ? handleLockedClick : undefined}
      >
        {post.mediaUrl && (
          <img 
            src={post.mediaUrl} 
            alt="Post content" 
            className={`w-full h-full object-cover transition-all duration-700 ${isLocked ? 'blur-2xl' : ''}`} 
          />
        )}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <Lock size={48} className="text-[#967bb6] mb-4 animate-pulse" fill="#967bb6" />
            <p className="text-white font-black uppercase tracking-widest text-sm">Private Content</p>
          </div>
        )}
      </div>

      {/* Footer / Stats */}
      <div className="p-4 flex items-center space-x-4 border-t border-white/5">
        <button 
          onClick={handleLike}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#000000', color: '#967bb6' }}
        >
          <Heart size={18} fill={liked ? '#967bb6' : 'none'} />
          <span className="text-xs font-black uppercase tracking-widest">{post.likes}</span>
        </button>
        <button 
          onClick={onComment}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#000000', color: '#967bb6' }}
        >
          <MessageCircle size={18} />
          <span className="text-xs font-black uppercase tracking-widest">{post.commentsCount}</span>
        </button>
        <div className="flex-grow"></div>
        <button 
          className="p-2 rounded-xl transition-all hover:scale-105"
          style={{ backgroundColor: '#000000', color: '#967bb6' }}
        >
          <Eye size={18} />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
