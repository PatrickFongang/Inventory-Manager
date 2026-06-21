export default function StatusScreen({ title, message, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
      {message && <p className="text-lg text-slate-400">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-2xl bg-sky-600 px-8 py-5 text-xl font-bold text-white active:bg-sky-700"
        >
          Spróbuj ponownie
        </button>
      )}
    </div>
  )
}
