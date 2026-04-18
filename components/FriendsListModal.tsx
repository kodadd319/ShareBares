
import React from 'react';
import { X, Users, UserX, Ban } from 'lucide-react';
import { User } from '../types';

interface FriendsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  allUsers: User[];
  onProfileClick: (userId: string) => void;
  isOwnProfile: boolean;
  onDeleteFriend?: (userId: string) => void;
  onBlockUser?: (userId: string) => void;
}

const FriendsListModal: React.FC<FriendsListModalProps> = ({ 
  isOpen, onClose, user, allUsers, onProfileClick, isOwnProfile, onDeleteFriend, onBlockUser 
}) => {
  if (!isOpen) return null;

  const friends = allUsers.filter(u => user.friendIds.includes(u.id));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg glass-panel rounded-[2.5rem] border-[#967bb6]/20 bg-[#050505] chrome-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#967bb6]/10 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#967bb6]/20 rounded-xl flex items-center justify-center">
              <Users className="text-[#967bb6]" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Friends List</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{user.displayName}'s Connections</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {friends.length > 0 ? (
            friends.map(friend => (
              <div key={friend.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 group hover:border-[#967bb6]/30 transition-all">
                <div 
                  className="flex items-center space-x-4 cursor-pointer"
                  onClick={() => {
                    onProfileClick(friend.id);
                    onClose();
                  }}
                >
                  <img 
                    src={friend.avatar} 
                    className="w-12 h-12 rounded-xl object-cover border border-white/10" 
                    alt="" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/bare-bear-logo.png';
                    }}
                  />
                  <div>
                    <h4 className="text-white font-bold text-sm group-hover:text-[#967bb6] transition-colors">{friend.displayName}</h4>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">@{friend.username}</p>
                  </div>
                </div>
                
                {isOwnProfile && (
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onDeleteFriend?.(friend.id)}
                      className="p-2 rounded-lg transition-all"
                      style={{ backgroundColor: '#000000', color: '#967bb6' }}
                      title="Remove Friend"
                    >
                      <UserX size={18} />
                    </button>
                    <button 
                      onClick={() => onBlockUser?.(friend.id)}
                      className="p-2 rounded-lg transition-all"
                      style={{ backgroundColor: '#000000', color: '#967bb6' }}
                      title="Block User"
                    >
                      <Ban size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <Users size={32} className="text-slate-700" />
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No friends found</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
          <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">
            {friends.length} Total Friends
          </p>
        </div>
      </div>
    </div>
  );
};

export default FriendsListModal;
