import { useState } from "react";
import "./SQLExecutor.css";

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
    <div className="sql-executor">
      <div className="sql-editor-section">
        <div className="sql-header">
          <h3>SQL 查询编辑器</h3>
          <div className="sql-actions">
            <button
              className="btn btn-primary"
              onClick={handleExecute}
              disabled={loading || !sql.trim()}
            >
              执行 (Ctrl+Enter)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setSql("")}
            >
              清空
            </button>
          </div>
        </div>
        <textarea
          className="sql-editor"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入 SQL 查询语句（仅支持 SELECT 查询）&#10;按 Ctrl+Enter 执行"
          rows={10}
        />
      </div>
      {history.length > 0 && (
        <div className="sql-history">
          <h4>查询历史</h4>
          <div className="history-list">
            {history.map((query, index) => (
              <div
                key={index}
                className="history-item"
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

