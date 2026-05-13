
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
  
  if (!(window as any).process) {
    (window as any).process = { 
      env: {},
      nextTick: (fn: any) => setTimeout(fn, 0)
    };
  } else if (!(window as any).process.env) {
    (window as any).process.env = {};
  }
}
