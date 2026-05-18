
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

  const features = [
    'Monetize Content',
    'Secure Payments',
    'Custom Storefront',
    'Marketplace Exposure',
    '8-Minute Video Limits',
    'Picture Pack Support'
  ];

  return (
    <PaymentGate 
      title="Store Activation"
      description="Unlock your creative business"
      amount={15}
      paymentLink={STORE_ACTIVATION_LINK}
      onSuccess={handleSuccess}
      features={features}
    />
  );
};

export default StoreActivationGate;
