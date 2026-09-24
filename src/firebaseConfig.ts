import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import type { PostIt } from './types/pinnwand';
import appletConfig from '../firebase-applet-config.json';

/**
 * =======================================================================
 * FIREBASE CREDENTIALS CONFIGURATION
 * =======================================================================
 * Du kannst dieses Config-Objekt jederzeit durch deine eigenen
 * Firebase-Projekt-Credentials austauschen.
 */
export const FIREBASE_CONFIG = {
  apiKey: appletConfig.apiKey || "DEINE_API_KEY",
  authDomain: appletConfig.authDomain || "dein-projekt.firebaseapp.com",
  projectId: appletConfig.projectId || "dein-projekt",
  storageBucket: appletConfig.storageBucket || "dein-projekt.firebasestorage.app",
  messagingSenderId: appletConfig.messagingSenderId || "123456789",
  appId: appletConfig.appId || "1:123456789:web:abcdef123456",
  measurementId: appletConfig.measurementId || ""
};

// Singleton App & Services
export const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);
export const auth = getAuth(app);

// State to track current active user
let currentUser: User | null = null;
let authInitPromise: Promise<User | null> | null = null;

export const ensureAnonymousUser = (): Promise<User | null> => {
  if (currentUser) return Promise.resolve(currentUser);
  if (authInitPromise) return authInitPromise;

  authInitPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          resolve(cred.user);
        } catch (err) {
          console.warn('Anonymous auth note (proceeding in public mode):', err);
          resolve(null);
        }
      }
    });
  });

  return authInitPromise;
};

// Ensure auth is initialized
if (typeof window !== 'undefined') {
  ensureAnonymousUser().catch(console.error);
}

/**
 * =======================================================================
 * REALTIME FIRESTORE ACTIONS FOR PINNWAND
 * =======================================================================
 */

export const DEFAULT_BOARD_ID = 'main-pinnwand';

/**
 * Hört in Echtzeit auf alle Post-its eines Boards
 */
export const subscribeToBoardPostIts = (
  boardId: string = DEFAULT_BOARD_ID,
  callback: (postIts: PostIt[]) => void,
  onError?: (err: Error) => void
) => {
  const cacheKey = `pinnwand_cache_${boardId}`;

  // 1. Immediately emit cached items if available so UI is instant and doesn't flicker
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        callback(parsed);
      }
    }
  } catch (e) {
    console.warn('Local cache read note:', e);
  }

  const postItsRef = collection(db, 'boards', boardId, 'postits');
  let activeUnsubscribe: (() => void) | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let isCancelled = false;

  const startListener = () => {
    if (isCancelled) return;
    try {
      activeUnsubscribe = onSnapshot(
        postItsRef,
        (snapshot) => {
          const items: PostIt[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...(docSnap.data() as Omit<PostIt, 'id'>) });
          });
          // Sort client-side by createdAt asc
          items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

          // Save to local cache
          try {
            localStorage.setItem(cacheKey, JSON.stringify(items));
          } catch {
            // ignore
          }

          callback(items);
        },
        (err) => {
          console.warn('Firestore subscription notice (retrying automatically):', err.message);
          // If permission denied or network issue, fallback to cache
          try {
            const raw = localStorage.getItem(cacheKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                callback(parsed);
              }
            }
          } catch {}

          if (onError) onError(err);

          // Retry listener after 2 seconds (in case security rules are propagating)
          if (!isCancelled) {
            retryTimer = setTimeout(() => {
              if (!isCancelled) startListener();
            }, 2000);
          }
        }
      );
    } catch (err) {
      console.warn('Failed to start onSnapshot:', err);
      if (!isCancelled) {
        retryTimer = setTimeout(() => {
          if (!isCancelled) startListener();
        }, 2000);
      }
    }
  };

  startListener();

  return () => {
    isCancelled = true;
    if (activeUnsubscribe) activeUnsubscribe();
    if (retryTimer) clearTimeout(retryTimer);
  };
};

/**
 * Hilfsfunktion zum Aktualisieren des lokalen Caches
 */
const updateLocalCache = (boardId: string, modifier: (items: PostIt[]) => PostIt[]) => {
  try {
    const cacheKey = `pinnwand_cache_${boardId}`;
    const raw = localStorage.getItem(cacheKey);
    const current: PostIt[] = raw ? JSON.parse(raw) : [];
    const updated = modifier(current);
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  } catch (e) {
    console.warn('updateLocalCache error:', e);
  }
};

/**
 * Speichert oder aktualisiert ein Post-it
 */
