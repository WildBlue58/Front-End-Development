import { useState } from 'react';

function GradeTable({ grades, statistics }) {
  const [sortField, setSortField] = useState('totalScore');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedGrades = [...grades].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (aVal === null || aVal === undefined) aVal = -1;
    if (bVal === null || bVal === undefined) bVal = -1;

    if (sortDirection === 'asc') {
      return aVal - bVal;
    } else {
      return bVal - aVal;
    }
  });

  const getScoreClass = (score) => {
    if (score === null || score === undefined) return 'text-slate-500';
    if (score >= 90) return 'text-emerald-400 font-semibold';
    if (score >= 80) return 'text-sky-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400 font-semibold';
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (!grades || grades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg">暂无成绩数据</p>
        <p className="text-sm mt-2">请点击"提取成绩"按钮开始获取数据</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {statistics && (
        <div className="mb-4 p-4 bg-gradient-to-r from-sky-500/10 to-purple-500/10 border border-sky-500/20 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-200 mb-3">成绩统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-sky-400">{statistics.totalCourses}</p>
              <p className="text-xs text-slate-400 mt-1">总课程数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{statistics.averageRegular.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">平均平时分</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{statistics.averageFinal.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">平均期末分</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{statistics.averageTotal.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">平均总分</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{statistics.maxTotal}</p>
              <p className="text-xs text-slate-400 mt-1">最高分</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{statistics.minTotal}</p>
              <p className="text-xs text-slate-400 mt-1">最低分</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{statistics.passedCourses}/{statistics.totalCourses}</p>
              <p className="text-xs text-slate-400 mt-1">及格课程</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/20">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-900 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
            <tr>
              <th 
                className="px-4 py-3 text-left font-semibold text-slate-500 border-b border-white/10 uppercase text-xs tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('courseName')}
              >
                课程名称 {renderSortIcon('courseName')}
              </th>
              <th 
                className="px-4 py-3 text-center font-semibold text-slate-500 border-b border-white/10 uppercase text-xs tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('regularScore')}
              >
                平时分 {renderSortIcon('regularScore')}
              </th>
              <th 
                className="px-4 py-3 text-center font-semibold text-slate-500 border-b border-white/10 uppercase text-xs tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('finalScore')}
              >
                期末分 {renderSortIcon('finalScore')}
              </th>
              <th 
                className="px-4 py-3 text-center font-semibold text-slate-500 border-b border-white/10 uppercase text-xs tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('totalScore')}
              >
                总分 {renderSortIcon('totalScore')}
              </th>
              <th 
                className="px-4 py-3 text-center font-semibold text-slate-500 border-b border-white/10 uppercase text-xs tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('credit')}
              >
                学分 {renderSortIcon('credit')}
              </th>
              <th 
                className="px-4 py-3 text-center font-semibold text-slate-500 border-b border-white/10 uppercase text-xs tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('gpa')}
              >
                绩点 {renderSortIcon('gpa')}
              </th>
              <th 
                className="px-4 py-3 text-center font-semibold text-slate-500 border-b border-white/10 uppercase text-xs tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('semester')}
              >
                学期 {renderSortIcon('semester')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedGrades.map((grade, index) => (
              <tr 
                key={index} 
                className="hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-b-0"
              >
                <td className="px-4 py-3 text-slate-300 font-medium">
                  {grade.courseName || '-'}
                </td>
                <td className={`px-4 py-3 text-center ${getScoreClass(grade.regularScore)}`}>
                  {grade.regularScore !== null && grade.regularScore !== undefined ? grade.regularScore : '-'}
                </td>
                <td className={`px-4 py-3 text-center ${getScoreClass(grade.finalScore)}`}>
                  {grade.finalScore !== null && grade.finalScore !== undefined ? grade.finalScore : '-'}
                </td>
                <td className={`px-4 py-3 text-center ${getScoreClass(grade.totalScore)}`}>
                  {grade.totalScore !== null && grade.totalScore !== undefined ? grade.totalScore : '-'}
                </td>
                <td className="px-4 py-3 text-center text-slate-400">
                  {grade.credit !== null && grade.credit !== undefined ? grade.credit : '-'}
                </td>
                <td className="px-4 py-3 text-center text-slate-400">
                  {grade.gpa !== null && grade.gpa !== undefined ? grade.gpa : '-'}
                </td>
                <td className="px-4 py-3 text-center text-slate-400 text-xs">
                  {grade.semester || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GradeTable;
