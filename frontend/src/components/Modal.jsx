import { X, AlertTriangle } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-content ${sizes[size] || sizes.md} animate-scale-in`}>
        <div className="modal-header">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="btn-ghost btn-icon text-gray-400">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true, loading }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md animate-scale-in">
        <div className="modal-body text-center py-6">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 
            ${danger ? 'bg-red-50' : 'bg-yellow-50'}`}>
            <AlertTriangle size={28} className={danger ? 'text-red-500' : 'text-yellow-500'} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={onConfirm} disabled={loading}
              className={danger ? 'btn-danger' : 'btn-primary'}>
              {loading ? <span className="spinner" /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
