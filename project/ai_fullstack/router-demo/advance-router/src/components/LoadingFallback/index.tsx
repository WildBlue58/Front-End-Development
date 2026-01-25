export default function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px] w-full bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner 动画 - 组合了 spin 和 pulse 效果 */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 animate-pulse-fast"></div>
        </div>
        
        {/* 文字加载动画 */}
        <p className="text-gray-500 font-medium text-lg animate-pulse">
          Loading
          <span className="inline-block animate-[bounce_1s_infinite_100ms]">.</span>
          <span className="inline-block animate-[bounce_1s_infinite_200ms]">.</span>
          <span className="inline-block animate-[bounce_1s_infinite_300ms]">.</span>
        </p>
      </div>
    </div>
  )
}
