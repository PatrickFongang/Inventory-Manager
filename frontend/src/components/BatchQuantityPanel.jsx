import { useState } from 'react'
import { parseQuantity } from './QuantityControl.jsx'

function formatBatchSum(batches) {
  return batches.join(' + ')
}

export default function BatchQuantityPanel({
  value,
  batches,
  onOpen,
  onAddBatch,
  onRemoveBatch,
  onClearBatches,
}) {
  const [open, setOpen] = useState(batches.length > 0)
  const [batchInput, setBatchInput] = useState('')

  function handleOpen() {
    onOpen?.()
    setOpen(true)
  }

  function handleAddBatch(event) {
    event.preventDefault()
    const amount = parseQuantity(batchInput)
    if (amount <= 0) {
      return
    }
    onAddBatch(amount)
    setBatchInput('')
    setOpen(true)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="mt-4 w-full rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-base font-semibold text-sky-300 active:bg-slate-800"
      >
        Licz partiami
      </button>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-sky-800/50 bg-sky-950/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-sky-300">Liczenie partiami</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-400 active:bg-slate-800"
        >
          Ukryj
        </button>
      </div>

      {batches.length > 0 ? (
        <>
          <p className="mb-1 text-center text-lg font-semibold text-slate-200">
            {formatBatchSum(batches)} = {parseQuantity(value)}
          </p>
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {batches.map((amount, index) => (
              <span
                key={index + '-' + amount}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-lg font-bold text-slate-100"
              >
                {amount}
                <button
                  type="button"
                  onClick={() => onRemoveBatch(index)}
                  className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-sm text-slate-300 active:bg-slate-600"
                  aria-label={'Usuń partię ' + amount}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="mb-4 text-center text-sm text-slate-400">
          Dodawaj kolejne partie — suma trafi do pola powyżej.
        </p>
      )}

      <form onSubmit={handleAddBatch} className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder="Partia"
          className="h-14 min-w-0 flex-1 rounded-xl border-2 border-slate-700 bg-slate-900 px-4 text-2xl font-bold text-slate-100 outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={parseQuantity(batchInput) <= 0}
          className="shrink-0 rounded-xl bg-sky-600 px-5 text-lg font-bold text-white active:bg-sky-700 disabled:opacity-50"
        >
          Dodaj
        </button>
      </form>

      {batches.length > 0 && (
        <button
          type="button"
          onClick={onClearBatches}
          className="mt-3 w-full rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 active:bg-slate-800"
        >
          Wyczyść partie
        </button>
      )}
    </div>
  )
}
