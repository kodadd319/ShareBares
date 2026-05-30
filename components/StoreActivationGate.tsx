
import React from 'react';
import { User } from '../types';
import PaymentGate from './PaymentGate';
import { STORE_ACTIVATION_LINK } from '../constants';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface StoreActivationGateProps {
  user: User;
  onActivated: () => void;
}

const StoreActivationGate: React.FC<StoreActivationGateProps> = ({ user, onActivated }) => {
  const handleSuccess = async () => {
    // In a real app, this would be verified server-side
    // But we trigger the state change here
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      isStoreActive: true,
      storeActivationDate: new Date().toISOString()
    }, { merge: true });
    
    // Also update public profile
    const profileRef = doc(db, 'profiles', user.id);
    await setDoc(profileRef, {
      isStoreActive: true
    }, { merge: true });
    
    onActivated();
  };

  return (
    <div className="space-y-6">
      <div className="max-w-md mx-auto text-center px-4 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-4">
          🔐 STORE ACCESS BLOCKED
        </div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wide leading-relaxed">
          Access to Store Management is blocked until the monthly store usage fee subscription of $15.00 is active.
        </p>
      </div>

      <PaymentGate 
        title="Store Usage Fee"
        description="Active Monthly Subscription Required"
        amount={15}
        paymentLink={STORE_ACTIVATION_LINK}
        onSuccess={handleSuccess}
        isSubscription={true}
      />
    </div>
  );
};

export default StoreActivationGate;