export const savePostIt = async (
  postIt: PostIt, 
  boardId: string = DEFAULT_BOARD_ID
): Promise<void> => {
  const data = {
    ...postIt,
    updatedAt: Date.now()
  };

  // Optimistic local cache update
  updateLocalCache(boardId, (items) => {
    const index = items.findIndex(i => i.id === postIt.id);
    if (index >= 0) {
      const copy = [...items];
      copy[index] = data;
      return copy;
    }
    return [...items, data];
  });

  try {
    const docRef = doc(db, 'boards', boardId, 'postits', postIt.id);
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.warn('Cloud save deferred to local cache:', err);
  }
};

/**
 * Aktualisiert ausschließlich die Position eines Post-its (für Smooth Drag)
 */
export const updatePostItPosition = async (
  postItId: string,
  x: number,
  y: number,
  boardId: string = DEFAULT_BOARD_ID
): Promise<void> => {
  // Optimistic local cache update
  updateLocalCache(boardId, (items) => {
    return items.map(item => item.id === postItId ? { ...item, x, y, updatedAt: Date.now() } : item);
  });

  try {
    const docRef = doc(db, 'boards', boardId, 'postits', postItId);
    await updateDoc(docRef, {
      x,
      y,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('Cloud position update deferred:', err);
  }
};

/**
 * Löscht ein Post-it und optional dessen Kind-Post-its
 */
export const deletePostIt = async (
  postItId: string,
  boardId: string = DEFAULT_BOARD_ID,
  cascade: boolean = true
): Promise<void> => {
  // Optimistic local cache update
  updateLocalCache(boardId, (items) => {
    if (cascade) {
      // Find all descendents
      const toDelete = new Set<string>([postItId]);
      let added = true;
      while (added) {
        added = false;
        items.forEach(p => {
          if (p.parentId && toDelete.has(p.parentId) && !toDelete.has(p.id)) {
            toDelete.add(p.id);
            added = true;
          }
        });
      }
      return items.filter(item => !toDelete.has(item.id));
    }
    return items.filter(item => item.id !== postItId);
  });

  try {
    const docRef = doc(db, 'boards', boardId, 'postits', postItId);
    await deleteDoc(docRef);

    if (cascade) {
      // Find all children that had this postit as parent
      const colRef = collection(db, 'boards', boardId, 'postits');
      const snap = await getDocs(colRef);
      const batch = writeBatch(db);
      let count = 0;
      
      snap.forEach((docSnap) => {
        const data = docSnap.data() as PostIt;
        if (data.parentId === postItId) {
          batch.delete(docSnap.ref);
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('Cloud delete error:', err);
  }
};

/**
 * Stimmt für eine Option in einem Abstimmungs-Post-it ab
 */
export const votePollOption = async (
  postItId: string,
  optionId: string,
  voterId: string,
  boardId: string = DEFAULT_BOARD_ID
): Promise<void> => {
  // Optimistic local cache update
  updateLocalCache(boardId, (items) => {
    return items.map(postIt => {
      if (postIt.id !== postItId || !postIt.pollOptions) return postIt;
      const updatedOptions = postIt.pollOptions.map((opt) => {
        const voterList = opt.voterIds || [];
        const hasVoted = voterList.includes(voterId);

        if (opt.id === optionId) {
          if (hasVoted) {
            return {
              ...opt,
              votes: Math.max(0, opt.votes - 1),
              voterIds: voterList.filter(id => id !== voterId)
            };
          } else {
            return {
              ...opt,
              votes: opt.votes + 1,
              voterIds: [...voterList, voterId]
            };
          }
        } else {
          if (hasVoted) {
            return {
              ...opt,
              votes: Math.max(0, opt.votes - 1),
              voterIds: voterList.filter(id => id !== voterId)
            };
          }
          return opt;
        }
      });
      return { ...postIt, pollOptions: updatedOptions, updatedAt: Date.now() };
    });
  });

  try {
    const docRef = doc(db, 'boards', boardId, 'postits', postItId);
    const snap = await getDocs(collection(db, 'boards', boardId, 'postits'));
    const currentDoc = snap.docs.find(d => d.id === postItId);
    if (!currentDoc) return;

    const postIt = currentDoc.data() as PostIt;
    if (!postIt.pollOptions) return;

    const updatedOptions = postIt.pollOptions.map((opt) => {
      const voterList = opt.voterIds || [];
      const hasVoted = voterList.includes(voterId);

      if (opt.id === optionId) {
        if (hasVoted) {
          return {
            ...opt,
            votes: Math.max(0, opt.votes - 1),
            voterIds: voterList.filter(id => id !== voterId)
          };
        } else {
          return {
            ...opt,
            votes: opt.votes + 1,
            voterIds: [...voterList, voterId]
          };
        }
      } else {
        if (hasVoted) {
          return {
            ...opt,
            votes: Math.max(0, opt.votes - 1),
            voterIds: voterList.filter(id => id !== voterId)
          };
        }
        return opt;
      }
    });

    await updateDoc(docRef, {
      pollOptions: updatedOptions,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('Cloud poll vote error:', err);
  }
};

/**
 * Reagiert mit einem Emoji auf ein Post-it
 */
export const reactToPostIt = async (
  postItId: string,
  emoji: string,
  voterId: string,
  boardId: string = DEFAULT_BOARD_ID
): Promise<void> => {
  // Optimistic local cache update
  updateLocalCache(boardId, (items) => {
    return items.map(postIt => {
      if (postIt.id !== postItId) return postIt;
      const reactions = { ...(postIt.reactions || {}) };
      const votedReactions = { ...(postIt.votedReactions || {}) };
      const currentVoters = votedReactions[emoji] || [];
      const alreadyReacted = currentVoters.includes(voterId);

      if (alreadyReacted) {
        reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1);
        votedReactions[emoji] = currentVoters.filter(id => id !== voterId);
      } else {
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        votedReactions[emoji] = [...currentVoters, voterId];
      }
      return { ...postIt, reactions, votedReactions, updatedAt: Date.now() };
    });
  });

  try {
    const docRef = doc(db, 'boards', boardId, 'postits', postItId);
    const snap = await getDocs(collection(db, 'boards', boardId, 'postits'));
    const currentDoc = snap.docs.find(d => d.id === postItId);
    if (!currentDoc) return;

    const postIt = currentDoc.data() as PostIt;
    const reactions = { ...(postIt.reactions || {}) };
    const votedReactions = { ...(postIt.votedReactions || {}) };

    const currentVoters = votedReactions[emoji] || [];
    const alreadyReacted = currentVoters.includes(voterId);

    if (alreadyReacted) {
      reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1);
      votedReactions[emoji] = currentVoters.filter(id => id !== voterId);
    } else {
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      votedReactions[emoji] = [...currentVoters, voterId];
    }

    await updateDoc(docRef, {
      reactions,
      votedReactions,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('Cloud reaction error:', err);
  }
};

/**
 * Erstellt realistische Demo-Daten mit Haupt-Thema, Antworten und rotem Wollfaden
 */
export const seedDemoBoard = async (boardId: string = DEFAULT_BOARD_ID): Promise<void> => {
  const batch = writeBatch(db);
  const colRef = collection(db, 'boards', boardId, 'postits');
  
  // Clear existing first
  const existing = await getDocs(colRef);
  existing.forEach(d => batch.delete(d.ref));

  const now = Date.now();

  // Root Post-it 1: Haupt-Thema
  const root1Id = 'root-sommerfest';
  const root1: PostIt = {
    id: root1Id,
    boardId,
    type: 'standard',
    parentId: null,
    level: 0,
    title: '🎉 Sommerfest & Team-Retreat 2026',
    content: 'Ideensammlung für unser Sommerfest!\n\nWo wollen wir feiern, welche Aktivitäten planen wir und was gibt es zu essen?',
    author: 'Moritz',
    authorId: 'user-moritz',
    color: 'yellow',
    pinColor: 'red',
    x: 400,
    y: 180,
    rotation: -1.2,
    reactions: { '❤️': 4, '🎉': 6, '🔥': 2 },
    createdAt: now - 3600000 * 5,
    updatedAt: now - 3600000 * 5
  };
  batch.set(doc(colRef, root1Id), root1);

  // Child 1.1: Antwort auf Sommerfest (Location)
  const child1Id = 'child-location';
  const child1: PostIt = {
    id: child1Id,
    boardId,
    type: 'standard',
    parentId: root1Id,
    level: 1,
    title: '📍 Location: Am Seeufer',
    content: 'Der Pavillon am Stadtsee ist reservierbar! Es gibt Grillstellen, Wiese und einen Steg.',
    author: 'Sophie',
    authorId: 'user-sophie',
    color: 'green',
    pinColor: 'wood',
    x: 100,
    y: 420,
    rotation: 1.8,
    reactions: { '👍': 5, '💡': 3 },
    createdAt: now - 3600000 * 3,
    updatedAt: now - 3600000 * 3
  };
  batch.set(doc(colRef, child1Id), child1);

  // Grandchild 1.1.1: Antwort auf Location
  const grandChild1Id = 'grandchild-pavillon';
  const grandChild1: PostIt = {
    id: grandChild1Id,
    boardId,
    type: 'standard',
    parentId: child1Id,
    level: 2,
    title: 'Strom & Soundanlage?',
    content: 'Gibt es dort Starkstrom für die Musikanlage? Ich kann meine portable Box mitbringen!',
    author: 'Felix',
    authorId: 'user-felix',
    color: 'blue',
    pinColor: 'blue',
    x: 60,
    y: 680,
    rotation: -2,
    reactions: { '👍': 2 },
    createdAt: now - 3600000 * 2,
    updatedAt: now - 3600000 * 2
  };
  batch.set(doc(colRef, grandChild1Id), grandChild1);

  // Child 1.2: Abstimmungs-Post-it (Catering / Essen)
  const child2Id = 'poll-catering';
  const child2: PostIt = {
    id: child2Id,
    boardId,
    type: 'poll',
    parentId: root1Id,
    level: 1,
    title: '🥗 Catering-Abstimmung',
    content: 'Welche Art von Catering bevorzugt ihr am meisten?',
    pollQuestion: 'Welches Essen wollen wir?',
    pollOptions: [
      { id: 'opt-bbq', text: '🍖 BBQ & Grillbuffet', votes: 7, voterIds: [] },
      { id: 'opt-vegan', text: '🌱 Frische Veggie & Falafel-Bowls', votes: 5, voterIds: [] },
      { id: 'opt-pizza', text: '🍕 Mobiler Steinofen-Pizzawagen', votes: 11, voterIds: [] }
    ],
    author: 'Elena',
    authorId: 'user-elena',
    color: 'orange',
    pinColor: 'gold',
    x: 750,
    y: 380,
    rotation: -1.5,
    reactions: { '🔥': 8, '👍': 4 },
    createdAt: now - 3600000 * 4,
    updatedAt: now - 3600000 * 4
  };
  batch.set(doc(colRef, child2Id), child2);

  // Grandchild 1.2.1: Nachtisch
  const grandChild2Id = 'grandchild-nachtisch';
  const grandChild2: PostIt = {
    id: grandChild2Id,
    boardId,
    type: 'standard',
    parentId: child2Id,
    level: 2,
    title: 'Eiswagen als Dessert!',
    content: 'Ein kleiner lokaler Eiswagen für den Nachmittag wäre das absolute Highlight! 🍦',
    author: 'Lukas',
    authorId: 'user-lukas',
    color: 'pink',
    pinColor: 'red',
    x: 800,
    y: 690,
    rotation: 2.2,
    reactions: { '❤️': 6, '🎉': 4 },
    createdAt: now - 3600000 * 1,
    updatedAt: now - 3600000 * 1
  };
  batch.set(doc(colRef, grandChild2Id), grandChild2);

  // Root Post-it 2: Zweites Haupt-Thema (Produkt-Ideen)
  const root2Id = 'root-roadmap';
  const root2: PostIt = {
    id: root2Id,
    boardId,
    type: 'standard',
    parentId: null,
    level: 0,
    title: '🚀 Q4 Produkt-Feature Brainstorming',
    content: 'Welche Features haben für unsere Nutzer die höchste Priorität vor dem Launch?',
    author: 'Moritz',
    authorId: 'user-moritz',
    color: 'purple',
    pinColor: 'red',
    x: 1250,
    y: 180,
    rotation: 1.1,
    reactions: { '💡': 5, '🔥': 3 },
    createdAt: now - 3600000 * 6,
    updatedAt: now - 3600000 * 6
  };
  batch.set(doc(colRef, root2Id), root2);

  // Child 2.1
  const child21Id = 'child-offline';
  const child21: PostIt = {
    id: child21Id,
    boardId,
    type: 'standard',
    parentId: root2Id,
    level: 1,
    title: 'Offline-Modus mit Auto-Sync',
    content: 'Nutzer im Zug oder mit instabiler Verbindung müssen ohne Unterbrechung weiterarbeiten können.',
    author: 'David',
    authorId: 'user-david',
    color: 'yellow',
    pinColor: 'wood',
    x: 1280,
    y: 430,
    rotation: -1.7,
    reactions: { '👍': 6 },
    createdAt: now - 3600000 * 2,
    updatedAt: now - 3600000 * 2
  };
  batch.set(doc(colRef, child21Id), child21);

  try {
    await batch.commit();
  } catch (err) {
    console.warn('Cloud batch commit notice (using local cache):', err);
  }

  // Also update local cache with the demo data
  const demoList = [root1, child1, grandChild1, child2, grandChild2, root2, child21];
  try {
    localStorage.setItem(`pinnwand_cache_${boardId}`, JSON.stringify(demoList));
  } catch {}
};

/**
 * Löscht das gesamte Board
 */
export const clearBoard = async (boardId: string = DEFAULT_BOARD_ID): Promise<void> => {
  try {
    localStorage.removeItem(`pinnwand_cache_${boardId}`);
  } catch {}

  try {
    const colRef = collection(db, 'boards', boardId, 'postits');
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    console.warn('Cloud clear board error:', err);
  }
};
