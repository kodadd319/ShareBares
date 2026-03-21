
import React, { useEffect } from 'react';

interface AdSenseProps {
  adClient?: string;
  adSlot?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const AdSense: React.FC<AdSenseProps> = ({
  adClient = (import.meta as any).env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-5765882849864509',
  adSlot = (import.meta as any).env.VITE_ADSENSE_SLOT_ID || 'placeholder-slot',
  format = 'auto',
  responsive = true,
  className = '',
  style = { display: 'block' }
}) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className={`adsense-container overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdSense;
