import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  downloadExport,
  fetchAdminOverview,
  fetchWorkers,
  resetInventory,
  updateInventoryEntry,
  updateProductAssignment,
} from '../api.js'
import { isAdminAuthenticated, logoutAdmin } from '../auth.js'
import AdminLogin from '../components/AdminLogin.jsx'
import Spinner from '../components/Spinner.jsx'
import StatusScreen from '../components/StatusScreen.jsx'
import QuantityControl, { parseQuantity } from '../components/QuantityControl.jsx'

const SECTIONS = {
  menu: 'menu',
  progress: 'progress',
  edit: 'edit',
  assignments: 'assignments',
  actions: 'actions',
}

function AdminHeader({ title, subtitle, onBack, onLogout }) {
  return (
    <header className="mx-auto mb-6 flex max-w-lg items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-2xl text-slate-200 active:bg-slate-700"
            aria-label="Wróć"
          >
            ‹
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-slate-100">{title}</h1>
          {subtitle && <p className="mt-1 text-base text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={onLogout}
        className="shrink-0 rounded-xl bg-slate-700 px-3 py-2 text-sm font-bold text-slate-200 active:bg-slate-600"
      >
        Wyloguj
      </button>
    </header>
  )
}

function MenuTile({ label, description, color, onClick }) {
  const colors = {
    sky: 'bg-sky-600 active:bg-sky-700',
    amber: 'bg-amber-600 active:bg-amber-700',
    violet: 'bg-violet-600 active:bg-violet-700',
    emerald: 'bg-emerald-600 active:bg-emerald-700',
  }

  return (
    <button
      onClick={onClick}
      className={'flex min-h-[120px] flex-col items-start justify-center rounded-3xl px-5 py-6 text-left text-white shadow-lg ' + colors[color]}
    >
      <span className="text-xl font-extrabold">{label}</span>
      <span className="mt-2 text-sm font-medium text-white/80">{description}</span>
    </button>
  )
}

function WorkerPicker({ workers, onSelect }) {
  return (
    <div className="flex flex-col gap-3">
      {workers.map((worker) => (
        <button
          key={worker.name}
          onClick={() => onSelect(worker.name)}
          className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/60 px-5 py-5 active:bg-slate-700"
        >
          <span className="text-xl font-bold text-slate-100">{worker.name}</span>
          <span className="text-lg font-semibold text-sky-300">
            {worker.completedCount}/{worker.totalProducts}
          </span>
        </button>
      ))}
    </div>
  )
}

function ProgressSection({ workers }) {
  return (
    <div className="flex flex-col gap-4">
      {workers.map((worker) => {
        const percent = worker.totalProducts === 0
          ? 0
          : Math.round((worker.completedCount / worker.totalProducts) * 100)

        return (
          <div
            key={worker.name}
            className="rounded-3xl border border-slate-800 bg-slate-800/60 p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-100">{worker.name}</h3>
              <span className="text-lg font-semibold text-sky-300">
                {worker.completedCount}/{worker.totalProducts}
              </span>
            </div>
            <div className="mb-4 h-4 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{ width: percent + '%' }}
              />
            </div>
            {worker.pendingProducts.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-amber-300">
                  Brakuje ({worker.pendingProducts.length}):
                </p>
                <ul className="space-y-1 text-sm text-slate-300">
                  {worker.pendingProducts.map((product) => (
                    <li key={product.id}>• {product.name}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm font-semibold text-emerald-400">Wszystko policzone</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EntryEditor({ worker, onSaved }) {
  const [quantities, setQuantities] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [errorId, setErrorId] = useState(null)

  useEffect(() => {
    const initial = {}
    worker.entries.forEach((entry) => {
      initial[entry.entryId] = String(entry.quantity ?? 0)
    })
    setQuantities(initial)
  }, [worker])

  function setValue(entryId, value) {
    setQuantities((prev) => ({ ...prev, [entryId]: value }))
  }

  function step(entryId, delta) {
    setQuantities((prev) => {
      const next = parseQuantity(prev[entryId]) + delta
      return { ...prev, [entryId]: String(next < 0 ? 0 : next) }
    })
  }

  function handleSave(entry) {
    setSavingId(entry.entryId)
    setErrorId(null)
    updateInventoryEntry(entry.entryId, parseQuantity(quantities[entry.entryId]))
      .then(() => onSaved())
      .catch(() => setErrorId(entry.entryId))
      .finally(() => setSavingId(null))
  }

  if (worker.entries.length === 0) {
    return (
      <p className="mt-8 text-center text-lg text-slate-400">
        Ten pracownik nie ma jeszcze żadnych wpisów.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {worker.entries.map((entry) => (
        <div key={entry.entryId} className="rounded-3xl border border-slate-800 bg-slate-800/60 p-5">
          <p className="mb-4 text-center text-xl font-bold text-slate-100">
            {entry.productName}
          </p>
          <QuantityControl
            value={quantities[entry.entryId] ?? '0'}
            onChange={(value) => setValue(entry.entryId, value)}
            onStep={(delta) => step(entry.entryId, delta)}
          />
          <button
            onClick={() => handleSave(entry)}
            disabled={savingId === entry.entryId}
            className="mt-4 w-full rounded-2xl bg-sky-600 px-4 py-4 text-lg font-bold text-white active:bg-sky-700 disabled:opacity-50"
          >
            {savingId === entry.entryId ? 'ZAPISYWANIE...' : 'ZAPISZ'}
          </button>
          {errorId === entry.entryId && (
            <p className="mt-2 text-center text-sm text-rose-400">Nie udało się zapisać</p>
          )}
        </div>
      ))}
    </div>
  )
}

function AssignmentList({ products, workers, workerName, onChange, savingId }) {
  const filtered = products.filter((product) => product.assignedWorker === workerName)

  if (filtered.length === 0) {
    return (
      <p className="mt-8 text-center text-lg text-slate-400">
        Brak produktów przypisanych do tego pracownika.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((product) => (
        <div
          key={product.id}
          className="rounded-2xl border border-slate-800 bg-slate-800/60 p-4"
        >
          <p className="mb-3 text-base font-semibold text-slate-100">{product.name}</p>
          <select
            value={product.assignedWorker}
            onChange={(e) => onChange(product.id, e.target.value)}
            disabled={savingId === product.id}
            className="h-14 w-full rounded-xl border-2 border-slate-700 bg-slate-900 px-4 text-lg font-semibold text-slate-100 outline-none focus:border-violet-500"
          >
            {workers.map((worker) => (
              <option key={worker} value={worker}>
                {worker}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated())
  const [overview, setOverview] = useState(null)
  const [workers, setWorkers] = useState([])
  const [status, setStatus] = useState('loading')
  const [section, setSection] = useState(SECTIONS.menu)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [exportState, setExportState] = useState('idle')
  const [resetState, setResetState] = useState('idle')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [assignmentSavingId, setAssignmentSavingId] = useState(null)

  function loadOverview() {
    setStatus('loading')
    Promise.all([fetchAdminOverview(), fetchWorkers()])
      .then(([overviewData, workerList]) => {
        setOverview(overviewData)
        setWorkers(workerList)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(() => {
    if (authenticated) {
      loadOverview()
    }
  }, [authenticated])

  function handleLogout() {
    logoutAdmin()
    setAuthenticated(false)
    navigate('/')
  }

  function goToMenu() {
    setSection(SECTIONS.menu)
    setSelectedWorker(null)
  }

  function handleAssignmentChange(productId, assignedWorker) {
    setAssignmentSavingId(productId)
    updateProductAssignment(productId, assignedWorker)
      .then(() => loadOverview())
      .catch(() => {})
      .finally(() => setAssignmentSavingId(null))
  }

  function handleDownload() {
    setExportState('downloading')
    downloadExport()
      .then(() => setExportState('done'))
      .catch(() => setExportState('error'))
  }

  function handleReset() {
    setResetState('resetting')
    resetInventory()
      .then(() => {
        setResetState('done')
        setShowResetConfirm(false)
        loadOverview()
      })
      .catch(() => setResetState('error'))
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />
  }

  if (status === 'loading') {
    return <Spinner label="Ładowanie panelu..." />
  }

  if (status === 'error') {
    return (
      <StatusScreen
        title="Nie udało się załadować panelu"
        message="Sprawdź połączenie z serwerem."
        onRetry={loadOverview}
      />
    )
  }

  const totalProducts = overview.products.length
  const totalCompleted = overview.workers.reduce((sum, worker) => sum + worker.completedCount, 0)
  const selectedWorkerData = overview.workers.find((worker) => worker.name === selectedWorker)

  if (section === SECTIONS.menu) {
    return (
      <div className="min-h-screen px-4 pb-10 pt-6">
        <AdminHeader
          title="Panel Koordynatora"
          subtitle={'Postęp: ' + totalCompleted + '/' + totalProducts + ' produktów'}
          onLogout={handleLogout}
        />

        <div className="mx-auto grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
          <MenuTile
            label="Postęp"
            description="Kto co już policzył"
            color="sky"
            onClick={() => setSection(SECTIONS.progress)}
          />
          <MenuTile
            label="Edycja liczb"
            description="Popraw wpisane ilości"
            color="amber"
            onClick={() => {
              setSelectedWorker(null)
              setSection(SECTIONS.edit)
            }}
          />
          <MenuTile
            label="Przypisania"
            description="Zmień produkty między osobami"
            color="violet"
            onClick={() => {
              setSelectedWorker(null)
              setSection(SECTIONS.assignments)
            }}
          />
          <MenuTile
            label="Akcje"
            description="CSV i reset inwentaryzacji"
            color="emerald"
            onClick={() => setSection(SECTIONS.actions)}
          />
        </div>

        <div className="mx-auto mt-8 max-w-lg">
          <button
            onClick={() => navigate('/')}
            className="w-full rounded-2xl border-2 border-slate-700 bg-slate-800/60 px-6 py-4 text-lg font-semibold text-slate-300 active:bg-slate-700"
          >
            Powrót do startu
          </button>
        </div>
      </div>
    )
  }

  if (section === SECTIONS.progress) {
    return (
      <div className="min-h-screen px-4 pb-10 pt-6">
        <AdminHeader
          title="Postęp"
          subtitle="Status każdego pracownika"
          onBack={goToMenu}
          onLogout={handleLogout}
        />
        <div className="mx-auto max-w-lg">
          <ProgressSection workers={overview.workers} />
        </div>
      </div>
    )
  }

  if (section === SECTIONS.edit) {
    return (
      <div className="min-h-screen px-4 pb-10 pt-6">
        <AdminHeader
          title={selectedWorker ? 'Edycja: ' + selectedWorker : 'Edycja liczb'}
          subtitle={selectedWorker ? 'Popraw wpisane ilości' : 'Wybierz pracownika'}
          onBack={selectedWorker ? () => setSelectedWorker(null) : goToMenu}
          onLogout={handleLogout}
        />
        <div className="mx-auto max-w-lg">
          {!selectedWorker ? (
            <WorkerPicker
              workers={overview.workers}
              onSelect={setSelectedWorker}
            />
          ) : (
            <EntryEditor
              worker={selectedWorkerData}
              onSaved={loadOverview}
            />
          )}
        </div>
      </div>
    )
  }

  if (section === SECTIONS.assignments) {
    return (
      <div className="min-h-screen px-4 pb-10 pt-6">
        <AdminHeader
          title={selectedWorker ? 'Produkty: ' + selectedWorker : 'Przypisania'}
          subtitle={selectedWorker ? 'Zmień osobę liczącą' : 'Wybierz pracownika'}
          onBack={selectedWorker ? () => setSelectedWorker(null) : goToMenu}
          onLogout={handleLogout}
        />
        <div className="mx-auto max-w-lg">
          {!selectedWorker ? (
            <WorkerPicker
              workers={overview.workers}
              onSelect={setSelectedWorker}
            />
          ) : (
            <AssignmentList
              products={overview.products}
              workers={workers}
              workerName={selectedWorker}
              onChange={handleAssignmentChange}
              savingId={assignmentSavingId}
            />
          )}
        </div>
      </div>
    )
  }

  if (section === SECTIONS.actions) {
    return (
      <div className="min-h-screen px-4 pb-10 pt-6">
        <AdminHeader
          title="Akcje"
          subtitle="Eksport i reset danych"
          onBack={goToMenu}
          onLogout={handleLogout}
        />

        <div className="mx-auto flex max-w-lg flex-col gap-4">
          <button
            onClick={handleDownload}
            disabled={exportState === 'downloading'}
            className="rounded-3xl bg-emerald-600 px-8 py-8 text-2xl font-extrabold text-white shadow-lg active:bg-emerald-700 disabled:opacity-50"
          >
            {exportState === 'downloading' ? 'POBIERANIE...' : 'POBIERZ PLIK CSV'}
          </button>
          {exportState === 'done' && (
            <p className="text-center text-lg font-semibold text-emerald-400">
              Plik został pobrany.
            </p>
          )}
          {exportState === 'error' && (
            <p className="text-center text-lg font-semibold text-rose-400">
              Nie udało się pobrać pliku.
            </p>
          )}

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={resetState === 'resetting'}
            className="rounded-3xl bg-rose-600 px-8 py-8 text-2xl font-extrabold text-white shadow-lg active:bg-rose-700 disabled:opacity-50"
          >
            RESETUJ INWENTARYZACJĘ
          </button>
          {resetState === 'done' && (
            <p className="text-center text-lg font-semibold text-emerald-400">
              Wszystkie wpisy zostały usunięte.
            </p>
          )}
          {resetState === 'error' && (
            <p className="text-center text-lg font-semibold text-rose-400">
              Nie udało się zresetować inwentaryzacji.
            </p>
          )}
        </div>

        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
            <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center">
              <h3 className="text-2xl font-extrabold text-slate-100">Na pewno?</h3>
              <p className="mt-3 text-base text-slate-400">
                To usunie wszystkie wpisane liczby. Przypisania produktów do osób pozostaną bez zmian.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleReset}
                  disabled={resetState === 'resetting'}
                  className="rounded-2xl bg-rose-600 px-6 py-5 text-xl font-bold text-white active:bg-rose-700 disabled:opacity-50"
                >
                  {resetState === 'resetting' ? 'USUWANIE...' : 'TAK, RESETUJ'}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-2xl bg-slate-700 px-6 py-5 text-xl font-bold text-white active:bg-slate-600"
                >
                  ANULUJ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
