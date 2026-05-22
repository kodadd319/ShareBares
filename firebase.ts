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
const app = initializeApp(firebaseConfig);
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId;

// Initialize Firestore with specific settings for better compatibility in iframe environments
export const db = firestoreDbId 
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

// Initialize Firebase Storage
export const storage = getStorage(app);

// Connection Heartbeat and Auto-Reconnect
if (typeof window !== 'undefined') {
  // Add a listener for online/offline events to nudge Firestore
  window.addEventListener('online', () => {
    console.log('Browser back online, nudging Firestore...');
    enableNetwork(db).catch(console.error);
  });
}

export const auth = getAuth(app);
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
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        if (onProgress) onProgress(50); // Simulate progress halfway
        const base64String = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: file.name,
            type: file.type,
            data: base64String
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
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided for upload'));
      return;
    }
    
    // Log upload details for debugging if needed
    console.log(`Starting upload to ${path}`, { 
      name: file.name, 
      size: file.size, 
      type: file.type,
      bucket: firebaseConfig.storageBucket
    });

    let isSettled = false;

    // Timeout mechanism to fall back to local upload if Firebase Storage hangs or retries excessively
    const timeoutId = setTimeout(async () => {
      if (!isSettled) {
        console.warn(`Firebase Storage upload timed out for ${file.name}. Falling back immediately to local Express upload.`);
        isSettled = true;
        try {
          if (uploadTask && typeof uploadTask.cancel === 'function') {
            try { uploadTask.cancel(); } catch (_) {}
          }
        } catch (_) {}
        try {
          const localUrl = await uploadFileLocally(file, onProgress);
          resolve(localUrl);
        } catch (fallbackError: any) {
          reject(new Error(`Firebase Storage upload timed out and local fallback failed: ${fallbackError.message}`));
        }
      }
    }, 3500);

    let uploadTask: any = null;

    try {
      const storageRef = ref(storage, path);
      const metadata = {
        contentType: file.type || 'application/octet-stream'
      };
      
      uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot: any) => {
          if (isSettled) return;
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress * 0.95); // leave 5% for the URL resolution
          console.log(`Upload progress for ${file.name}: ${Math.round(progress)}%`);
        },
        async (error: any) => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timeoutId);
          console.warn('Firebase Storage upload failed, falling back to local Express upload...', error);
          try {
            const localUrl = await uploadFileLocally(file, onProgress);
            resolve(localUrl);
          } catch (fallbackError: any) {
            reject(new Error(`Firebase Storage upload failed (${error.message}) and local fallback failed: ${fallbackError.message}`));
          }
        },
        async () => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timeoutId);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`Upload successful for ${file.name}: ${downloadURL}`);
            resolve(downloadURL);
          } catch (urlError: any) {
            console.warn('Failed to get download URL, falling back to local Express upload...', urlError);
            try {
              const localUrl = await uploadFileLocally(file, onProgress);
              resolve(localUrl);
            } catch (fallbackError: any) {
              reject(urlError);
            }
          }
        }
      );
    } catch (err: any) {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timeoutId);
        console.warn('Failed to initialize Firebase Storage task, falling back to local Express upload immediately...', err);
        uploadFileLocally(file, onProgress).then(resolve).catch(reject);
      }
    }
  });
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const isPermissionError = errMessage.includes('Missing or insufficient permissions');
  
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
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
