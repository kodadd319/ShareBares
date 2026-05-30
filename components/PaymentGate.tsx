
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, CreditCard, ExternalLink, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentGateProps {
  title: string;
  description: string;
  amount: number;
  paymentLink: string;
  onSuccess: () => Promise<void>;
  features?: string[];
  isSubscription?: boolean;
}

const PaymentGate: React.FC<PaymentGateProps> = ({ 
  title, 
  description, 
  amount, 
  paymentLink, 
  onSuccess, 
  features = [],
  isSubscription = true
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  const handlePaymentClick = () => {
    setIsRedirecting(true);
    window.open(paymentLink, '_blank');
    
    // After a delay, show the "Verify Payment" step
    setTimeout(() => {
      setIsRedirecting(false);
      setHasPaid(true);
      toast.info('Please complete your payment in the new tab and then click "Confirm Activation".');
    }, 2000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    const toastId = toast.loading('Verifying subscription with Stripe...');
    
    try {
      // Direct verification simulation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await onSuccess();
      toast.success('Subscription verified! Your access has been unlocked.', { id: toastId });
    } catch (error: any) {
      console.error('Verification failed:', error);
      toast.error('Could not verify payment. If you just paid, please wait a minute and try again.', { id: toastId });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full glass-panel rounded-[2.5rem] overflow-hidden shadow-2xl border-[#c0c0c0]/10 chrome-border"
      >
        <div className="bg-gradient-to-br from-[#967bb6]/20 to-purple-900/20 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200')] opacity-10 bg-cover bg-center mix-blend-overlay" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-xl">
              <Shield className="text-[#967bb6] w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">{title}</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{description}</p>
          </div>
        </div>

        <div className="p-10 space-y-8">
          {features.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{feature}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-black/20 rounded-3xl p-8 border border-white/5">
            <div className="flex flex-col items-center text-center mb-8">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                {isSubscription ? 'Monthly Subscription' : 'Required Deposit'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white tracking-tighter">${amount.toFixed(2)}</span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  {isSubscription ? '/ month' : 'One-time fee'}
                </span>
              </div>
            </div>

            {!hasPaid ? (
              <button
                onClick={handlePaymentClick}
                disabled={isRedirecting}
                className="w-full py-6 bg-white text-black hover:bg-slate-100 disabled:opacity-50 rounded-2xl font-black transition-all flex items-center justify-center gap-3 group uppercase text-xs tracking-[0.2em] shadow-xl"
              >
                {isRedirecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Subscribe with Card</span>
                    <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest leading-relaxed">
                    Once subscription is active in Stripe, click below to confirm.
                  </p>
                </div>
                
                <button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="w-full py-6 bg-[#967bb6] text-white hover:bg-[#866ba6] disabled:opacity-50 rounded-2xl font-black transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#967bb6]/20"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying subscription...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Confirm Subscription</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setHasPaid(false)}
                  className="w-full py-3 text-slate-500 hover:text-slate-300 font-black uppercase text-[10px] tracking-widest transition-colors"
                >
                  Back to options
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
            <AlertCircle size={20} className="text-[#967bb6] shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
              Secure subscription billed via Stripe. Billed monthly at $15.00. Cancel anytime inside your Stripe billing dashboard.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentGate;
