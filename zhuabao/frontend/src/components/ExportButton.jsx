import { useState } from 'react';
import { gradeAPI } from '../services/gradeAPI';

function ExportButton({ disabled, onExport }) {
  const [exporting, setExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await gradeAPI.exportToExcel();
      onExport && onExport('Excel 导出成功');
    } catch (error) {
      console.error('导出 Excel 失败:', error);
      onExport && onExport('Excel 导出失败: ' + error.message, 'error');
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await gradeAPI.exportToCSV();
      onExport && onExport('CSV 导出成功');
    } catch (error) {
      console.error('导出 CSV 失败:', error);
      onExport && onExport('CSV 导出失败: ' + error.message, 'error');
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || exporting}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 hover:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {exporting ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        {exporting ? '导出中...' : '导出成绩'}
        <svg className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/10 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出为 Excel
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/10 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-t border-white/10"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出为 CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ExportButton;
