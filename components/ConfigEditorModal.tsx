import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { UploadIcon } from './icons/UploadIcon';
import { useProcedureConfig } from '../context/ProcedureConfigContext';
import { useToast } from './Toast';
import { ProcedureDefinition, ProcedureFieldDefinition, CategoryDefinition, SubcategoryDefinition } from '../types';
import { publishToGitHub, getStoredToken, storeToken, clearStoredToken, validateGitHubToken } from '../utils/githubApi';

interface ConfigEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EditorTab = 'procedures' | 'categories' | 'subcategories';

const FIELD_TYPES: Array<{ value: ProcedureFieldDefinition['type']; label: string }> = [
  { value: 'list', label: 'Dropdown List' },
  { value: 'number', label: 'Number Input' },
  { value: 'textbox', label: 'Text Input' },
  { value: 'checkbox', label: 'Checkbox' },
];

const createEmptyField = (): ProcedureFieldDefinition => ({
  type: 'textbox',
  label: '',
  controlName: '',
});

const createEmptyProcedure = (categories: CategoryDefinition[], subcategories: SubcategoryDefinition[]): ProcedureDefinition => ({
  categoryId: categories[0]?.id || '',
  subcategoryId: subcategories[0]?.id || '',
  description: '',
  controlName: '',
  fields: [],
  aliases: [],
  tags: [],
});

const createEmptyCategory = (existingCategories: CategoryDefinition[]): CategoryDefinition => ({
  id: '',
  name: '',
  sortOrder: Math.max(0, ...existingCategories.map(c => c.sortOrder)) + 10,
});

