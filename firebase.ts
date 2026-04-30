import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut,
  setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, getDocFromServer, or,
  enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence
} from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from './firebase-applet-config.json';
export { firebaseConfig };

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
console.log('Initializing Firestore with databaseId:', databaseId);

// Use the default database if no ID is provided, or the specific one if it is
// Force default database to troubleshoot 'unavailable' error
// const configWithDb = firebaseConfig as any;
// export const db = configWithDb.firestoreDatabaseId 
//   ? getFirestore(app, configWithDb.firestoreDatabaseId)
//   : getFirestore(app);
export const db = getFirestore(app);

// Enable persistence
// Disable persistence for now to troubleshoot connectivity
// if (typeof window !== 'undefined') {
//   enableMultiTabIndexedDbPersistence(db).catch((err) => {
//     if (err.code === 'failed-precondition') {
//       // Multiple tabs open, persistence can only be enabled in one tab at a time.
//       console.warn('Firestore persistence failed-precondition: Multiple tabs open');
//     } else if (err.code === 'unimplemented') {
//       // The current browser does not support all of the features required to enable persistence
//       console.warn('Firestore persistence unimplemented');
//     }
//   });
// }

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
  }
  
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    // Attempt to get a document from a known collection to verify connectivity
    // We use getDocFromServer to force a network request
    const testDoc = doc(db, '_connection_test_', 'ping');
    await getDocFromServer(testDoc).catch(async (e) => {
      // If server get fails, try a normal get which might use cache but also triggers connection
      if (e.message.includes('permission-denied') || e.message.includes('Missing or insufficient permissions')) {
        console.log("Firestore reachability test: Connected (Permission restricted as expected)");
        return;
      }
      console.warn("Server-side ping failed, trying standard get:", e.message);
      return await getDoc(testDoc);
    });
    console.log("Firestore connection test successful.");
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    if (errMessage.includes('the client is offline') || errMessage.includes('unavailable') || errMessage.includes('failed-precondition')) {
      console.error("Firestore connection failed: The client is offline or the backend is unreachable.");
      console.log("Diagnostics:", {
        projectId: firebaseConfig.projectId,
        databaseId: (firebaseConfig as any).firestoreDatabaseId || '(default)',
        apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
        authDomain: firebaseConfig.authDomain
      });
      console.log("Suggestion: Please verify that the Firebase project is correctly provisioned and that the Firestore database exists in the specified region.");
    } else {
      console.warn("Firestore connection test (ignorable if app works):", errMessage);
    }
  }
}
testConnection();

export { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, onAuthStateChanged, or,
  setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken
};
