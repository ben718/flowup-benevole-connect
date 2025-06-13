import { useState, useEffect, createContext, useContext } from 'react';
import ReactDOM from 'react-dom';

// Contexte pour les Toasts
const ToastContext = createContext();

// Types de Toast
const TOAST_TYPES = {
  success: {
    icon: '✓',
    className: 'bg-green-100 border-green-500 text-green-800',
  },
  error: {
    icon: '✕',
    className: 'bg-red-100 border-red-500 text-red-800',
  },
  warning: {
    icon: '⚠',
    className: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  },
  info: {
    icon: 'ℹ',
    className: 'bg-blue-100 border-blue-500 text-blue-800',
  },
};

// Composant Toast
const Toast = ({ message, type = 'info', onClose }) => {
  const { icon, className } = TOAST_TYPES[type] || TOAST_TYPES.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4`}>
      <div
        className={`${className} border-l-4 p-4 rounded-md shadow-md flex items-center justify-between`}
      >
        <div className="flex items-center">
          <span className="mr-2 font-bold">{icon}</span>
          <span className="text-sm">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Fournisseur de Toasts
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  };

  const closeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {ReactDOM.createPortal(
        <div className="toast-container">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => closeToast(toast.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// Hook pour utiliser les Toasts
const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé à l\'intérieur d\'un ToastProvider');
  }  return context;
};

export { ToastProvider, useToast };
