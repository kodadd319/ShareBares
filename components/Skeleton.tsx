import React from 'react';

export const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-slate-800/50 rounded-lg", className)} />
);

export const PostSkeleton: React.FC = () => (
  <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl mb-4">
    <div className="flex items-start gap-3 mb-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-20 h-3" />
      </div>
    </div>
    <div className="space-y-3 mb-4">
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-4/5 h-4" />
    </div>
    <Skeleton className="w-full aspect-square rounded-2xl" />
    <div className="flex justify-between mt-4">
      <Skeleton className="w-16 h-8 rounded-full" />
      <Skeleton className="w-16 h-8 rounded-full" />
      <Skeleton className="w-16 h-8 rounded-full" />
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="bg-black min-h-screen">
    <Skeleton className="w-full h-48 sm:h-64 rounded-none" />
    <div className="max-w-4xl mx-auto px-4 -mt-16 relative bg-black min-h-screen border-x border-white/5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 py-4">
        <div className="relative">
          <Skeleton className="w-32 h-32 rounded-3xl border-4 border-black" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-24 h-10 rounded-xl" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </div>
      <div className="space-y-4 mb-8">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-32 h-4 opacity-50" />
        <div className="flex gap-4">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
        <Skeleton className="w-full h-20" />
      </div>
      <div className="grid grid-cols-3 gap-1 mt-8">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  </div>
);

export const StoreItemSkeleton: React.FC = () => (
  <div className="animate-pulse flex flex-col space-y-3">
    <div className="aspect-square bg-white/5 rounded-2xl border border-white/5" />
    <div className="h-4 bg-white/5 rounded w-3/4" />
    <div className="h-3 bg-white/5 rounded w-1/2 opacity-50" />
  </div>
);

export const MessageSkeleton: React.FC = () => (
  <div className="flex flex-col space-y-4 p-4">
    <div className="flex justify-start space-x-2">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <Skeleton className="w-48 h-12 rounded-2xl rounded-bl-none" />
    </div>
    <div className="flex justify-end">
      <Skeleton className="w-56 h-14 rounded-2xl rounded-br-none" />
    </div>
    <div className="flex justify-start space-x-2">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <Skeleton className="w-32 h-10 rounded-2xl rounded-bl-none" />
    </div>
  </div>
);

export const NotificationSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-start space-x-4">
        <div className="w-11 h-11 rounded-2xl bg-white/10 shrink-0" />
        <div className="flex-grow space-y-2">
          <div className="h-4 w-1/3 bg-white/10 rounded-lg" />
          <div className="h-3 w-3/4 bg-white/5 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

export const StableSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 space-y-4">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <Skeleton className="w-3/4 h-6 mx-auto" />
        <Skeleton className="w-1/2 h-4 mx-auto opacity-50" />
        <div className="space-y-2">
          <Skeleton className="w-full h-12 rounded-xl" />
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);
