import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ProcedureConfig, ProcedureDefinition } from '../types';
import { parseConfigJson, configToJson } from '../utils/migrateProcedures';

// Import the default config
import defaultConfig from '../procedures.json';

interface ProcedureConfigContextType {
  /** Current list of procedure definitions */
  procedures: ProcedureDefinition[];
  /** Current config version */
  version: string;
  /** Load a config from a JSON file */
  loadConfig: (file: File) => Promise<void>;
  /** Export current config as a JSON download */
  exportConfig: () => void;
  /** Update procedures in the config */
  updateProcedures: (procedures: ProcedureDefinition[]) => void;
  /** Update a single procedure by index */
  updateProcedure: (index: number, procedure: ProcedureDefinition) => void;
  /** Add a new procedure */
  addProcedure: (procedure: ProcedureDefinition) => void;
  /** Delete a procedure by index */
  deleteProcedure: (index: number) => void;
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ProcedureConfigContext.Provider
      value={{
        procedures: config.procedures,
        version: config.version,
        loadConfig,
        exportConfig,
        updateProcedures,
        updateProcedure,
        addProcedure,
        deleteProcedure,
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
