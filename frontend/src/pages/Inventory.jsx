import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchProducts, submitInventory } from '../api.js'
import Spinner from '../components/Spinner.jsx'
import StatusScreen from '../components/StatusScreen.jsx'

function parseQuantity(value) {
  if (value === '' || value === '-') {
    return 0
  }
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export default function Inventory() {
  const { worker } = useParams()
  const workerName = decodeURIComponent(worker)
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const [status, setStatus] = useState('loading')
  const [submitState, setSubmitState] = useState('idle')

  function load() {
    setStatus('loading')
    fetchProducts(workerName)
      .then((data) => {
        setProducts(data)
        const initial = {}
        data.forEach((product) => {
          initial[product.id] = '0'
        })
        setQuantities(initial)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(() => {
    load()
  }, [workerName])

  function setValue(id, value) {
    setQuantities((prev) => ({ ...prev, [id]: value }))
  }

  function step(id, delta) {
    setQuantities((prev) => {
      const next = parseQuantity(prev[id]) + delta
      return { ...prev, [id]: String(next < 0 ? 0 : next) }
    })
  }

  function handleFocus(id, event) {
    if (quantities[id] === '0') {
      setValue(id, '')
    }
    event.target.select()
  }

  function handleBlur(id) {
    if (quantities[id] === '' || quantities[id] === '-') {
      setValue(id, '0')
    }
  }

  function handleSubmit() {
    setSubmitState('sending')
    const entries = products.map((product) => ({
      workerName,
      productId: product.id,
      quantity: parseQuantity(quantities[product.id]),
    }))
    submitInventory(entries)
      .then(() => setSubmitState('success'))
      .catch(() => setSubmitState('error'))
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
        <p className="text-lg text-slate-400">
          Inwentaryzacja pracownika <span className="font-bold text-slate-200">{workerName}</span> została zapisana.
        </p>
        <button
          onClick={() => navigate('/')}
          className="rounded-2xl bg-sky-600 px-10 py-5 text-xl font-bold text-white active:bg-sky-700"
        >
          Powrót do startu
        </button>
      </div>
    )
  }

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
        <div className="min-w-0">
          <p className="text-sm text-slate-400">Pracownik</p>
          <h1 className="truncate text-xl font-bold text-slate-100">{workerName}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-5">
        {products.length === 0 ? (
          <p className="mt-12 text-center text-lg text-slate-400">
            Brak produktów przypisanych do tego pracownika.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-3xl border border-slate-800 bg-slate-800/60 p-5"
              >
                <p className="mb-4 text-center text-xl font-bold text-slate-100">
                  {product.name}
                </p>
                <div className="flex items-stretch gap-3">
                  <button
                    onClick={() => step(product.id, -1)}
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-4xl font-bold text-white active:bg-rose-700"
                    aria-label="Zmniejsz"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={quantities[product.id]}
                    onChange={(e) => setValue(product.id, e.target.value)}
                    onFocus={(e) => handleFocus(product.id, e)}
                    onBlur={() => handleBlur(product.id)}
                    className="h-20 w-full min-w-0 rounded-2xl border-2 border-slate-700 bg-slate-900 text-center text-4xl font-extrabold text-slate-100 outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => step(product.id, 1)}
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-4xl font-bold text-white active:bg-emerald-700"
                    aria-label="Zwiększ"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-900/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          {submitState === 'error' && (
            <p className="mb-3 text-center text-base font-semibold text-rose-400">
              Nie udało się wysłać. Spróbuj ponownie.
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitState === 'sending' || products.length === 0}
            className="w-full rounded-2xl bg-sky-600 px-6 py-6 text-2xl font-extrabold tracking-wide text-white shadow-lg active:bg-sky-700 disabled:opacity-50"
          >
            {submitState === 'sending' ? 'WYSYŁANIE...' : 'WYŚLIJ INWENTARYZACJĘ'}
          </button>
        </div>
      </div>
    </div>
  )
}
