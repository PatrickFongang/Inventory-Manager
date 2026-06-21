export function parseQuantity(value) {
  if (value === '' || value === '-') {
    return 0
  }
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export default function QuantityControl({ value, onChange, onStep }) {
  function handleFocus(event) {
    if (value === '0') {
      onChange('')
    }
    event.target.select()
  }

  function handleBlur() {
    if (value === '' || value === '-') {
      onChange('0')
    }
  }

  return (
    <div className="flex items-stretch gap-3">
      <button
        type="button"
        onClick={() => onStep(-1)}
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-4xl font-bold text-white active:bg-rose-700"
        aria-label="Zmniejsz"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="h-20 w-full min-w-0 rounded-2xl border-2 border-slate-700 bg-slate-900 text-center text-4xl font-extrabold text-slate-100 outline-none focus:border-sky-500"
      />
      <button
        type="button"
        onClick={() => onStep(1)}
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-4xl font-bold text-white active:bg-emerald-700"
        aria-label="Zwiększ"
      >
        +
      </button>
    </div>
  )
}