const createEmptySubcategory = (existingSubcategories: SubcategoryDefinition[]): SubcategoryDefinition => ({
  id: '',
  name: '',
  sortOrder: Math.max(0, ...existingSubcategories.map(s => s.sortOrder)) + 10,
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const ConfigEditorModal: React.FC<ConfigEditorModalProps> = ({ isOpen, onClose }) => {
  const { 
    procedures, 
    categories,
    subcategories,
    version,
    getCategoryName,
    getSubcategoryName,
    getSortedCategories,
    getSortedSubcategories,
    loadConfig, 
    exportConfig,
    resetToDefaults,
    hasStoredConfig,
    updateProcedure, 
    addProcedure, 
    deleteProcedure,
    updateCategory,
    addCategory,
    deleteCategory,
    updateSubcategory,
    addSubcategory,
    deleteSubcategory,
    error, 
    clearError 
  } = useProcedureConfig();
  
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<EditorTab>('procedures');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureDefinition | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryDefinition | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // GitHub publish state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [githubToken, setGithubToken] = useState(getStoredToken() || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(null);
      setEditingProcedure(null);
      setEditingCategory(null);
      setEditingSubcategory(null);
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
      setHasChanges(false);
      setIsAddingNew(false);
      setSearchTerm('');
      setActiveTab('procedures');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sortedCategories = getSortedCategories();
  const sortedSubcategories = getSortedSubcategories();

  const filteredProcedures = procedures
    .map((proc, idx) => ({ proc, idx }))
    .filter(({ proc }) => {
      const catName = getCategoryName(proc.categoryId);
      const subcatName = getSubcategoryName(proc.subcategoryId);
      return (
        proc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        catName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subcatName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

  const filteredCategories = sortedCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubcategories = sortedSubcategories.filter(subcat =>
    subcat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subcat.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await loadConfig(file);
        setSelectedIndex(null);
        setEditingProcedure(null);
        setEditingCategory(null);
        setEditingSubcategory(null);
        setHasChanges(false);
        setIsAddingNew(false);
        showToast(`Configuration imported successfully`, 'success');
      } catch {
        showToast('Failed to import configuration', 'error');
      }
    }
    e.target.value = '';
  };

  const handleExport = () => {
    try {
      exportConfig();
      showToast('Configuration exported successfully', 'success');
    } catch {
      showToast('Failed to export configuration', 'error');
    }
  };

  // GitHub publish handler
  const handlePublish = async () => {
    if (!githubToken.trim()) {
      showToast('Please enter a GitHub token', 'error');
      return;
    }

    setIsPublishing(true);
    
    try {
      // Validate token first
      const isValid = await validateGitHubToken(githubToken);
      if (!isValid) {
        showToast('Invalid GitHub token. Please check and try again.', 'error');
        setIsPublishing(false);
        return;
      }

      // Store the token for future use
      storeToken(githubToken);

      // Build the full config object
      const fullConfig = {
        version: version,
        categories: categories,
        subcategories: subcategories,
        procedures: procedures,
      };

      const result = await publishToGitHub(
        fullConfig,
        githubToken,
        commitMessage.trim() || undefined
      );

      if (result.success) {
        showToast('Published! Netlify will deploy in ~1-2 minutes.', 'success');
        setShowPublishModal(false);
        setCommitMessage('');
      } else {
        showToast(`Publish failed: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast('Publish failed. Please try again.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Procedure handlers
  const handleSelectProcedure = (index: number) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setSelectedIndex(index);
    const proc = procedures[index];
    setEditingProcedure({ 
      ...proc, 
      fields: proc.fields.map(f => ({ ...f, listItems: f.listItems ? [...f.listItems] : undefined })),
      aliases: proc.aliases ? [...proc.aliases] : [],
      tags: proc.tags ? [...proc.tags] : [],
    });
    setHasChanges(false);
    setIsAddingNew(false);
  };

  const handleAddNewProcedure = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setSelectedIndex(null);
    setEditingProcedure(createEmptyProcedure(categories, subcategories));
    setHasChanges(true);
    setIsAddingNew(true);
  };

  const handleSaveProcedure = () => {
    if (!editingProcedure) return;
    
    // Validate required fields
    if (!editingProcedure.description.trim()) {
      showToast('Description is required', 'error');
      return;
    }
    if (!editingProcedure.categoryId) {
      showToast('Category is required', 'error');
      return;
    }
    if (!editingProcedure.controlName.trim()) {
      showToast('Control Name is required', 'error');
      return;
    }

    // Validate fields
    for (let i = 0; i < editingProcedure.fields.length; i++) {
      const field = editingProcedure.fields[i];
      if (!field.label.trim()) {
        showToast(`Field ${i + 1}: Label is required`, 'error');
        return;
      }
      if (!field.controlName.trim()) {
        showToast(`Field ${i + 1}: Control Name is required`, 'error');
        return;
      }
      if (field.type === 'list' && (!field.listItems || field.listItems.length === 0)) {
        showToast(`Field ${i + 1}: List type requires at least one item`, 'error');
        return;
      }
    }

    if (isAddingNew) {
      addProcedure(editingProcedure);
      setSelectedIndex(procedures.length);
      showToast(`Procedure "${editingProcedure.description}" added`, 'success');
    } else if (selectedIndex !== null) {
      updateProcedure(selectedIndex, editingProcedure);
      showToast(`Procedure "${editingProcedure.description}" saved`, 'success');
    }
    
    setHasChanges(false);
    setIsAddingNew(false);
  };

  const handleDeleteProcedure = () => {
    if (selectedIndex === null || isAddingNew) return;
    const procedureName = procedures[selectedIndex].description;
    if (!confirm(`Delete "${procedureName}"? This cannot be undone.`)) {
      return;
    }
    deleteProcedure(selectedIndex);
    setSelectedIndex(null);
    setEditingProcedure(null);
    setHasChanges(false);
    showToast(`Procedure "${procedureName}" deleted`, 'success');
  };

  // Category handlers
  const handleSelectCategory = (id: string) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    const cat = categories.find(c => c.id === id);
    if (cat) {
      setSelectedCategoryId(id);
      setEditingCategory({ ...cat });
      setHasChanges(false);
      setIsAddingNew(false);
    }
  };

  const handleAddNewCategory = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setSelectedCategoryId(null);
    setEditingCategory(createEmptyCategory(categories));
    setHasChanges(true);
    setIsAddingNew(true);
  };

  const handleSaveCategory = () => {
    if (!editingCategory) return;
    
    if (!editingCategory.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    // Auto-generate ID if adding new
    const categoryToSave = { ...editingCategory };
    if (isAddingNew && !categoryToSave.id) {
      categoryToSave.id = slugify(categoryToSave.name);
    }

    // Check for duplicate ID
    const existingWithId = categories.find(c => c.id === categoryToSave.id && c.id !== selectedCategoryId);
    if (existingWithId) {
      showToast('A category with this ID already exists', 'error');
      return;
    }

    if (isAddingNew) {
      addCategory(categoryToSave);
      setSelectedCategoryId(categoryToSave.id);
      showToast(`Category "${categoryToSave.name}" added`, 'success');
    } else if (selectedCategoryId) {
      updateCategory(selectedCategoryId, categoryToSave);
      showToast(`Category "${categoryToSave.name}" saved`, 'success');
    }
    
    setHasChanges(false);
    setIsAddingNew(false);
  };

  const handleDeleteCategory = () => {
    if (!selectedCategoryId || isAddingNew) return;
    const cat = categories.find(c => c.id === selectedCategoryId);
    
    // Check if category is in use
    const procsUsingCategory = procedures.filter(p => p.categoryId === selectedCategoryId);
    if (procsUsingCategory.length > 0) {
      showToast(`Cannot delete: ${procsUsingCategory.length} procedure(s) use this category`, 'error');
      return;
    }
    
    if (!confirm(`Delete category "${cat?.name}"? This cannot be undone.`)) {
      return;
    }
    deleteCategory(selectedCategoryId);
    setSelectedCategoryId(null);
    setEditingCategory(null);
    setHasChanges(false);
    showToast(`Category "${cat?.name}" deleted`, 'success');
  };

  // Subcategory handlers
  const handleSelectSubcategory = (id: string) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    const subcat = subcategories.find(s => s.id === id);
    if (subcat) {
      setSelectedSubcategoryId(id);
      setEditingSubcategory({ ...subcat });
      setHasChanges(false);
      setIsAddingNew(false);
    }
  };

  const handleAddNewSubcategory = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setSelectedSubcategoryId(null);
    setEditingSubcategory(createEmptySubcategory(subcategories));
    setHasChanges(true);
    setIsAddingNew(true);
  };

  const handleSaveSubcategory = () => {
    if (!editingSubcategory) return;
    
    if (!editingSubcategory.name.trim()) {
      showToast('Subcategory name is required', 'error');
      return;
    }

    const subcategoryToSave = { ...editingSubcategory };
    if (isAddingNew && !subcategoryToSave.id) {
      subcategoryToSave.id = slugify(subcategoryToSave.name);
    }

    const existingWithId = subcategories.find(s => s.id === subcategoryToSave.id && s.id !== selectedSubcategoryId);
    if (existingWithId) {
      showToast('A subcategory with this ID already exists', 'error');
      return;
    }

    if (isAddingNew) {
      addSubcategory(subcategoryToSave);
      setSelectedSubcategoryId(subcategoryToSave.id);
      showToast(`Subcategory "${subcategoryToSave.name}" added`, 'success');
    } else if (selectedSubcategoryId) {
      updateSubcategory(selectedSubcategoryId, subcategoryToSave);
      showToast(`Subcategory "${subcategoryToSave.name}" saved`, 'success');
    }
    
    setHasChanges(false);
    setIsAddingNew(false);
  };

  const handleDeleteSubcategory = () => {
    if (!selectedSubcategoryId || isAddingNew) return;
    const subcat = subcategories.find(s => s.id === selectedSubcategoryId);
    
    const procsUsingSubcategory = procedures.filter(p => p.subcategoryId === selectedSubcategoryId);
    if (procsUsingSubcategory.length > 0) {
      showToast(`Cannot delete: ${procsUsingSubcategory.length} procedure(s) use this subcategory`, 'error');
      return;
    }
    
    if (!confirm(`Delete subcategory "${subcat?.name}"? This cannot be undone.`)) {
      return;
    }
    deleteSubcategory(selectedSubcategoryId);
    setSelectedSubcategoryId(null);
    setEditingSubcategory(null);
    setHasChanges(false);
    showToast(`Subcategory "${subcat?.name}" deleted`, 'success');
  };

  const handleDiscard = () => {
    if (activeTab === 'procedures') {
      if (isAddingNew) {
        setEditingProcedure(null);
        setIsAddingNew(false);
        setHasChanges(false);
      } else if (selectedIndex !== null) {
        const proc = procedures[selectedIndex];
        setEditingProcedure({ 
          ...proc, 
          fields: proc.fields.map(f => ({ ...f, listItems: f.listItems ? [...f.listItems] : undefined })),
          aliases: proc.aliases ? [...proc.aliases] : [],
          tags: proc.tags ? [...proc.tags] : [],
        });
        setHasChanges(false);
      }
    } else if (activeTab === 'categories') {
      if (isAddingNew) {
        setEditingCategory(null);
        setIsAddingNew(false);
        setHasChanges(false);
      } else if (selectedCategoryId) {
        const cat = categories.find(c => c.id === selectedCategoryId);
        if (cat) setEditingCategory({ ...cat });
        setHasChanges(false);
      }
    } else if (activeTab === 'subcategories') {
      if (isAddingNew) {
        setEditingSubcategory(null);
        setIsAddingNew(false);
        setHasChanges(false);
      } else if (selectedSubcategoryId) {
        const subcat = subcategories.find(s => s.id === selectedSubcategoryId);
        if (subcat) setEditingSubcategory({ ...subcat });
        setHasChanges(false);
      }
    }
  };

  // Clear selection when switching tabs
  const handleTabChange = (tab: EditorTab) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setActiveTab(tab);
    setSelectedIndex(null);
    setEditingProcedure(null);
    setSelectedCategoryId(null);
    setEditingCategory(null);
    setSelectedSubcategoryId(null);
    setEditingSubcategory(null);
    setHasChanges(false);
    setIsAddingNew(false);
    setSearchTerm('');
  };

  const updateProcedureField = <K extends keyof ProcedureDefinition>(key: K, value: ProcedureDefinition[K]) => {
    if (!editingProcedure) return;
    setEditingProcedure({ ...editingProcedure, [key]: value });
    setHasChanges(true);
  };

  const updateFieldDef = (fieldIndex: number, updates: Partial<ProcedureFieldDefinition>) => {
    if (!editingProcedure) return;
    const newFields = [...editingProcedure.fields];
    newFields[fieldIndex] = { ...newFields[fieldIndex], ...updates };
    
    if (updates.type === 'list' && !newFields[fieldIndex].listItems) {
      newFields[fieldIndex].listItems = [];
    }
    if (updates.type && updates.type !== 'list') {
      delete newFields[fieldIndex].listItems;
    }
    
    setEditingProcedure({ ...editingProcedure, fields: newFields });
    setHasChanges(true);
  };

  const addField = () => {
    if (!editingProcedure) return;
    setEditingProcedure({
      ...editingProcedure,
      fields: [...editingProcedure.fields, createEmptyField()],
    });
    setHasChanges(true);
  };

  const removeField = (fieldIndex: number) => {
    if (!editingProcedure) return;
    setEditingProcedure({
      ...editingProcedure,
      fields: editingProcedure.fields.filter((_, i) => i !== fieldIndex),
    });
    setHasChanges(true);
  };

  const updateListItem = (fieldIndex: number, itemIndex: number, value: string) => {
    if (!editingProcedure) return;
    const newFields = [...editingProcedure.fields];
    const listItems = [...(newFields[fieldIndex].listItems || [])];
    listItems[itemIndex] = value;
    newFields[fieldIndex] = { ...newFields[fieldIndex], listItems };
    setEditingProcedure({ ...editingProcedure, fields: newFields });
    setHasChanges(true);
  };

  const addListItem = (fieldIndex: number) => {
    if (!editingProcedure) return;
    const newFields = [...editingProcedure.fields];
    const listItems = [...(newFields[fieldIndex].listItems || []), ''];
    newFields[fieldIndex] = { ...newFields[fieldIndex], listItems };
    setEditingProcedure({ ...editingProcedure, fields: newFields });
    setHasChanges(true);
  };

  const removeListItem = (fieldIndex: number, itemIndex: number) => {
    if (!editingProcedure) return;
    const newFields = [...editingProcedure.fields];
    const listItems = (newFields[fieldIndex].listItems || []).filter((_, i) => i !== itemIndex);
    newFields[fieldIndex] = { ...newFields[fieldIndex], listItems };
    setEditingProcedure({ ...editingProcedure, fields: newFields });
    setHasChanges(true);
  };

  const renderProceduresList = () => (
    <div className="w-2/5 border-r border-slate-700 flex flex-col">
      <div className="p-4 space-y-2">
        <input
          type="text"
          placeholder="Search procedures..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          onClick={handleAddNewProcedure}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add New Procedure
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="text-xs text-slate-500 mb-2">
          {filteredProcedures.length} of {procedures.length} procedures
        </div>
        {filteredProcedures.map(({ proc, idx }) => (
          <button
            key={`${proc.controlName}-${idx}`}
            onClick={() => handleSelectProcedure(idx)}
            className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
              selectedIndex === idx && !isAddingNew
                ? 'bg-cyan-600/30 border border-cyan-500'
                : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
            }`}
          >
            <div className="text-white text-sm font-medium truncate">{proc.description || '(No description)'}</div>
            <div className="text-slate-400 text-xs truncate">
              {getCategoryName(proc.categoryId)} → {getSubcategoryName(proc.subcategoryId)}
            </div>
            <div className="text-slate-500 text-xs mt-1">
              {proc.fields.length === 0 ? 'No fields (immediate add)' : `${proc.fields.length} field(s)`}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderProcedureEditor = () => (
    <div className="w-3/5 flex flex-col overflow-hidden">
      {editingProcedure ? (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {isAddingNew ? 'New Procedure' : 'Edit Procedure'}
              </h3>
              {hasChanges && (
                <span className="text-xs text-amber-400 bg-amber-400/20 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Basic Information</h4>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Description *</label>
                  <input
                    type="text"
                    value={editingProcedure.description}
                    onChange={(e) => updateProcedureField('description', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., Central Line Insertion"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Category *</label>
                    <select
                      value={editingProcedure.categoryId}
                      onChange={(e) => updateProcedureField('categoryId', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select category...</option>
                      {sortedCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Subcategory</label>
                    <select
                      value={editingProcedure.subcategoryId}
                      onChange={(e) => updateProcedureField('subcategoryId', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select subcategory...</option>
                      {sortedSubcategories.map(subcat => (
                        <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Control Name *</label>
                  <input
                    type="text"
                    value={editingProcedure.controlName}
                    onChange={(e) => updateProcedureField('controlName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., Procedures_CentralLine_cbo"
                  />
                </div>
              </div>

              {/* Search Helpers - Aliases & Tags */}
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Search Helpers</h4>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Aliases <span className="text-slate-500">(abbreviations, alternative names - comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={(editingProcedure.aliases || []).join(', ')}
                    onChange={(e) => {
                      const aliases = e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                      updateProcedureField('aliases', aliases.length > 0 ? aliases : undefined);
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., LP, spinal tap, CSF"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Tags <span className="text-slate-500">(body parts, conditions - comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={(editingProcedure.tags || []).join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                      updateProcedureField('tags', tags.length > 0 ? tags : undefined);
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., spine, back, meningitis"
                  />
                </div>
              </div>

              {/* Fields */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-300">
                    Fields ({editingProcedure.fields.length})
                  </h4>
                  <button
                    onClick={addField}
                    className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors flex items-center gap-1"
                  >
                    <PlusIcon className="w-3 h-3" />
                    Add Field
                  </button>
                </div>

                {editingProcedure.fields.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">
                    No fields defined. This procedure will be added immediately when selected.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {editingProcedure.fields.map((field, fieldIdx) => (
                      <div key={fieldIdx} className="bg-slate-800 rounded-lg p-3 border border-slate-600">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-slate-400">Field {fieldIdx + 1}</span>
                          <button
                            onClick={() => removeField(fieldIdx)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                            title="Remove field"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Label *</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateFieldDef(fieldIdx, { label: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Field label"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Type *</label>
                              <select
                                value={field.type}
                                onChange={(e) => updateFieldDef(fieldIdx, { type: e.target.value as ProcedureFieldDefinition['type'] })}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              >
                                {FIELD_TYPES.map(ft => (
                                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Control Name *</label>
                            <input
                              type="text"
                              value={field.controlName}
                              onChange={(e) => updateFieldDef(fieldIdx, { controlName: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              placeholder="Field control name"
                            />
                          </div>

                          {field.type === 'list' && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs text-slate-400">List Items *</label>
                                <button
                                  onClick={() => addListItem(fieldIdx)}
                                  className="px-2 py-0.5 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors flex items-center gap-1"
                                >
                                  <PlusIcon className="w-3 h-3" />
                                  Add Item
                                </button>
                              </div>
                              <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-900/50 rounded p-2">
                                {(field.listItems || []).length === 0 ? (
                                  <p className="text-xs text-slate-500 italic">No items. Add at least one.</p>
                                ) : (
                                  (field.listItems || []).map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => updateListItem(fieldIdx, itemIdx, e.target.value)}
                                        className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                        placeholder="Item value"
                                      />
                                      <button
                                        onClick={() => removeListItem(fieldIdx, itemIdx)}
                                        className="p-1 text-red-400 hover:text-red-300 rounded transition-colors"
                                      >
                                        <CloseIcon className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-700 flex items-center justify-between">
            <div>
              {!isAddingNew && selectedIndex !== null && (
                <button
                  onClick={handleDeleteProcedure}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Discard
                </button>
              )}
              <button
                onClick={handleSaveProcedure}
                disabled={!hasChanges}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  hasChanges
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <SaveIcon className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <p className="mb-2">Select a procedure to edit</p>
            <p className="text-sm text-slate-500">or click "Add New Procedure" to create one</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderCategoriesList = () => (
    <div className="w-2/5 border-r border-slate-700 flex flex-col">
      <div className="p-4 space-y-2">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          onClick={handleAddNewCategory}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add New Category
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="text-xs text-slate-500 mb-2">
          {filteredCategories.length} of {categories.length} categories
        </div>
        {filteredCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat.id)}
            className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
              selectedCategoryId === cat.id && !isAddingNew
                ? 'bg-cyan-600/30 border border-cyan-500'
                : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
            }`}
          >
            <div className="text-white text-sm font-medium truncate">{cat.name}</div>
            <div className="text-slate-400 text-xs truncate font-mono">{cat.id}</div>
            <div className="text-slate-500 text-xs mt-1">Sort Order: {cat.sortOrder}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCategoryEditor = () => (
    <div className="w-3/5 flex flex-col overflow-hidden">
      {editingCategory ? (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {isAddingNew ? 'New Category' : 'Edit Category'}
              </h3>
              {hasChanges && (
                <span className="text-xs text-amber-400 bg-amber-400/20 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => {
                    setEditingCategory({ ...editingCategory, name: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g., Cardiovascular"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ID {isAddingNew ? '(auto-generated)' : ''}</label>
                <input
                  type="text"
                  value={editingCategory.id}
                  onChange={(e) => {
                    setEditingCategory({ ...editingCategory, id: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g., cardiovascular"
                  disabled={!isAddingNew}
                />
                {isAddingNew && !editingCategory.id && editingCategory.name && (
                  <p className="text-xs text-slate-500 mt-1">Will be: {slugify(editingCategory.name)}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={editingCategory.sortOrder}
                  onChange={(e) => {
                    setEditingCategory({ ...editingCategory, sortOrder: parseInt(e.target.value) || 0 });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-700 flex items-center justify-between">
            <div>
              {!isAddingNew && selectedCategoryId && (
                <button
                  onClick={handleDeleteCategory}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Discard
                </button>
              )}
              <button
                onClick={handleSaveCategory}
                disabled={!hasChanges}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  hasChanges
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <SaveIcon className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <p className="mb-2">Select a category to edit</p>
            <p className="text-sm text-slate-500">or click "Add New Category" to create one</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderSubcategoriesList = () => (
    <div className="w-2/5 border-r border-slate-700 flex flex-col">
      <div className="p-4 space-y-2">
        <input
          type="text"
          placeholder="Search subcategories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          onClick={handleAddNewSubcategory}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add New Subcategory
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="text-xs text-slate-500 mb-2">
          {filteredSubcategories.length} of {subcategories.length} subcategories
        </div>
        {filteredSubcategories.map((subcat) => (
          <button
            key={subcat.id}
            onClick={() => handleSelectSubcategory(subcat.id)}
            className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
              selectedSubcategoryId === subcat.id && !isAddingNew
                ? 'bg-cyan-600/30 border border-cyan-500'
                : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
            }`}
          >
            <div className="text-white text-sm font-medium truncate">{subcat.name}</div>
            <div className="text-slate-400 text-xs truncate font-mono">{subcat.id}</div>
            <div className="text-slate-500 text-xs mt-1">Sort Order: {subcat.sortOrder}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSubcategoryEditor = () => (
    <div className="w-3/5 flex flex-col overflow-hidden">
      {editingSubcategory ? (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {isAddingNew ? 'New Subcategory' : 'Edit Subcategory'}
              </h3>
              {hasChanges && (
                <span className="text-xs text-amber-400 bg-amber-400/20 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={editingSubcategory.name}
                  onChange={(e) => {
                    setEditingSubcategory({ ...editingSubcategory, name: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g., Central Line"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ID {isAddingNew ? '(auto-generated)' : ''}</label>
                <input
                  type="text"
                  value={editingSubcategory.id}
                  onChange={(e) => {
                    setEditingSubcategory({ ...editingSubcategory, id: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g., central-line"
                  disabled={!isAddingNew}
                />
                {isAddingNew && !editingSubcategory.id && editingSubcategory.name && (
                  <p className="text-xs text-slate-500 mt-1">Will be: {slugify(editingSubcategory.name)}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={editingSubcategory.sortOrder}
                  onChange={(e) => {
                    setEditingSubcategory({ ...editingSubcategory, sortOrder: parseInt(e.target.value) || 0 });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-700 flex items-center justify-between">
            <div>
              {!isAddingNew && selectedSubcategoryId && (
                <button
                  onClick={handleDeleteSubcategory}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Discard
                </button>
              )}
              <button
                onClick={handleSaveSubcategory}
                disabled={!hasChanges}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  hasChanges
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <SaveIcon className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <p className="mb-2">Select a subcategory to edit</p>
            <p className="text-sm text-slate-500">or click "Add New Subcategory" to create one</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Procedure Configuration</h2>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Import
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Export
            </button>
            <button
              onClick={() => setShowPublishModal(true)}
              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
              title="Publish changes to GitHub (deploys to all users)"
            >
              <UploadIcon className="w-4 h-4" />
              Publish
            </button>
            {hasStoredConfig && (
              <button
                onClick={() => {
                  if (confirm('Reset all configuration to defaults? This will discard all your changes.')) {
                    resetToDefaults();
                    setSelectedIndex(null);
                    setEditingProcedure(null);
                    setEditingCategory(null);
                    setEditingSubcategory(null);
                    setSelectedCategoryId(null);
                    setSelectedSubcategoryId(null);
                    setHasChanges(false);
                    setIsAddingNew(false);
                    showToast('Configuration reset to defaults', 'success');
                  }
                }}
                className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
                title="Reset all changes and restore default configuration"
              >
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors ml-2"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {(['procedures', 'categories', 'subcategories'] as EditorTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-700/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 text-xs text-slate-500">
                ({tab === 'procedures' ? procedures.length : tab === 'categories' ? categories.length : subcategories.length})
              </span>
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center justify-between">
            <span className="text-red-200 text-sm">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-200">
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === 'procedures' && (
            <>
              {renderProceduresList()}
              {renderProcedureEditor()}
            </>
          )}
          {activeTab === 'categories' && (
            <>
              {renderCategoriesList()}
              {renderCategoryEditor()}
            </>
          )}
          {activeTab === 'subcategories' && (
            <>
              {renderSubcategoriesList()}
              {renderSubcategoryEditor()}
            </>
          )}
        </div>
      </div>

      {/* Publish to GitHub Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <UploadIcon className="w-5 h-5 text-green-400" />
                Publish to GitHub
              </h3>
              <button
                onClick={() => setShowPublishModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-300">
                This will commit your changes to GitHub. Netlify will automatically deploy them in ~1-2 minutes, making them available to all users.
              </p>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  GitHub Personal Access Token *
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Need a token? <a 
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Procedure%20Selector%20Config" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Create one here
                  </a> (select "repo" scope)
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Commit Message (optional)
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Describe your changes..."
                />
              </div>

              {getStoredToken() && (
                <button
                  onClick={() => {
                    clearStoredToken();
                    setGithubToken('');
                    showToast('Saved token cleared', 'success');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Clear saved token
                </button>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || !githubToken.trim()}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isPublishing || !githubToken.trim()
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4" />
                    Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
