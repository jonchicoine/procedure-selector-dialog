import React, { useState, useRef } from 'react';
import { ProcedureSelectionModal } from './components/ProcedureSelectionModal';
import { EditProcedureModal, PHYSICIANS } from './components/EditProcedureModal';
import { ConfigEditorModal } from './components/ConfigEditorModal';
import { SelectedProcedure } from './types';
import { useProcedureConfig } from './context/ProcedureConfigContext';
import { TrashIcon } from './components/icons/TrashIcon';
import { EditIcon } from './components/icons/EditIcon';
import { GearIcon } from './components/icons/GearIcon';

const App: React.FC = () => {
  const { error, clearError } = useProcedureConfig();
  
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [procedureToEdit, setProcedureToEdit] = useState<SelectedProcedure | null>(null);

  const [selectedProcedures, setSelectedProcedures] = useState<SelectedProcedure[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPhysician, setCurrentPhysician] = useState(PHYSICIANS[0]);

  const handleSelectProcedure = (procedure: SelectedProcedure, keepOpen: boolean = false) => {
    setSelectedProcedures(prev => {
      // Prevent adding duplicates based on controlName and first field value
      const firstFieldValue = Object.values(procedure.fieldValues)[0];
      const isDuplicate = prev.some(p => 
        p.controlName === procedure.controlName && 
        Object.values(p.fieldValues)[0] === firstFieldValue
      );
      if (isDuplicate) return prev;
      return [...prev, procedure];
    });

    if (!keepOpen) {
      setIsSelectionModalOpen(false);
    }
  };

  const handleRemoveProcedure = (idToRemove: string) => {
    setSelectedProcedures(prev => prev.filter((p) => p.id !== idToRemove));
  };

  const handleOpenEditModal = (procedure: SelectedProcedure) => {
    setProcedureToEdit(procedure);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setProcedureToEdit(null);
  };

  const handleSaveProcedure = (updatedProcedure: SelectedProcedure) => {
    setSelectedProcedures(prev => 
      prev.map(p => (p.id === updatedProcedure.id ? updatedProcedure : p))
    );
    handleCloseEditModal();
  };

  // Helper to get display value for a field
  const getFieldDisplayValue = (proc: SelectedProcedure): string => {
    if (proc.fields.length === 0) return 'N/A';
    const values = Object.values(proc.fieldValues);
    if (values.length === 0) return 'N/A';
    return values.map(v => String(v)).join(', ');
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-start p-4 font-sans">
      {/* Gear icon in upper right */}
      <button
        onClick={() => setIsConfigModalOpen(true)}
        className="fixed top-4 right-4 p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors z-40"
        title="Procedure Configuration"
      >
        <GearIcon className="w-6 h-6" />
      </button>

      <div className="w-full max-w-6xl text-center mt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-4">Procedure Selector</h1>
        <p className="text-lg text-slate-400 mb-8">
          A demonstration of a searchable and filterable selection dialog for medical procedures.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-white">✕</button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto items-end">
          <div className="text-left">
            <label htmlFor="procedure-date" className="block text-sm font-medium text-slate-400 mb-2">Date</label>
            <input 
              id="procedure-date"
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
          <div className="text-left">
            <label htmlFor="physician-select" className="block text-sm font-medium text-slate-400 mb-2">Physician</label>
            <select 
              id="physician-select"
              value={currentPhysician}
              onChange={(e) => setCurrentPhysician(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 w-full text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              {PHYSICIANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button
            onClick={() => setIsSelectionModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-cyan-500/30 transition-all duration-300 ease-in-out transform hover:scale-105 w-full"
          >
            Add Procedure
          </button>
        </div>


        <div className="mt-10 text-left w-full">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-b border-slate-700 pb-2">Selected Procedures:</h2>
          {selectedProcedures.length > 0 ? (
            <div className="overflow-x-auto bg-slate-800 rounded-lg border border-slate-700">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Category</th>
                    <th scope="col" className="px-6 py-3">Subcategory</th>
                    <th scope="col" className="px-6 py-3">Description</th>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Physician</th>
                    <th scope="col" className="px-6 py-3">Field Values</th>
                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProcedures.map((proc) => (
                    <tr 
                      key={proc.id}
                      className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50"
                      title={`Control Name: ${proc.controlName}`}
                    >
                      <td className="px-6 py-4">{proc.category}</td>
                      <td className="px-6 py-4">{proc.subcategory || 'N/A'}</td>
                      <td className="px-6 py-4 font-medium text-white">{proc.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{proc.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{proc.physician}</td>
                      <td className="px-6 py-4 text-cyan-400">{getFieldDisplayValue(proc)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <button 
                            onClick={() => handleOpenEditModal(proc)} 
                            className="text-slate-500 hover:text-cyan-400 p-1 rounded-full hover:bg-slate-600 transition-colors" 
                            aria-label={`Edit ${proc.description}`}
                          >
                            <EditIcon />
                          </button>
                          <button 
                            onClick={() => handleRemoveProcedure(proc.id)} 
                            className="text-slate-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-600" 
                            aria-label={`Remove ${proc.description}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
              <p className="text-slate-500">No procedures selected yet.</p>
              <p className="text-slate-600 text-sm">Use the controls above to start building your list.</p>
            </div>
          )}
        </div>
      </div>
      
      <ProcedureSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onSelect={handleSelectProcedure}
      />

      <EditProcedureModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveProcedure}
        procedure={procedureToEdit}
      />

      <ConfigEditorModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

      <footer className="w-full text-center p-4 mt-auto text-slate-500 text-sm">
        Built by a World-Class Senior Frontend React Engineer.
      </footer>
    </div>
  );
};

export default App;