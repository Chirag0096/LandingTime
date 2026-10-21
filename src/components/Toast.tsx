import React from 'react';
import { useCookingSession } from '../context/CookingSessionContext';
import { Check, AlertTriangle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useCookingSession();

  if (!toast.show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-6 z-50 max-w-md w-full px-4 transition-all duration-300 transform translate-y-0 opacity-100"
    >
      <div className="bg-white/95 backdrop-blur-md border border-[#E5E5DF] rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex items-center gap-3.5 text-[#202124]">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            toast.type === 'amber'
              ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
              : toast.type === 'info'
              ? 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0284C7]'
              : 'bg-[#EBF4F0] border-[#C4DDD3] text-[#3D8065]'
          }`}
        >
          {toast.type === 'amber' ? (
            <AlertTriangle className="w-5 h-5" />
          ) : toast.type === 'info' ? (
            <Info className="w-5 h-5" />
          ) : (
            <Check className="w-5 h-5 stroke-[2.5]" />
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-xs font-bold text-[#202124] truncate">{toast.title}</span>
          <span className="text-xs text-[#737780] truncate">{toast.message}</span>
        </div>
        <button
          onClick={hideToast}
          aria-label="Close notification"
          className="text-[#9CA3AF] hover:text-[#202124] transition-colors p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
