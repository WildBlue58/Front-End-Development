import Icons from "../common/Icons";

function Sidebar({
  loadTables,
  searchTerm,
  setSearchTerm,
  loading,
  filteredTables,
  selectedTable,
  setSelectedTable,
}) {
  return (
    <aside className="w-[260px] min-w-[260px] bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col h-full shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="m-0 text-sm text-slate-400 uppercase tracking-wider font-semibold">
          数据表
        </h2>
        <button
          onClick={loadTables}
          className="text-slate-400 hover:text-slate-100 hover:bg-white/10 p-1.5 rounded transition-colors"
          title="刷新列表"
        >
          <Icons.Refresh size={16} />
        </button>
      </div>

      <div className="relative mb-4">
        <Icons.Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="搜索数据表..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 focus:bg-black/30 transition-all placeholder-slate-600"
        />
      </div>

      {loading && (
        <div className="text-center text-slate-500 text-sm py-4 italic">
          加载中...
        </div>
      )}

      <ul className="flex-1 overflow-y-auto pr-1 space-y-1">
        {filteredTables.map((table) => (
          <li
            key={table}
            className={`
              px-3 py-2.5 rounded-lg cursor-pointer text-sm flex items-center gap-3 border transition-all
              ${
                selectedTable === table
                  ? "bg-sky-500/15 text-sky-400 border-sky-500/20 font-medium"
                  : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }
            `}
            onClick={() => setSelectedTable(table)}
          >
            <Icons.Table
              size={16}
              className={selectedTable === table ? "opacity-100" : "opacity-70"}
            />
            <span className="truncate">{table}</span>
          </li>
        ))}
        {filteredTables.length === 0 && !loading && (
          <li className="text-center text-slate-500 text-sm py-4 italic">
            未找到匹配的表
          </li>
        )}
      </ul>
    </aside>
  );
}

export default Sidebar;
