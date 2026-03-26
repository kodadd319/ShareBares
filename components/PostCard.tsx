
import React, { useState } from 'react';
import { Post, PostVisibility, User, AppComment } from '../types';
import { Heart, MessageCircle, Eye, Star, Trash2, Lock, Share2, Check } from 'lucide-react';
import { useBareBear } from './BareBearContext';
import { APP_URL } from '../constants';

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
  comments?: AppComment[];
  users?: User[];
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, author, isMe, isAdmin, isFan, onLike, onComment, onDelete, onProfileClick,
  comments = [], users = []
}) => {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { showMascot } = useBareBear();
  
  const handleLike = () => {
    if (!liked && onLike) onLike();
    setLiked(!liked);
  };

  const handleShare = () => {
    const postUrl = `${APP_URL}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    showMascot({
      action: 'wink',
      message: `Spread the love! Link copied to clipboard. 😉🔥`,
      duration: 3000
    });
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

  const postComments = comments.filter(c => c.postId === post.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

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
      {post.content && (
        <div className={`px-4 pb-3 ${isLocked ? 'blur-md select-none pointer-events-none' : ''}`}>
          <p className="text-slate-200 leading-relaxed">{post.content}</p>
        </div>
      )}

      {/* Media */}
      {post.mediaUrl && (
        <div 
          className="relative aspect-video bg-black flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={isLocked ? handleLockedClick : undefined}
        >
          <img 
            src={post.mediaUrl} 
            alt="Post content" 
            className={`w-full h-full object-cover transition-all duration-700 ${isLocked ? 'blur-2xl' : ''}`} 
          />
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
              <Lock size={48} className="text-[#967bb6] mb-4 animate-pulse" fill="#967bb6" />
              <p className="text-white font-black uppercase tracking-widest text-sm">Private Content</p>
            </div>
          )}
        </div>
      )}

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
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#000000', color: '#967bb6' }}
        >
          <MessageCircle size={18} />
          <span className="text-xs font-black uppercase tracking-widest">{post.commentsCount}</span>
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#000000', color: copied ? '#4ade80' : '#967bb6' }}
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          <span className="text-xs font-black uppercase tracking-widest">{copied ? 'Copied' : 'Share'}</span>
        </button>
        <div className="flex-grow"></div>
        <button 
          className="p-2 rounded-xl transition-all hover:scale-105"
          style={{ backgroundColor: '#000000', color: '#967bb6' }}
        >
          <Eye size={18} />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && !isLocked && (
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#967bb6]">Comments</h4>
            <button 
              onClick={onComment}
              className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              Add Comment
            </button>
          </div>
          
          <div className="space-y-4">
            {postComments.length > 0 ? (
              postComments.map(comment => {
                const commenter = users.find(u => u.id === comment.userId);
                return (
                  <div key={comment.id} className="flex space-x-3">
                    <img 
                      src={commenter?.avatar || 'https://picsum.photos/seed/user/100/100'} 
                      alt={commenter?.displayName || 'User'} 
                      className="w-8 h-8 rounded-full border border-white/10"
                    />
                    <div className="flex-grow bg-white/5 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-200">{commenter?.displayName || 'Unknown User'}</span>
                        <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-2">No comments yet. Be the first!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
