export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-12 h-12 rounded-full absolute border-4 border-solid border-gray-700"></div>
        {/* Inner Spinning Ring */}
        <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-solid border-blue-500 border-t-transparent"></div>
      </div>
      <p className="mt-16 text-sm font-semibold text-blue-400 tracking-widest uppercase animate-pulse">Memuat Data...</p>
    </div>
  );
}
