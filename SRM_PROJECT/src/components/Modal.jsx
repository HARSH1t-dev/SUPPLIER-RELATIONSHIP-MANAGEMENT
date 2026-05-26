import { X } from 'lucide-react';
import { Button } from './Button.jsx';

export function Modal({ title, children, isOpen, onClose, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    xxl: 'max-w-7xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className={`w-full ${sizes[size] || 'max-w-xl'} max-h-[calc(100vh-2rem)] flex flex-col rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-200`}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
          <Button variant="ghost" className="h-9 w-9 p-0" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5 text-slate-700 dark:text-slate-300 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
