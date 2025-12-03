import React, { useState, useEffect } from 'react';
import { SelectedProcedure, PHYSICIANS } from '../App';
import { CloseIcon } from './icons/CloseIcon';

interface EditProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (procedure: SelectedProcedure) => void;
  procedure: SelectedProcedure | null;
}

const SEDATION_CONTROL_NAME = 'Procedures02_ProceduralSedation_cbo';

export const EditProcedureModal: React.FC<EditProcedureModalProps> = ({ isOpen, onClose, onSave, procedure }) => {
  const [editedDate, setEditedDate] = useState('');
  const [editedPhysician, setEditedPhysician] = useState('');
  const [editedOption, setEditedOption] = useState<string | undefined>(undefined);
  const [editedDuration, setEditedDuration] = useState('');

  useEffect(() => {
    if (procedure) {
      setEditedDate(procedure.date);
      setEditedPhysician(procedure.physician);
      setEditedOption(procedure.selectedOption);
      setEditedDuration(procedure.duration?.toString() ?? '');
    } else {
      // Reset form when modal is closed or procedure is cleared
      setEditedDate('');
      setEditedPhysician('');
      setEditedOption(undefined);
      setEditedDuration('');
    }
  }, [procedure]);

  const handleSave = () => {
    if (procedure) {
      onSave({
        ...procedure,
        date: editedDate,
        physician: editedPhysician,
        selectedOption: editedOption,
        duration: editedDuration ? parseInt(editedDuration, 10) : undefined,
      });
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
  
  const isSedationProcedure = procedure.controlName === SEDATION_CONTROL_NAME;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dialog-title"
    >
      <div
        className="bg-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-slate-700 animate-slide-up"
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

        <main className="p-6 space-y-6">
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
          {procedure.options && procedure.options.length > 0 && (
            <div>
              <label htmlFor="edit-option-select" className="block text-sm font-medium text-slate-400 mb-2">Option</label>
              <select 
                id="edit-option-select"
                value={editedOption || ''}
                onChange={(e) => setEditedOption(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                {procedure.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}
          {isSedationProcedure && (
            <div>
              <label htmlFor="edit-sedation-duration" className="block text-sm font-medium text-slate-400 mb-2">Duration (in minutes)</label>
              <input
                id="edit-sedation-duration"
                type="number"
                value={editedDuration}
                onChange={(e) => setEditedDuration(e.target.value)}
                placeholder="e.g., 30"
                className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
          )}
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