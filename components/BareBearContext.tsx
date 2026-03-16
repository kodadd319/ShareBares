import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import BareBear, { BareBearAction } from './BareBear';

interface BareBearContextType {
  showMascot: (config: {
    action?: BareBearAction;
    message?: string;
    duration?: number;
    position?: 'bottom-right' | 'bottom-left' | 'center';
  }) => void;
  hideMascot: () => void;
}

const BareBearContext = createContext<BareBearContextType | undefined>(undefined);

export const BareBearProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [config, setConfig] = useState<{
    action: BareBearAction;
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
    action?: BareBearAction;
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
    <BareBearContext.Provider value={{ showMascot, hideMascot }}>
      {children}
      <BareBear
        isVisible={isVisible}
        action={config.action}
        message={config.message}
        position={config.position}
        onClose={hideMascot}
      />
    </BareBearContext.Provider>
  );
};

export const useBareBear = () => {
  const context = useContext(BareBearContext);
  if (context === undefined) {
    throw new Error('useBareBear must be used within a BareBearProvider');
  }
  return context;
};
