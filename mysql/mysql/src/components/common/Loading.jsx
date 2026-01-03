function Loading() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-3 min-h-[200px] w-full">
      <div className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-sky-500 animate-spin"></div>
      <span className="text-sm font-medium tracking-wide">LOADING...</span>
    </div>
  );
}

export default Loading;
