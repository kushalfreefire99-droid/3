import { Generation, UserPreferences } from '../types/index';

/**
 * Storage utilities for CodersLab
 * 
 * IMPORTANT: All data is stored in the user's browser localStorage ONLY.
 * - No data is sent to or stored on any server
 * - History and preferences remain on the user's computer
 * - Clearing browser data will remove all saved generations
 * - Data is not synced across devices or browsers
 */

const STORAGE_KEYS = {
  GENERATIONS: 'minecraft_generator_history',
  PREFERENCES: 'minecraft_generator_preferences',
  CURRENT_GENERATION: 'minecraft_generator_current'
};

const MAX_HISTORY_ITEMS = 20;

/**
 * Saves a generation to localStorage history
 */
export function saveGeneration(generation: Generation): void {
  try {
    const history = getHistory();
    history.unshift(generation);
    
    // Keep only the last 20 generations
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(STORAGE_KEYS.GENERATIONS, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error saving generation:', error);
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      // If quota exceeded, remove oldest items and try again
      const history = getHistory();
      const reducedHistory = history.slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.GENERATIONS, JSON.stringify(reducedHistory));
      
      // Try saving again
      reducedHistory.unshift(generation);
      localStorage.setItem(STORAGE_KEYS.GENERATIONS, JSON.stringify(reducedHistory.slice(0, MAX_HISTORY_ITEMS)));
    }
  }
}

/**
 * Gets all generations from localStorage
 */
export function getHistory(): Generation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GENERATIONS);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
}

/**
 * Deletes a specific generation from history
 */
export function deleteGeneration(id: string): void {
  try {
    const history = getHistory();
    const filtered = history.filter(gen => gen.id !== id);
    localStorage.setItem(STORAGE_KEYS.GENERATIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting generation:', error);
  }
}

/**
 * Clears all generation history
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.GENERATIONS);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}


/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  defaultMinecraftVersion: '1.20',
  defaultPluginAPI: 'spigot',
  defaultSkriptVersion: '2.8',
  theme: 'light'
};

/**
 * Saves user preferences to localStorage
 */
export function savePreferences(preferences: Partial<UserPreferences>): void {
  try {
    const current = getPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

/**
 * Gets user preferences from localStorage with defaults
 */
export function getPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!stored) return DEFAULT_PREFERENCES;
    
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (error) {
    console.error('Error reading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Saves the current generation to localStorage
 */
export function saveCurrentGeneration(generation: Generation | null): void {
  try {
    if (generation) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_GENERATION, JSON.stringify(generation));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_GENERATION);
    }
  } catch (error) {
    console.error('Error saving current generation:', error);
  }
}

/**
 * Gets the current generation from localStorage
 */
export function getCurrentGeneration(): Generation | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_GENERATION);
    if (!stored) return null;
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading current generation:', error);
    return null;
  }
}
