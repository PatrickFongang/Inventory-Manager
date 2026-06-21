export default function Spinner({ label = 'Ładowanie...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500" />
      <p className="text-xl font-semibold text-slate-300">{label}</p>
    </div>
  )
}
