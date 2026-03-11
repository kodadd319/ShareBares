
export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  createdAt: string;
  isNSFW: boolean;
}

export interface StoreCustomization {
  backgroundColor: string;
  accentColor: string;
  fontFamily: string;
  fontColor: string;
  layout: 'grid' | 'list' | 'bento';
}

export interface ProfileCustomization {
  backgroundColor?: string;
  backgroundWallpaper?: string;
  menuBarColor?: string;
  fontColor?: string;
  fontType?: string;
  buttonColor?: string;
  accentColor?: string;
  layout?: 'default' | 'bento' | 'minimal' | 'sidebar' | 'magazine';
  themeSongUrl?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coverImage: string;
  bio: string;
  email?: string;
  password?: string;
  isBanned?: boolean;
  location?: string;
  occupation?: string;
  tagline?: string;
  phone?: string;
  socials?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  isCreator: boolean;
  subscribersCount: number;
  followingCount: number;
  friendIds: string[];
  pendingFriendRequestsSent: string[];
  pendingFriendRequestsReceived: string[];
  fwbIds: string[];
  pendingFwbRequestsSent: string[];
  pendingFwbRequestsReceived: string[];
  fwbRequestsResetDate: string;
  fwbRequestsSentCount: number;
  fanIds: string[];
  photos: MediaItem[];
  storeUploads: MediaItem[];
  blockedUserIds: string[];
  hasPaidStoreFee?: boolean;
  hasPaidStableFee?: boolean;
  hasPaidStableBundle?: boolean;
  isAdmin?: boolean;
  stripeConnectId?: string;
  purchasedItemIds?: string[];
  storeCustomization?: StoreCustomization;
  profileCustomization?: ProfileCustomization;
  settings?: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    profileVisibility: 'public' | 'private';
    messagingPrivacy: 'everyone' | 'following' | 'none';
  };
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: string;
  likes: number;
  commentsCount: number;
  visibility: PostVisibility;
  category?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface StoreItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  price: number;
  thumbnailUrl: string;
  mediaUrl: string;
  type: 'image' | 'video';
  createdAt: string;
}

export interface ChatThread {
  otherUser: User;
  lastMessage?: Message;
}

export enum NotificationType {
  MESSAGE = 'MESSAGE',
  PURCHASE = 'PURCHASE',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  SYSTEM = 'SYSTEM'
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  senderId?: string;
  postId?: string;
  storeItemId?: string;
}

export interface StableListing {
  id: string;
  userId: string;
  providerName: string;
  providerGender: 'male' | 'female' | 'non-binary' | 'transgender';
  services: string;
  city: string;
  importantInfo?: string;
  pricing: string;
  contactInfo: string;
  avatarUrl?: string;
  photos?: string[];
  createdAt: string;
}
