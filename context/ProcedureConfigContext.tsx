import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { ProcedureConfig, ProcedureDefinition, CategoryDefinition, SubcategoryDefinition } from '../types';
import { parseConfigJson, configToJson } from '../utils/migrateProcedures';

// Import the default config
import defaultConfig from '../procedures.json';

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
}

const ProcedureConfigContext = createContext<ProcedureConfigContextType | null>(null);

interface ProcedureConfigProviderProps {
  children: ReactNode;
}

export function ProcedureConfigProvider({ children }: ProcedureConfigProviderProps) {
  const [config, setConfig] = useState<ProcedureConfig>(defaultConfig as ProcedureConfig);
  const [error, setError] = useState<string | null>(null);

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
