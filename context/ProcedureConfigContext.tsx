import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, ReactNode } from 'react';
import { 
  ProcedureConfig, 
  ProcedureDefinition, 
  CategoryDefinition, 
  SubcategoryDefinition,
  PredictionData,
  SuggestionSettings,
  ProcedureSuggestion,
  FacilityType,
  DEFAULT_SUGGESTION_SETTINGS
} from '../types';
import { parseConfigJson, configToJson } from '../utils/migrateProcedures';
import { createSuggestionProvider } from '../utils/aiSuggestionProvider';
import { generateSeedPredictions, mergePredictionData, createEmptyPredictionData, getPredictionStats } from '../utils/generateSeedPredictions';

// Import the default config
import defaultConfig from '../procedures.json';

// localStorage keys for persisting data
const STORAGE_KEY = 'procedure-config';
const FAVORITES_KEY = 'procedure-favorites';
const CATEGORY_FAVORITES_KEY = 'category-favorites';
const SUBCATEGORY_FAVORITES_KEY = 'subcategory-favorites';
const RECENTS_KEY = 'procedure-recents';
const MAX_RECENTS = 10;
const USAGE_COUNTS_KEY = 'procedure-usage-counts';
const MAX_MOST_USED = 20;
const PREDICTION_DATA_KEY = 'procedure-prediction-data';
const SUGGESTION_SETTINGS_KEY = 'procedure-suggestion-settings';

// Debounce delay for saving prediction data (ms)
const PREDICTION_SAVE_DEBOUNCE = 500;

/**
 * Load config from localStorage if available, otherwise return null
 */
function loadFromStorage(): ProcedureConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return parseConfigJson(stored);
    }
  } catch (e) {
    console.warn('Failed to load config from localStorage:', e);
  }
  return null;
}

/**
 * Save config to localStorage
 */
function saveToStorage(config: ProcedureConfig): void {
  try {
    const json = configToJson(config);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.warn('Failed to save config to localStorage:', e);
  }
}

/**
 * Clear saved config from localStorage
 */
function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

/**
 * Load favorites from localStorage (stored as array of controlNames)
 */
function loadFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (e) {
    console.warn('Failed to load favorites from localStorage:', e);
  }
  return new Set();
}

/**
 * Save favorites to localStorage
 */
function saveFavorites(favorites: Set<string>): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  } catch (e) {
    console.warn('Failed to save favorites to localStorage:', e);
  }
}

/**
 * Load category favorites from localStorage (stored as array of category IDs)
 */
function loadCategoryFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem(CATEGORY_FAVORITES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (e) {
    console.warn('Failed to load category favorites from localStorage:', e);
  }
  return new Set();
}

/**
 * Save category favorites to localStorage
 */
