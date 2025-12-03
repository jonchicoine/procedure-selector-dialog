import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { useProcedureConfig } from '../context/ProcedureConfigContext';
import { ProcedureDefinition, ProcedureFieldDefinition } from '../types';

interface ConfigEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_TYPES: Array<{ value: ProcedureFieldDefinition['type']; label: string }> = [
  { value: 'list', label: 'Dropdown List' },
  { value: 'number', label: 'Number Input' },
  { value: 'textbox', label: 'Text Input' },
];

const createEmptyField = (): ProcedureFieldDefinition => ({
  type: 'textbox',
  label: '',
  controlName: '',
});

const createEmptyProcedure = (): ProcedureDefinition => ({
  category: '',
  subcategory: '',
  description: '',
  controlName: '',
  fields: [],
});

export const ConfigEditorModal: React.FC<ConfigEditorModalProps> = ({ isOpen, onClose }) => {
  const { 
    procedures, 
    loadConfig, 
    exportConfig, 
    updateProcedure, 
    addProcedure, 
    deleteProcedure,
    error, 
    clearError 
  } = useProcedureConfig();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureDefinition | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(null);
      setEditingProcedure(null);
      setHasChanges(false);
      setIsAddingNew(false);
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProcedures = procedures
    .map((proc, idx) => ({ proc, idx }))
    .filter(({ proc }) =>
      proc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proc.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
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
        setHasChanges(false);
        setIsAddingNew(false);
      } catch {
        // Error is handled in context
      }
    }
    e.target.value = '';
  };

  const handleSelectProcedure = (index: number) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setSelectedIndex(index);
    setEditingProcedure({ ...procedures[index], fields: procedures[index].fields.map(f => ({ ...f, listItems: f.listItems ? [...f.listItems] : undefined })) });
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
    setEditingProcedure(createEmptyProcedure());
    setHasChanges(true);
    setIsAddingNew(true);
  };

  const handleSave = () => {
    if (!editingProcedure) return;
    
    // Validate required fields
    if (!editingProcedure.description.trim()) {
      alert('Description is required');
      return;
    }
    if (!editingProcedure.category.trim()) {
      alert('Category is required');
      return;
    }
    if (!editingProcedure.controlName.trim()) {
      alert('Control Name is required');
      return;
    }

    // Validate fields
    for (let i = 0; i < editingProcedure.fields.length; i++) {
      const field = editingProcedure.fields[i];
      if (!field.label.trim()) {
        alert(`Field ${i + 1}: Label is required`);
        return;
      }
      if (!field.controlName.trim()) {
        alert(`Field ${i + 1}: Control Name is required`);
        return;
      }
      if (field.type === 'list' && (!field.listItems || field.listItems.length === 0)) {
        alert(`Field ${i + 1}: List type requires at least one item`);
        return;
      }
    }

    if (isAddingNew) {
      addProcedure(editingProcedure);
      setSelectedIndex(procedures.length); // Will be the new index
    } else if (selectedIndex !== null) {
      updateProcedure(selectedIndex, editingProcedure);
    }
    
    setHasChanges(false);
    setIsAddingNew(false);
  };

  const handleDelete = () => {
    if (selectedIndex === null || isAddingNew) return;
    if (!confirm(`Delete "${procedures[selectedIndex].description}"? This cannot be undone.`)) {
      return;
    }
    deleteProcedure(selectedIndex);
    setSelectedIndex(null);
    setEditingProcedure(null);
    setHasChanges(false);
  };

  const handleDiscard = () => {
    if (isAddingNew) {
      setEditingProcedure(null);
      setIsAddingNew(false);
      setHasChanges(false);
    } else if (selectedIndex !== null) {
      setEditingProcedure({ ...procedures[selectedIndex], fields: procedures[selectedIndex].fields.map(f => ({ ...f, listItems: f.listItems ? [...f.listItems] : undefined })) });
      setHasChanges(false);
    }
  };

  const updateField = <K extends keyof ProcedureDefinition>(key: K, value: ProcedureDefinition[K]) => {
    if (!editingProcedure) return;
    setEditingProcedure({ ...editingProcedure, [key]: value });
    setHasChanges(true);
  };

  const updateFieldDef = (fieldIndex: number, updates: Partial<ProcedureFieldDefinition>) => {
    if (!editingProcedure) return;
    const newFields = [...editingProcedure.fields];
    newFields[fieldIndex] = { ...newFields[fieldIndex], ...updates };
    
    // If changing to list type and no listItems, initialize empty array
    if (updates.type === 'list' && !newFields[fieldIndex].listItems) {
      newFields[fieldIndex].listItems = [];
    }
    // If changing away from list, remove listItems
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
              onClick={exportConfig}
              className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              Export
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors ml-2"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
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
          {/* Left Panel - Procedure List */}
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
                    {proc.category} → {proc.subcategory}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    {proc.fields.length === 0 ? 'No fields (immediate add)' : `${proc.fields.length} field(s)`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel - Procedure Editor */}
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
                    {/* Basic Info */}
                    <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Basic Information</h4>
                      
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Description *</label>
                        <input
                          type="text"
                          value={editingProcedure.description}
                          onChange={(e) => updateField('description', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="e.g., Central Line Insertion"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Category *</label>
                          <input
                            type="text"
                            value={editingProcedure.category}
                            onChange={(e) => updateField('category', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="e.g., Vascular Access"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Subcategory</label>
                          <input
                            type="text"
                            value={editingProcedure.subcategory}
                            onChange={(e) => updateField('subcategory', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="e.g., Central Lines"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Control Name *</label>
                        <input
                          type="text"
                          value={editingProcedure.controlName}
                          onChange={(e) => updateField('controlName', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="e.g., Procedures_CentralLine_cbo"
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

                                {/* List Items (only for list type) */}
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

                {/* Action Buttons */}
                <div className="p-4 border-t border-slate-700 flex items-center justify-between">
                  <div>
                    {!isAddingNew && selectedIndex !== null && (
                      <button
                        onClick={handleDelete}
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
                      onClick={handleSave}
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
        </div>
      </div>
    </div>
  );
};
