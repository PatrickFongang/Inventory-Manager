import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  fetchProducts,
  fetchWorkers,
  saveDraft,
  submitFeedback,
  submitInventory,
  updateInventoryEntry,
} from '../api.js'
import { formatWorkerShort } from '../workerName.js'
import Spinner from '../components/Spinner.jsx'
import StatusScreen from '../components/StatusScreen.jsx'
import QuantityControl, { parseQuantity } from '../components/QuantityControl.jsx'
import BatchQuantityPanel from '../components/BatchQuantityPanel.jsx'

const AUTOSAVE_DELAY = 600

function productMatchesSearch(product, query) {
  if (!query) {
    return true
  }
  return product.name.toLowerCase().includes(query.toLowerCase())
}

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

function CompletionPanel({
  workerName,
  sectionName,
  feedback,
  onFeedbackChange,
  feedbackState,
  onSubmitFeedback,
  onSkip,
}) {
  return (
    <div className="mb-6 rounded-3xl border border-emerald-700 bg-emerald-950/40 p-5">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white">
          ✓
        </div>
        <h2 className="text-2xl font-extrabold text-emerald-300">Inwentaryzacja ukończona!</h2>
        <p className="mt-2 text-sm text-emerald-400/90">
          Wszystkie produkty w Twojej sekcji zostały wysłane.
        </p>
        <p className="mt-3 rounded-xl bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
          Możesz jeszcze <span className="font-bold text-amber-300">edytować</span> wysłane liczby —
          użyj przycisku <span className="font-bold text-amber-300">„Edytuj”</span> u góry ekranu.
        </p>
      </div>

      {feedbackState === 'sent' ? (
        <p className="text-center text-sm font-semibold text-emerald-300">
          Dziękujemy — pomoże nam to ulepszyć aplikację!
        </p>
      ) : (
        <form
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault()
            if (feedback.trim()) {
              onSubmitFeedback()
            }
          }}
        >
          <label
            htmlFor="inventory-app-feedback"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Co można poprawić w aplikacji? (opcjonalnie)
          </label>
          <p className="mb-3 text-xs text-slate-500">
            Chodzi o samą apkę — wygodę, przyciski, czytelność, błędy. Nie o braki produktów na stadionie.
          </p>
          <textarea
            id="inventory-app-feedback"
            name="inventory-app-feedback"
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            rows={4}
            placeholder="np. za małe przyciski, trudno znaleźć produkt, coś się zawiesiło..."
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck="true"
            enterKeyHint="done"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            onFocus={(event) => {
              setTimeout(() => {
                event.target.scrollIntoView({ block: 'center', behavior: 'smooth' })
              }, 300)
            }}
            className="mb-3 w-full rounded-xl border-2 border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 outline-none focus:border-emerald-500"
          />
          {feedbackState === 'error' && (
            <p className="mb-3 text-center text-sm text-rose-400">
              Nie udało się wysłać opinii. Spróbuj ponownie.
            </p>
          )}
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={!feedback.trim() || feedbackState === 'sending'}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-4 text-lg font-bold text-white active:bg-emerald-700 disabled:opacity-50"
            >
              {feedbackState === 'sending' ? 'WYSYŁANIE...' : 'WYŚLIJ OPINIĘ O APLIKACJI'}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="w-full rounded-2xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-base font-semibold text-slate-300 active:bg-slate-700"
            >
              {feedback.trim() ? 'Pomiń opinię' : 'Wróć do startu'}
            </button>
          </div>
        </form>
      )}

      {feedbackState === 'sent' && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-4 w-full rounded-2xl bg-slate-700 px-4 py-4 text-lg font-bold text-white active:bg-slate-600"
        >
          Wróć do startu
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
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('loading')
  const [submitState, setSubmitState] = useState('idle')
  const [submittingProductId, setSubmittingProductId] = useState(null)
  const [singleSubmitErrorId, setSingleSubmitErrorId] = useState(null)
  const [saveState, setSaveState] = useState('idle')
  const [showSubmitted, setShowSubmitted] = useState(false)
  const [bulkMessage, setBulkMessage] = useState('')
  const [showCompletionPanel, setShowCompletionPanel] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackState, setFeedbackState] = useState('idle')
  const [editMessage, setEditMessage] = useState('')

  function applyProductData(data, name) {
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
    return pending.length === 0 && submitted.length > 0
  }

  function load(options = {}) {
    const { silent = false } = options
    if (!silent) {
      setStatus('loading')
    }
    const productsPromise = fetchProducts(workerId)
    const namePromise = workerName
      ? Promise.resolve(workerName)
      : fetchWorkers().then((workers) => {
          const found = workers.find((w) => String(w.id) === String(workerId))
          return found ? formatWorkerShort(found) : 'Pracownik'
        })

    return Promise.all([productsPromise, namePromise])
      .then(([data, name]) => {
        const allDone = applyProductData(data, name)
        if (!silent) {
          setBatches({})
          setSearch('')
          setSaveState('idle')
          setSingleSubmitErrorId(null)
          setStatus('ready')
        }
        return allDone
      })
      .catch(() => {
        if (!silent) {
          setStatus('error')
        }
        return false
      })
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

  function flushDraft(productId, quantity) {
    clearTimeout(saveTimers.current[productId])
    return saveDraft({ productId, quantity })
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

  function moveProductToSubmitted(product, entry) {
    setPendingProducts((prev) => prev.filter((item) => item.id !== product.id))
    setSubmittedProducts((prev) => [
      ...prev,
      {
        ...product,
        submitted: true,
        entryId: entry?.id ?? product.entryId,
        quantity: entry?.quantity ?? parseQuantity(quantities[product.id]),
      },
    ])
    setBatches((prev) => {
      const next = { ...prev }
      delete next[product.id]
      return next
    })
  }

  function handleSubmitSingle(product) {
    const quantity = parseQuantity(quantities[product.id])
    if (!product.entryId && quantity === 0) {
      setSingleSubmitErrorId(product.id)
      return
    }

    setSubmittingProductId(product.id)
    setSingleSubmitErrorId(null)
    setBulkMessage('')

    flushDraft(product.id, quantity)
      .then((entry) =>
        submitInventory([{ productId: product.id, quantity }]).then(() => entry),
      )
      .then((entry) => {
        moveProductToSubmitted(product, entry)
        return load({ silent: true })
      })
      .then((allDone) => {
        if (allDone) {
          setShowCompletionPanel(true)
        }
      })
      .catch(() => setSingleSubmitErrorId(product.id))
      .finally(() => setSubmittingProductId(null))
  }

  function handleSubmitPending() {
    const productsToSubmit = pendingProducts.filter((product) => product.entryId)
    if (productsToSubmit.length === 0) {
      setSubmitState('error')
      return
    }

    const submittingAll = productsToSubmit.length === pendingProducts.length
    setSubmitState('sending')
    setBulkMessage('')

    const entries = productsToSubmit.map((product) => ({
      productId: product.id,
      quantity: parseQuantity(quantities[product.id]),
    }))

    submitInventory(entries)
      .then(() => load({ silent: true }))
      .then((allDone) => {
        setSubmitState('idle')
        if (allDone || submittingAll) {
          setShowCompletionPanel(true)
          setShowSubmitted(false)
        } else {
          setBulkMessage('Wysłano ' + entries.length + ' produktów. Kontynuuj liczenie pozostałych.')
        }
      })
      .catch(() => setSubmitState('error'))
  }

  function handleSaveSubmitted(product) {
    setSubmitState('sending')
    setEditMessage('')
    updateInventoryEntry(product.entryId, parseQuantity(quantities[product.id]))
      .then(() => {
        setSubmitState('idle')
        setEditMessage('Zapisano zmianę: ' + product.name)
      })
      .catch(() => setSubmitState('error'))
  }

  function handleSubmitFeedback() {
    const message = feedback.trim()
    if (!message) {
      return
    }
    setFeedbackState('sending')
    submitFeedback({
      workerId: Number(workerId),
      workerName,
      sectionName: sectionName || null,
      message,
    })
      .then(() => {
        setFeedbackState('sent')
        setFeedback('')
      })
      .catch(() => setFeedbackState('error'))
  }

  function handleLeaveAfterCompletion() {
    navigate('/')
  }

  if (status === 'loading') {
    return <Spinner label="Pobieranie produktów..." />
  }

  if (status === 'error') {
    return (
      <StatusScreen
        title="Nie udało się pobrać produktów"
        message="Sprawdź połączenie i spróbuj ponownie."
        onRetry={() => load()}
      />
    )
  }

  const allDone = pendingProducts.length === 0 && submittedProducts.length > 0
  const draftCount = pendingProducts.filter((product) => product.entryId).length
  const searchQuery = search.trim()
  const filteredPending = pendingProducts.filter((product) =>
    productMatchesSearch(product, searchQuery),
  )
  const showDonePanel = allDone && showCompletionPanel

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
        {showDonePanel && (
          <CompletionPanel
            workerName={workerName}
            sectionName={sectionName}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            feedbackState={feedbackState}
            onSubmitFeedback={handleSubmitFeedback}
            onSkip={handleLeaveAfterCompletion}
          />
        )}

        {allDone && !showDonePanel && !showSubmitted && (
          <div className="mb-5 rounded-2xl border border-emerald-700 bg-emerald-900/40 p-5 text-center">
            <p className="text-lg font-bold text-emerald-300">Wszystko policzone!</p>
            <p className="mt-1 text-sm text-emerald-400/80">
              Możesz edytować wysłane produkty przyciskiem „Edytuj” u góry.
            </p>
            {!showCompletionPanel && (
              <button
                type="button"
                onClick={() => setShowCompletionPanel(true)}
                className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white active:bg-emerald-700"
              >
                Oceń aplikację
              </button>
            )}
          </div>
        )}

        {bulkMessage && (
          <p className="mb-4 rounded-xl border border-sky-700/60 bg-sky-950/40 px-4 py-3 text-center text-sm font-semibold text-sky-300">
            {bulkMessage}
          </p>
        )}

        {editMessage && (
          <p className="mb-4 rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-4 py-3 text-center text-sm font-semibold text-emerald-300">
            {editMessage}
          </p>
        )}

        {pendingProducts.length === 0 && submittedProducts.length === 0 && (
          <p className="mt-12 text-center text-lg text-slate-400">
            Brak produktów przypisanych do Twoich sekcji. Poproś koordynatora o przypisanie.
          </p>
        )}

        {showSubmitted && submittedProducts.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-amber-300">Wysłane — edycja</h2>
            <p className="mb-4 text-sm text-slate-400">
              Popraw liczbę i naciśnij „Zapisz zmianę” przy produkcie.
            </p>
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

            <label className="mb-2 block text-sm font-semibold text-slate-400">
              Szukaj produktu
            </label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Wpisz nazwę..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              name="inventory-product-search"
              className="mb-4 h-12 w-full rounded-xl border-2 border-slate-700 bg-slate-900 px-4 text-base font-semibold text-slate-100 outline-none focus:border-sky-500"
            />

            {searchQuery && filteredPending.length === 0 && (
              <p className="mb-4 text-center text-sm text-slate-400">
                Brak wyników dla „{searchQuery}”.
              </p>
            )}

            {searchQuery && filteredPending.length > 0 && (
              <p className="mb-4 text-sm text-slate-500">
                Wyniki: {filteredPending.length} / {pendingProducts.length}
              </p>
            )}

            <div className="flex flex-col gap-4">
              {filteredPending.map((product) => (
                <div key={product.id} className="flex flex-col gap-2">
                  <ProductCard
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
                  <button
                    type="button"
                    onClick={() => handleSubmitSingle(product)}
                    disabled={submittingProductId === product.id || submitState === 'sending'}
                    className="w-full rounded-2xl bg-sky-600 px-4 py-4 text-lg font-bold text-white active:bg-sky-700 disabled:opacity-50"
                  >
                    {submittingProductId === product.id ? 'Wysyłanie...' : 'Wyślij'}
                  </button>
                  {singleSubmitErrorId === product.id && (
                    <p className="text-center text-sm font-semibold text-rose-400">
                      Wpisz ilość przed wysłaniem
                    </p>
                  )}
                </div>
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
              disabled={submitState === 'sending' || submittingProductId != null}
              className="w-full rounded-2xl bg-sky-600 px-6 py-6 text-2xl font-extrabold tracking-wide text-white shadow-lg active:bg-sky-700 disabled:opacity-50"
            >
              {submitState === 'sending' ? 'WYSYŁANIE...' : 'WYŚLIJ WYPEŁNIONE'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
