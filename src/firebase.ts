import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Safe initialization
export const isConfigValid = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);

if (!isConfigValid) {
  console.warn('Firebase configuration is invalid or missing. Some features may not work.');
}

const app = initializeApp(isConfigValid ? firebaseConfig : {
  apiKey: "mock-key",
  authDomain: "mock.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock.appspot.com",
  messagingSenderId: "123",
  appId: "1:123:web:123"
});

if (import.meta.env.PROD) {
  console.log('Firebase initialized for project:', isConfigValid ? firebaseConfig.projectId : 'MOCK');
  if (typeof window !== 'undefined') {
    console.log('Current Domain:', window.location.hostname);
    if (window.location.hostname.includes('github.io')) {
      console.info('Tip: Ensure your GitHub domain is added to "Authorized Domains" in Firebase Authentication settings.');
    }
  }
}

// Critical: specify databaseId as configured
export const db = (isConfigValid && firebaseConfig.firestoreDatabaseId) 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

// Enable persistence for better reliability
if (typeof window !== 'undefined' && isConfigValid) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed (multiple tabs open)');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not supported in this browser');
    }
  });
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection() {
  if (!isConfigValid) {
    console.log('Firebase: Connection test skipped (Disabled).');
    return;
  }
  
  // Give the network a moment to stabilize
  setTimeout(async () => {
    try {
      console.log('Firebase: Testing connection...');
      // Using a timeout for the getDoc itself to avoid long hangs
      const testDoc = doc(db, 'test', 'connection');
      await getDoc(testDoc);
      console.log('Firebase: Connection test finished (Success or Cached).');
    } catch (error: any) {
      // Don't log "offline" as a hard error, it's expected in some environments
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        console.log('Firebase: Working in offline/persistence mode.');
      } else {
        console.warn('Firebase Connection Hint:', error.code, error.message);
      }
    }
  }, 2000);
}

export { onAuthStateChanged, signInWithPopup, signOut };
export type { User };
