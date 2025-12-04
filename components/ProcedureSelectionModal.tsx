import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProcedureDefinition, ProcedureFieldDefinition, SelectedProcedure } from '../types';
import { useProcedureConfig } from '../context/ProcedureConfigContext';
import { SearchIcon } from './icons/SearchIcon';
import { CloseIcon } from './icons/CloseIcon';
import { BackIcon } from './icons/BackIcon';

interface ProcedureSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (procedure: SelectedProcedure, keepOpen?: boolean) => void;
  currentDate: string;
  currentPhysician: string;
}

// Grouped by categoryId, then subcategoryId
type GroupedProcedures = Record<string, Record<string, ProcedureDefinition[]>>;

export const ProcedureSelectionModal: React.FC<ProcedureSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  currentDate,
  currentPhysician,
}) => {
  const { 
    procedures, 
    getCategoryName, 
    getSubcategoryName,
    getCategoryById,
    getSubcategoryById,
    getSortedCategories,
  } = useProcedureConfig();
  
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeProcedure, setActiveProcedure] = useState<ProcedureDefinition | null>(null);
  const [keepOpen, setKeepOpen] = useState(false);
  const [preserveFilters, setPreserveFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // State for field values when a procedure with fields is selected
  const [fieldValues, setFieldValues] = useState<Record<string, string | number>>({});


  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        if (!preserveFilters) {
          setSearchTokens([]);
          setInputValue('');
        }
        setActiveProcedure(null);
        setFieldValues({});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, preserveFilters]);

  // Reset field values when active procedure changes
  useEffect(() => {
    if (activeProcedure) {
      const initialValues: Record<string, string | number> = {};
      activeProcedure.fields.forEach(field => {
        if (field.type === 'list' && field.listItems && field.listItems.length > 0) {
          initialValues[field.controlName] = field.listItems[0];
        } else if (field.type === 'number') {
          initialValues[field.controlName] = '';
        } else {
          initialValues[field.controlName] = '';
        }
      });
      setFieldValues(initialValues);
    }
  }, [activeProcedure]);

  const handleClose = () => {
    onClose();
  };
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeProcedure) {
          setActiveProcedure(null);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose, activeProcedure]);

  const createSelectedProcedure = (
    procedure: ProcedureDefinition, 
    values: Record<string, string | number>
  ): SelectedProcedure => {
    const processedValues: Record<string, string | number> = {};
    procedure.fields.forEach(field => {
      const value = values[field.controlName];
      if (field.type === 'number') {
        const numVal = typeof value === 'string' ? parseInt(value, 10) : value;
        if (!isNaN(numVal as number)) {
          processedValues[field.controlName] = numVal;
        }
      } else if (value !== undefined && value !== '') {
        processedValues[field.controlName] = value;
      }
    });

    return {
      id: `${procedure.controlName}-${Date.now()}`,
      categoryId: procedure.categoryId,
      subcategoryId: procedure.subcategoryId,
      description: procedure.description,
      controlName: procedure.controlName,
      fields: procedure.fields,
      fieldValues: processedValues,
      date: currentDate,
      physician: currentPhysician,
    };
  };

  const handleProcedureClick = (procedure: ProcedureDefinition) => {
    if (procedure.fields && procedure.fields.length > 0) {
      setActiveProcedure(procedure);
    } else {
      const selected = createSelectedProcedure(procedure, {});
      onSelect(selected, keepOpen);
    }
  };

  const handleFieldSave = () => {
    if (activeProcedure) {
      const selected = createSelectedProcedure(activeProcedure, fieldValues);
      onSelect(selected, keepOpen);
      if (keepOpen) {
        setActiveProcedure(null);
        setFieldValues({});
      }
    }
  };

  const handleQuickOptionSelect = (option: string) => {
    if (activeProcedure && activeProcedure.fields.length === 1 && activeProcedure.fields[0].type === 'list') {
      const values = { [activeProcedure.fields[0].controlName]: option };
      const selected = createSelectedProcedure(activeProcedure, values);
      onSelect(selected, keepOpen);
      if (keepOpen) {
        setActiveProcedure(null);
        setFieldValues({});
      }
    }
  };

  const updateFieldValue = (controlName: string, value: string | number) => {
    setFieldValues(prev => ({ ...prev, [controlName]: value }));
  };

  const renderFieldInput = (field: ProcedureFieldDefinition) => {
    const value = fieldValues[field.controlName] ?? '';
    
    switch (field.type) {
      case 'list':
        return (
          <div key={field.controlName}>
            <label htmlFor={`field-${field.controlName}`} className="block text-sm font-medium text-slate-400 mb-2">
              {field.label}
            </label>
            <select
              id={`field-${field.controlName}`}
              value={value as string}
              onChange={(e) => updateFieldValue(field.controlName, e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              {field.listItems?.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        );
      
      case 'number':
        return (
          <div key={field.controlName}>
            <label htmlFor={`field-${field.controlName}`} className="block text-sm font-medium text-slate-400 mb-2">
              {field.label}
            </label>
            <input
              id={`field-${field.controlName}`}
              type="number"
              value={value}
              onChange={(e) => updateFieldValue(field.controlName, e.target.value)}
              placeholder="Enter a number"
              className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
        );
      
      case 'textbox':
        return (
          <div key={field.controlName}>
            <label htmlFor={`field-${field.controlName}`} className="block text-sm font-medium text-slate-400 mb-2">
              {field.label}
            </label>
            <input
              id={`field-${field.controlName}`}
              type="text"
              value={value as string}
              onChange={(e) => updateFieldValue(field.controlName, e.target.value)}
              placeholder="Enter text"
              className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={field.controlName} className="flex items-center gap-3 py-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={value === true || value === 'true'}
              onClick={() => updateFieldValue(field.controlName, value === 'true' ? 'false' : 'true')}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                value === true || value === 'true'
                  ? 'bg-cyan-500 border-cyan-500'
                  : 'bg-slate-900 border-slate-600 hover:border-slate-500'
              }`}
            >
              {(value === true || value === 'true') && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
            <label 
              onClick={() => updateFieldValue(field.controlName, value === 'true' ? 'false' : 'true')}
              className="text-sm font-medium text-slate-300 cursor-pointer select-none"
            >
              {field.label}
            </label>
          </div>
        );
      
      default:
        return null;
    }
  };

  const clearAllTokens = () => {
    setSearchTokens([]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const filteredProcedures = useMemo(() => {
    const currentInputTokens = inputValue.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
    const allTokens = [...searchTokens, ...currentInputTokens];

    if (allTokens.length === 0) {
      return procedures;
    }

    return procedures.filter((proc) => {
      // Search by resolved names (display names) rather than IDs
      const categoryName = getCategoryName(proc.categoryId);
      const subcategoryName = getSubcategoryName(proc.subcategoryId);
      const searchSpace = `${categoryName} ${subcategoryName} ${proc.description}`.toLowerCase();
      return allTokens.every(token => searchSpace.includes(token));
    });
  }, [procedures, searchTokens, inputValue, getCategoryName, getSubcategoryName]);

  // Group procedures by categoryId, then subcategoryId
  const groupedProcedures = useMemo(() => {
    return filteredProcedures.reduce((acc, procedure) => {
      const { categoryId, subcategoryId } = procedure;
      if (!acc[categoryId]) {
        acc[categoryId] = {};
      }
      const finalSubcategoryId = subcategoryId || 'general';
      if (!acc[categoryId][finalSubcategoryId]) {
        acc[categoryId][finalSubcategoryId] = [];
      }
      acc[categoryId][finalSubcategoryId].push(procedure);
      return acc;
    }, {} as GroupedProcedures);
  }, [filteredProcedures]);

  // Get sorted category IDs based on their sortOrder
  const sortedCategoryIds = useMemo(() => {
    const categoryIds = Object.keys(groupedProcedures);
    return categoryIds.sort((a, b) => {
      const catA = getCategoryById(a);
      const catB = getCategoryById(b);
      const orderA = catA?.sortOrder ?? 999999;
      const orderB = catB?.sortOrder ?? 999999;
      return orderA - orderB;
    });
  }, [groupedProcedures, getCategoryById]);

  // Get sorted subcategory IDs for a given category
  const getSortedSubcategoryIds = (subcategories: Record<string, ProcedureDefinition[]>) => {
    const subcategoryIds = Object.keys(subcategories);
    return subcategoryIds.sort((a, b) => {
      const subA = getSubcategoryById(a);
      const subB = getSubcategoryById(b);
      const orderA = subA?.sortOrder ?? 999999;
      const orderB = subB?.sortOrder ?? 999999;
      return orderA - orderB;
    });
  };

  const suggestions = useMemo(() => {
    const currentCatNames = new Set<string>();
    const currentSubcatNames = new Set<string>();

    filteredProcedures.forEach(p => {
      const catName = getCategoryName(p.categoryId);
      const subcatName = getSubcategoryName(p.subcategoryId);
      if (catName) currentCatNames.add(catName);
      if (subcatName) currentSubcatNames.add(subcatName);
    });

    const isUnfiltered = searchTokens.length === 0 && !inputValue.trim();
    const existingTokens = new Set(searchTokens.map(t => t.toLowerCase()));
    const currentInput = inputValue.toLowerCase().trim();
    
    let candidates: string[] = [];

    if (isUnfiltered) {
      // Show categories sorted by sortOrder when unfiltered
      candidates = getSortedCategories().map(c => c.name);
    } else {
      const catsArray = Array.from(currentCatNames).sort();
      const usefulCats = catsArray.length > 1 ? catsArray : []; 
      const subcatsArray = Array.from(currentSubcatNames).sort();
      candidates = [...usefulCats, ...subcatsArray];
    }

    // Remove duplicates and already selected tokens
    let filtered = Array.from(new Set(candidates))
      .filter(s => !existingTokens.has(s.toLowerCase()));
    
    // Prioritize suggestions that contain the current input value
    if (currentInput) {
      filtered.sort((a, b) => {
        const aContains = a.toLowerCase().includes(currentInput);
        const bContains = b.toLowerCase().includes(currentInput);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        return a.localeCompare(b);
      });
    }
    
    return filtered.slice(0, 30); // Limit to 30 to prevent UI clutter
  }, [filteredProcedures, searchTokens, inputValue, getCategoryName, getSubcategoryName, getSortedCategories]);

  const addToken = (token: string) => {
    setSearchTokens(prev => {
      const newTokens = [...prev];
      const currentInputTokens = inputValue.trim().split(/\s+/).filter(t => t.length > 0);
      
      currentInputTokens.forEach(t => {
        const lowerT = t.toLowerCase();
        if (!newTokens.includes(lowerT)) {
          newTokens.push(lowerT);
        }
      });

      const tokenLower = token.toLowerCase();
      if (!newTokens.includes(tokenLower)) {
        newTokens.push(tokenLower);
      }
      return newTokens;
    });
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const val = inputValue.trim();
      if (val) {
        e.preventDefault();
        setSearchTokens(prev => [...prev, val.toLowerCase()]);
        setInputValue('');
      } else if (e.key === ' ') {
        e.preventDefault(); 
      }
    } else if (e.key === 'Backspace' && !inputValue) {
      if (searchTokens.length > 0) {
        setSearchTokens(prev => prev.slice(0, -1));
      }
    }
  };

  const removeToken = (indexToRemove: number) => {
    setSearchTokens(prev => prev.filter((_, i) => i !== indexToRemove));
    inputRef.current?.focus();
  };

  if (!isOpen) {
    return null;
  }

  const renderProcedureList = () => (
    <>
      <div className="p-4 sticky top-[69px] bg-slate-800 z-10 border-b border-slate-700 shadow-sm">
        <div 
          className="bg-slate-900 border border-slate-700 rounded-lg p-2 flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="text-slate-500 flex-shrink-0 ml-1" aria-hidden="true">
            <SearchIcon />
          </div>
          
          {searchTokens.map((token, idx) => (
            <div key={`${token}-${idx}`} className="bg-cyan-900/40 border border-cyan-700/50 text-cyan-200 text-sm rounded-full px-3 py-1 flex items-center gap-2 animate-fade-in-fast">
              <span>{token}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); removeToken(idx); }}
                className="text-cyan-400 hover:text-white focus:outline-none rounded-full p-0.5 hover:bg-cyan-800/50 transition-colors"
                aria-label={`Remove filter ${token}`}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          ))}

          <input
            ref={inputRef}
            type="text"
            className="bg-transparent border-none outline-none text-white placeholder-slate-500 flex-grow min-w-[120px] py-1"
            placeholder={searchTokens.length === 0 ? "Search procedures (e.g. 'cardio cpr')..." : ""}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="Search for a procedure"
          />

          {(searchTokens.length > 0 || inputValue.length > 0) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllTokens();
              }}
              className="text-slate-500 hover:text-white focus:outline-none hover:bg-slate-700/50 rounded-full p-1 transition-colors ml-1"
              aria-label="Clear all filters"
              title="Clear all filters"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-3">
             <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Refine by:</p>
             <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => addToken(s)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-cyan-900/40 hover:text-cyan-400 hover:border-cyan-500/50 transition-all duration-200 flex items-center gap-1 group"
                >
                  <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">+</span>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-grow overflow-y-auto px-4 pb-4">
        {sortedCategoryIds.length > 0 ? (
          sortedCategoryIds.map((categoryId) => {
            const subcategories = groupedProcedures[categoryId];
            const categoryName = getCategoryName(categoryId);
            const sortedSubcategoryIds = getSortedSubcategoryIds(subcategories);
            
            return (
              <div key={categoryId} className="mb-4">
                <h3 className="text-lg font-semibold text-slate-400 mb-2 sticky top-0 bg-slate-800 py-3 z-0">{categoryName}</h3>
                {sortedSubcategoryIds.map((subcategoryId) => {
                  const procs = subcategories[subcategoryId];
                  const subcategoryName = getSubcategoryName(subcategoryId);
                  
                  return (
                    <div key={subcategoryId} className="mb-3 pl-2">
                      <h4 className="font-semibold text-cyan-400 mb-2">{subcategoryName}</h4>
                      <ul className="space-y-1 pl-2 border-l border-slate-700">
                        {[...procs]
                          .sort((a, b) => a.description.localeCompare(b.description))
                          .map((proc, index) => (
                            <li key={`${proc.controlName}-${index}`}>
                              <button
                                onClick={() => handleProcedureClick(proc)}
                                className="w-full text-left p-2 rounded-md hover:bg-cyan-500/10 transition-colors duration-200"
                              >
                                <span className="text-slate-300">{proc.description}</span>
                                {proc.fields.length === 0 && (
                                  <span className="ml-2 text-xs text-slate-500">(quick add)</span>
                                )}
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-slate-500" role="status">
            <p className="font-semibold">No procedures found</p>
            <p className="text-sm">Try adjusting your search filters.</p>
          </div>
        )}
      </div>
    </>
  );

  const renderFieldForm = () => {
    if (!activeProcedure) return null;

    // If there's only a single list field, show quick-select options
    const isSingleListField = activeProcedure.fields.length === 1 && activeProcedure.fields[0].type === 'list';

    if (isSingleListField) {
      const field = activeProcedure.fields[0];
      return (
        <div className="flex-grow overflow-y-auto px-4 pb-4 pt-2">
          <ul className="space-y-1">
            {field.listItems?.map((option, index) => (
              <li key={index}>
                <button
                  onClick={() => handleQuickOptionSelect(option)}
                  className="w-full text-left p-3 rounded-md hover:bg-cyan-500/10 transition-colors duration-200 text-slate-300"
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Multiple fields or non-list fields - show full form
    return (
      <div className="p-6 space-y-6 flex-grow overflow-y-auto">
        {activeProcedure.fields.map(field => renderFieldInput(field))}
        <div className="pt-4">
          <button
            onClick={handleFieldSave}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-cyan-500/30 transition-all duration-300"
          >
            Add Procedure
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in-fast"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className="bg-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-full max-h-[90vh] border border-slate-700 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-20 flex-shrink-0 gap-4">
          <div className="flex items-center min-w-0 flex-grow">
            {activeProcedure ? (
                <div className="flex items-center min-w-0">
                  <button onClick={() => setActiveProcedure(null)} className="mr-3 text-slate-400 hover:text-white transition-colors flex-shrink-0" aria-label="Go back to procedures list">
                    <BackIcon />
                  </button>
                  <div className="flex flex-col min-w-0">
                    <h2 id="dialog-title" className="text-lg font-bold text-cyan-400 truncate" title={activeProcedure.description}>
                      {activeProcedure.description}
                    </h2>
                    <span className="text-sm text-slate-400">
                      {activeProcedure.fields.length === 1 && activeProcedure.fields[0].type === 'list' 
                        ? 'Select an Option' 
                        : 'Enter Details'}
                    </span>
                  </div>
                </div>
              ) : (
                <h2 id="dialog-title" className="text-xl font-bold text-cyan-400 truncate">Select a Procedure</h2>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white cursor-pointer select-none group" title="Keep search filters when closing dialog">
              <input 
                type="checkbox" 
                checked={preserveFilters} 
                onChange={(e) => setPreserveFilters(e.target.checked)}
                className="appearance-none h-4 w-4 bg-slate-700 border border-slate-600 rounded checked:bg-cyan-500 checked:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[5px] after:top-[1px] after:w-[5px] after:h-[9px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
              />
              <span className="group-hover:text-cyan-300 transition-colors whitespace-nowrap hidden sm:inline">Preserve filters</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white cursor-pointer select-none group" title="Keep dialog open after selection to add multiple items">
              <input 
                type="checkbox" 
                checked={keepOpen} 
                onChange={(e) => setKeepOpen(e.target.checked)}
                className="appearance-none h-4 w-4 bg-slate-700 border border-slate-600 rounded checked:bg-cyan-500 checked:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[5px] after:top-[1px] after:w-[5px] after:h-[9px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
              />
              <span className="group-hover:text-cyan-300 transition-colors whitespace-nowrap hidden sm:inline">Keep open</span>
            </label>

            <div className="h-5 w-px bg-slate-700"></div>

            <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close dialog">
              <CloseIcon />
            </button>
          </div>
        </header>

        {activeProcedure ? renderFieldForm() : renderProcedureList()}
      </div>
       <style>{`
        @keyframes fade-in-fast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-fast {
          animation: fade-in-fast 0.2s ease-out forwards;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
           animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
