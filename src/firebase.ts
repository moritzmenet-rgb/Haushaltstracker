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
  getDocFromServer,
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Safe initialization
export const isConfigValid = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);

const app = initializeApp(isConfigValid ? firebaseConfig : {
  apiKey: "mock-key",
  authDomain: "mock.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock.appspot.com",
  messagingSenderId: "123",
  appId: "1:123:web:123"
});

// Primary services
export const auth = getAuth(app);
auth.useDeviceLanguage(); // Set language to device default

export const googleProvider = new GoogleAuthProvider();

// Database initialization
export const db = isConfigValid ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : getFirestore(app);

/**
 * Utility to completely clear local storage and indexedDB databases (e.g. stale firestore cache)
 */
export async function clearAllLocalPersistence(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.clear();
    sessionStorage.clear();
    if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
      const dbs = await window.indexedDB.databases();
      for (const d of dbs) {
        if (d.name) {
          try {
            window.indexedDB.deleteDatabase(d.name);
          } catch { /* ignore */ }
        }
      }
    }
  } catch (e) {
    console.warn('Error clearing local persistence:', e);
  }
}

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

// Validation Test
export async function testFirestoreConnection() {
  if (!isConfigValid) return;
  
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
    console.log('Firebase: Connection validated.');
  } catch (error) {
    console.warn('Firebase: Connection test note:', error);
  }
}

export { onAuthStateChanged, signInWithPopup, signOut };
export type { User };
