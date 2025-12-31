import "./TableStructureViewer.css";

function TableStructureViewer({ structure }) {
  if (!structure) {
    return <div className="empty-message">加载表结构中...</div>;
  }

  const { columns, constraints } = structure;

  return (
    <div className="structure-viewer">
      <div className="structure-section">
        <h3>列信息</h3>
        <table className="structure-table">
          <thead>
            <tr>
              <th>列名</th>
              <th>数据类型</th>
              <th>允许NULL</th>
              <th>默认值</th>
              <th>键</th>
              <th>额外信息</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, index) => (
              <tr key={index}>
                <td className="column-name">{col.COLUMN_NAME}</td>
                <td>{col.COLUMN_TYPE || col.DATA_TYPE}</td>
                <td>{col.IS_NULLABLE === "YES" ? "是" : "否"}</td>
                <td>{col.COLUMN_DEFAULT ?? "NULL"}</td>
                <td>
                  {col.COLUMN_KEY === "PRI" && (
                    <span className="badge badge-primary">主键</span>
                  )}
                  {col.COLUMN_KEY === "UNI" && (
                    <span className="badge badge-unique">唯一</span>
                  )}
                  {col.COLUMN_KEY === "MUL" && (
                    <span className="badge badge-index">索引</span>
                  )}
                </td>
                <td>{col.EXTRA || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {constraints && (
        <div className="structure-section">
          <h3>约束信息</h3>
          {constraints.primaryKeys.length > 0 && (
            <div className="constraint-group">
              <h4>主键</h4>
              <div className="constraint-list">
                {constraints.primaryKeys.map((pk, index) => (
                  <span key={index} className="badge badge-primary">
                    {pk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {constraints.foreignKeys.length > 0 && (
            <div className="constraint-group">
              <h4>外键</h4>
              <table className="constraint-table">
                <thead>
                  <tr>
                    <th>列名</th>
                    <th>引用表</th>
                    <th>引用列</th>
                  </tr>
                </thead>
                <tbody>
                  {constraints.foreignKeys.map((fk, index) => (
                    <tr key={index}>
                      <td>{fk.COLUMN_NAME}</td>
                      <td>{fk.REFERENCED_TABLE_NAME}</td>
                      <td>{fk.REFERENCED_COLUMN_NAME}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {constraints.indexes.length > 0 && (
            <div className="constraint-group">
              <h4>索引</h4>
              <table className="constraint-table">
                <thead>
                  <tr>
                    <th>索引名</th>
                    <th>列名</th>
                    <th>唯一</th>
                  </tr>
                </thead>
                <tbody>
                  {constraints.indexes.map((idx, index) => (
                    <tr key={index}>
                      <td>{idx.INDEX_NAME}</td>
                      <td>{idx.COLUMN_NAME}</td>
                      <td>{idx.NON_UNIQUE === 0 ? "是" : "否"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TableStructureViewer;

