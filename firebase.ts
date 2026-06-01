import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut,
  setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, getDocFromServer, or,
  enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence, arrayUnion, arrayRemove, initializeFirestore, enableNetwork, disableNetwork
} from 'firebase/firestore';
import { 
  getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject 
} from 'firebase/storage';

// Import the Firebase configuration
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
let app: any;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.error("Firebase SDK initializeApp failed:", e);
}

const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId;

// Initialize Firestore with specific settings and handle persistent storage sandbox errors gracefully
let firestoreInstance: any = null;
try {
  firestoreInstance = firestoreDbId 
    ? initializeFirestore(app, { 
        experimentalForceLongPolling: true,
        localCache: {
          kind: 'persistent',
          initialTabManager: { kind: 'multi-tab' }
        }
      } as any, firestoreDbId)
    : initializeFirestore(app, { 
        experimentalForceLongPolling: true,
        localCache: {
          kind: 'persistent',
          initialTabManager: { kind: 'multi-tab' }
        }
      } as any);
} catch (persistError) {
  console.warn("Firestore persistent cache failed to initialize (commonly due to sandboxed iframe or third-party storage restrictions). Falling back to memory cache...", persistError);
  try {
    firestoreInstance = firestoreDbId 
      ? initializeFirestore(app, { 
          experimentalForceLongPolling: true,
          localCache: { kind: 'memory' }
        } as any, firestoreDbId)
      : initializeFirestore(app, { 
          experimentalForceLongPolling: true,
          localCache: { kind: 'memory' }
        } as any);
  } catch (fallbackError) {
    console.error("Firestore basic initialize with memory cache failed. Using getFirestore() fallback:", fallbackError);
    try {
      firestoreInstance = getFirestore(app);
    } catch (ultimateError) {
      console.error("Firestore ultimate fallback getFirestore failed:", ultimateError);
    }
  }
}

export const db = firestoreInstance;

// Initialize Firebase Storage with safety guard
let storageInstance: any = null;
try {
  if (app) storageInstance = getStorage(app);
} catch (e) {
  console.error("Firebase Storage initialization failed:", e);
}
export const storage = storageInstance;

// Connection Heartbeat and Auto-Reconnect
if (typeof window !== 'undefined' && db) {
  // Add a listener for online/offline events to nudge Firestore
  window.addEventListener('online', () => {
    console.log('Browser back online, nudging Firestore...');
    enableNetwork(db).catch(console.error);
  });
}

// Initialize Firebase Auth with safety guard
let authInstance: any = null;
try {
  if (app) authInstance = getAuth(app);
} catch (e) {
  console.error("Firebase Auth initialization failed:", e);
}
export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Auth helpers
export const loginWithGoogle = () => {
  console.log('Calling signInWithPopup with Google provider');
  return signInWithPopup(auth, googleProvider);
};
export const loginWithGoogleRedirect = () => {
  console.log('Calling signInWithRedirect with Google provider');
  return signInWithRedirect(auth, googleProvider);
};
export const getGoogleRedirectResult = () => getRedirectResult(auth);
export const logout = () => signOut(auth);

// Firestore helpers with error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Tests the connection to Firestore with a small retry window 
 * to handle transient initialization delays.
 */
export async function testFirestoreConnection(retries = 3): Promise<boolean> {
  if (!db) {
    console.warn('Firestore database is not initialized. Skipping connection test.');
    return false;
  }
  for (let i = 0; i < retries; i++) {
    try {
      // Try to get a non-existent document from a test collection
      // We use getDocFromServer to bypass local cache for a real network check
      await getDocFromServer(doc(db, '_connection_test_', 'startup-check'));
      console.log('Firestore connectivity verified.');
      return true;
    } catch (error: any) {
      console.warn(`Firestore connection attempt ${i + 1} failed:`, error?.message);
      
      // If it's a "unavailable" error, we might want to wait a bit and try enableNetwork
      if (error?.message?.includes('unavailable') || error?.message?.includes('offline')) {
        try {
          await enableNetwork(db);
        } catch (e) {
          console.error('Failed to enable network during retry:', e);
        }
      }
      
      if (i < retries - 1) {
        // Linear backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  return false;
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// Storage helpers
export interface UploadProgress {
  progress: number;
  downloadURL?: string;
  error?: any;
}

const uploadFileLocally = (
  file: File,
  path?: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        if (onProgress) onProgress(30);
        const base64String = reader.result as string;
        if (onProgress) onProgress(60);
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: file.name,
            type: file.type,
            data: base64String,
            path: path
          })
        });

        if (!response.ok) {
          const errBody = await response.json();
          throw new Error(errBody.error || 'Server upload failed');
        }

        const result = await response.json();
        if (onProgress) onProgress(100);
        console.log(`Fallback local upload successful: ${result.url}`);
        resolve(result.url);
      } catch (fallbackError: any) {
        console.error('Fallback local upload failed:', fallbackError);
        reject(fallbackError);
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file for local upload'));
    };
    reader.readAsDataURL(file);
  });
};

export const uploadFile = (
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file) {
    return Promise.reject(new Error('No file provided for upload'));
  }
  
  console.log(`uploadFile via server-side secure cloud gate for ${file.name} -> destination: ${path}`);
  // Delegate directly to server-side upload which handles Firebase Storage upload via Admin SDK & local folder fallback.
  // This bypasses browser iframe sandbox CORS errors, cookie restrictions, and sluggish client-side connection timeouts.
  return uploadFileLocally(file, path, onProgress);
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const isPermissionError = errMessage.includes('Missing or insufficient permissions');
  
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  if (isPermissionError) {
    console.warn('Firestore Permission Denied: ', JSON.stringify(errInfo));
    // Don't throw for permission errors specifically in non-critical reads to avoid crashing app
    if (operationType === OperationType.LIST || operationType === OperationType.GET) {
      return;
    }
  } else {
    const isConnectivityError = errMessage.includes('unavailable') || errMessage.includes('offline');
    if (isConnectivityError) {
      console.warn('Firestore connectivity issue (transient):', errMessage);
      // For listeners and generic reads, don't throw, just let it retry in background
      if (operationType === OperationType.LIST || operationType === OperationType.GET) {
        return;
      }
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  
  // Only throw if it's a critical write operation or non-transient error
  throw new Error(JSON.stringify(errInfo));
}

export { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, onAuthStateChanged, or, getDocFromServer,
  enableNetwork, disableNetwork, setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken,
  arrayUnion, arrayRemove, firebaseConfig, signOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  ref, uploadBytesResumable, getDownloadURL, deleteObject
};
