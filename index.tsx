
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ProcedureConfigProvider } from './context/ProcedureConfigContext';
import { ToastProvider } from './components/Toast';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <ProcedureConfigProvider>
        <App />
      </ProcedureConfigProvider>
    </ToastProvider>
  </React.StrictMode>
);
