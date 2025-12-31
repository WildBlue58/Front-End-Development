import DataTable from "./DataTable";
import "./QueryResult.css";

function QueryResult({ data, loading, error }) {
  if (loading) {
    return (
      <div className="query-result">
        <div className="query-status">执行中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="query-result">
        <div className="query-error">
          <h4>执行失败</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="query-result">
        <div className="query-status">查询结果为空</div>
      </div>
    );
  }

  const columns = Object.keys(data[0] || {});
  if (columns.length === 0) {
    return (
      <div className="query-result">
        <div className="query-status">查询结果为空</div>
      </div>
    );
  }

  return (
    <div className="query-result">
      <div className="result-header">
        <h3>查询结果</h3>
        <span className="result-count">共 {data.length} 条记录</span>
      </div>
      <DataTable data={data} columns={columns} primaryKey={columns[0]} />
    </div>
  );
}

export default QueryResult;
