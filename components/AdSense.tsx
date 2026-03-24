
import React, { useEffect, useRef } from 'react';

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
  const adPushed = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWidth, setHasWidth] = React.useState(false);

  useEffect(() => {
    if (!containerRef.current || adPushed.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setHasWidth(true);
          observer.disconnect();
        }
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (hasWidth && !adPushed.current) {
      try {
        // Ensure the script is loaded
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adPushed.current = true;
        }
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [hasWidth]);

  return (
    <div 
      ref={containerRef}
      className={`adsense-container overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] ${className}`}
    >
      <ins
        className="adsbygoogle"
        style={{ ...style, minWidth: hasWidth ? 'auto' : '1px' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdSense;
