import { FamilyData, TaskItem } from '../types';

export const DEFAULT_HOUSEHOLD_TASKS: Record<string, TaskItem> = {
  task_1: {
    id: 'task_1',
    title: 'Geschirrspüler ein-/ausräumen',
    description: 'Sauberes Geschirr & Besteck in Schränke einräumen, schmutziges Geschirr einräumen.',
    category: 'Küche',
    base_points: 10,
    estimated_duration: 10,
    interval_days: 1,
    created_by: 'Moritz',
    last_done: null
  },
  task_2: {
    id: 'task_2',
    title: 'Küche sauber machen',
    description: 'Arbeitsflächen abwischen, Spüle säubern und Kochfeld reinigen.',
    category: 'Küche',
    base_points: 20,
    estimated_duration: 15,
    interval_days: 1,
    created_by: 'Moritz',
    last_done: null
  },
  task_3: {
    id: 'task_3',
    title: 'Müll rausbringen & trennen',
    description: 'Restmüll, Gelber Sack und Papier leeren und neue Müllbeutel einsetzen.',
    category: 'Allgemein',
    base_points: 15,
    estimated_duration: 10,
    interval_days: 2,
    created_by: 'Moritz',
    last_done: null
  },
  task_4: {
    id: 'task_4',
    title: 'Staubsaugen & lüften',
    description: 'Wohn- und Flurbereiche gründlich durchsaugen und Stoßlüften.',
    category: 'Wohnbereich',
    base_points: 25,
    estimated_duration: 20,
    interval_days: 3,
    created_by: 'Moritz',
    last_done: null
  },
  task_5: {
    id: 'task_5',
    title: 'Badezimmer gründlich putzen',
    description: 'Waschbecken, Spiegel, Toilette und Dusche reinigen & Handtücher wechseln.',
    category: 'Bad',
    base_points: 40,
    estimated_duration: 35,
    interval_days: 7,
    created_by: 'Moritz',
    last_done: null
  },
  task_6: {
    id: 'task_6',
    title: 'Wäsche waschen & aufhängen',
    description: 'Wäscheladung starten, aufhängen oder in den Trockner geben.',
    category: 'Allgemein',
    base_points: 20,
    estimated_duration: 15,
    interval_days: 3,
    created_by: 'Moritz',
    last_done: null
  },
  task_7: {
    id: 'task_7',
    title: 'Böden feucht wischen',
    description: 'Küche, Flur und Bad feucht aufwischen.',
    category: 'Wohnbereich',
    base_points: 30,
    estimated_duration: 25,
    interval_days: 7,
    created_by: 'Moritz',
    last_done: null
  },
  task_8: {
    id: 'task_8',
    title: 'Bettwäsche wechseln',
    description: 'Betten abziehen, frisch beziehen und alte Wäsche in den Wäschekorb.',
    category: 'Schlafzimmer',
    base_points: 25,
    estimated_duration: 20,
    interval_days: 14,
    created_by: 'Moritz',
    last_done: null
  }
};

export const INITIAL_FAMILY_DATA: FamilyData = {
  settings: {
    household_name: 'Familie Menet',
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
  tasks: DEFAULT_HOUSEHOLD_TASKS,
  logs: []
};

export const DEMO_FAMILY_DATA: FamilyData = {
  settings: {
    household_name: 'Familie Menet',
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
  members: {
    user_moritz: {
      id: 'user_moritz',
      name: 'Moritz',
      role: 'admin',
      avatar_color: '#4F46E5',
      total_points: 35,
      weekly_target: 50
    },
    user_sophie: {
      id: 'user_sophie',
      name: 'Sophie',
      role: 'member',
      avatar_color: '#10B981',
      total_points: 40,
      weekly_target: 50
    },
    user_leo: {
      id: 'user_leo',
      name: 'Leo',
      role: 'member',
      avatar_color: '#F59E0B',
      total_points: 20,
      weekly_target: 30
    }
  },
  tasks: DEFAULT_HOUSEHOLD_TASKS,
  logs: []
};

