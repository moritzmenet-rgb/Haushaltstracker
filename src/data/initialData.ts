import { FamilyData, PinnwandNote, TaskItem } from '../types';

/**
 * Default Pinnwand sample threads to illustrate the concept immediately
 */
export const DEFAULT_PINNWAND_NOTES: Record<string, PinnwandNote> = {};

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
