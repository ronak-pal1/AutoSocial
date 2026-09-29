import React from 'react';
import { useToastStore, type ToastType } from '../../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
};

const borderColors: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200',
  error: 'border-rose-500/30 bg-rose-950/40 text-rose-200',
  info: 'border-sky-500/30 bg-sky-950/40 text-sky-200',
  warning: 'border-amber-500/30 bg-amber-950/40 text-amber-200'
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-md w-full pointer-events-none px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-3 ${borderColors[toast.type]}`}
        >
          {icons[toast.type]}
          <div className="flex-1 min-w-0">
            {toast.title && <h4 className="text-sm font-semibold mb-0.5 text-white">{toast.title}</h4>}
            <p className="text-xs leading-relaxed break-words text-slate-300">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
