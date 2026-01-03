import { useEffect } from "react";

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-6 right-6 z-[2000] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function Toast({ toast, removeToast }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast, removeToast]);

  const typeStyles = {
    success: "border-l-emerald-500 text-emerald-400",
    error: "border-l-red-500 text-red-400",
    info: "border-l-sky-500 text-sky-400",
    warning: "border-l-amber-500 text-amber-400",
  };

  return (
    <div
      className={`
        pointer-events-auto min-w-[300px] bg-slate-800/90 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-xl 
        flex items-center justify-between gap-3 animate-fade-in border-l-4
        ${typeStyles[toast.type] || typeStyles.info}
      `}
      onClick={() => removeToast(toast.id)}
    >
      <div className="text-sm font-medium">{toast.message}</div>
      <button className="text-slate-500 hover:text-white transition-colors text-lg leading-none">
        ×
      </button>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export { ToastContainer, Toast };
