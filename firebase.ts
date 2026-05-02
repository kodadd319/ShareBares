import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut,
  setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, getDocFromServer, or,
  enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence, arrayUnion, arrayRemove, initializeFirestore
} from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from './firebase-applet-config.json';
export { firebaseConfig };

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
console.log('Initializing Firestore with databaseId:', databaseId);

// Initialize Firestore with specific databaseId and longPolling for better compatibility
const configWithDb = firebaseConfig as any;
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Force long polling to bypass potential proxy/iframe WebSocket issues
}, configWithDb.firestoreDatabaseId || undefined);

// Enable persistence
if (typeof window !== 'undefined') {
  // Use standard indexedDB persistence (single tab) which is usually more robust for simple apps
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed-precondition: Tab already open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence unimplemented');
    }
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
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    // Also don't throw for transient connection errors in readers to avoid crashing
    if ((errMessage.includes('unavailable') || errMessage.includes('offline')) && 
        (operationType === OperationType.LIST || operationType === OperationType.GET)) {
      console.warn('Suppressing throw for transient Firestore connectivity error');
      return;
    }
  }
  
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    const testDoc = doc(db, '_connection_test_', 'ping');
    await getDocFromServer(testDoc).catch((e) => {
      // Permission denied is expected for this doc but indicates server reachability
      if (e.message.includes('permission-denied') || e.message.includes('Missing or insufficient permissions')) {
        return;
      }
      throw e;
    });
    console.log("Firestore connection test successful.");
  } catch (error: any) {
    const errMessage = error.message || String(error);
    if (errMessage.includes('the client is offline') || errMessage.includes('unavailable') || errMessage.includes('failed-precondition')) {
      // Use warn instead of error to avoid triggering 'error' state in UI logs if it's transient
      console.warn("Firestore connection check:", errMessage);
    }
  }
}
testConnection();

export { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, onAuthStateChanged, or,
  setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken,
  arrayUnion, arrayRemove
};
