import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ShareBares, { ShareBaresAction } from './Mascot';

interface ShareBaresContextType {
  showMascot: (config: {
    action?: ShareBaresAction;
    message?: string;
    duration?: number;
    position?: 'bottom-right' | 'bottom-left' | 'center';
  }) => void;
  hideMascot: () => void;
}

const ShareBaresContext = createContext<ShareBaresContextType | undefined>(undefined);

export const ShareBaresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [config, setConfig] = useState<{
    action: ShareBaresAction;
    message?: string;
    position: 'bottom-right' | 'bottom-left' | 'center';
  }>({
    action: 'wink',
    position: 'bottom-right'
  });

  const hideMascot = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showMascot = useCallback(({ 
    action = 'wink', 
    message, 
    duration = 5000,
    position = 'bottom-right'
  }: {
    action?: ShareBaresAction;
    message?: string;
    duration?: number;
    position?: 'bottom-right' | 'bottom-left' | 'center';
  }) => {
    setConfig({ action, message, position });
    setIsVisible(true);

    if (duration > 0) {
      setTimeout(() => {
        setIsVisible(false);
      }, duration);
    }
  }, []);

  return (
    <ShareBaresContext.Provider value={{ showMascot, hideMascot }}>
      {children}
      <ShareBares
        isVisible={isVisible}
        action={config.action}
        message={config.message}
        position={config.position}
        onClose={hideMascot}
      />
    </ShareBaresContext.Provider>
  );
};

export const useShareBares = () => {
  const context = useContext(ShareBaresContext);
  if (context === undefined) {
    throw new Error('useShareBares must be used within a ShareBaresProvider');
  }
  return context;
};
