
import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, ArrowLeft, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Logo from './Logo';
import { useBareBear } from './BareBearContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentPageProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
  itemName: string;
  paymentLink?: string;
  successMessage?: string;
  successTitle?: string;
  destinationAccountId?: string;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ 
  onSuccess, 
  onCancel, 
  amount, 
  itemName,
  paymentLink,
  successMessage = "Your store has been activated",
  successTitle = "Payment Successful",
  destinationAccountId
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showMascot } = useBareBear();

  useEffect(() => {
    showMascot({
      action: 'point',
      message: `Time to secure your ${itemName}! I've got your back. 🛡️`,
      duration: 6000
    });
  }, [itemName, showMascot]);

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        setIsProcessing(true);
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            amount, 
            metadata: { itemName },
            destinationAccountId
          }),
        });
        
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error || "Failed to initialize payment");
        }
      } catch (err: any) {
        console.error("Error creating payment intent:", err);
        setError("Could not connect to payment server");
      } finally {
        setIsProcessing(false);
      }
    };

    createPaymentIntent();
  }, [amount, itemName]);

  const handlePaymentSuccess = () => {
    setIsSuccess(true);
    showMascot({
      action: 'dance',
      message: "YESSS! Payment successful! You're officially legendary! 🕺✨",
      duration: 5000,
      position: 'center'
    });
    setTimeout(() => {
      onSuccess();
    }, 3000);
  };

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#967bb6',
      colorBackground: '#0a0a0a',
      colorText: '#ffffff',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '16px',
    },
  };

  const options = {
    clientSecret: clientSecret || '',
    appearance,
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="max-w-md w-full glass-panel rounded-[2.5rem] overflow-hidden border-[#967bb6]/20 shadow-2xl shadow-[#967bb6]/10 chrome-border">
        {!isSuccess ? (
          <>
            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-[#967bb6]/10 to-transparent">
              <button 
                onClick={onCancel}
                className="mb-6 flex items-center space-x-2 text-slate-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest"
              >
                <ArrowLeft size={14} />
                <span>Cancel</span>
              </button>
              
              <div className="flex justify-center mb-6">
                <Logo size="md" />
              </div>
              
              <h1 className="text-2xl font-black text-white text-center uppercase tracking-tighter chrome-text">Secure Payment</h1>
              <p className="text-slate-500 text-center text-xs mt-2 uppercase tracking-widest font-bold">{itemName}</p>
            </div>

            <div className="p-8">
              {error ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                    <AlertCircle size={32} className="text-red-500" />
                  </div>
                  <p className="text-red-500 text-sm font-bold uppercase tracking-widest">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/10"
                  >
                    Try Again
                  </button>
                </div>
              ) : isProcessing || !clientSecret ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="animate-spin text-[#967bb6]" size={48} />
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Initializing Secure Checkout...</p>
                </div>
              ) : (
                <Elements options={options} stripe={stripePromise}>
                  <StripePaymentForm 
                    amount={amount} 
                    onSuccess={handlePaymentSuccess} 
                    onCancel={onCancel} 
                  />
                </Elements>
              )}
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
              <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">
                By clicking pay, you agree to our terms of service and creator agreement.
              </p>
            </div>
          </>
        ) : (
          <div className="p-12 text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter chrome-text">{successTitle}</h2>
              <p className="text-slate-400 mt-2 uppercase text-[10px] tracking-widest font-bold">{successMessage}</p>
            </div>
            <p className="text-slate-500 text-xs italic">Redirecting you back...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
