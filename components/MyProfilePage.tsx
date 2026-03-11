
import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Trash2, Ban, UserPlus, UserCheck, UserX, 
  Flame, Shield, Heart, Users, Check, X, AlertCircle, Clock,
  Image as ImageIcon
} from 'lucide-react';
import { User, MediaItem } from '../types';
import AdPlaceholder from './AdPlaceholder';

interface MyProfilePageProps {
  me: User;
  users: User[];
  onUploadPhoto: (photo: Omit<MediaItem, 'id' | 'createdAt'>) => void;
  onDeletePhoto: (photoId: string) => void;
  onAcceptFriendRequest: (userId: string) => void;
  onRejectFriendRequest: (userId: string) => void;
  onDeleteFriend: (userId: string) => void;
  onBlockUser: (userId: string) => void;
  onSendFwbRequest: (userId: string) => void;
  onAcceptFwbRequest: (userId: string) => void;
  onRejectFwbRequest: (userId: string) => void;
  onUnblockUser: (userId: string) => void;
}

const MyProfilePage: React.FC<MyProfilePageProps> = ({ 
  me, users, onUploadPhoto, onDeletePhoto, onAcceptFriendRequest, 
  onRejectFriendRequest, onDeleteFriend, onBlockUser, onSendFwbRequest,
  onAcceptFwbRequest, onRejectFwbRequest, onUnblockUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'photos' | 'friends' | 'fwb'>('photos');
  const [fwbSearchTerm, setFwbSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onUploadPhoto({
        url,
        type: 'image',
        isNSFW: false
      });
    }
  };

  const friends = users.filter(u => me.friendIds.includes(u.id));
  const pendingReceived = users.filter(u => me.pendingFriendRequestsReceived.includes(u.id));
  const pendingSent = users.filter(u => me.pendingFriendRequestsSent.includes(u.id));
  
  const fwbList = users.filter(u => me.fwbIds.includes(u.id));
  const fwbPendingReceived = users.filter(u => me.pendingFwbRequestsReceived.includes(u.id));
  const fwbPendingSent = users.filter(u => me.pendingFwbRequestsSent.includes(u.id));

  // FWB Limit Logic
  const canSendFwb = me.fwbRequestsSentCount < 2;
  
  const potentialFwbUsers = users.filter(u => 
    u.id !== me.id && 
    !me.fwbIds.includes(u.id) && 
    !me.pendingFwbRequestsSent.includes(u.id) &&
    !me.pendingFwbRequestsReceived.includes(u.id) &&
    (u.displayName.toLowerCase().includes(fwbSearchTerm.toLowerCase()) || 
     u.username.toLowerCase().includes(fwbSearchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase chrome-text mb-2">More</h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Manage your profile, friends, and connections</p>
      </div>

      {/* Sub-navigation */}
      <div className="flex space-x-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setActiveSubTab('photos')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center space-x-2 chrome-border ${activeSubTab === 'photos' ? 'bg-black text-[#967bb6] shadow-lg shadow-[#967bb6]/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
        >
          <Camera size={16} />
          <span>My Photos</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('friends')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center space-x-2 chrome-border ${activeSubTab === 'friends' ? 'bg-black text-[#967bb6] shadow-lg shadow-[#967bb6]/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
        >
          <Users size={16} />
          <span>Friends</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('fwb')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center space-x-2 chrome-border ${activeSubTab === 'fwb' ? 'bg-black text-[#967bb6] shadow-lg shadow-[#967bb6]/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
        >
          <Flame size={16} />
          <span>FWB Connections</span>
        </button>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {activeSubTab === 'photos' && (
          <div className="glass-panel rounded-[2.5rem] p-8 border-[#967bb6]/20 bg-[#967bb6]/5 chrome-border">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Photo Gallery</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Upload photos to your public profile</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-black text-[#967bb6] px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#967bb6]/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 chrome-border"
              >
                <Upload size={16} />
                <span>Upload New</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {me.photos.map(photo => (
                <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group chrome-border">
                  <img src={photo.url} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => onDeletePhoto(photo.id)}
                      className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {me.photos.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <ImageIcon size={32} className="text-slate-700" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No photos uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'friends' && (
          <div className="space-y-8">
            {/* Pending Requests */}
            {pendingReceived.length > 0 && (
              <div className="glass-panel rounded-[2.5rem] p-8 border-emerald-500/20 bg-emerald-500/5 chrome-border">
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center space-x-2">
                  <UserPlus className="text-emerald-500" size={20} />
                  <span>New Friend Requests</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReceived.map(user => (
                    <div key={user.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                      <div className="flex items-center space-x-3">
                        <img src={user.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <div>
                          <h4 className="text-white font-bold text-sm">{user.displayName}</h4>
                          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">@{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => onAcceptFriendRequest(user.id)}
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => onRejectFriendRequest(user.id)}
                          className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className="glass-panel rounded-[2.5rem] p-8 border-[#967bb6]/20 bg-[#967bb6]/5 chrome-border">
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center space-x-2">
                <Users className="text-[#967bb6]" size={20} />
                <span>My Friends</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map(user => (
                  <div key={user.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 group">
                    <div className="flex items-center space-x-3">
                      <img src={user.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                      <div>
                        <h4 className="text-white font-bold text-sm">{user.displayName}</h4>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">@{user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onDeleteFriend(user.id)}
                        className="p-2 bg-white/10 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Remove Friend"
                      >
                        <UserX size={18} />
                      </button>
                      <button 
                        onClick={() => onBlockUser(user.id)}
                        className="p-2 bg-white/10 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Block User"
                      >
                        <Ban size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {friends.length === 0 && (
                  <div className="col-span-full py-8 text-center">
                    <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">You haven't added any friends yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'fwb' && (
          <div className="space-y-8">
            {/* FWB Status & Search */}
            <div className="glass-panel rounded-[2.5rem] p-8 border-[#967bb6]/20 bg-[#967bb6]/5 chrome-border">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">FWB Connections</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Exclusive connections with trusted partners</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex items-center space-x-3">
                  <Clock size={16} className="text-[#967bb6]" />
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Monthly Limit</p>
                    <p className={`text-xs font-black ${canSendFwb ? 'text-emerald-500' : 'text-red-500'}`}>
                      {me.fwbRequestsSentCount} / 2 Sent
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mb-8">
                <input 
                  type="text"
                  value={fwbSearchTerm}
                  onChange={(e) => setFwbSearchTerm(e.target.value)}
                  placeholder="Search users to send FWB request..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#967bb6] transition-all outline-none text-slate-100 placeholder:text-slate-700"
                />
                {fwbSearchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl max-h-64 overflow-y-auto">
                    {potentialFwbUsers.map(user => (
                      <div key={user.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                        <div className="flex items-center space-x-3">
                          <img src={user.avatar} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div>
                            <h4 className="text-white font-bold text-sm">{user.displayName}</h4>
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">@{user.username}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            onSendFwbRequest(user.id);
                            setFwbSearchTerm('');
                          }}
                          disabled={!canSendFwb}
                          className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all ${canSendFwb ? 'bg-black text-[#967bb6] hover:scale-105' : 'bg-white/5 text-slate-700 cursor-not-allowed'}`}
                        >
                          {canSendFwb ? 'Send Request' : 'Limit Reached'}
                        </button>
                      </div>
                    ))}
                    {potentialFwbUsers.length === 0 && (
                      <div className="p-8 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FWB Pending Received */}
              {fwbPendingReceived.length > 0 && (
                <div className="mb-8 p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20">
                  <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center space-x-2">
                    <Flame size={14} />
                    <span>Incoming FWB Requests</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fwbPendingReceived.map(user => (
                      <div key={user.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                        <div className="flex items-center space-x-3">
                          <img src={user.avatar} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div>
                            <h4 className="text-white font-bold text-sm">{user.displayName}</h4>
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">@{user.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => onAcceptFwbRequest(user.id)}
                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => onRejectFwbRequest(user.id)}
                            className="p-2 bg-white/10 text-slate-400 rounded-lg hover:bg-white/20 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FWB List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fwbList.map(user => (
                  <div key={user.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 group">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img src={user.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <div className="absolute -top-1 -right-1 bg-black text-[#967bb6] p-1 rounded-full shadow-lg border border-[#967bb6]/30">
                          <Flame size={10} className="text-[#967bb6]" fill="currentColor" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{user.displayName}</h4>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">@{user.username}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onRejectFwbRequest(user.id)}
                      className="p-2 bg-white/10 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="End FWB Connection"
                    >
                      <UserX size={18} />
                    </button>
                  </div>
                ))}
                {fwbList.length === 0 && (
                  <div className="col-span-full py-8 text-center">
                    <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">No active FWB connections</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Ad Placement at the bottom of Profile Management */}
      <div className="mt-12">
        <AdPlaceholder size="md" />
      </div>
    </div>
  );
};

export default MyProfilePage;