function saveCategoryFavorites(favorites: Set<string>): void {
  try {
    localStorage.setItem(CATEGORY_FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  } catch (e) {
    console.warn('Failed to save category favorites to localStorage:', e);
  }
}

/**
 * Load subcategory favorites from localStorage (stored as array of subcategory IDs)
 */
function loadSubcategoryFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem(SUBCATEGORY_FAVORITES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (e) {
    console.warn('Failed to load subcategory favorites from localStorage:', e);
  }
  return new Set();
}

/**
 * Save subcategory favorites to localStorage
 */
function saveSubcategoryFavorites(favorites: Set<string>): void {
  try {
    localStorage.setItem(SUBCATEGORY_FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  } catch (e) {
    console.warn('Failed to save subcategory favorites to localStorage:', e);
  }
}

/**
 * Load recent procedure controlNames from localStorage
 */
function loadRecents(): string[] {
  try {
    const stored = localStorage.getItem(RECENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.warn('Failed to load recents from localStorage:', e);
  }
  return [];
}

/**
 * Save recents to localStorage
 */
function saveRecents(recents: string[]): void {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
  } catch (e) {
    console.warn('Failed to save recents to localStorage:', e);
  }
}

/**
 * Load usage counts from localStorage (controlName -> count mapping)
 */
function loadUsageCounts(): Record<string, number> {
  try {
    const stored = localStorage.getItem(USAGE_COUNTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    }
  } catch (e) {
    console.warn('Failed to load usage counts from localStorage:', e);
  }
  return {};
}

/**
 * Save usage counts to localStorage
 */
function saveUsageCounts(counts: Record<string, number>): void {
  try {
    localStorage.setItem(USAGE_COUNTS_KEY, JSON.stringify(counts));
  } catch (e) {
    console.warn('Failed to save usage counts to localStorage:', e);
  }
}

/**
 * Load prediction data from localStorage
 */
function loadPredictionData(): PredictionData {
  try {
    const stored = localStorage.getItem(PREDICTION_DATA_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate structure
      if (parsed && typeof parsed === 'object' && 
          parsed.procedureAddCounts && parsed.coOccurrences) {
        return parsed as PredictionData;
      }
    }
  } catch (e) {
    console.warn('Failed to load prediction data from localStorage:', e);
  }
  return createEmptyPredictionData();
}

/**
 * Save prediction data to localStorage
 */
function savePredictionData(data: PredictionData): void {
  try {
    localStorage.setItem(PREDICTION_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save prediction data to localStorage:', e);
  }
}

/**
 * Load suggestion settings from localStorage
 */
function loadSuggestionSettings(): SuggestionSettings {
  try {
    const stored = localStorage.getItem(SUGGESTION_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return { ...DEFAULT_SUGGESTION_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load suggestion settings from localStorage:', e);
  }
  return { ...DEFAULT_SUGGESTION_SETTINGS };
}

/**
 * Save suggestion settings to localStorage
 */
function saveSuggestionSettings(settings: SuggestionSettings): void {
  try {
    localStorage.setItem(SUGGESTION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save suggestion settings to localStorage:', e);
  }
}

/**
 * Get initial config: try localStorage first, fall back to default
 */
function getInitialConfig(): ProcedureConfig {
  const stored = loadFromStorage();
  if (stored) {
    return stored;
  }
  return defaultConfig as ProcedureConfig;
}

interface ProcedureConfigContextType {
  /** Current list of procedure definitions */
  procedures: ProcedureDefinition[];
  /** Current list of category definitions */
  categories: CategoryDefinition[];
  /** Current list of subcategory definitions */
  subcategories: SubcategoryDefinition[];
  /** Current config version */
  version: string;
  
  // Category lookups
  /** Get a category by its ID */
  getCategoryById: (id: string) => CategoryDefinition | undefined;
  /** Get a category's display name by ID */
  getCategoryName: (id: string) => string;
  /** Get categories sorted by sortOrder */
  getSortedCategories: () => CategoryDefinition[];
  
  // Subcategory lookups
  /** Get a subcategory by its ID */
  getSubcategoryById: (id: string) => SubcategoryDefinition | undefined;
  /** Get a subcategory's display name by ID */
  getSubcategoryName: (id: string) => string;
  /** Get subcategories sorted by sortOrder */
  getSortedSubcategories: () => SubcategoryDefinition[];
  /** Get subcategories used within a specific category (inferred from procedures) */
  getSubcategoriesForCategory: (categoryId: string) => SubcategoryDefinition[];
  
  // Config operations
  /** Load a config from a JSON file */
  loadConfig: (file: File) => Promise<void>;
  /** Export current config as a JSON download */
  exportConfig: () => void;
  /** Reset config to defaults (clears localStorage) */
  resetToDefaults: () => void;
  /** Whether the config has been modified from defaults */
  hasStoredConfig: boolean;
  
  // Procedure CRUD
  /** Update all procedures in the config */
  updateProcedures: (procedures: ProcedureDefinition[]) => void;
  /** Update a single procedure by index */
  updateProcedure: (index: number, procedure: ProcedureDefinition) => void;
  /** Add a new procedure */
  addProcedure: (procedure: ProcedureDefinition) => void;
  /** Delete a procedure by index */
  deleteProcedure: (index: number) => void;
  
  // Category CRUD
  /** Update all categories in the config */
  updateCategories: (categories: CategoryDefinition[]) => void;
  /** Update a single category by ID */
  updateCategory: (id: string, category: CategoryDefinition) => void;
  /** Add a new category */
  addCategory: (category: CategoryDefinition) => void;
  /** Delete a category by ID */
  deleteCategory: (id: string) => void;
  
  // Subcategory CRUD
  /** Update all subcategories in the config */
  updateSubcategories: (subcategories: SubcategoryDefinition[]) => void;
  /** Update a single subcategory by ID */
  updateSubcategory: (id: string, subcategory: SubcategoryDefinition) => void;
  /** Add a new subcategory */
  addSubcategory: (subcategory: SubcategoryDefinition) => void;
  /** Delete a subcategory by ID */
  deleteSubcategory: (id: string) => void;
  
  /** Error message from last failed operation */
  error: string | null;
  /** Clear any error message */
  clearError: () => void;
  
  // Favorites management (procedures)
  /** Set of favorited procedure controlNames */
  favorites: Set<string>;
  /** Check if a procedure is favorited */
  isFavorite: (controlName: string) => boolean;
  /** Toggle favorite status for a procedure */
  toggleFavorite: (controlName: string) => void;
  /** Get all favorited procedures */
  getFavoriteProcedures: () => ProcedureDefinition[];
  
  // Category favorites management
  /** Set of favorited category IDs */
  categoryFavorites: Set<string>;
  /** Check if a category is favorited */
  isCategoryFavorite: (categoryId: string) => boolean;
  /** Toggle favorite status for a category */
  toggleCategoryFavorite: (categoryId: string) => void;
  /** Get all favorited categories */
  getFavoriteCategories: () => CategoryDefinition[];
  
  // Subcategory favorites management
  /** Set of favorited subcategory IDs */
  subcategoryFavorites: Set<string>;
  /** Check if a subcategory is favorited */
  isSubcategoryFavorite: (subcategoryId: string) => boolean;
  /** Toggle favorite status for a subcategory */
  toggleSubcategoryFavorite: (subcategoryId: string) => void;
  /** Get all favorited subcategories */
  getFavoriteSubcategories: () => SubcategoryDefinition[];
  
  // Recent procedures management
  /** List of recently used procedure controlNames (most recent first) */
  recentControlNames: string[];
  /** Add a procedure to recents (called when selecting a procedure) */
  addToRecents: (controlName: string) => void;
  /** Get all recent procedures */
  getRecentProcedures: () => ProcedureDefinition[];
  /** Clear all recents */
  clearRecents: () => void;
  
  // Usage tracking (most used)
  /** Map of procedure controlNames to usage counts */
  usageCounts: Record<string, number>;
  /** Increment usage count for a procedure */
  incrementUsage: (controlName: string) => void;
  /** Get top N most used procedures with their counts */
  getMostUsedProcedures: () => Array<{ procedure: ProcedureDefinition; count: number }>;
  /** Get usage count for a specific procedure */
  getUsageCount: (controlName: string) => number;
  /** Clear all usage data */
  clearUsageCounts: () => void;
  
  // Prediction and suggestion system
  /** Current prediction data (co-occurrence tracking) */
  predictionData: PredictionData;
  /** Current suggestion settings */
  suggestionSettings: SuggestionSettings;
  /** Update suggestion settings */
  updateSuggestionSettings: (settings: Partial<SuggestionSettings>) => void;
  /** Record co-occurrence when a procedure is added to a session */
  recordCoOccurrence: (newProcedureId: string, sessionProcedureIds: string[]) => void;
  /** Get suggestions based on current session procedures */
  getSuggestionsForSession: (sessionProcedureIds: string[]) => ProcedureSuggestion[];
  /** Clear all prediction data */
  clearPredictionData: () => void;
  /** Export prediction data as JSON */
  exportPredictionData: () => void;
  /** Import prediction data from file */
  importPredictionData: (file: File) => Promise<void>;
  /** Generate and apply seed prediction data for a facility type */
  generateAndApplySeedData: (facilityType: FacilityType, procedures: ProcedureDefinition[]) => void;
  /** Get statistics about current prediction data */
  getPredictionDataStats: () => { totalProcedures: number; totalPairs: number; totalObservations: number };
  /** Auto-seed prediction data if empty (returns true if seeding was performed) */
  autoSeedIfEmpty: () => boolean;
}

const ProcedureConfigContext = createContext<ProcedureConfigContextType | null>(null);

interface ProcedureConfigProviderProps {
  children: ReactNode;
}

export function ProcedureConfigProvider({ children }: ProcedureConfigProviderProps) {
  // Initialize from localStorage if available, otherwise use defaults
  const [config, setConfig] = useState<ProcedureConfig>(getInitialConfig);
  const [error, setError] = useState<string | null>(null);
  const [hasStoredConfig, setHasStoredConfig] = useState(() => loadFromStorage() !== null);
  
  // Favorites and recents state
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [categoryFavorites, setCategoryFavorites] = useState<Set<string>>(loadCategoryFavorites);
  const [subcategoryFavorites, setSubcategoryFavorites] = useState<Set<string>>(loadSubcategoryFavorites);
  const [recentControlNames, setRecentControlNames] = useState<string[]>(loadRecents);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>(loadUsageCounts);
  
  // Prediction and suggestion state
  const [predictionData, setPredictionData] = useState<PredictionData>(loadPredictionData);
  const [suggestionSettings, setSuggestionSettings] = useState<SuggestionSettings>(loadSuggestionSettings);
  
  // Debounce timer ref for saving prediction data
  const predictionSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save to localStorage whenever config changes
  useEffect(() => {
    saveToStorage(config);
    setHasStoredConfig(true);
  }, [config]);

  // Create lookup maps for efficient access
  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryDefinition>();
    for (const cat of config.categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [config.categories]);

  const subcategoryMap = useMemo(() => {
    const map = new Map<string, SubcategoryDefinition>();
    for (const subcat of config.subcategories) {
      map.set(subcat.id, subcat);
    }
    return map;
  }, [config.subcategories]);

  // Category-to-subcategory mapping (inferred from procedures)
  const categorySubcategoryMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const proc of config.procedures) {
      if (!map.has(proc.categoryId)) {
        map.set(proc.categoryId, new Set());
      }
      map.get(proc.categoryId)!.add(proc.subcategoryId);
    }
    return map;
  }, [config.procedures]);

  // Category lookups
  const getCategoryById = useCallback((id: string) => {
    return categoryMap.get(id);
  }, [categoryMap]);

  const getCategoryName = useCallback((id: string) => {
    return categoryMap.get(id)?.name || id;
  }, [categoryMap]);

  const getSortedCategories = useCallback(() => {
    return [...config.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [config.categories]);

  // Subcategory lookups
  const getSubcategoryById = useCallback((id: string) => {
    return subcategoryMap.get(id);
  }, [subcategoryMap]);

  const getSubcategoryName = useCallback((id: string) => {
    return subcategoryMap.get(id)?.name || id;
  }, [subcategoryMap]);

  const getSortedSubcategories = useCallback(() => {
    return [...config.subcategories].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [config.subcategories]);

  const getSubcategoriesForCategory = useCallback((categoryId: string) => {
    const subcatIds = categorySubcategoryMap.get(categoryId);
    if (!subcatIds) return [];
    
    const subcats: SubcategoryDefinition[] = [];
    for (const id of subcatIds) {
      const subcat = subcategoryMap.get(id);
      if (subcat) {
        subcats.push(subcat);
      }
    }
    return subcats.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categorySubcategoryMap, subcategoryMap]);

  // Config operations
  const loadConfig = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseConfigJson(text);
      setConfig(parsed);
      setError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load config';
      setError(message);
      throw e;
    }
  }, []);

  const exportConfig = useCallback(() => {
    const json = configToJson(config);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'procedures.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [config]);

  const resetToDefaults = useCallback(() => {
    clearStorage();
    setConfig(defaultConfig as ProcedureConfig);
    setHasStoredConfig(false);
    setError(null);
  }, []);

  // Procedure CRUD
  const updateProcedures = useCallback((procedures: ProcedureDefinition[]) => {
    setConfig(prev => ({ ...prev, procedures }));
  }, []);

  const updateProcedure = useCallback((index: number, procedure: ProcedureDefinition) => {
    setConfig(prev => ({
      ...prev,
      procedures: prev.procedures.map((p, i) => i === index ? procedure : p),
    }));
  }, []);

  const addProcedure = useCallback((procedure: ProcedureDefinition) => {
    setConfig(prev => ({
      ...prev,
      procedures: [...prev.procedures, procedure],
    }));
  }, []);

  const deleteProcedure = useCallback((index: number) => {
    setConfig(prev => ({
      ...prev,
      procedures: prev.procedures.filter((_, i) => i !== index),
    }));
  }, []);

  // Category CRUD
  const updateCategories = useCallback((categories: CategoryDefinition[]) => {
    setConfig(prev => ({ ...prev, categories }));
  }, []);

  const updateCategory = useCallback((id: string, category: CategoryDefinition) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? category : c),
    }));
  }, []);

  const addCategory = useCallback((category: CategoryDefinition) => {
    setConfig(prev => ({
      ...prev,
      categories: [...prev.categories, category],
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
    }));
  }, []);

  // Subcategory CRUD
  const updateSubcategories = useCallback((subcategories: SubcategoryDefinition[]) => {
    setConfig(prev => ({ ...prev, subcategories }));
  }, []);

  const updateSubcategory = useCallback((id: string, subcategory: SubcategoryDefinition) => {
    setConfig(prev => ({
      ...prev,
      subcategories: prev.subcategories.map(s => s.id === id ? subcategory : s),
    }));
  }, []);

  const addSubcategory = useCallback((subcategory: SubcategoryDefinition) => {
    setConfig(prev => ({
      ...prev,
      subcategories: [...prev.subcategories, subcategory],
    }));
  }, []);

  const deleteSubcategory = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter(s => s.id !== id),
    }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Favorites management
  const isFavorite = useCallback((controlName: string) => {
    return favorites.has(controlName);
  }, [favorites]);

  const toggleFavorite = useCallback((controlName: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(controlName)) {
        next.delete(controlName);
      } else {
        next.add(controlName);
      }
      saveFavorites(next);
      return next;
    });
  }, []);

  const getFavoriteProcedures = useCallback(() => {
    return config.procedures.filter(p => favorites.has(p.controlName));
  }, [config.procedures, favorites]);

  // Category favorites management
  const isCategoryFavorite = useCallback((categoryId: string) => {
    return categoryFavorites.has(categoryId);
  }, [categoryFavorites]);

  const toggleCategoryFavorite = useCallback((categoryId: string) => {
    setCategoryFavorites(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      saveCategoryFavorites(next);
      return next;
    });
  }, []);

  const getFavoriteCategories = useCallback(() => {
    return config.categories
      .filter(c => categoryFavorites.has(c.id))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [config.categories, categoryFavorites]);

  // Subcategory favorites management
  const isSubcategoryFavorite = useCallback((subcategoryId: string) => {
    return subcategoryFavorites.has(subcategoryId);
  }, [subcategoryFavorites]);

  const toggleSubcategoryFavorite = useCallback((subcategoryId: string) => {
    setSubcategoryFavorites(prev => {
      const next = new Set(prev);
      if (next.has(subcategoryId)) {
        next.delete(subcategoryId);
      } else {
        next.add(subcategoryId);
      }
      saveSubcategoryFavorites(next);
      return next;
    });
  }, []);

  const getFavoriteSubcategories = useCallback(() => {
    return config.subcategories
      .filter(s => subcategoryFavorites.has(s.id))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [config.subcategories, subcategoryFavorites]);

  // Recents management
  const addToRecents = useCallback((controlName: string) => {
    setRecentControlNames(prev => {
      // Remove if already exists, then add to front
      const filtered = prev.filter(cn => cn !== controlName);
      const next = [controlName, ...filtered].slice(0, MAX_RECENTS);
      saveRecents(next);
      return next;
    });
  }, []);

  const getRecentProcedures = useCallback(() => {
    // Return procedures in order of recency
    const procedureMap = new Map(config.procedures.map(p => [p.controlName, p]));
    return recentControlNames
      .map(cn => procedureMap.get(cn))
      .filter((p): p is ProcedureDefinition => p !== undefined);
  }, [config.procedures, recentControlNames]);

  const clearRecents = useCallback(() => {
    setRecentControlNames([]);
    saveRecents([]);
  }, []);

  // Usage tracking (most used)
  const incrementUsage = useCallback((controlName: string) => {
    setUsageCounts(prev => {
      const next = { ...prev, [controlName]: (prev[controlName] || 0) + 1 };
      saveUsageCounts(next);
      return next;
    });
  }, []);

  const getMostUsedProcedures = useCallback(() => {
    const procedureMap = new Map(config.procedures.map(p => [p.controlName, p]));
    
    return (Object.entries(usageCounts) as [string, number][])
      .filter(([controlName]) => procedureMap.has(controlName))
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, MAX_MOST_USED)
      .map(([controlName, count]) => ({
        procedure: procedureMap.get(controlName)!,
        count
      }));
  }, [config.procedures, usageCounts]);

  const getUsageCount = useCallback((controlName: string) => {
    return usageCounts[controlName] || 0;
  }, [usageCounts]);

  const clearUsageCounts = useCallback(() => {
    setUsageCounts({});
    saveUsageCounts({});
  }, []);

  // Prediction and suggestion functions
  
  // Create procedure lookup map for suggestions
  const procedureLookupMap = useMemo(() => {
    const map = new Map<string, ProcedureDefinition>();
    for (const proc of config.procedures) {
      map.set(proc.controlName, proc);
    }
    return map;
  }, [config.procedures]);

  // Debounced save for prediction data
  const debouncedSavePredictionData = useCallback((data: PredictionData) => {
    if (predictionSaveTimerRef.current) {
      clearTimeout(predictionSaveTimerRef.current);
    }
    predictionSaveTimerRef.current = setTimeout(() => {
      savePredictionData(data);
      predictionSaveTimerRef.current = null;
    }, PREDICTION_SAVE_DEBOUNCE);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (predictionSaveTimerRef.current) {
        clearTimeout(predictionSaveTimerRef.current);
      }
    };
  }, []);

  const updateSuggestionSettings = useCallback((updates: Partial<SuggestionSettings>) => {
    setSuggestionSettings(prev => {
      const next = { ...prev, ...updates };
      saveSuggestionSettings(next);
      return next;
    });
  }, []);

  const recordCoOccurrence = useCallback((newProcedureId: string, sessionProcedureIds: string[]) => {
    console.log('recordCoOccurrence called:', newProcedureId, 'with session:', sessionProcedureIds);
    
    setPredictionData(prev => {
      const next = { ...prev };
      
      // Deep clone the nested objects
      next.procedureAddCounts = { ...prev.procedureAddCounts };
      next.coOccurrences = { ...prev.coOccurrences };
      
      // Increment the add count for the new procedure
      next.procedureAddCounts[newProcedureId] = (next.procedureAddCounts[newProcedureId] || 0) + 1;
      
      // Record co-occurrence with each existing procedure in session
      for (const existingId of sessionProcedureIds) {
        if (existingId === newProcedureId) continue;
        
        // Also increment add count for existing procedure (it's part of this co-occurrence)
        next.procedureAddCounts[existingId] = (next.procedureAddCounts[existingId] || 0) + 1;
        
        // Create BIDIRECTIONAL co-occurrence entries
        // existingId -> newProcedureId (existing predicts new)
        if (!next.coOccurrences[existingId]) {
          next.coOccurrences[existingId] = {};
        }
        next.coOccurrences[existingId] = { ...next.coOccurrences[existingId] };
        next.coOccurrences[existingId][newProcedureId] = 
          (next.coOccurrences[existingId][newProcedureId] || 0) + 1;
        
        // newProcedureId -> existingId (new predicts existing)
        if (!next.coOccurrences[newProcedureId]) {
          next.coOccurrences[newProcedureId] = {};
        }
        next.coOccurrences[newProcedureId] = { ...next.coOccurrences[newProcedureId] };
        next.coOccurrences[newProcedureId][existingId] = 
          (next.coOccurrences[newProcedureId][existingId] || 0) + 1;
      }
      
      console.log('Updated prediction data:', {
        procedureAddCounts: next.procedureAddCounts,
        coOccurrencePairs: Object.keys(next.coOccurrences).length
      });
      
      // Debounced save
      debouncedSavePredictionData(next);
      
      return next;
    });
  }, [debouncedSavePredictionData]);

  const getSuggestionsForSession = useCallback((sessionProcedureIds: string[]): ProcedureSuggestion[] => {
    if (!suggestionSettings.enabled || sessionProcedureIds.length === 0) {
      return [];
    }
    
    const provider = createSuggestionProvider(suggestionSettings);
    return provider.getSuggestions(
      sessionProcedureIds,
      config.procedures,
      predictionData,
      suggestionSettings.threshold,
      suggestionSettings.maxSuggestions
    );
  }, [suggestionSettings, predictionData, config.procedures]);

  const clearPredictionData = useCallback(() => {
    const empty = createEmptyPredictionData();
    setPredictionData(empty);
    savePredictionData(empty);
  }, []);

  const exportPredictionData = useCallback(() => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      facilityType: suggestionSettings.facilityType,
      data: predictionData,
      stats: getPredictionStats(predictionData)
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `prediction-data-${suggestionSettings.facilityType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [predictionData, suggestionSettings.facilityType]);

  const importPredictionData = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      // Handle both direct prediction data and wrapped export format
      let importData: PredictionData;
      if (parsed.data && parsed.data.procedureAddCounts && parsed.data.coOccurrences) {
        importData = parsed.data;
      } else if (parsed.procedureAddCounts && parsed.coOccurrences) {
        importData = parsed;
      } else {
        throw new Error('Invalid prediction data format');
      }
      
      // Merge with existing data
      const merged = mergePredictionData(predictionData, importData);
      setPredictionData(merged);
      savePredictionData(merged);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to import prediction data';
      setError(message);
      throw e;
    }
  }, [predictionData]);

  const generateAndApplySeedData = useCallback((facilityType: FacilityType, procedures: ProcedureDefinition[]) => {
    const seedData = generateSeedPredictions(procedures, [facilityType]);
    const merged = mergePredictionData(predictionData, seedData);
    setPredictionData(merged);
    savePredictionData(merged);
  }, [predictionData]);

  const getPredictionDataStats = useCallback(() => {
    return getPredictionStats(predictionData);
  }, [predictionData]);

  // Auto-seed prediction data if empty (called when opening procedure selection)
  const autoSeedIfEmpty = useCallback(() => {
    // Check if auto-seeding is enabled
    if (!suggestionSettings.autoSeed) {
      return false;
    }
    
    const stats = getPredictionStats(predictionData);
    console.log('autoSeedIfEmpty called, totalPairs:', stats.totalPairs, 'totalProcedures:', stats.totalProcedures, 'procedures count:', config.procedures.length);
    if (stats.totalPairs === 0) {
      // No prediction data - auto-seed with the configured facility type
      console.log('Seeding with', suggestionSettings.facilityType, 'bundles...');
      const seedData = generateSeedPredictions(config.procedures, [suggestionSettings.facilityType]);
      const seedStats = getPredictionStats(seedData);
      console.log('Seed data generated - totalPairs:', seedStats.totalPairs, 'totalProcedures:', seedStats.totalProcedures);
      setPredictionData(seedData);
      savePredictionData(seedData);
      return true; // Indicates seeding was performed
    }
    return false; // Already had data
  }, [predictionData, config.procedures, suggestionSettings.autoSeed, suggestionSettings.facilityType]);

  return (
    <ProcedureConfigContext.Provider
      value={{
        procedures: config.procedures,
        categories: config.categories,
        subcategories: config.subcategories,
        version: config.version,
        
        getCategoryById,
        getCategoryName,
        getSortedCategories,
        
        getSubcategoryById,
        getSubcategoryName,
        getSortedSubcategories,
        getSubcategoriesForCategory,
        
        loadConfig,
        exportConfig,
        resetToDefaults,
        hasStoredConfig,
        
        updateProcedures,
        updateProcedure,
        addProcedure,
        deleteProcedure,
        
        updateCategories,
        updateCategory,
        addCategory,
        deleteCategory,
        
        updateSubcategories,
        updateSubcategory,
        addSubcategory,
        deleteSubcategory,
        
        error,
        clearError,
        
        favorites,
        isFavorite,
        toggleFavorite,
        getFavoriteProcedures,
        
        categoryFavorites,
        isCategoryFavorite,
        toggleCategoryFavorite,
        getFavoriteCategories,
        
        subcategoryFavorites,
        isSubcategoryFavorite,
        toggleSubcategoryFavorite,
        getFavoriteSubcategories,
        
        recentControlNames,
        addToRecents,
        getRecentProcedures,
        clearRecents,
        
        usageCounts,
        incrementUsage,
        getMostUsedProcedures,
        getUsageCount,
        clearUsageCounts,
        
        predictionData,
        suggestionSettings,
        updateSuggestionSettings,
        recordCoOccurrence,
        getSuggestionsForSession,
        clearPredictionData,
        exportPredictionData,
        importPredictionData,
        generateAndApplySeedData,
        getPredictionDataStats,
        autoSeedIfEmpty,
      }}
    >
      {children}
    </ProcedureConfigContext.Provider>
  );
}

export function useProcedureConfig(): ProcedureConfigContextType {
  const context = useContext(ProcedureConfigContext);
  if (!context) {
    throw new Error('useProcedureConfig must be used within a ProcedureConfigProvider');
  }
  return context;
}
