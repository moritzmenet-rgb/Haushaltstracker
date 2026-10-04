export interface CatShopItem {
  id: string;
  name: string;
  category: 'clothing' | 'hair' | 'fur' | 'accessory';
  price: number; // in Chips
  requiredLevel: number;
  emoji: string;
  description: string;
  previewColor?: string;
}

export const CAT_FUR_COLORS: Record<string, { label: string; primary: string; secondary: string; belly: string; earInner: string; nose: string }> = {
  orange: {
    label: 'Tiger-Orange',
    primary: '#F97316',
    secondary: '#EA580C',
    belly: '#FED7AA',
    earInner: '#FDA4AF',
    nose: '#FB7185'
  },
  grey: {
    label: 'Kavalier-Grau',
    primary: '#64748B',
    secondary: '#475569',
    belly: '#CBD5E1',
    earInner: '#F472B6',
    nose: '#F43F5E'
  },
  white: {
    label: 'Schneeweiß',
    primary: '#F8FAFC',
    secondary: '#E2E8F0',
    belly: '#FFFFFF',
    earInner: '#FDA4AF',
    nose: '#FB7185'
  },
  black: {
    label: 'Mitternacht',
    primary: '#1E293B',
    secondary: '#0F172A',
    belly: '#334155',
    earInner: '#64748B',
    nose: '#94A3B8'
  },
  calico: {
    label: 'Glücks-Calico',
    primary: '#F59E0B',
    secondary: '#0F172A',
    belly: '#FEF3C7',
    earInner: '#F472B6',
    nose: '#FB7185'
  },
  cream: {
    label: 'Sanfte Sahne',
    primary: '#FDE68A',
    secondary: '#F59E0B',
    belly: '#FEF9C3',
    earInner: '#FDA4AF',
    nose: '#F43F5E'
  }
};

export const CAT_SHOP_ITEMS: CatShopItem[] = [
  // --- A. KLEIDUNG (Clothing) ---
  {
    id: 'hoodie_red',
    name: 'Gemütlicher Hoodie',
    category: 'clothing',
    price: 10,
    requiredLevel: 1,
    emoji: '🧥',
    description: 'Kuscheliger roter Baumwoll-Kapuzenpulli für kühle Tage.'
  },
  {
    id: 'bowtie_gold',
    name: 'Gentleman-Fliege',
    category: 'clothing',
    price: 8,
    requiredLevel: 1,
    emoji: '🎀',
    description: 'Elegante goldene Fliege für den wahren Aristokraten.'
  },
  {
    id: 'cape_hero',
    name: 'Superhelden-Umhang',
    category: 'clothing',
    price: 16,
    requiredLevel: 2,
    emoji: '🦸',
    description: 'Roter flatternder Umhang für den Retter des Haushalts.'
  },
  {
    id: 'sweater_cozy',
    name: 'Norweger-Strickpulli',
    category: 'clothing',
    price: 12,
    requiredLevel: 2,
    emoji: '🧶',
    description: 'Handgestrickter Pullover mit hübschen Sternmustern.'
  },
  {
    id: 'scarf_winter',
    name: 'Wollschal Petrol',
    category: 'clothing',
    price: 6,
    requiredLevel: 1,
    emoji: '🧣',
    description: 'Hält den Hals warm und sieht stylisch aus.'
  },
  {
    id: 'dress_royal',
    name: 'Königsgewand',
    category: 'clothing',
    price: 25,
    requiredLevel: 3,
    emoji: '👑',
    description: 'Samtrotes Edelsakko mit Goldknöpfen für Majestäten.'
  },

  // --- B. FRISUREN & KOPFBEDECKUNG (Hair / Hats) ---
  {
    id: 'punk',
    name: 'Punk-Irokesenschnitt',
    category: 'hair',
    price: 10,
    requiredLevel: 1,
    emoji: '⚡',
    description: 'Frecher, rebellischer Iro mit coolen Spitzen.'
  },
  {
    id: 'curls',
    name: 'Lockenkopf',
    category: 'hair',
    price: 8,
    requiredLevel: 1,
    emoji: '💇',
    description: 'Verspielte, flauschige Locken auf dem Schopf.'
  },
  {
    id: 'flower',
    name: 'Frühlings-Blütenkranz',
    category: 'hair',
    price: 8,
    requiredLevel: 1,
    emoji: '🌸',
    description: 'Zarte Blumenkrone für friedliche Wohlfühl-Tage.'
  },
  {
    id: 'chef',
    name: 'Chefkoch-Mütze',
    category: 'hair',
    price: 14,
    requiredLevel: 2,
    emoji: '👨‍🍳',
    description: 'Für Feinschmecker-Katzen mit exklusivem Geschmack.'
  },
  {
    id: 'crown',
    name: 'Goldene Zarenkrone',
    category: 'hair',
    price: 30,
    requiredLevel: 3,
    emoji: '👑',
    description: 'Massives Gold mit Rubinen verziert. Purer Luxus!'
  },

  // --- C. ACCESSOIRES (Accessories) ---
  {
    id: 'glasses_cool',
    name: 'Piloten-Sonnenbrille',
    category: 'accessory',
    price: 8,
    requiredLevel: 1,
    emoji: '🕶️',
    description: 'Schwarze Gläser mit goldenem Gestell – maximal lässig.'
  },
  {
    id: 'monocle',
    name: 'Goldenes Monokel',
    category: 'accessory',
    price: 15,
    requiredLevel: 2,
    emoji: '🧐',
    description: 'Verleiht Ihrer Katze einen Hauch akademischer Weisheit.'
  },
  {
    id: 'bell_collar',
    name: 'Glöckchen-Halsband',
    category: 'accessory',
    price: 5,
    requiredLevel: 1,
    emoji: '🔔',
    description: 'Klingelt leise bei jedem Schritt und Streicheln.'
  },
  {
    id: 'star_pin',
    name: 'Glitzernder Stern-Pin',
    category: 'accessory',
    price: 7,
    requiredLevel: 1,
    emoji: '⭐',
    description: 'Blinkt sanft im Sonnenlicht des Katzen-Zimmers.'
  }
];

