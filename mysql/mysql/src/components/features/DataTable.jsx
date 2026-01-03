import { useState } from "react";

function DataTable({
  data,
  columns,
  primaryKey,
  onEdit,
  onDelete,
  onPageChange,
  pagination,
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());

  // 如果没有主键，使用索引作为key
  const getRowKey = (row, index) => {
    if (primaryKey && row[primaryKey] !== undefined) {
      return row[primaryKey];
    }
    return index;
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(data.map((row, index) => getRowKey(row, index))));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const renderCell = (value, column) => {
    if (value === null || value === undefined) {
      return <span className="italic text-slate-500/60 text-xs">NULL</span>;
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    const strValue = String(value);
    if (strValue.length > 50) {
      return (
        <span
          title={strValue}
          className="cursor-help border-b border-dotted border-slate-500"
        >
          {strValue.substring(0, 50)}...
        </span>
      );
    }
    return strValue;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-[0.9rem] min-w-full">
          <thead className="sticky top-0 z-10 bg-slate-900 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
            <tr>
              {onDelete && (
                <th className="px-5 py-4 text-left font-semibold text-slate-500 border-b border-white/10 uppercase text-xs tracking-wider w-[50px] text-center">
                  <input
                    type="checkbox"
                    checked={
                      data.length > 0 && selectedRows.size === data.length
                    }
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-5 py-4 text-left font-semibold text-slate-500 border-b border-white/10 uppercase text-xs tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-5 py-4 text-center font-semibold text-slate-500 border-b border-white/10 uppercase text-xs tracking-wider w-[140px]">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (onDelete ? 1 : 0) +
                    (onEdit || onDelete ? 1 : 0)
                  }
                  className="text-center py-16 text-slate-500"
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowKey = getRowKey(row, index);
                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-white/[0.02] group transition-colors"
                  >
                    {onDelete && (
                      <td className="px-5 py-3.5 border-b border-white/5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(rowKey)}
                          onChange={() => handleSelectRow(rowKey)}
                          className="cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col}
                        title={String(row[col] || "")}
                        className="px-5 py-3.5 border-b border-white/5 text-slate-400 max-w-[300px] whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-slate-200 transition-colors"
                      >
                        {renderCell(row[col], col)}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-5 py-3.5 border-b border-white/5 text-center">
                        <div className="flex gap-2 justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                          {onEdit && (
                            <button
                              className="px-2 py-1 rounded text-xs font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white transition-colors border border-transparent"
                              onClick={() => onEdit(row)}
                              title="编辑"
                            >
                              编辑
                            </button>
                          )}
                          {onDelete && (
                            <button
                              className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-transparent"
                              onClick={() => onDelete(row)}
                              title="删除"
                            >
                              删除
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 border-t border-white/10 bg-black/15">
          <button
            className="px-3 py-1.5 bg-white/5 text-slate-200 border border-white/10 rounded hover:bg-white/10 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm min-w-[80px]"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            上一页
          </button>
          <span className="text-slate-400 text-sm">
            第 {pagination.page} 页 / 共 {pagination.totalPages} 页 （共{" "}
            {pagination.total} 条）
          </span>
          <button
            className="px-3 py-1.5 bg-white/5 text-slate-200 border border-white/10 rounded hover:bg-white/10 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm min-w-[80px]"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            下一页
          </button>
        </div>
      )}
      {selectedRows.size > 0 && (
        <div className="px-6 py-2.5 bg-sky-500/10 border-t border-sky-500/20 text-sky-400 text-sm font-medium">
          已选择 {selectedRows.size} 条记录
        </div>
      )}
    </div>
  );
}

export default DataTable;
