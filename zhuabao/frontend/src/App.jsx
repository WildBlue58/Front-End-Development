import { useState, useEffect } from 'react';
import { gradeAPI } from './services/gradeAPI';
import GradeTable from './components/GradeTable';
import ExportButton from './components/ExportButton';

function App() {
  const [grades, setGrades] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const result = await gradeAPI.getStatus();
      setStatus(result.data);
      if (result.data.hasGrades) {
        loadCurrentGrades();
      }
    } catch (err) {
      console.error('检查状态失败:', err);
    }
  };

  const loadCurrentGrades = async () => {
    try {
      const result = await gradeAPI.getCurrentGrades();
      setGrades(result.data);
      setStatistics(result.statistics);
    } catch (err) {
      console.error('加载当前成绩失败:', err);
    }
  };

  const handleExtract = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await gradeAPI.extractGrades();
      setGrades(result.data);
      setStatistics(result.statistics);
      showToast('成绩提取成功！', 'success');
      
      await checkStatus();
    } catch (err) {
      setError(err.message);
      showToast('提取失败: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await gradeAPI.refreshGrades();
      setGrades(result.data);
      setStatistics(result.statistics);
      showToast('成绩刷新成功！', 'success');
    } catch (err) {
      setError(err.message);
      showToast('刷新失败: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      await gradeAPI.closeBrowser();
      setGrades([]);
      setStatistics(null);
      setStatus(null);
      showToast('浏览器已关闭', 'success');
    } catch (err) {
      showToast('关闭失败: ' + err.message, 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">学生成绩提取工具</h1>
              <p className="text-slate-400">从教务系统自动提取并分析学生成绩</p>
            </div>
            {status && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-white/10">
                <div className={`w-2 h-2 rounded-full ${status.isInitialized ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                <span className="text-sm text-slate-400">
                  {status.isInitialized ? '浏览器已连接' : '浏览器未连接'}
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <button
            onClick={handleExtract}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-sky-500/20"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                提取中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                提取成绩
              </>
            )}
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading || !status?.isInitialized}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新成绩
          </button>

          <ExportButton 
            disabled={loading || grades.length === 0}
            onExport={showToast}
          />

          <div className="flex-1" />

          <button
            onClick={handleClose}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            关闭浏览器
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <GradeTable grades={grades} statistics={statistics} />
        </div>

        <footer className="mt-8 text-center text-slate-500 text-sm">
          <p>目标网站: https://172-20-130-13.atrust.ecut.edu.cn/jwglxt/cjcx/cjcx_cxDgXscj.html</p>
          <p className="mt-2">请确保在浏览器中已登录教务系统</p>
        </footer>
      </div>

      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : toast.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
