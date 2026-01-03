function QueryResult({ data, loading, error }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-sky-500 animate-spin"></div>
        <span>执行中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-400">
        <h4 className="font-semibold mb-2">执行出错</h4>
        <pre className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
          {error}
        </pre>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
        <p>执行结果将显示在这里</p>
      </div>
    );
  }

  // Handle non-select queries (like INSERT, UPDATE, DELETE) which might return an object with affectedRows
  if (!Array.isArray(data)) {
    return (
      <div className="p-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span>✓</span> 执行成功
          </h4>
          <pre className="font-mono text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-6 text-slate-400 flex flex-col items-center justify-center h-full">
        <p>查询结果为空</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="flex flex-col h-full bg-slate-900/30">
      <div className="px-4 py-2 border-b border-white/10 bg-black/20 flex justify-between items-center">
        <span className="text-xs text-slate-400 uppercase tracking-wider">
          查询结果
        </span>
        <span className="text-xs text-slate-500">{data.length} 行</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left border-collapse min-w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="sticky top-0 z-10 bg-slate-800 px-4 py-2 text-slate-400 font-medium border-b border-white/10 border-r border-white/5 last:border-r-0 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-slate-900/40">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 border-b border-white/5 border-r border-white/5 last:border-r-0 text-slate-300 whitespace-nowrap max-w-[300px] overflow-hidden text-ellipsis"
                    title={String(row[col])}
                  >
                    {row[col] === null ? (
                      <span className="text-slate-600 italic text-xs">
                        NULL
                      </span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QueryResult;
