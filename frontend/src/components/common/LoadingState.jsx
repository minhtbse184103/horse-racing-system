export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white p-8 shadow-soft">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#1B5E20]" />
        <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
      </div>
    </div>
  );
}
