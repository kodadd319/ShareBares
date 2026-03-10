
import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: window.location.origin,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Amount</span>
          <span className="text-xl font-black text-white">${amount.toFixed(2)}</span>
        </div>
        <div className="flex items-center space-x-2 text-emerald-500">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Secure SSL Encryption</span>
        </div>
      </div>

      <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
      
      {message && (
        <div className="flex items-center space-x-2 text-red-500 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
          <AlertCircle size={18} />
          <p className="text-xs font-bold">{message}</p>
        </div>
      )}

      <div className="flex flex-col space-y-3 pt-4">
        <button
          disabled={isLoading || !stripe || !elements}
          id="submit"
          className="w-full bg-black text-[#967bb6] py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#967bb6]/20 transition-all active:scale-[0.98] chrome-border flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <span>Pay Now</span>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full bg-white/5 hover:bg-white/10 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default StripePaymentForm;
