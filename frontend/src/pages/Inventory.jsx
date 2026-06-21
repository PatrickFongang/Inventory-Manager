import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchProducts, saveDraft, submitInventory, updateInventoryEntry } from '../api.js'
import Spinner from '../components/Spinner.jsx'
import StatusScreen from '../components/StatusScreen.jsx'
import QuantityControl, { parseQuantity } from '../components/QuantityControl.jsx'

const AUTOSAVE_DELAY = 600

export default function Inventory() {
  const { worker } = useParams()
  const workerName = decodeURIComponent(worker)
  const navigate = useNavigate()
  const saveTimers = useRef({})

  const [pendingProducts, setPendingProducts] = useState([])
  const [submittedProducts, setSubmittedProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const [status, setStatus] = useState('loading')
  const [submitState, setSubmitState] = useState('idle')
  const [saveState, setSaveState] = useState('idle')
  const [showSubmitted, setShowSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  function load() {
    setStatus('loading')
    fetchProducts(workerName)
      .then((data) => {
        const pending = data.filter((product) => !product.submitted)
        const submitted = data.filter((product) => product.submitted)
        const initial = {}
        pending.forEach((product) => {
          initial[product.id] = product.entryId
            ? String(product.quantity ?? 0)
            : '0'
        })
        submitted.forEach((product) => {
          initial[product.id] = String(product.quantity ?? 0)
        })
        setPendingProducts(pending)
        setSubmittedProducts(submitted)
        setQuantities(initial)
        setSaveState('idle')
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(() => {
    load()
    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout)
    }
  }, [workerName])

  function scheduleAutoSave(productId, value) {
    clearTimeout(saveTimers.current[productId])
    setSaveState('saving')
    saveTimers.current[productId] = setTimeout(() => {
      saveDraft({
        workerName,
        productId,
        quantity: parseQuantity(value),
      })
        .then((entry) => {
          setPendingProducts((prev) =>
            prev.map((product) =>
              product.id === productId
                ? { ...product, entryId: entry.id, quantity: entry.quantity }
                : product,
            ),
          )
          setSaveState('saved')
        })
        .catch(() => setSaveState('error'))
    }, AUTOSAVE_DELAY)
  }

  function setValue(id, value) {
    setQuantities((prev) => ({ ...prev, [id]: value }))
    if (pendingProducts.some((product) => product.id === id)) {
      scheduleAutoSave(id, value)
    }
  }

  function step(id, delta) {
    setQuantities((prev) => {
      const next = parseQuantity(prev[id]) + delta
      const value = String(next < 0 ? 0 : next)
      if (pendingProducts.some((product) => product.id === id)) {
        scheduleAutoSave(id, value)
      }
      return { ...prev, [id]: value }
    })
  }

  function handleSubmitPending() {
    const productsToSubmit = pendingProducts.filter((product) => product.entryId)
    if (productsToSubmit.length === 0) {
      setSubmitState('error')
      return
    }
    setSubmitState('sending')
    const entries = productsToSubmit.map((product) => ({
      workerName,
      productId: product.id,
      quantity: parseQuantity(quantities[product.id]),
    }))
    submitInventory(entries)
      .then(() => {
        setSuccessMessage('Wysłano ' + entries.length + ' produktów do inwentaryzacji.')
        setSubmitState('success')
      })
      .catch(() => setSubmitState('error'))
  }

  function handleSaveSubmitted(product) {
    setSubmitState('sending')
    updateInventoryEntry(product.entryId, parseQuantity(quantities[product.id]))
      .then(() => {
        setSuccessMessage('Zaktualizowano wpis dla: ' + product.name)
        setSubmitState('success')
      })
      .catch(() => setSubmitState('error'))
  }

  function handleContinue() {
    setSubmitState('idle')
    setSuccessMessage('')
    setShowSubmitted(false)
    load()
  }

  if (status === 'loading') {
    return <Spinner label="Pobieranie produktów..." />
  }

  if (status === 'error') {
    return (
      <StatusScreen
        title="Nie udało się pobrać produktów"
        message="Sprawdź połączenie i spróbuj ponownie."
        onRetry={load}
      />
    )
  }

  if (submitState === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500 text-6xl text-white">
          ✓
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100">Wysłano!</h2>
        <p className="text-lg text-slate-400">{successMessage}</p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <button
            onClick={handleContinue}
            className="rounded-2xl bg-sky-600 px-10 py-5 text-xl font-bold text-white active:bg-sky-700"
          >
            Kontynuuj liczenie
          </button>
          <button
            onClick={() => navigate('/')}
            className="rounded-2xl bg-slate-700 px-10 py-5 text-xl font-bold text-white active:bg-slate-600"
          >
            Powrót do startu
          </button>
        </div>
      </div>
    )
  }

  const allDone = pendingProducts.length === 0 && submittedProducts.length > 0
  const draftCount = pendingProducts.filter((product) => product.entryId).length

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-800 bg-slate-900/95 px-4 py-4 backdrop-blur">
        <button
          onClick={() => navigate('/')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-2xl text-slate-200 active:bg-slate-700"
          aria-label="Powrót"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-400">Pracownik</p>
          <h1 className="truncate text-xl font-bold text-slate-100">{workerName}</h1>
          {saveState === 'saving' && (
            <p className="text-xs text-slate-500">Zapisywanie...</p>
          )}
          {saveState === 'saved' && (
            <p className="text-xs text-emerald-400">Zapisano automatycznie</p>
          )}
          {saveState === 'error' && (
            <p className="text-xs text-rose-400">Błąd autozapisu</p>
          )}
        </div>
        {submittedProducts.length > 0 && (
          <button
            onClick={() => setShowSubmitted((value) => !value)}
            className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white active:bg-amber-700"
          >
            {showSubmitted ? 'Ukryj' : 'Edytuj'} ({submittedProducts.length})
          </button>
        )}
      </header>

      <div className="mx-auto max-w-md px-4 pt-5">
        {allDone && !showSubmitted && (
          <div className="mb-5 rounded-2xl border border-emerald-700 bg-emerald-900/40 p-5 text-center">
            <p className="text-lg font-bold text-emerald-300">Wszystko policzone!</p>
            <p className="mt-1 text-sm text-emerald-400/80">
              Możesz edytować wysłane produkty przyciskiem u góry.
            </p>
          </div>
        )}

        {showSubmitted && submittedProducts.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-amber-300">Wysłane — edycja</h2>
            <div className="flex flex-col gap-4">
              {submittedProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-3xl border border-amber-800/60 bg-amber-950/30 p-5"
                >
                  <p className="mb-4 text-center text-xl font-bold text-slate-100">
                    {product.name}
                  </p>
                  <QuantityControl
                    value={quantities[product.id]}
                    onChange={(value) => setValue(product.id, value)}
                    onStep={(delta) => step(product.id, delta)}
                  />
                  <button
                    onClick={() => handleSaveSubmitted(product)}
                    disabled={submitState === 'sending'}
                    className="mt-4 w-full rounded-2xl bg-amber-600 px-6 py-4 text-lg font-bold text-white active:bg-amber-700 disabled:opacity-50"
                  >
                    ZAPISZ ZMIANĘ
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!showSubmitted && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-sky-300">
              Do policzenia ({pendingProducts.length})
            </h2>
            {draftCount > 0 && (
              <p className="mb-4 text-sm text-slate-400">
                Przywrócono {draftCount} zapisanych wcześniej produktów.
              </p>
            )}
            {pendingProducts.length === 0 ? (
              <p className="mt-8 text-center text-lg text-slate-400">
                Brak produktów do policzenia.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingProducts.map((product) => (
                  <div
                    key={product.id}
                    className={'rounded-3xl border p-5 ' + (
                      product.entryId
                        ? 'border-sky-800/60 bg-sky-950/20'
                        : 'border-slate-800 bg-slate-800/60'
                    )}
                  >
                    <p className="mb-4 text-center text-xl font-bold text-slate-100">
                      {product.name}
                    </p>
                    <QuantityControl
                      value={quantities[product.id]}
                      onChange={(value) => setValue(product.id, value)}
                      onStep={(delta) => step(product.id, delta)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {!showSubmitted && pendingProducts.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-900/95 px-4 py-4 backdrop-blur">
          <div className="mx-auto max-w-md">
            {submitState === 'error' && (
              <p className="mb-3 text-center text-base font-semibold text-rose-400">
                {draftCount === 0
                  ? 'Wpierw wpisz ilości — zapisują się automatycznie.'
                  : 'Nie udało się wysłać. Spróbuj ponownie.'}
              </p>
            )}
            <button
              onClick={handleSubmitPending}
              disabled={submitState === 'sending'}
              className="w-full rounded-2xl bg-sky-600 px-6 py-6 text-2xl font-extrabold tracking-wide text-white shadow-lg active:bg-sky-700 disabled:opacity-50"
            >
              {submitState === 'sending' ? 'WYSYŁANIE...' : 'WYŚLIJ INWENTARYZACJĘ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
