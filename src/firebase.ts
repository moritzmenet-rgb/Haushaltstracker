import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
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

console.log('Firebase: Config status:', isConfigValid ? 'Valid' : 'INVALID');
if (isConfigValid) {
  console.log('Firebase: Target Project:', firebaseConfig.projectId);
}

const app = initializeApp(isConfigValid ? firebaseConfig : {
  apiKey: "mock-key",
  authDomain: "mock.firebaseapp.com",
  projectId: "mock-project"
});

// Primary services
export const auth = getAuth(app);
auth.useDeviceLanguage();

// Ensure local persistence across redirects, mobile tabs, and reloads
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase setPersistence notice:', err);
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Firebase: Current User UID:', user.uid);
    console.log('Firebase: Current User Email:', user.email);
    console.log('Firebase: Provider:', user.providerData?.map(p => p.providerId).join(', ') || 'none');
    console.log('Firebase: Email Verified:', user.emailVerified);
  } else {
    console.log('Firebase: No user logged in.');
  }
});

// Google Provider configured for family friendly login
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Apple Provider configured with required scopes
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

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
      isAnonymous: auth.currentUser?.isAnonymous,
    }
  };

  // Log full details to console for debugging
  console.error('[Firestore Critical Error]', JSON.stringify(errInfo, null, 2));
  
  // Create a user-friendly message
  let userMessage = 'Verbindung zum Cloud-Speicher fehlgeschlagen.';
  if (errCode === 'permission-denied') {
    userMessage = 'Zugriff verweigert: Du hast keine Berechtigung für diese Aktion oder dein Profil ist noch nicht verifiziert.';
  } else if (errCode === 'unavailable') {
    userMessage = 'Cloud-Dienst vorübergehend nicht erreichbar. Bitte Internetverbindung prüfen.';
  } else if (errMsg.includes('Quota exceeded')) {
    userMessage = 'Limit erreicht: Das tägliche Cloud-Kontingent ist erschöpft.';
  } else if (errCode === 'not-found') {
    userMessage = 'Daten wurden nicht gefunden.';
  }
  
  throw new Error(userMessage);
}

export async function testFirestoreConnection() {
  if (!isConfigValid || !auth.currentUser) return;
  try {
    const testDoc = doc(db, 'test', auth.currentUser.uid);
    await setDoc(testDoc, {
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'anonymous',
      check: true
    }, { merge: true });
    console.log('Firebase: Connection & Write Test established for', auth.currentUser.email);
  } catch (error) {
    console.warn('Firebase: Connection write test notice:', error);
  }
}

export { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut };
export type { User };
