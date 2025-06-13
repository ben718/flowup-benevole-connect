import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmation', 
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmButtonColor = 'bg-vs-blue-primary hover:bg-vs-blue-dark',
  isDestructive = false
}) => {
  const [modalRoot, setModalRoot] = useState(null);
  
  useEffect(() => {
    let modalRootElement = document.getElementById('modal-root');
    
    if (!modalRootElement) {
      modalRootElement = document.createElement('div');
      modalRootElement.id = 'modal-root';
      document.body.appendChild(modalRootElement);
    }
    
    setModalRoot(modalRootElement);
    
    return () => {
      if (modalRootElement && modalRootElement.childNodes.length === 0) {
        document.body.removeChild(modalRootElement);
      }
    };
  }, []);
  
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleEscape]);
  
  if (!isOpen || !modalRoot) return null;
  
  const confirmButtonClasses = isDestructive 
    ? 'bg-vs-error hover:bg-vs-error-dark text-white' 
    : confirmButtonColor + ' text-white';
  
  const dialogContent = (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-vs-gray-800 mb-2">{title}</h3>
          <p className="text-vs-gray-600">{message}</p>
        </div>
        
        <div className="px-6 py-4 bg-vs-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-vs-gray-300 text-vs-gray-700 rounded-lg hover:bg-vs-gray-100 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${confirmButtonClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(dialogContent, modalRoot);
};

// Hook pour utiliser la boîte de dialogue de confirmation
export const useConfirmDialog = () => {
  const [dialogProps, setDialogProps] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    onConfirm: () => {},
    isDestructive: false,
  });
  
  const confirm = ({
    title = 'Confirmation',
    message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    onConfirm = () => {},
    isDestructive = false,
  }) => {
    return new Promise((resolve) => {
      setDialogProps({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          onConfirm();
          resolve(true);
        },
        isDestructive,
      });
    });
  };
  
  const closeDialog = () => {
    setDialogProps((prev) => ({ ...prev, isOpen: false }));
  };
  
  return {
    confirm,
    ConfirmDialog: (
      <ConfirmDialog
        {...dialogProps}
        onClose={closeDialog}
      />
    ),
  };
};

export default ConfirmDialog;
