import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { fetchProducts, fetchWorkers, saveDraft, submitInventory, updateInventoryEntry } from '../api.js'
import { formatWorkerShort } from '../workerName.js'
import Spinner from '../components/Spinner.jsx'
import StatusScreen from '../components/StatusScreen.jsx'
import QuantityControl, { parseQuantity } from '../components/QuantityControl.jsx'
import BatchQuantityPanel from '../components/BatchQuantityPanel.jsx'

const AUTOSAVE_DELAY = 600

function ProductCard({
  product,
  variant,
  sectionName,
  quantity,
  productBatches,
  submitState,
  onChange,
  onStep,
  onOpenBatch,
  onAddBatch,
  onRemoveBatch,
  onClearBatches,
  onSaveSubmitted,
}) {
  const borderClass = variant === 'submitted'
    ? 'border-amber-800/60 bg-amber-950/30'
    : product.entryId
      ? 'border-sky-800/60 bg-sky-950/20'
      : 'border-slate-800 bg-slate-800/60'

  return (
    <div className={'rounded-3xl border p-5 ' + borderClass}>
      {!sectionName && product.sectionName && (
        <p className="mb-1 text-center text-sm text-slate-500">{product.sectionName}</p>
      )}
      <p className="mb-4 text-center text-xl font-bold text-slate-100">{product.name}</p>
      <QuantityControl
        value={quantity}
        onChange={onChange}
        onStep={onStep}
      />
      {variant === 'pending' && (
        <BatchQuantityPanel
          value={quantity}
          batches={productBatches}
          onOpen={onOpenBatch}
          onAddBatch={onAddBatch}
          onRemoveBatch={onRemoveBatch}
          onClearBatches={onClearBatches}
        />
      )}
      {variant === 'submitted' && (
        <button
          onClick={onSaveSubmitted}
          disabled={submitState === 'sending'}
          className="mt-4 w-full rounded-2xl bg-amber-600 px-6 py-4 text-lg font-bold text-white active:bg-amber-700 disabled:opacity-50"
        >
          ZAPISZ ZMIANĘ
        </button>
      )}
    </div>
  )
}

export default function Inventory() {
  const { workerId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const saveTimers = useRef({})

  const [workerName, setWorkerName] = useState(location.state?.workerDisplayName ?? '')
  const [sectionName, setSectionName] = useState(location.state?.sectionName ?? '')
  const [pendingProducts, setPendingProducts] = useState([])
  const [submittedProducts, setSubmittedProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const [batches, setBatches] = useState({})
  const [status, setStatus] = useState('loading')
  const [submitState, setSubmitState] = useState('idle')
  const [saveState, setSaveState] = useState('idle')
  const [showSubmitted, setShowSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  function load() {
    setStatus('loading')
    const productsPromise = fetchProducts(workerId)
    const namePromise = workerName
      ? Promise.resolve(workerName)
      : fetchWorkers().then((workers) => {
          const found = workers.find((w) => String(w.id) === String(workerId))
          return found ? formatWorkerShort(found) : 'Pracownik'
        })

    Promise.all([productsPromise, namePromise])
      .then(([data, name]) => {
        setWorkerName(name)
        const activeSection = location.state?.sectionName ?? sectionName
        const scoped = activeSection
          ? data.filter((product) => product.sectionName === activeSection)
          : data
        if (activeSection) {
          setSectionName(activeSection)
        }
        const pending = scoped.filter((product) => !product.submitted)
        const submitted = scoped.filter((product) => product.submitted)
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
        setBatches({})
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
  }, [workerId])

  function scheduleAutoSave(productId, value) {
    clearTimeout(saveTimers.current[productId])
    setSaveState('saving')
    saveTimers.current[productId] = setTimeout(() => {
      saveDraft({
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

  function setValue(id, value, fromBatch = false) {
    setQuantities((prev) => ({ ...prev, [id]: value }))
    if (!fromBatch) {
      setBatches((prev) => {
        if (!prev[id]?.length) {
          return prev
        }
        return { ...prev, [id]: [] }
      })
    }
    if (pendingProducts.some((product) => product.id === id)) {
      scheduleAutoSave(id, value)
    }
  }

  function applyBatchTotal(productId, nextBatches) {
    const total = nextBatches.reduce((sum, amount) => sum + amount, 0)
    setBatches((prev) => ({ ...prev, [productId]: nextBatches }))
    setValue(productId, String(total), true)
  }

  function addBatch(productId, amount) {
    const current = batches[productId] ?? []
    applyBatchTotal(productId, [...current, amount])
  }

  function removeBatch(productId, index) {
    const current = batches[productId] ?? []
    applyBatchTotal(
      productId,
      current.filter((_, i) => i !== index),
    )
  }

  function clearBatches(productId) {
    applyBatchTotal(productId, [])
  }

  function openBatchMode(productId) {
    const current = parseQuantity(quantities[productId])
    const currentBatches = batches[productId] ?? []
    if (current > 0 && currentBatches.length === 0) {
      applyBatchTotal(productId, [current])
    }
  }

  function step(id, delta) {
    setBatches((prev) => ({ ...prev, [id]: [] }))
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
          {sectionName ? (
            <>
              <h1 className="truncate text-2xl font-extrabold text-slate-100">{workerName}</h1>
              <p className="truncate text-sm text-slate-400">{sectionName}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400">Pracownik</p>
              <h1 className="truncate text-xl font-bold text-slate-100">{workerName}</h1>
            </>
          )}
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

        {pendingProducts.length === 0 && submittedProducts.length === 0 && (
          <p className="mt-12 text-center text-lg text-slate-400">
            Brak produktów przypisanych do Twoich sekcji. Poproś koordynatora o przypisanie.
          </p>
        )}

        {showSubmitted && submittedProducts.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-amber-300">Wysłane — edycja</h2>
            <div className="flex flex-col gap-4">
              {submittedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="submitted"
                  sectionName={sectionName}
                  quantity={quantities[product.id]}
                  submitState={submitState}
                  onChange={(value) => setValue(product.id, value)}
                  onStep={(delta) => step(product.id, delta)}
                  onSaveSubmitted={() => handleSaveSubmitted(product)}
                />
              ))}
            </div>
          </section>
        )}

        {!showSubmitted && pendingProducts.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-sky-300">
              Do policzenia ({pendingProducts.length})
            </h2>
            {draftCount > 0 && (
              <p className="mb-4 text-sm text-slate-400">
                Przywrócono {draftCount} zapisanych wcześniej produktów.
              </p>
            )}
            <div className="flex flex-col gap-4">
              {pendingProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="pending"
                  sectionName={sectionName}
                  quantity={quantities[product.id]}
                  productBatches={batches[product.id] ?? []}
                  submitState={submitState}
                  onChange={(value) => setValue(product.id, value)}
                  onStep={(delta) => step(product.id, delta)}
                  onOpenBatch={() => openBatchMode(product.id)}
                  onAddBatch={(amount) => addBatch(product.id, amount)}
                  onRemoveBatch={(index) => removeBatch(product.id, index)}
                  onClearBatches={() => clearBatches(product.id)}
                />
              ))}
            </div>
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
