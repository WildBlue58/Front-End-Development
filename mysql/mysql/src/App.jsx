import { useState, useEffect, useMemo } from "react";
import { tableAPI, dataAPI, structureAPI, sqlAPI } from "./services/api";
import DataTable from "./components/features/DataTable";
import DataForm from "./components/features/DataForm";
import Modal from "./components/common/Modal";
import Loading from "./components/common/Loading";
import TableStructureViewer from "./components/features/TableStructureViewer";
import SQLExecutor from "./components/features/SQLExecutor";
import QueryResult from "./components/features/QueryResult";
import { ToastContainer } from "./components/common/Toast";
import Icons from "./components/common/Icons";
// import "./App.css"; // Removed as we are using Tailwind
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";

function App() {
  const [tables, setTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [viewMode, setViewMode] = useState("data"); // 'data', 'structure', 'sql'
  const [tableData, setTableData] = useState(null);
  const [tableStructure, setTableStructure] = useState(null);
  const [tableColumns, setTableColumns] = useState([]);
  const [primaryKey, setPrimaryKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("检查中...");
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [editingRow, setEditingRow] = useState(null);
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState(null);

  // 过滤后的表列表
  const filteredTables = useMemo(() => {
    return tables.filter((table) =>
      table.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tables, searchTerm]);

  // 显示Toast消息
  const showToast = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // 检查数据库连接
  useEffect(() => {
    checkConnection();
    loadTables();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await tableAPI.testConnection();
      if (result.success) {
        setConnectionStatus("已连接");
      } else {
        setConnectionStatus("连接失败");
      }
    } catch (err) {
      setConnectionStatus("连接失败");
      setError("无法连接到后端服务器，请确保后端服务已启动");
    }
  };

  const loadTables = async () => {
    try {
      setLoading(true);
      const result = await tableAPI.getTables();
      if (result.success) {
        const tableNames = result.data.map((table) => table.name);
        setTables(tableNames);
        if (tableNames.length > 0 && !selectedTable) {
          setSelectedTable(tableNames[0]);
        }
      }
    } catch (err) {
      showToast("获取表列表失败: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      setTableData(null);
      const result = await dataAPI.getTableData(tableName, page, 100);
      if (result.success) {
        setTableData(result);
        setCurrentPage(page);
        // 获取列信息用于编辑
        await loadTableColumns(tableName);
      } else {
        setError(result.message || "获取数据失败");
      }
    } catch (err) {
      setError("获取数据失败: " + err.message);
      setTableData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadTableColumns = async (tableName) => {
    try {
      const result = await structureAPI.getTableStructure(tableName);
      if (result.success) {
        setTableColumns(result.data.columns);
        // 查找主键
        const pkColumn = result.data.columns.find(
          (col) => col.COLUMN_KEY === "PRI"
        );
        if (pkColumn) {
          setPrimaryKey(pkColumn.COLUMN_NAME);
        } else if (result.data.constraints?.primaryKeys?.length > 0) {
          setPrimaryKey(result.data.constraints.primaryKeys[0]);
        }
      }
    } catch (err) {
      console.error("获取列信息失败:", err);
    }
  };

  const loadTableStructure = async (tableName) => {
    try {
      setLoading(true);
      setError(null);
      const result = await structureAPI.getTableStructure(tableName);
      if (result.success) {
        setTableStructure(result.data);
      } else {
        setError(result.message || "获取表结构失败");
      }
    } catch (err) {
      setError("获取表结构失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      if (viewMode === "data") {
        loadTableData(selectedTable, 1); // 切换表时重置到第一页
      } else if (viewMode === "structure") {
        loadTableStructure(selectedTable);
      }
    }
  }, [selectedTable, viewMode]);

  useEffect(() => {
    if (selectedTable && viewMode === "data") {
      loadTableData(selectedTable, currentPage);
    }
  }, [currentPage]);

  // 处理数据操作
  const handleCreate = () => {
    setModalMode("create");
    setEditingRow(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setModalMode("edit");
    setEditingRow(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("确定要删除这条记录吗？")) {
      return;
    }

    try {
      const result = await dataAPI.deleteData(
        selectedTable,
        row[primaryKey],
        primaryKey
      );
      if (result.success) {
        showToast("删除成功", "success");
        loadTableData(selectedTable, currentPage);
      } else {
        showToast("删除失败: " + result.message, "error");
      }
    } catch (err) {
      showToast("删除失败: " + err.message, "error");
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (modalMode === "create") {
        const result = await dataAPI.insertData(selectedTable, formData);
        if (result.success) {
          showToast("创建成功", "success");
          setIsModalOpen(false);
          loadTableData(selectedTable, currentPage);
        } else {
          showToast("创建失败: " + result.message, "error");
        }
      } else {
        const result = await dataAPI.updateData(
          selectedTable,
          editingRow[primaryKey],
          primaryKey,
          formData
        );
        if (result.success) {
          showToast("更新成功", "success");
          setIsModalOpen(false);
          loadTableData(selectedTable, currentPage);
        } else {
          showToast("更新失败: " + result.message, "error");
        }
      }
    } catch (err) {
      showToast(
        (modalMode === "create" ? "创建" : "更新") + "失败: " + err.message,
        "error"
      );
    }
  };

  // 处理SQL执行
  const handleSQLExecute = async (sql) => {
    try {
      setSqlLoading(true);
      setSqlError(null);
      setSqlResult(null);
      const result = await sqlAPI.executeSQL(sql);
      if (result.success) {
        setSqlResult(result.data);
        showToast("查询执行成功", "success");
      } else {
        setSqlError(result.message || "执行失败");
        showToast("查询执行失败: " + result.message, "error");
      }
    } catch (err) {
      setSqlError(err.message);
      showToast("查询执行失败: " + err.message, "error");
    } finally {
      setSqlLoading(false);
    }
  };

  const renderContent = () => {
    if (viewMode === "structure") {
      return (
        <div className="flex-1 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col overflow-hidden relative shadow-xl animate-fade-in">
          {loading && <Loading />}
          {error && (
            <div className="m-6 bg-red-500/15 border border-red-500/20 text-red-300 p-4 rounded-lg flex items-center">
              <p>❌ {error}</p>
            </div>
          )}
          {tableStructure && (
            <TableStructureViewer structure={tableStructure} />
          )}
        </div>
      );
    }

    if (viewMode === "sql") {
      return (
        <div className="flex-1 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col overflow-hidden relative shadow-xl animate-fade-in">
          <div className="flex-none border-b border-white/10">
            <SQLExecutor onExecute={handleSQLExecute} loading={sqlLoading} />
          </div>
          <div className="flex-1 overflow-hidden flex flex-col bg-black/20">
            <QueryResult
              data={sqlResult}
              loading={sqlLoading}
              error={sqlError}
            />
          </div>
        </div>
      );
    }

    // 数据视图
    return (
      <div className="flex-1 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col overflow-hidden relative shadow-xl animate-fade-in">
        <div className="p-5 border-b border-white/10 bg-black/10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="m-0 text-slate-100 flex items-center gap-3 text-xl font-semibold">
              {tableData?.tableType === "VIEW" ? (
                <Icons.View size={20} />
              ) : (
                <Icons.Table size={20} />
              )}
              {selectedTable}
              {tableData?.tableType === "VIEW" && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20 uppercase tracking-wider">
                  视图
                </span>
              )}
            </h3>
            {tableData?.tableType !== "VIEW" && (
              <button className="btn btn-primary" onClick={handleCreate}>
                <Icons.Plus size={16} />
                新增记录
              </button>
            )}
          </div>
          {tableData?.pagination && (
            <p className="m-0 text-slate-400 text-sm">
              共 {tableData.pagination.total} 条记录，当前显示{" "}
              {tableData.data.length} 条（第 {tableData.pagination.page} 页，共{" "}
              {tableData.pagination.totalPages} 页）
            </p>
          )}
        </div>
        {loading && !tableData && <Loading />}
        {error && (
          <div className="m-6 bg-red-500/15 border border-red-500/20 text-red-300 p-4 rounded-lg flex items-center">
            <p>❌ {error}</p>
          </div>
        )}
        {tableData && tableData.data && tableData.data.length > 0 && (
          <DataTable
            data={tableData.data}
            columns={Object.keys(tableData.data[0] || {})}
            primaryKey={primaryKey || Object.keys(tableData.data[0] || {})[0]}
            onEdit={tableData.tableType !== "VIEW" ? handleEdit : null}
            onDelete={tableData.tableType !== "VIEW" ? handleDelete : null}
            onPageChange={(page) => setCurrentPage(page)}
            pagination={tableData.pagination}
          />
        )}
        {tableData && tableData.data && tableData.data.length === 0 && (
          <div className="text-center mt-20 text-slate-500 text-lg flex flex-col items-center gap-4">
            表中没有数据
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      <Header
        connectionStatus={connectionStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <div className="flex flex-1 gap-6 p-6 max-w-[1800px] mx-auto w-full h-[calc(100vh-64px)] box-border">
        <Sidebar
          loadTables={loadTables}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loading={loading}
          filteredTables={filteredTables}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
        />

        {renderContent()}
      </div>

      {/* 编辑/创建模态框 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "新增记录" : "编辑记录"}
        size="large"
      >
        <DataForm
          tableName={selectedTable}
          columns={tableColumns}
          initialData={editingRow}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Toast通知 */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
