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
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>数据表</h2>
        <button onClick={loadTables} className="icon-btn" title="刷新列表">
          <Icons.Refresh size={16} />
        </button>
      </div>

      <div className="search-box">
        <Icons.Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="搜索数据表..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <div className="sidebar-loading">加载中...</div>}

      <ul className="table-list">
        {filteredTables.map((table) => (
          <li
            key={table}
            className={selectedTable === table ? "active" : ""}
            onClick={() => setSelectedTable(table)}
          >
            <Icons.Table size={16} className="table-icon" />
            <span className="table-name">{table}</span>
          </li>
        ))}
        {filteredTables.length === 0 && !loading && (
          <li className="no-results">未找到匹配的表</li>
        )}
      </ul>
    </aside>
  );
}

export default Sidebar;
