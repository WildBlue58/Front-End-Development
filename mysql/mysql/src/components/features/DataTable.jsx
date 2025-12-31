import { useState } from "react";
import "./DataTable.css";

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
      return <span className="null-value">NULL</span>;
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    const strValue = String(value);
    if (strValue.length > 50) {
      return (
        <span title={strValue} className="truncated">
          {strValue.substring(0, 50)}...
        </span>
      );
    }
    return strValue;
  };

  return (
    <div className="data-table-container">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {onDelete && (
                <th className="select-column">
                  <input
                    type="checkbox"
                    checked={
                      data.length > 0 && selectedRows.size === data.length
                    }
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
              {(onEdit || onDelete) && <th className="actions-column">操作</th>}
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
                  className="empty-row"
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowKey = getRowKey(row, index);
                return (
                  <tr key={rowKey}>
                    {onDelete && (
                      <td className="select-column">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(rowKey)}
                          onChange={() => handleSelectRow(rowKey)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col} title={String(row[col] || "")}>
                        {renderCell(row[col], col)}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="actions-column">
                        <div className="action-buttons">
                          {onEdit && (
                            <button
                              className="btn-action btn-edit"
                              onClick={() => onEdit(row)}
                              title="编辑"
                            >
                              编辑
                            </button>
                          )}
                          {onDelete && (
                            <button
                              className="btn-action btn-delete"
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
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            上一页
          </button>
          <span className="pagination-info">
            第 {pagination.page} 页 / 共 {pagination.totalPages} 页 （共{" "}
            {pagination.total} 条）
          </span>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            下一页
          </button>
        </div>
      )}
      {selectedRows.size > 0 && (
        <div className="selection-info">已选择 {selectedRows.size} 条记录</div>
      )}
    </div>
  );
}

export default DataTable;
