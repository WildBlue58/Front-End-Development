import { useEffect } from "react";

function Modal({ isOpen, onClose, title, children, size = "medium" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: "w-[90%] max-w-[400px]",
    medium: "w-[90%] max-w-[600px]",
    large: "w-[90%] max-w-[900px]",
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-[4px] flex items-center justify-center z-[1000] animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`
          bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] 
          ${sizeClasses[size]} 
          animate-[slideUp_0.3s_ease-out]
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="m-0 text-slate-100 text-xl font-semibold">{title}</h2>
          <button
            className="bg-transparent border-none text-slate-400 text-2xl cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 hover:text-slate-100 transition-all"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Modal;
