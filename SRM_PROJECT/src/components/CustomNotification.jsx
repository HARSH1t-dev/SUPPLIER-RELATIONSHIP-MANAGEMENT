import { useState, useEffect } from 'react';
import { Check, X, AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from './Button.jsx';

export function CustomNotification({ 
  isOpen, 
  onClose, 
  type = 'success', // 'success' | 'error' | 'confirm' | 'prompt'
  title, 
  message, 
  onConfirm, 
  promptPlaceholder = 'Enter value...',
  defaultValue = ''
}) {
  const [promptVal, setPromptVal] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setPromptVal(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    if (type === 'prompt') {
      if (onConfirm) onConfirm(promptVal);
    } else {
      if (onConfirm) onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 font-sans">
        
        {/* Render Icon based on Type */}
        <div className="flex flex-col items-center text-center">
          {type === 'success' && (
            <div className="mb-4 rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-4 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/10">
              <Check className="h-10 w-10 animate-bounce" strokeWidth={3} />
            </div>
          )}
          {type === 'error' && (
            <div className="mb-4 rounded-full bg-rose-50 dark:bg-rose-950/30 p-4 text-rose-600 dark:text-rose-400 ring-8 ring-rose-500/10 animate-pulse">
              <X className="h-10 w-10" strokeWidth={3} />
            </div>
          )}
          {type === 'confirm' && (
            <div className="mb-4 rounded-full bg-amber-50 dark:bg-amber-950/30 p-4 text-amber-600 dark:text-amber-400 ring-8 ring-amber-500/10">
              <HelpCircle className="h-10 w-10 text-amber-600" />
            </div>
          )}
          {type === 'prompt' && (
            <div className="mb-4 rounded-full bg-blue-50 dark:bg-blue-950/30 p-4 text-blue-600 dark:text-blue-400 ring-8 ring-blue-500/10">
              <AlertCircle className="h-10 w-10 text-blue-600" />
            </div>
          )}

          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white leading-tight">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm">
            {message}
          </p>
        </div>

        {/* Input Form for Prompt */}
        <form onSubmit={handleConfirmSubmit} className="mt-5 space-y-4">
          {type === 'prompt' && (
            <input
              type="text"
              autoFocus
              value={promptVal}
              onChange={(e) => setPromptVal(e.target.value)}
              placeholder={promptPlaceholder}
              className="w-full bg-white/40 dark:bg-slate-950/40 border border-white/20 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 backdrop-blur-sm transition"
              required
            />
          )}

          {/* Buttons Layout */}
          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
            {(type === 'confirm' || type === 'prompt') ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 hover:bg-brand-700 px-4 py-2 text-xs font-bold text-white transition"
                >
                  Confirm
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-white transition text-center"
              >
                Okay
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
