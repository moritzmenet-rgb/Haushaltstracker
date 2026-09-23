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
  setDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Safe initialization
export const isConfigValid = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);

const app = initializeApp(isConfigValid ? firebaseConfig : {
  apiKey: "mock-key",
  authDomain: "mock.firebaseapp.com",
  projectId: "mock-project"
});

// Primary services
export const auth = getAuth(app);
auth.useDeviceLanguage();

export const googleProvider = new GoogleAuthProvider();

/**
 * Utility to completely clear local storage and indexedDB databases (e.g. stale firestore cache)
 */
export async function clearAllLocalPersistence(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.clear();
    sessionStorage.clear();
    if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
      try {
        const dbs = await window.indexedDB.databases();
        for (const d of dbs) {
          if (d.name) {
            window.indexedDB.deleteDatabase(d.name);
          }
        }
      } catch {
        // Fallback if databases() not supported
      }
    }
  } catch (e) {
    console.warn('Error clearing local persistence:', e);
  }
}

// Standard Firestore initialization - with critical Database ID support
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errCode = error?.code || 'unknown';
  const errMsg = error?.message || String(error);
  
  const errInfo = {
    error: errMsg,
    code: errCode,
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    }
  };

  console.error('[Firestore Critical Error]', JSON.stringify(errInfo));
  
  // Create a user-friendly message
  let userMessage = 'Verbindung zum Cloud-Speicher fehlgeschlagen.';
  if (errCode === 'permission-denied') {
    userMessage = 'Zugriff verweigert: Du hast keine Berechtigung für diese Aktion.';
  } else if (errCode === 'unavailable') {
    userMessage = 'Cloud-Dienst vorübergehend nicht erreichbar. Bitte Internetverbindung prüfen.';
  } else if (errMsg.includes('Quota exceeded')) {
    userMessage = 'Limit erreicht: Das tägliche Cloud-Kontingent ist erschöpft.';
  }
  
  throw new Error(userMessage);
}

export async function testFirestoreConnection() {
  if (!isConfigValid) return;
  try {
    const testDoc = doc(db, 'test', 'last_check');
    await setDoc(testDoc, {
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'anonymous'
    });
    console.log('Firebase: Connection & Write Test established.');
  } catch (error) {
    console.warn('Firebase: Connection write test failed (this is normal if not logged in):', error);
  }
}

export { onAuthStateChanged, signInWithPopup, signOut };
export type { User };
