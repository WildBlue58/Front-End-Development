import { useState } from "react";

function SQLExecutor({ onExecute, loading }) {
  const [sql, setSql] = useState("");
  const [history, setHistory] = useState([]);

  const handleExecute = () => {
    if (!sql.trim()) {
      return;
    }
    onExecute(sql);
    // 添加到历史记录
    if (!history.includes(sql)) {
      setHistory([sql, ...history].slice(0, 10)); // 保留最近10条
    }
  };

  const handleHistoryClick = (query) => {
    setSql(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleExecute();
    }
  };

  return (
    <div className="flex flex-col gap-0 p-0 h-full">
      <div className="flex flex-col bg-slate-800/50 border-b border-white/10">
        <div className="flex justify-between items-center px-6 py-3 bg-black/10 border-b border-white/10">
          <h3 className="text-slate-400 m-0 text-sm font-medium uppercase tracking-wider">
            SQL 查询编辑器
          </h3>
          <div className="flex gap-3">
            <button
              className="btn btn-primary"
              onClick={handleExecute}
              disabled={loading || !sql.trim()}
            >
              执行 (Ctrl+Enter)
            </button>
            <button className="btn btn-secondary" onClick={() => setSql("")}>
              清空
            </button>
          </div>
        </div>
        <textarea
          className="w-full p-6 bg-transparent border-none text-slate-200 font-mono text-sm leading-relaxed resize-y min-h-[200px] focus:outline-none placeholder-slate-600"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入 SQL 查询语句（仅支持 SELECT 查询）&#10;按 Ctrl+Enter 执行"
          rows={10}
        />
      </div>
      {history.length > 0 && (
        <div className="border-t border-white/10 bg-slate-900/30">
          <h4 className="text-slate-500 m-0 px-6 py-3 text-xs uppercase tracking-wider bg-black/20 border-b border-white/10">
            查询历史
          </h4>
          <div className="flex flex-col max-h-[150px] overflow-y-auto">
            {history.map((query, index) => (
              <div
                key={index}
                className="px-6 py-3 border-b border-white/10 text-slate-400 text-sm cursor-pointer hover:bg-white/5 hover:text-slate-100 transition-all font-mono truncate"
                onClick={() => handleHistoryClick(query)}
                title={query}
              >
                {query.length > 60 ? `${query.substring(0, 60)}...` : query}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SQLExecutor;
