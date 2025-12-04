import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProcedureDefinition, ProcedureFieldDefinition, SelectedProcedure } from '../types';
import { useProcedureConfig } from '../context/ProcedureConfigContext';
import { SearchIcon } from './icons/SearchIcon';
import { CloseIcon } from './icons/CloseIcon';
import { BackIcon } from './icons/BackIcon';
import { ChevronIcon } from './icons/ChevronIcon';
import { StarIcon } from './icons/StarIcon';
import { ClockIcon } from './icons/ClockIcon';
import { TrendingIcon } from './icons/TrendingIcon';

interface ProcedureSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (procedure: SelectedProcedure, keepOpen?: boolean) => void;
  currentDate: string;
  currentPhysician: string;
}

// Grouped by categoryId, then subcategoryId
type GroupedProcedures = Record<string, Record<string, ProcedureDefinition[]>>;

// Token types for search filters
type TokenType = 'category' | 'subcategory' | 'tag' | 'text';

interface SearchToken {
  value: string;
  type: TokenType;
}

export const ProcedureSelectionModal: React.FC<ProcedureSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  currentDate,
  currentPhysician,
}) => {
  const { 
    procedures, 
    categories,
    subcategories,
    getCategoryName, 
    getSubcategoryName,
    getCategoryById,
    getSubcategoryById,
    getSortedCategories,
    getSubcategoriesForCategory,
    // Procedure Favorites
    isFavorite,
    toggleFavorite,
    getFavoriteProcedures,
    // Category Favorites
    isCategoryFavorite,
    toggleCategoryFavorite,
    getFavoriteCategories,
    // Subcategory Favorites
    isSubcategoryFavorite,
    toggleSubcategoryFavorite,
    getFavoriteSubcategories,
    // Recents
    addToRecents,
    getRecentProcedures,
    // Usage tracking
    incrementUsage,
    getMostUsedProcedures,
  } = useProcedureConfig();
  
  const [searchTokens, setSearchTokens] = useState<SearchToken[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeProcedure, setActiveProcedure] = useState<ProcedureDefinition | null>(null);
  const [keepOpen, setKeepOpen] = useState(false);
  const [preserveFilters, setPreserveFilters] = useState(false);
  const [filterOnExpand, setFilterOnExpand] = useState(true);
  const [catOnly, setCatOnly] = useState(false);
  const [flatView, setFlatView] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // State for field values when a procedure with fields is selected
  const [fieldValues, setFieldValues] = useState<Record<string, string | number>>({});
  
  // State for tracking expanded subcategories (key format: "categoryId:subcategoryId")
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  
  // State for tracking expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // State for filter section visibility
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);
  const [showBodyPartFilters, setShowBodyPartFilters] = useState(false);
  const [showFavorites, setShowFavorites] = useState(true);
  const [showFavoriteCategories, setShowFavoriteCategories] = useState(true);
  const [showRecent, setShowRecent] = useState(true);
  const [showMostUsed, setShowMostUsed] = useState(true);


  // Collect all unique tags from procedures
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    procedures.forEach(proc => {
      proc.tags?.forEach(tag => tagSet.add(tag.toLowerCase()));
    });
    return Array.from(tagSet).sort();
  }, [procedures]);

  // Helper to determine token type from a value
  const getTokenType = (value: string): TokenType => {
    const lowerValue = value.toLowerCase();
    // Check if it matches a category name
    if (categories.some(c => c.name.toLowerCase() === lowerValue)) {
      return 'category';
    }
    // Check if it matches a subcategory name
    if (subcategories.some(s => s.name.toLowerCase() === lowerValue)) {
      return 'subcategory';
    }
    // Check if it matches a tag
    if (allTags.includes(lowerValue)) {
      return 'tag';
    }
    return 'text';
  };

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        if (!preserveFilters) {
          setSearchTokens([]);
          setInputValue('');
          setExpandedSubcategories(new Set());
          setExpandedCategories(new Set());
        }
        setActiveProcedure(null);
        setFieldValues({});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, preserveFilters]);

  // Clear expanded subcategories when search tokens change (except when we just added a token from expanding)
  const lastExpandedTokenRef = useRef<string | null>(null);
  useEffect(() => {
    // If the last token added matches what we just expanded, don't clear
    const lastToken = searchTokens[searchTokens.length - 1];
    if (lastToken && lastToken.value === lastExpandedTokenRef.current) {
      lastExpandedTokenRef.current = null;
      return;
    }
    // Otherwise, clear all expanded states when tokens change
    setExpandedSubcategories(new Set());
    setExpandedCategories(new Set());
  }, [searchTokens]);

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
      addToRecents(procedure.controlName);
      incrementUsage(procedure.controlName);
      const selected = createSelectedProcedure(procedure, {});
      onSelect(selected, keepOpen);
    }
  };

  const handleFieldSave = () => {
    if (activeProcedure) {
      addToRecents(activeProcedure.controlName);
      incrementUsage(activeProcedure.controlName);
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
      addToRecents(activeProcedure.controlName);
      incrementUsage(activeProcedure.controlName);
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
    
    // Separate tag tokens from other tokens
    const tagTokens = searchTokens.filter(t => t.type === 'tag').map(t => t.value.toLowerCase());
    const otherTokens = searchTokens.filter(t => t.type !== 'tag').map(t => t.value.toLowerCase());
    const allTextTokens = [...otherTokens, ...currentInputTokens];

    if (tagTokens.length === 0 && allTextTokens.length === 0) {
      return procedures;
    }

    return procedures.filter((proc) => {
      // For tag tokens, require exact match in the procedure's tags array
      const procTags = proc.tags?.map(t => t.toLowerCase()) || [];
      const matchesAllTags = tagTokens.every(tagToken => procTags.includes(tagToken));
      
      if (!matchesAllTags) {
        return false;
      }
      
      // For text tokens, search the full search space
      if (allTextTokens.length === 0) {
        return true;
      }
      
      const categoryName = getCategoryName(proc.categoryId);
      const subcategoryName = getSubcategoryName(proc.subcategoryId);
      const aliasesStr = proc.aliases?.join(' ') || '';
      const tagsStr = proc.tags?.join(' ') || '';
      
      // Build search space - exclude tags for very short tokens to avoid false positives
      const baseSearchSpace = `${categoryName} ${subcategoryName} ${proc.description} ${aliasesStr}`.toLowerCase();
      const fullSearchSpace = `${baseSearchSpace} ${tagsStr}`.toLowerCase();
      
      return allTextTokens.every(token => {
        // For short tokens (< 3 chars), don't search in tags to avoid partial matches like "id" in "fluid"
        const searchSpace = token.length < 3 ? baseSearchSpace : fullSearchSpace;
        return searchSpace.includes(token);
      });
    });
  }, [procedures, searchTokens, inputValue, getCategoryName, getSubcategoryName]);

  // Helper to determine why a procedure matched - tracks all match sources
  interface MatchReasons {
    category: boolean;
    subcategory: boolean;
    description: string[];  // matched tokens in description
    aliases: string[];      // matched alias values
    tags: string[];         // matched tag values
  }
  
  const getMatchReasons = (proc: ProcedureDefinition): MatchReasons => {
    const currentInputTokens = inputValue.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
    const otherTokens = searchTokens.filter(t => t.type !== 'tag').map(t => t.value.toLowerCase());
    const allTextTokens = [...otherTokens, ...currentInputTokens];
    
    const reasons: MatchReasons = {
      category: false,
      subcategory: false,
      description: [],
      aliases: [],
      tags: [],
    };
    
    if (allTextTokens.length === 0) {
      return reasons;
    }
    
    const categoryName = getCategoryName(proc.categoryId).toLowerCase();
    const subcategoryName = getSubcategoryName(proc.subcategoryId).toLowerCase();
    const description = proc.description.toLowerCase();
    
    allTextTokens.forEach(token => {
      // Check category match
      if (categoryName.includes(token)) {
        reasons.category = true;
      }
      
      // Check subcategory match
      if (subcategoryName.includes(token)) {
        reasons.subcategory = true;
      }
      
      // Check description match
      if (description.includes(token) && !reasons.description.includes(token)) {
        reasons.description.push(token);
      }
      
      // Check alias matches
      if (proc.aliases && proc.aliases.length > 0) {
        proc.aliases.forEach(alias => {
          if (alias.toLowerCase().includes(token) && !reasons.aliases.includes(alias)) {
            reasons.aliases.push(alias);
          }
        });
      }
      
      // Check tag matches (only for tokens >= 3 chars)
      if (token.length >= 3 && proc.tags && proc.tags.length > 0) {
        proc.tags.forEach(tag => {
          if (tag.toLowerCase().includes(token) && !reasons.tags.includes(tag)) {
            reasons.tags.push(tag);
          }
        });
      }
    });
    
    return reasons;
  };
  
  // Build tooltip text from match reasons
  const buildMatchTooltip = (proc: ProcedureDefinition, reasons: MatchReasons): string | null => {
    const parts: string[] = [];
    
    if (reasons.category) {
      parts.push(`Category: ${getCategoryName(proc.categoryId)}`);
    }
    if (reasons.subcategory) {
      parts.push(`Subcategory: ${getSubcategoryName(proc.subcategoryId)}`);
    }
    if (reasons.description.length > 0) {
      parts.push(`Description: "${reasons.description.join('", "')}"`);
    }
    if (reasons.aliases.length > 0) {
      parts.push(`Alias: ${reasons.aliases.join(', ')}`);
    }
    if (reasons.tags.length > 0) {
      parts.push(`Body part: ${reasons.tags.join(', ')}`);
    }
    
    return parts.length > 0 ? `Matched on:\n${parts.join('\n')}` : null;
  };
  
  // Check if there are any active search terms
  const hasActiveSearch = searchTokens.length > 0 || inputValue.trim().length > 0;

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

  // Collect tags from currently filtered procedures for the body part filter
  const relevantTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    filteredProcedures.forEach(proc => {
      proc.tags?.forEach(tag => {
        const lowerTag = tag.toLowerCase();
        tagCount.set(lowerTag, (tagCount.get(lowerTag) || 0) + 1);
      });
    });
    
    // Filter out tags that are already in search tokens
    const existingTokens = new Set(searchTokens.map(t => t.value.toLowerCase()));
    
    // Sort by count (most common first), then alphabetically
    return Array.from(tagCount.entries())
      .filter(([tag]) => !existingTokens.has(tag))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 15) // Limit to top 15 tags
      .map(([tag, count]) => ({ tag, count }));
  }, [filteredProcedures, searchTokens]);

  const suggestions = useMemo(() => {
    // Collect category and subcategory IDs from filtered procedures
    const currentCatIds = new Set<string>();
    const currentSubcatIds = new Set<string>();

    filteredProcedures.forEach(p => {
      if (p.categoryId) currentCatIds.add(p.categoryId);
      if (p.subcategoryId) currentSubcatIds.add(p.subcategoryId);
    });

    const isUnfiltered = searchTokens.length === 0 && !inputValue.trim();
    const existingTokens = new Set(searchTokens.map(t => t.value.toLowerCase()));
    const currentInput = inputValue.toLowerCase().trim();
    
    let candidates: string[] = [];

    if (isUnfiltered) {
      // Show categories sorted by sortOrder when unfiltered
      candidates = getSortedCategories().map(c => c.name);
    } else {
      // Sort subcategories by sortOrder (show these first as they're more specific)
      const sortedSubcatIds = Array.from(currentSubcatIds).sort((a, b) => {
        const subA = getSubcategoryById(a);
        const subB = getSubcategoryById(b);
        return (subA?.sortOrder ?? 999999) - (subB?.sortOrder ?? 999999);
      });
      const subcatsArray = sortedSubcatIds.map(id => getSubcategoryName(id));
      
      // Sort categories by sortOrder (show at end if multiple categories match)
      const sortedCatIds = Array.from(currentCatIds).sort((a, b) => {
        const catA = getCategoryById(a);
        const catB = getCategoryById(b);
        return (catA?.sortOrder ?? 999999) - (catB?.sortOrder ?? 999999);
      });
      const catsArray = sortedCatIds.map(id => getCategoryName(id));
      
      // Determine which suggestions to show based on catOnly toggle
      let usefulCats: string[] = [];
      let usefulSubcats: string[] = [];
      
      if (catOnly) {
        // When catOnly is ON:
        // - Show categories if there are multiple (to help narrow down)
        // - Only show subcategories when narrowed to 1 category
        if (currentCatIds.size > 1) {
          usefulCats = catsArray;
          usefulSubcats = []; // Hide subcategories until narrowed to 1 category
        } else {
          usefulCats = []; // No need to show the single category
          usefulSubcats = subcatsArray; // Show subcategories for the single category
        }
      } else {
        // When OFF: show both categories and subcategories
        usefulCats = catsArray.length > 1 ? catsArray : [];
        usefulSubcats = subcatsArray;
      }
      
      // Categories first (for narrowing down), then subcategories (more specific)
      candidates = [...usefulCats, ...usefulSubcats];
    }

    // Remove duplicates and already selected tokens
    let filtered = Array.from(new Set(candidates))
      .filter(s => !existingTokens.has(s.toLowerCase()));
    
    // Prioritize suggestions that contain the current input value (but preserve sortOrder otherwise)
    if (currentInput) {
      filtered.sort((a, b) => {
        const aContains = a.toLowerCase().includes(currentInput);
        const bContains = b.toLowerCase().includes(currentInput);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        return 0; // Preserve existing order when both contain or both don't contain
      });
    }
    
    return filtered.slice(0, 30); // Limit to 30 to prevent UI clutter
  }, [filteredProcedures, searchTokens, inputValue, getCategoryName, getSubcategoryName, getSortedCategories, getCategoryById, getSubcategoryById, catOnly]);

  const addToken = (token: string, type?: TokenType) => {
    const tokenType = type ?? getTokenType(token);
    setSearchTokens(prev => {
      const newTokens = [...prev];
      const currentInputTokens = inputValue.trim().split(/\s+/).filter(t => t.length > 0);
      
      currentInputTokens.forEach(t => {
        const lowerT = t.toLowerCase();
        if (!newTokens.some(tok => tok.value === lowerT)) {
          newTokens.push({ value: lowerT, type: getTokenType(t) });
        }
      });

      const tokenLower = token.toLowerCase();
      if (!newTokens.some(tok => tok.value === tokenLower)) {
        newTokens.push({ value: tokenLower, type: tokenType });
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
        const tokenType = getTokenType(val);
        setSearchTokens(prev => [...prev, { value: val.toLowerCase(), type: tokenType }]);
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
      <div className="py-2 px-3 sticky top-[53px] bg-slate-800 z-10 border-b border-slate-700 shadow-sm">
        <div 
          className="bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="text-slate-500 flex-shrink-0 ml-1" aria-hidden="true">
            <SearchIcon />
          </div>
          
          {searchTokens.map((token, idx) => {
            const typeStyles: Record<TokenType, string> = {
              category: 'bg-purple-900/40 border-purple-700/50 text-purple-200',
              subcategory: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-200',
              tag: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200',
              text: 'bg-slate-700/60 border-slate-600/50 text-slate-200',
            };
            const typeLabel: Record<TokenType, string> = {
              category: 'CAT',
              subcategory: 'SUB',
              tag: 'BODY',
              text: '',
            };
            const typeLabelStyles: Record<TokenType, string> = {
              category: 'bg-purple-700/50 text-purple-200',
              subcategory: 'bg-cyan-700/50 text-cyan-200',
              tag: 'bg-emerald-700/50 text-emerald-200',
              text: '',
            };
            return (
              <div key={`${token.value}-${idx}`} className={`${typeStyles[token.type]} border text-xs rounded-full px-2 py-0.5 flex items-center gap-1 animate-fade-in-fast`}>
                {typeLabel[token.type] && (
                  <span className={`${typeLabelStyles[token.type]} text-[10px] font-bold px-1.5 py-0.5 rounded-full`}>
                    {typeLabel[token.type]}
                  </span>
                )}
                <span>{token.value}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeToken(idx); }}
                  className="text-current opacity-60 hover:opacity-100 focus:outline-none rounded-full p-0.5 hover:bg-white/10 transition-colors"
                  aria-label={`Remove filter ${token.value}`}
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </div>
            );
          })}

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
          <div className="mt-1.5">
            <button
              onClick={() => setShowCategoryFilters(!showCategoryFilters)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 uppercase tracking-wider font-semibold transition-colors"
            >
              <ChevronIcon 
                className="w-3 h-3"
                direction={showCategoryFilters ? 'down' : 'right'}
              />
              Refine by Category
              <span className="text-slate-500 normal-case font-normal">({suggestions.length})</span>
            </button>
            {showCategoryFilters && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {suggestions.map(s => {
                  const suggestionType = getTokenType(s);
                  const isCategory = suggestionType === 'category';
                  const isSubcategory = suggestionType === 'subcategory';
                  const badgeStyles = isCategory 
                    ? 'bg-purple-700/50 text-purple-200' 
                    : isSubcategory 
                      ? 'bg-cyan-700/50 text-cyan-200' 
                      : '';
                  const buttonStyles = isCategory
                    ? 'bg-purple-900/30 border-purple-700/50 hover:bg-purple-900/50 hover:border-purple-500/50'
                    : isSubcategory
                      ? 'bg-cyan-900/30 border-cyan-700/50 hover:bg-cyan-900/50 hover:border-cyan-500/50'
                      : 'bg-slate-700/50 border-slate-600/50 hover:bg-cyan-900/40 hover:border-cyan-500/50';
                  const textStyles = isCategory
                    ? 'text-purple-200 hover:text-purple-100'
                    : isSubcategory
                      ? 'text-cyan-200 hover:text-cyan-100'
                      : 'text-slate-300 hover:text-cyan-400';
                  
                  return (
                    <button
                      key={s}
                      onClick={() => addToken(s, suggestionType)}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${buttonStyles} ${textStyles} transition-all duration-200 flex items-center gap-1`}
                    >
                      {(isCategory || isSubcategory) && (
                        <span className={`${badgeStyles} text-[10px] font-bold px-1.5 py-0.5 rounded-full`}>
                          {isCategory ? 'CAT' : 'SUB'}
                        </span>
                      )}
                      {!isCategory && !isSubcategory && (
                        <span className="text-slate-500">+</span>
                      )}
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Body Part / Anatomical Tags Filter */}
        {relevantTags.length > 0 && (
          <div className="mt-1.5">
            <button
              onClick={() => setShowBodyPartFilters(!showBodyPartFilters)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 uppercase tracking-wider font-semibold transition-colors"
            >
              <ChevronIcon 
                className="w-3 h-3"
                direction={showBodyPartFilters ? 'down' : 'right'}
              />
              Filter by Body Part
              <span className="text-slate-500 normal-case font-normal">({relevantTags.length})</span>
            </button>
            {showBodyPartFilters && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {relevantTags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => addToken(tag, 'tag')}
                    className="text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-900/30 border-emerald-700/50 hover:bg-emerald-900/50 hover:border-emerald-500/50 text-emerald-200 hover:text-emerald-100 transition-all duration-200 flex items-center gap-1"
                  >
                    <span className="bg-emerald-700/50 text-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      BODY
                    </span>
                    {tag}
                    <span className="text-emerald-400/60 text-[10px]">({count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex-grow overflow-y-auto px-3 pb-2">
        {/* Favorite Procedures Section */}
        {searchTokens.length === 0 && !inputValue.trim() && getFavoriteProcedures().length > 0 && (
          <div className="mb-2">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="w-full text-left font-semibold text-amber-400 flex items-center gap-2 sticky top-0 bg-slate-800 py-1 z-0 hover:text-amber-300 transition-colors"
            >
              <ChevronIcon 
                className="w-4 h-4"
                direction={showFavorites ? 'down' : 'right'}
              />
              <StarIcon className="w-5 h-5" filled />
              Favorite Procedures
              <span className="text-sm font-normal text-amber-600">({getFavoriteProcedures().length})</span>
            </button>
            {showFavorites && (
              <ul className="space-y-0 pl-2 border-l border-amber-700/50 mt-1">
                {getFavoriteProcedures().map((proc, index) => (
                  <li key={`fav-${proc.controlName}-${index}`} className="flex items-center group">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(proc.controlName); }}
                      className="p-1 mr-1 text-amber-400 hover:text-amber-300 opacity-60 hover:opacity-100 transition-all"
                      aria-label="Remove from favorites"
                    >
                      <StarIcon className="h-4 w-4" filled />
                    </button>
                    <button
                      onClick={() => handleProcedureClick(proc)}
                      className="flex-grow text-left py-1 px-1.5 rounded hover:bg-amber-500/10 transition-colors duration-200"
                    >
                      <span className="text-slate-300">{proc.description}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {getCategoryName(proc.categoryId)} › {getSubcategoryName(proc.subcategoryId)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Favorite Categories & Subcategories Section (Combined) */}
        {searchTokens.length === 0 && !inputValue.trim() && (getFavoriteCategories().length > 0 || getFavoriteSubcategories().length > 0) && (
          <div className="mb-2">
            <button
              onClick={() => setShowFavoriteCategories(!showFavoriteCategories)}
              className="w-full text-left font-semibold text-purple-400 flex items-center gap-2 sticky top-0 bg-slate-800 py-1 z-0 hover:text-purple-300 transition-colors"
            >
              <ChevronIcon 
                className="w-4 h-4"
                direction={showFavoriteCategories ? 'down' : 'right'}
              />
              <StarIcon className="w-5 h-5" filled />
              Favorite Categories
              <span className="text-sm font-normal text-purple-600">({getFavoriteCategories().length + getFavoriteSubcategories().length})</span>
            </button>
            {showFavoriteCategories && (
              <ul className="space-y-0 pl-2 border-l border-purple-700/50 mt-1">
                {getFavoriteCategories().map((cat) => (
                  <li key={`fav-cat-${cat.id}`} className="flex items-center group">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCategoryFavorite(cat.id); }}
                      className="p-1 mr-1 text-amber-400 hover:text-amber-300 opacity-60 hover:opacity-100 transition-all"
                      aria-label="Remove category from favorites"
                    >
                      <StarIcon className="h-4 w-4" filled />
                    </button>
                    <button
                      onClick={() => addToken(cat.name, 'category')}
                      className="flex-grow text-left py-1 px-1.5 rounded hover:bg-purple-500/10 transition-colors duration-200 flex items-center gap-2"
                    >
                      <span className="bg-purple-700/50 text-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">CAT</span>
                      <span className="text-slate-300">{cat.name}</span>
                      <span className="text-xs text-slate-500">
                        ({procedures.filter(p => p.categoryId === cat.id).length} procedures)
                      </span>
                    </button>
                  </li>
                ))}
                {getFavoriteSubcategories().map((subcat) => (
                  <li key={`fav-subcat-${subcat.id}`} className="flex items-center group">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSubcategoryFavorite(subcat.id); }}
                      className="p-1 mr-1 text-amber-400 hover:text-amber-300 opacity-60 hover:opacity-100 transition-all"
                      aria-label="Remove subcategory from favorites"
                    >
                      <StarIcon className="h-4 w-4" filled />
                    </button>
                    <button
                      onClick={() => addToken(subcat.name, 'subcategory')}
                      className="flex-grow text-left py-1 px-1.5 rounded hover:bg-cyan-500/10 transition-colors duration-200 flex items-center gap-2"
                    >
                      <span className="bg-cyan-700/50 text-cyan-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">SUB</span>
                      <span className="text-slate-300">{subcat.name}</span>
                      <span className="text-xs text-slate-500">
                        ({procedures.filter(p => p.subcategoryId === subcat.id).length} procedures)
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Recent Procedures Section */}
        {searchTokens.length === 0 && !inputValue.trim() && getRecentProcedures().length > 0 && (
          <div className="mb-2">
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="w-full text-left font-semibold text-slate-400 flex items-center gap-2 sticky top-0 bg-slate-800 py-1 z-0 hover:text-slate-300 transition-colors"
            >
              <ChevronIcon 
                className="w-4 h-4"
                direction={showRecent ? 'down' : 'right'}
              />
              <ClockIcon className="w-5 h-5" />
              Recent
              <span className="text-sm font-normal text-slate-500">({getRecentProcedures().length})</span>
            </button>
            {showRecent && (
              <ul className="space-y-0 pl-2 border-l border-slate-700 mt-1">
                {getRecentProcedures().map((proc, index) => (
                  <li key={`recent-${proc.controlName}-${index}`} className="flex items-center group">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(proc.controlName); }}
                      className={`p-1 mr-1 transition-all ${
                        isFavorite(proc.controlName) 
                          ? 'text-amber-400 hover:text-amber-300' 
                          : 'text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                      }`}
                      aria-label={isFavorite(proc.controlName) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <StarIcon className="h-4 w-4" filled={isFavorite(proc.controlName)} />
                    </button>
                    <button
                      onClick={() => handleProcedureClick(proc)}
                      className="flex-grow text-left py-1 px-1.5 rounded hover:bg-cyan-500/10 transition-colors duration-200"
                    >
                      <span className="text-slate-300">{proc.description}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {getCategoryName(proc.categoryId)} › {getSubcategoryName(proc.subcategoryId)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Most Used Procedures Section */}
        {searchTokens.length === 0 && !inputValue.trim() && getMostUsedProcedures().length > 0 && (
          <div className="mb-2">
            <button
              onClick={() => setShowMostUsed(!showMostUsed)}
              className="w-full text-left font-semibold text-blue-400 flex items-center gap-2 sticky top-0 bg-slate-800 py-1 z-0 hover:text-blue-300 transition-colors"
            >
              <ChevronIcon 
                className="w-4 h-4"
                direction={showMostUsed ? 'down' : 'right'}
              />
              <TrendingIcon className="w-5 h-5" />
              Most Used
              <span className="text-sm font-normal text-blue-500">({getMostUsedProcedures().length})</span>
            </button>
            {showMostUsed && (
              <ul className="space-y-0 pl-2 border-l border-blue-700/50 mt-1">
                {getMostUsedProcedures().map(({ procedure, count }, index) => (
                  <li key={`most-used-${procedure.controlName}-${index}`} className="flex items-center group">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(procedure.controlName); }}
                      className={`p-1 mr-1 transition-all ${
                        isFavorite(procedure.controlName) 
                          ? 'text-amber-400 hover:text-amber-300' 
                          : 'text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                      }`}
                      aria-label={isFavorite(procedure.controlName) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <StarIcon className="h-4 w-4" filled={isFavorite(procedure.controlName)} />
                    </button>
                    <button
                      onClick={() => handleProcedureClick(procedure)}
                      className="flex-grow text-left py-1 px-1.5 rounded hover:bg-blue-500/10 transition-colors duration-200"
                    >
                      <span className="text-slate-300">{procedure.description}</span>
                      <span className="ml-2 text-xs text-blue-400">({count}×)</span>
                      <span className="ml-1 text-xs text-slate-500">
                        {getCategoryName(procedure.categoryId)} › {getSubcategoryName(procedure.subcategoryId)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Divider if we have any favorites, recents, or most-used sections */}
        {searchTokens.length === 0 && !inputValue.trim() && (
          getFavoriteProcedures().length > 0 || 
          getFavoriteCategories().length > 0 || 
          getFavoriteSubcategories().length > 0 || 
          getRecentProcedures().length > 0 ||
          getMostUsedProcedures().length > 0
        ) && sortedCategoryIds.length > 0 && (
          <div className="border-t border-slate-700 my-2 pt-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">All Procedures</p>
          </div>
        )}

        {/* Flat View Mode */}
        {flatView && filteredProcedures.length > 0 ? (
          <div className="space-y-0">
            {[...filteredProcedures]
              .sort((a, b) => {
                // Sort by category, then subcategory, then description
                const catA = getCategoryById(a.categoryId);
                const catB = getCategoryById(b.categoryId);
                const catOrderDiff = (catA?.sortOrder ?? 999999) - (catB?.sortOrder ?? 999999);
                if (catOrderDiff !== 0) return catOrderDiff;
                
                const subA = getSubcategoryById(a.subcategoryId);
                const subB = getSubcategoryById(b.subcategoryId);
                const subOrderDiff = (subA?.sortOrder ?? 999999) - (subB?.sortOrder ?? 999999);
                if (subOrderDiff !== 0) return subOrderDiff;
                
                return a.description.localeCompare(b.description);
              })
              .map((proc, index) => {
                const reasons = getMatchReasons(proc);
                const tooltip = hasActiveSearch ? buildMatchTooltip(proc, reasons) : null;
                
                return (
                  <div key={`flat-${proc.controlName}-${index}`} className="flex items-center group hover:bg-slate-700/30 rounded transition-colors">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(proc.controlName); }}
                      className={`p-1.5 transition-all flex-shrink-0 ${
                        isFavorite(proc.controlName) 
                          ? 'text-amber-400 hover:text-amber-300' 
                          : 'text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                      }`}
                      aria-label={isFavorite(proc.controlName) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <StarIcon className="h-4 w-4" filled={isFavorite(proc.controlName)} />
                    </button>
                    <button
                      onClick={() => handleProcedureClick(proc)}
                      className="flex-grow text-left py-1.5 px-2 rounded flex items-center gap-2 min-w-0"
                    >
                      <span className="bg-cyan-700/50 text-cyan-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {getSubcategoryName(proc.subcategoryId)}
                      </span>
                      <span className="text-slate-300 truncate flex-grow">{proc.description}</span>
                      <span className="bg-purple-700/50 text-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {getCategoryName(proc.categoryId)}
                      </span>
                      {tooltip && (
                        <span 
                          className="text-slate-500 flex-shrink-0 hover:text-slate-300 cursor-help" 
                          title={tooltip}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                          </svg>
                        </span>
                      )}
                      {proc.fields.length === 0 ? (
                        <span className="text-amber-400 flex-shrink-0" title="Quick add - no form required">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-slate-500 flex-shrink-0" title="Opens form for additional options">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
          </div>
        ) : flatView && filteredProcedures.length === 0 ? (
          <div className="text-center py-6 text-slate-500" role="status">
            <p className="font-semibold">No procedures found</p>
            <p className="text-sm">Try adjusting your search filters.</p>
          </div>
        ) : sortedCategoryIds.length > 0 ? (
          sortedCategoryIds.map((categoryId) => {
            const subcategories = groupedProcedures[categoryId];
            const categoryName = getCategoryName(categoryId);
            const sortedSubcategoryIds = getSortedSubcategoryIds(subcategories);
            const hasMultipleSubcategories = sortedSubcategoryIds.length > 1;
            const hasMultipleCategories = sortedCategoryIds.length > 1;
            const isCategoryExpanded = !hasMultipleCategories || expandedCategories.has(categoryId);
            
            // Count total procedures in this category
            const totalProceduresInCategory = sortedSubcategoryIds.reduce(
              (sum, subId) => sum + subcategories[subId].length, 0
            );
            
            const toggleCategoryExpanded = () => {
              const isCurrentlyExpanded = expandedCategories.has(categoryId);
              
              setExpandedCategories(prev => {
                const next = new Set(prev);
                if (next.has(categoryId)) {
                  next.delete(categoryId);
                } else {
                  next.add(categoryId);
                }
                return next;
              });
              
              // When expanding, optionally add category as a search token
              if (!isCurrentlyExpanded && filterOnExpand) {
                const tokenLower = categoryName.toLowerCase();
                if (!searchTokens.some(t => t.value === tokenLower)) {
                  lastExpandedTokenRef.current = tokenLower;
                  setSearchTokens(prev => [...prev, { value: tokenLower, type: 'category' }]);
                }
              }
            };
            
            return (
              <div key={categoryId} className={isCategoryExpanded ? "mb-2" : "mb-0.5"}>
                {hasMultipleCategories ? (
                                  <div className={`flex items-center gap-1 sticky top-0 bg-slate-800 z-0 ${isCategoryExpanded ? 'mb-1 py-1' : 'py-0.5'} group/cat`}>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleCategoryFavorite(categoryId); }}
                                      className={`p-1 transition-all flex-shrink-0 ${
                                        isCategoryFavorite(categoryId) 
                                          ? 'text-amber-400 hover:text-amber-300' 
                                          : 'text-slate-600 hover:text-amber-400 opacity-0 group-hover/cat:opacity-100'
                                      }`}
                                      aria-label={isCategoryFavorite(categoryId) ? "Remove category from favorites" : "Add category to favorites"}
                                    >
                                      <StarIcon className="h-4 w-4" filled={isCategoryFavorite(categoryId)} />
                                    </button>
                                    <button
                                      onClick={toggleCategoryExpanded}
                                      className="flex items-center gap-2 font-semibold text-slate-400 w-full text-left hover:text-slate-300 transition-colors"
                                    >
                                      <ChevronIcon 
                                        className="w-4 h-4 flex-shrink-0" 
                                        direction={isCategoryExpanded ? 'down' : 'right'} 
                                      />
                                      <span>{categoryName}</span>
                                      <span className="text-sm text-slate-500 font-normal">({totalProceduresInCategory})</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 mb-1 sticky top-0 bg-slate-800 py-1 z-0 group/cat">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleCategoryFavorite(categoryId); }}
                                      className={`p-1 transition-all flex-shrink-0 ${
                                        isCategoryFavorite(categoryId) 
                                          ? 'text-amber-400 hover:text-amber-300' 
                                          : 'text-slate-600 hover:text-amber-400 opacity-0 group-hover/cat:opacity-100'
                                      }`}
                                      aria-label={isCategoryFavorite(categoryId) ? "Remove category from favorites" : "Add category to favorites"}
                                    >
                                      <StarIcon className="h-4 w-4" filled={isCategoryFavorite(categoryId)} />
                                    </button>
                                    <h3 className="font-semibold text-slate-400">{categoryName}</h3>
                                  </div>
                                )}
                {isCategoryExpanded && sortedSubcategoryIds.map((subcategoryId) => {
                  const procs = subcategories[subcategoryId];
                  const subcategoryName = getSubcategoryName(subcategoryId);
                  const expansionKey = `${categoryId}:${subcategoryId}`;
                  const isExpanded = !hasMultipleSubcategories || expandedSubcategories.has(expansionKey);
                  
                  const toggleExpanded = () => {
                    const isCurrentlyExpanded = expandedSubcategories.has(expansionKey);
                    
                    setExpandedSubcategories(prev => {
                      const next = new Set(prev);
                      if (next.has(expansionKey)) {
                        next.delete(expansionKey);
                      } else {
                        next.add(expansionKey);
                      }
                      return next;
                    });
                    
                    // When expanding, optionally add subcategory as a search token
                    if (!isCurrentlyExpanded && filterOnExpand) {
                      const tokenLower = subcategoryName.toLowerCase();
                      if (!searchTokens.some(t => t.value === tokenLower)) {
                        // Track this token so we don't clear expanded state when it's added
                        lastExpandedTokenRef.current = tokenLower;
                        setSearchTokens(prev => [...prev, { value: tokenLower, type: 'subcategory' }]);
                      }
                    }
                  };
                  
                  return (
                    <div key={subcategoryId} className={`pl-2 ${isExpanded ? 'mb-1.5' : 'mb-0.5'}`}>
                      {hasMultipleSubcategories ? (
                                        <div className={`flex items-center gap-1 ${isExpanded ? 'mb-0.5' : ''} group/subcat`}>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); toggleSubcategoryFavorite(subcategoryId); }}
                                            className={`p-1 transition-all flex-shrink-0 ${
                                              isSubcategoryFavorite(subcategoryId) 
                                                ? 'text-amber-400 hover:text-amber-300' 
                                                : 'text-slate-600 hover:text-amber-400 opacity-0 group-hover/subcat:opacity-100'
                                            }`}
                                            aria-label={isSubcategoryFavorite(subcategoryId) ? "Remove subcategory from favorites" : "Add subcategory to favorites"}
                                          >
                                            <StarIcon className="h-4 w-4" filled={isSubcategoryFavorite(subcategoryId)} />
                                          </button>
                                          <button
                                            onClick={toggleExpanded}
                                            className="flex items-center gap-2 font-semibold text-cyan-400 hover:text-cyan-300 transition-colors w-full text-left"
                                          >
                                            <ChevronIcon 
                                              className="w-4 h-4 flex-shrink-0" 
                                              direction={isExpanded ? 'down' : 'right'} 
                                            />
                                            <span>{subcategoryName}</span>
                                            <span className="text-xs text-slate-500 font-normal">({procs.length})</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 mb-0.5 group/subcat">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); toggleSubcategoryFavorite(subcategoryId); }}
                                            className={`p-1 transition-all flex-shrink-0 ${
                                              isSubcategoryFavorite(subcategoryId) 
                                                ? 'text-amber-400 hover:text-amber-300' 
                                                : 'text-slate-600 hover:text-amber-400 opacity-0 group-hover/subcat:opacity-100'
                                            }`}
                                            aria-label={isSubcategoryFavorite(subcategoryId) ? "Remove subcategory from favorites" : "Add subcategory to favorites"}
                                          >
                                            <StarIcon className="h-4 w-4" filled={isSubcategoryFavorite(subcategoryId)} />
                                          </button>
                                          <h4 className="font-semibold text-cyan-400">{subcategoryName}</h4>
                                        </div>
                                      )}
                      {isExpanded && (
                        <ul className="space-y-0 pl-2 border-l border-slate-700">
                          {[...procs]
                            .sort((a, b) => a.description.localeCompare(b.description))
                            .map((proc, index) => {
                              const reasons = getMatchReasons(proc);
                              const tooltip = hasActiveSearch ? buildMatchTooltip(proc, reasons) : null;
                              
                              return (
                                <li key={`${proc.controlName}-${index}`} className="flex items-center group">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(proc.controlName); }}
                                    className={`p-1 mr-1 transition-all ${
                                      isFavorite(proc.controlName) 
                                        ? 'text-amber-400 hover:text-amber-300' 
                                        : 'text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                                    }`}
                                    aria-label={isFavorite(proc.controlName) ? "Remove from favorites" : "Add to favorites"}
                                  >
                                    <StarIcon className="h-4 w-4" filled={isFavorite(proc.controlName)} />
                                  </button>
                                  <button
                                    onClick={() => handleProcedureClick(proc)}
                                    className="flex-grow text-left py-1 px-1.5 rounded hover:bg-cyan-500/10 transition-colors duration-200 flex items-center"
                                  >
                                    <span className="text-slate-300">{proc.description}</span>
                                    {tooltip && (
                                      <span 
                                        className="ml-1.5 text-slate-500 hover:text-slate-300 cursor-help" 
                                        title={tooltip}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                      </span>
                                    )}
                                    {proc.fields.length === 0 ? (
                                      <span className="ml-auto pl-2 text-amber-400 flex-shrink-0" title="Quick add - no form required">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                        </svg>
                                      </span>
                                    ) : (
                                      <span className="ml-auto pl-2 text-slate-500 flex-shrink-0" title="Opens form for additional options">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                      </span>
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-slate-500" role="status">
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
        className="bg-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-[840px] flex flex-col h-full max-h-[90vh] border border-slate-700 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="py-2 px-3 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-20 flex-shrink-0 gap-3">
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
            <label className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white cursor-pointer select-none group" title="Auto-filter when expanding categories/subcategories">
              <input 
                type="checkbox" 
                checked={filterOnExpand} 
                onChange={(e) => setFilterOnExpand(e.target.checked)}
                className="appearance-none h-4 w-4 bg-slate-700 border border-slate-600 rounded checked:bg-cyan-500 checked:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[5px] after:top-[1px] after:w-[5px] after:h-[9px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
              />
              <span className="group-hover:text-cyan-300 transition-colors whitespace-nowrap hidden sm:inline">Auto-filter</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white cursor-pointer select-none group" title="Only show category suggestions until narrowed to one category">
              <input 
                type="checkbox" 
                checked={catOnly} 
                onChange={(e) => setCatOnly(e.target.checked)}
                className="appearance-none h-4 w-4 bg-slate-700 border border-slate-600 rounded checked:bg-cyan-500 checked:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[5px] after:top-[1px] after:w-[5px] after:h-[9px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
              />
              <span className="group-hover:text-cyan-300 transition-colors whitespace-nowrap hidden sm:inline">Cat only</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white cursor-pointer select-none group" title="Display results as a flat list with Category, Subcategory, and Description on one row">
              <input 
                type="checkbox" 
                checked={flatView} 
                onChange={(e) => setFlatView(e.target.checked)}
                className="appearance-none h-4 w-4 bg-slate-700 border border-slate-600 rounded checked:bg-cyan-500 checked:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[5px] after:top-[1px] after:w-[5px] after:h-[9px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
              />
              <span className="group-hover:text-cyan-300 transition-colors whitespace-nowrap hidden sm:inline">Flat view</span>
            </label>

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