export const DEFAULT_CAT_NAME = 'Mimi';

export function createInitialPet(ownerId: string, memberName: string): any {
  return {
    id: `pet_${ownerId}`,
    ownerId,
    name: `${memberName}s Samtpfote`,
    level: 1,
    xp: 0,
    hunger: 85,
    hygiene: 90,
    happiness: 95,
    lastFedTimestamp: new Date().toISOString(),
    lastWashedTimestamp: new Date().toISOString(),
    lastPetTimestamp: new Date().toISOString(),
    appearance: {
      furColor: 'orange',
      hairStyle: 'classic',
      clothingId: null,
      accessoryId: null
    },
    unlockedItems: ['classic', 'orange'],
    feedHistory: []
  };
}

export function computeDecayedPetState(pet: any): any {
  if (!pet) return null;
  const now = Date.now();
  const fedTime = new Date(pet.lastFedTimestamp || pet.lastUpdate || now).getTime();
  const washedTime = new Date(pet.lastWashedTimestamp || pet.lastUpdate || now).getTime();

  const hoursSinceFed = Math.max(0, (now - fedTime) / (1000 * 60 * 60));
  const hoursSinceWashed = Math.max(0, (now - washedTime) / (1000 * 60 * 60));

  // Hunger drops ~3.5 points per hour
  const calculatedHunger = Math.max(0, Math.min(100, Math.round((pet.hunger ?? 100) - hoursSinceFed * 3.5)));
  // Hygiene drops ~2.5 points per hour
  const calculatedHygiene = Math.max(0, Math.min(100, Math.round((pet.hygiene ?? 100) - hoursSinceWashed * 2.5)));

  // Happiness is influenced by hunger, hygiene, level
  let baseHappy = 100;
  if (calculatedHunger < 40) baseHappy -= (40 - calculatedHunger) * 1.2;
  if (calculatedHygiene < 40) baseHappy -= (40 - calculatedHygiene) * 1.1;
  const calculatedHappiness = Math.max(10, Math.min(100, Math.round(baseHappy)));

  return {
    ...pet,
    hunger: calculatedHunger,
    hygiene: calculatedHygiene,
    happiness: calculatedHappiness
  };
}
