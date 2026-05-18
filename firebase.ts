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

    const storageRef = ref(storage, path);
    const metadata = {
      contentType: file.type || 'application/octet-stream'
    };
    
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
        console.log(`Upload progress for ${file.name}: ${Math.round(progress)}%`);
      },
      (error: any) => {
        console.error('Firebase Storage upload failed:', {
          code: error.code,
          message: error.message,
          serverResponse: error.serverResponse,
          path: path
        });
        
        let customMessage = error.message;
        if (error.code === 'storage/unauthorized') {
          customMessage = 'Permission denied to Firebase Storage. Please check storage rules.';
        } else if (error.code === 'storage/retry-limit-exceeded') {
          customMessage = 'Upload timed out. Please check your connection.';
        } else if (error.code === 'storage/invalid-checksum') {
          customMessage = 'File corrupted during upload. Please try again.';
        }
        
        reject(new Error(customMessage));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`Upload successful for ${file.name}: ${downloadURL}`);
          resolve(downloadURL);
        } catch (urlError: any) {
          console.error('Failed to get download URL after upload:', urlError);
          reject(urlError);
        }
      }
    );
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
