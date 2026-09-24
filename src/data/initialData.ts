import { FamilyData, PinnwandNote, TaskItem } from '../types';

/**
 * Default Pinnwand sample threads to illustrate the concept immediately
 */
export const DEFAULT_PINNWAND_NOTES: Record<string, PinnwandNote> = {
  'note_demo_1': {
    id: 'note_demo_1',
    rootId: 'note_demo_1',
    parentId: null,
    depth: 0,
    title: '🍽️ Was kochen wir am Wochenende?',
    content: 'Lasst uns abstimmen, was wir am Samstag kochen! Wer kocht, bekommt Bonuspunkte.',
    color: 'yellow',
    category: 'Essen & Kochen',
    authorId: 'admin_initial',
    authorName: 'Moritz',
    authorAvatarColor: '#4F46E5',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    isPinned: true,
    reactions: {
      '🍕': ['admin_initial'],
      '❤️': ['admin_initial']
    },
    poll: {
      question: 'Welches Gericht soll es geben?',
      options: [
        { id: 'opt_1', text: '🍕 Selbstgemachte Pizza', voterIds: ['admin_initial'] },
        { id: 'opt_2', text: '🌮 Taco & Burrito Night', voterIds: [] },
        { id: 'opt_3', text: '🍝 Frische Pasta Pesto', voterIds: [] }
      ],
      allowMultiple: false,
      closed: false
    },
    position: { x: 80, y: 80 },
    rotation: -1.2
  },
  'note_demo_2': {
    id: 'note_demo_2',
    rootId: 'note_demo_1',
    parentId: 'note_demo_1',
    depth: 1,
    title: undefined,
    content: 'Ich stimme für Pizza! Ich kann den Teig schon am Freitag ansetzen, damit er 24h ruht 🍕',
    color: 'pink',
    category: 'Essen & Kochen',
    authorId: 'admin_initial',
    authorName: 'Moritz',
    authorAvatarColor: '#4F46E5',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    reactions: {
      '👍': ['admin_initial'],
      '🔥': ['admin_initial']
    },
    position: { x: 450, y: 110 },
    rotation: 1.5
  },
  'note_demo_3': {
    id: 'note_demo_3',
    rootId: 'note_demo_1',
    parentId: 'note_demo_2',
    depth: 2,
    title: undefined,
    content: 'Perfekt! Ich bringe dann frischen Büffelmozzarella, Tomaten und Basilikum mit 🌿',
    color: 'green',
    category: 'Essen & Kochen',
    authorId: 'family_guest',
    authorName: 'Familie',
    authorAvatarColor: '#10B981',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    reactions: {
      '😋': ['admin_initial']
    },
    position: { x: 780, y: 150 },
    rotation: -0.8
  },
  'note_demo_4': {
    id: 'note_demo_4',
    rootId: 'note_demo_4',
    parentId: null,
    depth: 0,
    title: '💡 Willkommen auf der Pinnwand!',
    content: 'Starte ein Thema, hänge ein Post-it an, erstelle Abstimmungen oder reagiere auf Beiträge. Jede Antwort spinnt einen roten Faden!',
    color: 'blue',
    category: 'Idee',
    authorId: 'admin_initial',
    authorName: 'Moritz',
    authorAvatarColor: '#4F46E5',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    reactions: {
      '✨': ['admin_initial'],
      '💡': ['admin_initial']
    },
    position: { x: 100, y: 520 },
    rotation: 1.2
  },
  'note_demo_5': {
    id: 'note_demo_5',
    rootId: 'note_demo_4',
    parentId: 'note_demo_4',
    depth: 1,
    title: undefined,
    content: 'Genial mit den echten roten Fäden wie bei einer Gedankenkarte / Mindmap! 🧶📌',
    color: 'orange',
    category: 'Idee',
    authorId: 'admin_initial',
    authorName: 'Moritz',
    authorAvatarColor: '#4F46E5',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    reactions: {
      '🎯': ['admin_initial']
    },
    position: { x: 470, y: 550 },
    rotation: -1.4
  }
};

/**
 * Empty household tasks - No demo tasks.
 * Users can create their own custom household chores.
 */
export const DEFAULT_HOUSEHOLD_TASKS: Record<string, TaskItem> = {};

export const INITIAL_FAMILY_DATA: FamilyData = {
  settings: {
    household_name: 'Unser Haushalt',
    default_weekly_target: 50,
    categories: ['Küche', 'Bad', 'Wohnbereich', 'Schlafzimmer', 'Garten', 'Allgemein'],
    last_reset_date: new Date().toISOString(),
    color_theme: 'indigo',
    star_multiplier_1: 50,
    star_multiplier_2: 75,
    star_multiplier_3: 100,
    rollover_surplus_factor: 100,
    rollover_deficit_factor: 100,
    rollover_min_target: 10,
    rollover_max_target: 200,
    week_start_day: 'monday'
  },
  members: {},
  tasks: {},
  logs: [],
  pinnwand: { ...DEFAULT_PINNWAND_NOTES }
};

export const DEMO_FAMILY_DATA: FamilyData = {
  settings: {
    household_name: 'Unser Haushalt',
    default_weekly_target: 50,
    categories: ['Küche', 'Bad', 'Wohnbereich', 'Schlafzimmer', 'Garten', 'Allgemein'],
    last_reset_date: new Date().toISOString(),
    color_theme: 'indigo',
    star_multiplier_1: 50,
    star_multiplier_2: 75,
    star_multiplier_3: 100,
    rollover_surplus_factor: 100,
    rollover_deficit_factor: 100,
    rollover_min_target: 10,
    rollover_max_target: 200,
    week_start_day: 'monday'
  },
  members: {},
  tasks: {},
  logs: [],
  pinnwand: { ...DEFAULT_PINNWAND_NOTES }
};
