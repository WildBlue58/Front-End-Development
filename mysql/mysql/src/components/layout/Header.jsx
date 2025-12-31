import Icons from "../common/Icons";

function Header({ connectionStatus, viewMode, setViewMode }) {
  return (
    <header className="app-header">
      <div className="logo-section">
        <div className="logo-icon">
          <Icons.Database size={24} />
        </div>
        <h1>
          Enterprise Power <span className="logo-subtitle">DB Manager</span>
        </h1>
      </div>
      <div className="header-right">
        <div className="view-tabs">
          <button
            className={`tab-btn ${viewMode === "data" ? "active" : ""}`}
            onClick={() => setViewMode("data")}
            title="数据视图"
          >
            <Icons.Table size={16} />
            <span>数据</span>
          </button>
          <button
            className={`tab-btn ${viewMode === "structure" ? "active" : ""}`}
            onClick={() => setViewMode("structure")}
            title="结构视图"
          >
            <Icons.Structure size={16} />
            <span>结构</span>
          </button>
          <button
            className={`tab-btn ${viewMode === "sql" ? "active" : ""}`}
            onClick={() => setViewMode("sql")}
            title="SQL执行器"
          >
            <Icons.Code size={16} />
            <span>SQL</span>
          </button>
        </div>
        <div
          className={`connection-badge ${
            connectionStatus === "已连接" ? "connected" : "disconnected"
          }`}
        >
          <span className="status-dot"></span>
          {connectionStatus}
        </div>
      </div>
    </header>
  );
}

export default Header;
