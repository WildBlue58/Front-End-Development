import Icons from "../common/Icons";

function Header({ connectionStatus, viewMode, setViewMode }) {
  return (
    <header className="bg-slate-900/60 backdrop-blur-md border-b border-white/10 h-16 flex justify-between items-center px-6 z-50 shadow-sm relative">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-lg shadow-sky-500/30 bg-gradient-to-br from-sky-400 to-violet-500">
          <Icons.Database size={24} />
        </div>
        <h1 className="m-0 text-xl font-bold tracking-tight text-slate-100 flex items-baseline gap-2">
          Enterprise Power{" "}
          <span className="text-xs text-slate-500 font-medium uppercase tracking-widest bg-white/10 px-1.5 py-0.5 rounded">
            DB Manager
          </span>
        </h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex gap-1 bg-black/20 p-1 rounded-lg border border-white/10">
          {[
            { id: "data", icon: Icons.Table, label: "数据" },
            { id: "structure", icon: Icons.Structure, label: "结构" },
            { id: "sql", icon: Icons.Code, label: "SQL" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all
                ${
                  viewMode === tab.id
                    ? "bg-slate-800 text-sky-400 shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }
              `}
              onClick={() => setViewMode(tab.id)}
              title={`${tab.label}视图`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div
          className={`
            flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border
            ${
              connectionStatus === "已连接"
                ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                : "text-red-400 bg-red-400/10 border-red-400/20"
            }
          `}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] bg-current`}
          ></span>
          {connectionStatus}
        </div>
      </div>
    </header>
  );
}

export default Header;
