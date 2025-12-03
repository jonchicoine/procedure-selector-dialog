import React, { useState, useEffect } from 'react';
import { SelectedProcedure, ProcedureFieldDefinition } from '../types';
import { CloseIcon } from './icons/CloseIcon';

// Import PHYSICIANS from a shared location
export const PHYSICIANS = [
  'Dr. Alice Smith',
  'Dr. Bob Johnson',
  'Dr. Carol White',
  'Dr. David Green',
];

interface EditProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (procedure: SelectedProcedure) => void;
  procedure: SelectedProcedure | null;
}

export const EditProcedureModal: React.FC<EditProcedureModalProps> = ({ isOpen, onClose, onSave, procedure }) => {
  const [editedDate, setEditedDate] = useState('');
  const [editedPhysician, setEditedPhysician] = useState('');
  const [editedFieldValues, setEditedFieldValues] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (procedure) {
      setEditedDate(procedure.date);
      setEditedPhysician(procedure.physician);
      setEditedFieldValues({ ...procedure.fieldValues });
    } else {
      setEditedDate('');
      setEditedPhysician('');
      setEditedFieldValues({});
    }
  }, [procedure]);

  const handleSave = () => {
    if (procedure) {
      // Process field values - convert empty strings for numbers
      const processedValues: Record<string, string | number> = {};
      procedure.fields.forEach(field => {
        const value = editedFieldValues[field.controlName];
        if (field.type === 'number') {
          const numVal = typeof value === 'string' ? parseInt(value, 10) : value;
          if (!isNaN(numVal as number)) {
            processedValues[field.controlName] = numVal;
          }
        } else if (value !== undefined && value !== '') {
          processedValues[field.controlName] = value;
        }
      });

      onSave({
        ...procedure,
        date: editedDate,
        physician: editedPhysician,
        fieldValues: processedValues,
      });
    }
  };

  const updateFieldValue = (controlName: string, value: string | number) => {
    setEditedFieldValues(prev => ({ ...prev, [controlName]: value }));
  };

  const renderFieldInput = (field: ProcedureFieldDefinition) => {
    const value = editedFieldValues[field.controlName] ?? '';
    
    switch (field.type) {
      case 'list':
        return (
          <div key={field.controlName}>
            <label htmlFor={`edit-field-${field.controlName}`} className="block text-sm font-medium text-slate-400 mb-2">
              {field.label}
            </label>
            <select
              id={`edit-field-${field.controlName}`}
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
            <label htmlFor={`edit-field-${field.controlName}`} className="block text-sm font-medium text-slate-400 mb-2">
              {field.label}
            </label>
            <input
              id={`edit-field-${field.controlName}`}
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
            <label htmlFor={`edit-field-${field.controlName}`} className="block text-sm font-medium text-slate-400 mb-2">
              {field.label}
            </label>
            <input
              id={`edit-field-${field.controlName}`}
              type="text"
              value={value as string}
              onChange={(e) => updateFieldValue(field.controlName, e.target.value)}
              placeholder="Enter text"
              className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
        );
      
      default:
        return null;
    }
  };
  
  const handleEsc = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);


  if (!isOpen || !procedure) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dialog-title"
    >
      <div
        className="bg-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-slate-700 animate-slide-up max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex flex-col min-w-0">
            <h2 id="edit-dialog-title" className="text-xl font-bold text-cyan-400 truncate" title={procedure.description}>
              Edit Procedure
            </h2>
             <p className="text-sm text-slate-400 truncate">{procedure.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors ml-4" aria-label="Close dialog">
            <CloseIcon />
          </button>
        </header>

        <main className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label htmlFor="edit-procedure-date" className="block text-sm font-medium text-slate-400 mb-2">Date</label>
            <input 
              id="edit-procedure-date"
              type="date" 
              value={editedDate}
              onChange={(e) => setEditedDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="edit-physician-select" className="block text-sm font-medium text-slate-400 mb-2">Physician</label>
            <select 
              id="edit-physician-select"
              value={editedPhysician}
              onChange={(e) => setEditedPhysician(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              {PHYSICIANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {procedure.fields.map(field => renderFieldInput(field))}
        </main>
        
        <footer className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end items-center space-x-4">
            <button
                onClick={onClose}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md shadow-cyan-500/20 transition-colors"
            >
                Save Changes
            </button>
        </footer>
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