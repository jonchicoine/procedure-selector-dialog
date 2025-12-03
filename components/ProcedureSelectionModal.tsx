import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PROCEDURES } from '../constants';
import { Procedure } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { CloseIcon } from './icons/CloseIcon';
import { BackIcon } from './icons/BackIcon';

interface ProcedureSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (procedure: Procedure, option?: string, duration?: number, keepOpen?: boolean) => void;
}

type GroupedProcedures = Record<string, Record<string, Procedure[]>>;

const SEDATION_CONTROL_NAME = 'Procedures02_ProceduralSedation_cbo';

export const ProcedureSelectionModal: React.FC<ProcedureSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeProcedure, setActiveProcedure] = useState<Procedure | null>(null);
  const [keepOpen, setKeepOpen] = useState(false);
  const [preserveFilters, setPreserveFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // State for the special sedation form
  const [sedationOption, setSedationOption] = useState<string>('');
  const [sedationDuration, setSedationDuration] = useState('');


  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        // Only clear filters if preserveFilters is false
        if (!preserveFilters) {
          setSearchTokens([]);
          setInputValue('');
        }
        setActiveProcedure(null);
        // We do NOT reset keepOpen or preserveFilters preference here
      }, 300); // Delay reset to allow closing animation to finish
      return () => clearTimeout(timer);
    }
  }, [isOpen, preserveFilters]);

  // Reset sedation form state when active procedure changes
  useEffect(() => {
    if (activeProcedure && activeProcedure.controlName === SEDATION_CONTROL_NAME) {
      setSedationOption(activeProcedure.options[0] || '');
      setSedationDuration('');
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

  const handleProcedureClick = (procedure: Procedure) => {
    if (procedure.options && procedure.options.length > 0) {
      setActiveProcedure(procedure);
    } else {
      onSelect(procedure, undefined, undefined, keepOpen);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (activeProcedure) {
      onSelect(activeProcedure, option, undefined, keepOpen);
    }
  };

  const handleSedationSave = () => {
    if (activeProcedure) {
      const duration = sedationDuration ? parseInt(sedationDuration, 10) : undefined;
      onSelect(activeProcedure, sedationOption, duration, keepOpen);
    }
  };

  const clearAllTokens = () => {
    setSearchTokens([]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const filteredProcedures = useMemo(() => {
    // Combine existing tokens with current input (if it has valid chars)
    const currentInputTokens = inputValue.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
    const allTokens = [...searchTokens, ...currentInputTokens];

    if (allTokens.length === 0) {
      return PROCEDURES;
    }

    return PROCEDURES.filter((proc) => {
      // Combine fields into a single search space
      const searchSpace = `${proc.category} ${proc.subcategory} ${proc.description}`.toLowerCase();
      
      // Check if every token is present in the search space (AND logic)
      return allTokens.every(token => searchSpace.includes(token));
    });
  }, [searchTokens, inputValue]);

  const groupedProcedures = useMemo(() => {
    return filteredProcedures.reduce((acc, procedure) => {
      const { category, subcategory } = procedure;
      if (!acc[category]) {
        acc[category] = {};
      }
      const finalSubcategory = subcategory || 'General';
      if (!acc[category][finalSubcategory]) {
        acc[category][finalSubcategory] = [];
      }
      acc[category][finalSubcategory].push(procedure);
      return acc;
    }, {} as GroupedProcedures);
  }, [filteredProcedures]);

  const suggestions = useMemo(() => {
    const currentCats = new Set<string>();
    const currentSubcats = new Set<string>();

    filteredProcedures.forEach(p => {
      if (p.category) currentCats.add(p.category);
      if (p.subcategory) currentSubcats.add(p.subcategory);
    });

    const isUnfiltered = searchTokens.length === 0 && !inputValue.trim();
    const existingTokens = new Set(searchTokens.map(t => t.toLowerCase()));
    
    let candidates: string[] = [];

    if (isUnfiltered) {
      // In the initial state, only show categories to avoid overwhelming the user
      candidates = Array.from(currentCats).sort();
    } else {
      const catsArray = Array.from(currentCats).sort();
      // If we are already filtered down to a single category, showing it again is redundant
      // unless we want to show it as a "confirm" action. But generally, subcategories are more useful here.
      // We'll show categories if there are multiple possibilities.
      const usefulCats = catsArray.length > 1 ? catsArray : []; 
      const subcatsArray = Array.from(currentSubcats).sort();
      
      candidates = [...usefulCats, ...subcatsArray];
    }

    // Remove duplicates and already selected tokens
    return Array.from(new Set(candidates))
      .filter(s => !existingTokens.has(s.toLowerCase()))
      .slice(0, 30); // Limit to 30 to prevent UI clutter
  }, [filteredProcedures, searchTokens, inputValue]);

  const addToken = (token: string) => {
    setSearchTokens(prev => {
      const newTokens = [...prev];
      
      // Convert any pending input text into tokens to preserve them
      // We split by whitespace to mimic the 'live' search behavior where multiple words are treated as separate AND tokens
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
        // Prevent adding just a space to empty input if intended as token delimiter
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
        {Object.keys(groupedProcedures).length > 0 ? (
          Object.entries(groupedProcedures)
            .sort(([catA], [catB]) => catA.localeCompare(catB))
            .map(([category, subcategories]) => (
            <div key={category} className="mb-4">
              <h3 className="text-lg font-semibold text-slate-400 mb-2 sticky top-0 bg-slate-800 py-3 z-0">{category}</h3>
              {Object.entries(subcategories)
                .sort(([subA], [subB]) => subA.localeCompare(subB))
                .map(([subcategory, procedures]) => (
                <div key={subcategory} className="mb-3 pl-2">
                   <h4 className="font-semibold text-cyan-400 mb-2">{subcategory}</h4>
                   <ul className="space-y-1 pl-2 border-l border-slate-700">
                    {[...procedures]
                        .sort((a, b) => a.description.localeCompare(b.description))
                        .map((proc, index) => (
                      <li key={`${proc.controlName}-${index}`}>
                        <button
                          onClick={() => handleProcedureClick(proc)}
                          className="w-full text-left p-2 rounded-md hover:bg-cyan-500/10 transition-colors duration-200"
                        >
                          <span className="text-slate-300">{proc.description}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-500" role="status">
            <p className="font-semibold">No procedures found</p>
            <p className="text-sm">Try adjusting your search filters.</p>
          </div>
        )}
      </div>
    </>
  );

  const renderOptionList = () => {
    if (activeProcedure?.controlName === SEDATION_CONTROL_NAME) {
      return (
        <div className="p-6 space-y-6 flex-grow">
          <div>
            <label htmlFor="sedation-option-select" className="block text-sm font-medium text-slate-400 mb-2">Option</label>
            <select
              id="sedation-option-select"
              value={sedationOption}
              onChange={(e) => setSedationOption(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              {activeProcedure.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sedation-duration" className="block text-sm font-medium text-slate-400 mb-2">Duration (in minutes)</label>
            <input
              id="sedation-duration"
              type="number"
              value={sedationDuration}
              onChange={(e) => setSedationDuration(e.target.value)}
              placeholder="e.g., 30"
              className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
           <div className="pt-4">
             <button
                onClick={handleSedationSave}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-cyan-500/30 transition-all duration-300"
            >
                Add Procedure
            </button>
           </div>
        </div>
      );
    }

    return (
      <div className="flex-grow overflow-y-auto px-4 pb-4 pt-2">
        <ul className="space-y-1">
          {activeProcedure?.options.map((option, index) => (
            <li key={index}>
              <button
                onClick={() => handleOptionSelect(option)}
                className="w-full text-left p-3 rounded-md hover:bg-cyan-500/10 transition-colors duration-200 text-slate-300"
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
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
                    <span className="text-sm text-slate-400">Select an Option</span>
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

        {activeProcedure ? renderOptionList() : renderProcedureList()}
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