export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-slate-50/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600"
          aria-label="Loading"
          role="status"
        />
        <p className="text-sm font-medium text-slate-700">Loading page...</p>
      </div>
    </div>
  );
}
