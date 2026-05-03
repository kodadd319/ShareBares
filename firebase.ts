import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut,
  setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, getDocFromServer, or,
  enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence, arrayUnion, arrayRemove, initializeFirestore, enableNetwork, disableNetwork
} from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId;

// Initialize Firestore with specific settings for better compatibility in iframe environments
export const db = firestoreDbId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, firestoreDbId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

// Enable persistence for better offline resilience once connected
if (typeof window !== 'undefined') {
  // Use non-blocking persistence initialization
  const tryPersistence = async () => {
    try {
      await enableMultiTabIndexedDbPersistence(db);
      console.log('Firestore multi-tab persistence enabled');
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.warn('Firestore persistence not enabled: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence not supported by browser');
      } else {
        // Fallback to single tab persistence
        try {
          await enableIndexedDbPersistence(db);
          console.log('Firestore single-tab persistence enabled');
        } catch (innerErr) {
          console.warn('Firestore persistence initialization failed completely:', innerErr);
        }
      }
    }
  };
  tryPersistence();
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
    // Don't throw for permission errors in listeners to avoid crashing the app
    if (operationType === OperationType.LIST || operationType === OperationType.GET) {
      return;
    }
  } else {
    // Only log connectivity errors as warnings but DO throw them so callers can handle retries/UI
    if (errMessage.includes('unavailable') || errMessage.includes('offline')) {
      console.warn('Firestore connectivity issue (transient):', errMessage);
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  
  throw new Error(JSON.stringify(errInfo));
}

export { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, onAuthStateChanged, or, getDocFromServer,
  enableNetwork, disableNetwork, setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken,
  arrayUnion, arrayRemove, firebaseConfig
};
