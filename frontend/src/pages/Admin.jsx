import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createWorker,
  deleteWorker,
  downloadExport,
  fetchAdminOverview,
  fetchSectionProducts,
  fetchSections,
  fetchWorkers,
  resetInventory,
  resetWorkersWorkingToday,
  adminSaveProduct,
  updateSectionWorkers,
  updateWorkerWorkingToday,
} from '../api.js'
import { isAdminAuthenticated, logoutAdmin } from '../auth.js'
import AdminLogin from '../components/AdminLogin.jsx'
import Spinner from '../components/Spinner.jsx'
import StatusScreen from '../components/StatusScreen.jsx'
import QuantityControl, { parseQuantity } from '../components/QuantityControl.jsx'
import { formatWorkerFull, workerMatchesSearch } from '../workerName.js'

const SECTIONS = {
  menu: 'menu',
  progress: 'progress',
  edit: 'edit',
  assignments: 'assignments',
  workers: 'workers',
  actions: 'actions',
}

const ASSIGNMENTS_AUTOSAVE_DELAY = 600

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
    rose: 'bg-rose-600 active:bg-rose-700',
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

function visibleSectionWorkers(workers) {
  return (workers ?? []).filter((worker) => worker.workingToday)
}

function workerNamesLabel(workers) {
  const visible = visibleSectionWorkers(workers)
  if (visible.length === 0) {
    return 'brak przypisanych'
  }
  return visible.map((worker) => formatWorkerFull(worker)).join(', ')
}

function ProgressSection({ sections }) {
  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => {
        const percent = section.totalProducts === 0
          ? 0
          : Math.round((section.completedCount / section.totalProducts) * 100)

        return (
          <div
            key={section.id}
            className="rounded-3xl border border-slate-800 bg-slate-800/60 p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-100">{section.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  ({workerNamesLabel(section.workers)})
                </p>
              </div>
              <span className="shrink-0 text-lg font-semibold text-sky-300">
                {section.completedCount}/{section.totalProducts}
              </span>
            </div>
            <div className="mb-4 h-4 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{ width: percent + '%' }}
              />
            </div>
            {section.pendingProducts.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-amber-300">
                  Brakuje ({section.pendingProducts.length}):
                </p>
                <ul className="space-y-1 text-sm text-slate-300">
                  {section.pendingProducts.map((product) => (
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

function SectionPicker({ sections, onSelect }) {
  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSelect(section.id)}
          className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/60 px-5 py-5 active:bg-slate-700"
        >
          <div className="min-w-0 text-left">
            <span className="block text-xl font-bold text-slate-100">{section.name}</span>
            <span className="mt-1 block text-sm text-slate-400">
              {workerNamesLabel(section.workers)}
            </span>
          </div>
          <span className="shrink-0 text-lg font-semibold text-sky-300">
            {section.completedCount}/{section.totalProducts}
          </span>
        </button>
      ))}
    </div>
  )
}

function resolveEditableProducts(section) {
  if (section.editableProducts?.length > 0) {
    return section.editableProducts
  }

  const products = []
  const seen = new Set()

  for (const entry of section.entries ?? []) {
    products.push({
      productId: entry.productId,
      productName: entry.productName,
      entryId: entry.entryId,
      quantity: entry.quantity,
      submitted: true,
    })
    seen.add(entry.productId)
  }

  for (const pending of section.pendingProducts ?? []) {
    if (!seen.has(pending.id)) {
      products.push({
        productId: pending.id,
        productName: pending.name,
        entryId: null,
        quantity: null,
        submitted: false,
      })
    }
  }

  return products
}

function EntryEditor({ section, onSaved }) {
  const [products, setProducts] = useState(() => resolveEditableProducts(section))
  const [quantities, setQuantities] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [errorId, setErrorId] = useState(null)
  const [loadState, setLoadState] = useState('loading')

  function applyProducts(nextProducts) {
    setProducts(nextProducts)
    const initial = {}
    nextProducts.forEach((product) => {
      initial[product.productId] = product.quantity != null
        ? String(product.quantity)
        : '0'
    })
    setQuantities(initial)
  }

  function loadProducts() {
    setLoadState('loading')
    fetchSectionProducts(section.id)
      .then((data) => {
        applyProducts(data.length > 0 ? data : resolveEditableProducts(section))
        setLoadState('ready')
      })
      .catch(() => {
        applyProducts(resolveEditableProducts(section))
        setLoadState('ready')
      })
  }

  useEffect(() => {
    loadProducts()
  }, [section.id])

  function handleSaved() {
    loadProducts()
    onSaved()
  }

  function setValue(productId, value) {
    setQuantities((prev) => ({ ...prev, [productId]: value }))
  }

  function step(productId, delta) {
    setQuantities((prev) => {
      const next = parseQuantity(prev[productId]) + delta
      return { ...prev, [productId]: String(next < 0 ? 0 : next) }
    })
  }

  function handleSave(product) {
    setSavingId(product.productId)
    setErrorId(null)
    adminSaveProduct(product.productId, parseQuantity(quantities[product.productId]))
      .then(() => handleSaved())
      .catch(() => setErrorId(product.productId))
      .finally(() => setSavingId(null))
  }

  if (loadState === 'loading') {
    return <Spinner label="Pobieranie produktów..." />
  }

  if (products.length === 0) {
    return (
      <p className="mt-8 text-center text-lg text-slate-400">
        Ta sekcja nie ma produktów do edycji.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {products.map((product) => (
        <div key={product.productId} className="rounded-3xl border border-slate-800 bg-slate-800/60 p-5">
          <div className="mb-4 text-center">
            <p className="text-xl font-bold text-slate-100">{product.productName}</p>
            {!product.submitted && (
              <p className="mt-1 text-sm text-amber-400">
                {product.entryId ? 'Szkic pracownika' : 'Nie wysłano'}
              </p>
            )}
          </div>
          <QuantityControl
            value={quantities[product.productId] ?? '0'}
            onChange={(value) => setValue(product.productId, value)}
            onStep={(delta) => step(product.productId, delta)}
          />
          <button
            onClick={() => handleSave(product)}
            disabled={savingId === product.productId}
            className="mt-4 w-full rounded-2xl bg-sky-600 px-4 py-4 text-lg font-bold text-white active:bg-sky-700 disabled:opacity-50"
          >
            {savingId === product.productId ? 'ZAPISYWANIE...' : 'ZAPISZ'}
          </button>
          {errorId === product.productId && (
            <p className="mt-2 text-center text-sm text-rose-400">Nie udało się zapisać</p>
          )}
        </div>
      ))}
    </div>
  )
}

function normalizeWorkerId(id) {
  return Number(id)
}

function selectionsFromSections(sections) {
  const initial = {}
  sections.forEach((section) => {
    initial[section.id] = sortedIds(
      (section.workers ?? [])
        .filter((worker) => worker.workingToday)
        .map((worker) => worker.id),
    )
  })
  return initial
}

function sortedIds(ids) {
  return [...ids].map(normalizeWorkerId).sort((a, b) => a - b)
}

function getWorkerSectionNames(workerId, selections, sections) {
  const normalizedId = normalizeWorkerId(workerId)
  return sections
    .filter((section) =>
      (selections[section.id] ?? []).some((id) => normalizeWorkerId(id) === normalizedId),
    )
    .map((section) => section.name)
}

function sortWorkersForSection(workers, selections, sections, sectionId) {
  function assignmentRank(workerId) {
    const assignedCount = getWorkerSectionNames(workerId, selections, sections).length
    if (assignedCount === 0) {
      return 0
    }
    if ((selections[sectionId] ?? []).some((id) => normalizeWorkerId(id) === normalizeWorkerId(workerId))) {
      return 2
    }
    return 1
  }

  return [...workers].sort((a, b) => {
    const rankDiff = assignmentRank(a.id) - assignmentRank(b.id)
    if (rankDiff !== 0) {
      return rankDiff
    }
    return formatWorkerFull(a).localeCompare(formatWorkerFull(b), 'pl')
  })
}

function WorkerAssignmentOverview({ workers, sections, selections }) {
  if (workers.length === 0) {
    return null
  }

  return (
    <div className="mb-6 rounded-3xl border border-violet-800/50 bg-violet-950/30 p-5">
      <h3 className="text-lg font-bold text-violet-200">Podgląd przypisań</h3>
      <p className="mt-1 text-sm text-slate-400">
        Każda osoba powinna liczyć maksymalnie jedną sekcję. Kliknięcie imienia w innej sekcji przenosi pracownika.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {workers.map((worker) => {
          const sectionNames = getWorkerSectionNames(worker.id, selections, sections)
          const hasConflict = sectionNames.length > 1
          const isUnassigned = sectionNames.length === 0

          return (
            <li
              key={worker.id}
              className={
                'flex items-center justify-between gap-3 rounded-xl px-4 py-3 ' +
                (hasConflict
                  ? 'border border-amber-700/60 bg-amber-950/40'
                  : 'border border-slate-800 bg-slate-900/60')
              }
            >
              <span className="text-lg font-bold text-slate-100">{formatWorkerFull(worker)}</span>
              <span
                className={
                  'text-right text-sm font-semibold ' +
                  (hasConflict
                    ? 'text-amber-300'
                    : isUnassigned
                      ? 'text-slate-500'
                      : 'text-violet-300')
                }
              >
                {isUnassigned
                  ? 'nieprzypisany'
                  : hasConflict
                    ? sectionNames.join(' + ') + ' ⚠'
                    : sectionNames[0]}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SectionAssignments({ sections, workers, onAssignmentsSaved }) {
  const activeWorkers = workers.filter((worker) => worker.workingToday)
  const [selections, setSelections] = useState(() => selectionsFromSections(sections))
  const [saveState, setSaveState] = useState('idle')
  const baselineRef = useRef(JSON.stringify(selectionsFromSections(sections)))
  const saveTimer = useRef(null)
  const savedTimer = useRef(null)
  const sectionsRef = useRef(sections)
  const syncingRef = useRef(false)

  sectionsRef.current = sections

  useEffect(() => {
    const initial = selectionsFromSections(sections)
    const initialSerialized = JSON.stringify(initial)
    if (initialSerialized === baselineRef.current) {
      return
    }

    syncingRef.current = true
    setSelections(initial)
    baselineRef.current = initialSerialized
  }, [sections])

  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current)
      clearTimeout(savedTimer.current)
    }
  }, [])

  useEffect(() => {
    if (syncingRef.current) {
      syncingRef.current = false
      return undefined
    }
    if (baselineRef.current === null) {
      return undefined
    }

    const serialized = JSON.stringify(selections)
    if (serialized === baselineRef.current) {
      return undefined
    }

    clearTimeout(saveTimer.current)
    clearTimeout(savedTimer.current)

    saveTimer.current = setTimeout(() => {
      const baseline = JSON.parse(baselineRef.current)
      const currentSections = sectionsRef.current
      const sectionsToSave = currentSections.filter((section) => {
        const currentIds = sortedIds(selections[section.id] ?? [])
        const baselineIds = sortedIds(baseline[section.id] ?? [])
        return JSON.stringify(currentIds) !== JSON.stringify(baselineIds)
      })

      if (sectionsToSave.length === 0) {
        baselineRef.current = serialized
        return
      }

      setSaveState('saving')

      Promise.all(
        sectionsToSave.map((section) =>
          updateSectionWorkers(section.id, sortedIds(selections[section.id] ?? [])),
        ),
      )
        .then(() => {
          baselineRef.current = serialized
          setSaveState('saved')
          onAssignmentsSaved?.()
          savedTimer.current = setTimeout(() => {
            setSaveState((state) => (state === 'saved' ? 'idle' : state))
          }, 2000)
        })
        .catch(() => setSaveState('error'))
    }, ASSIGNMENTS_AUTOSAVE_DELAY)

    return () => clearTimeout(saveTimer.current)
  }, [selections, onAssignmentsSaved])

  function toggleWorker(sectionId, workerId) {
    const normalizedWorkerId = normalizeWorkerId(workerId)
    setSelections((prev) => {
      const next = { ...prev }
      const current = next[sectionId] ?? []
      const isSelected = current.some((id) => normalizeWorkerId(id) === normalizedWorkerId)

      if (isSelected) {
        next[sectionId] = current.filter((id) => normalizeWorkerId(id) !== normalizedWorkerId)
      } else {
        for (const section of sections) {
          if (section.id !== sectionId) {
            next[section.id] = (next[section.id] ?? []).filter(
              (id) => normalizeWorkerId(id) !== normalizedWorkerId,
            )
          }
        }
        next[sectionId] = sortedIds([...current, normalizedWorkerId])
      }

      return next
    })
  }

  const hasConflicts = activeWorkers.some(
    (worker) => getWorkerSectionNames(worker.id, selections, sections).length > 1,
  )

  if (sections.length === 0) {
    return (
      <p className="mt-8 text-center text-lg text-slate-400">Brak sekcji do przypisania.</p>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-16">
      {(saveState === 'saving' || saveState === 'saved' || saveState === 'error') && (
        <div
          className={
            'sticky top-0 z-10 rounded-2xl px-4 py-3 text-center text-sm font-semibold ' +
            (saveState === 'saving'
              ? 'border border-slate-700 bg-slate-800/90 text-slate-300'
              : saveState === 'saved'
                ? 'border border-emerald-700/60 bg-emerald-950/40 text-emerald-300'
                : 'border border-rose-700/60 bg-rose-950/40 text-rose-300')
          }
        >
          {saveState === 'saving' && 'Zapisywanie przypisań...'}
          {saveState === 'saved' && 'Zapisano automatycznie'}
          {saveState === 'error' && 'Nie udało się zapisać — spróbuj ponownie'}
        </div>
      )}

      <WorkerAssignmentOverview
        workers={activeWorkers}
        sections={sections}
        selections={selections}
      />

      {activeWorkers.length === 0 && workers.length > 0 && (
        <p className="rounded-2xl border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm font-semibold text-amber-300">
          Nikt nie jest oznaczony jako obecny. Ustaw obecność w zakładce „Pracownicy”.
        </p>
      )}

      {hasConflicts && (
        <p className="rounded-2xl border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm font-semibold text-amber-300">
          Niektórzy pracownicy są przypisani do więcej niż jednej sekcji. Kliknij ich imię w docelowej sekcji, aby przenieść.
        </p>
      )}

      {workers.length === 0 && (
        <p className="rounded-2xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-sm text-slate-400">
          Dodaj pracowników w zakładce „Pracownicy”.
        </p>
      )}

      {sections.map((section) => (
        <div
          key={section.id}
          className="rounded-3xl border border-slate-800 bg-slate-800/60 p-5"
        >
          <h3 className="mb-4 text-xl font-bold text-slate-100">{section.name}</h3>
          {activeWorkers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {sortWorkersForSection(activeWorkers, selections, sections, section.id).map((worker) => {
                const selected = (selections[section.id] ?? []).some(
                  (id) => normalizeWorkerId(id) === normalizeWorkerId(worker.id),
                )
                const otherSections = sections.filter(
                  (item) =>
                    item.id !== section.id &&
                    (selections[item.id] ?? []).some(
                      (id) => normalizeWorkerId(id) === normalizeWorkerId(worker.id),
                    ),
                )

                return (
                  <button
                    key={worker.id}
                    type="button"
                    onClick={() => toggleWorker(section.id, worker.id)}
                    className={
                      'min-h-[52px] rounded-2xl px-4 py-3 text-left transition active:scale-[0.98] ' +
                      (selected
                        ? 'bg-violet-600 text-white shadow-md active:bg-violet-700'
                        : 'border-2 border-slate-700 bg-slate-900/60 text-slate-200 active:bg-slate-800')
                    }
                  >
                    <span className="block text-lg font-bold leading-tight">{formatWorkerFull(worker)}</span>
                    {!selected && otherSections.length > 0 && (
                      <span className="mt-0.5 block text-xs font-medium text-amber-400">
                        → {otherSections.map((item) => item.name).join(', ')}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Brak pracowników do przypisania.</p>
          )}
        </div>
      ))}

    </div>
  )
}

function WorkersManager({ workers, onRefresh }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const firstNameInputRef = useRef(null)

  const presentWorkers = workers.filter((worker) => worker.workingToday)
  const query = search.trim()
  const filteredWorkers = query
    ? workers.filter((worker) => workerMatchesSearch(worker, query))
    : workers

  function handleAdd(event) {
    event.preventDefault()
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    if (!trimmedFirst || !trimmedLast) {
      return
    }
    setSaving(true)
    setError(false)
    createWorker(trimmedFirst, trimmedLast)
      .then(() => {
        setFirstName('')
        setLastName('')
        onRefresh()
        firstNameInputRef.current?.focus()
      })
      .catch(() => setError(true))
      .finally(() => setSaving(false))
  }

  function handleTogglePresence(worker) {
    setActionId(worker.id)
    updateWorkerWorkingToday(worker.id, !worker.workingToday)
      .then(() => onRefresh())
      .finally(() => setActionId(null))
  }

  function handleResetPresence() {
    setSaving(true)
    resetWorkersWorkingToday()
      .then(() => {
        setShowResetConfirm(false)
        onRefresh()
      })
      .finally(() => setSaving(false))
  }

  function handleDelete() {
    if (!deleteTarget || actionId != null) {
      return
    }
    const workerId = deleteTarget.id
    setActionId(workerId)
    setDeleteTarget(null)
    deleteWorker(workerId)
      .then(() => onRefresh())
      .catch(() => setError(true))
      .finally(() => setActionId(null))
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <form onSubmit={handleAdd} className="rounded-3xl border border-slate-800 bg-slate-800/60 p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-400">Imię</label>
        <input
          ref={firstNameInputRef}
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="np. Kasia"
          className="mb-4 h-14 w-full rounded-xl border-2 border-slate-700 bg-slate-900 px-4 text-lg font-semibold text-slate-100 outline-none focus:border-rose-500"
        />
        <label className="mb-2 block text-sm font-semibold text-slate-400">Nazwisko</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="np. Nowak"
          className="mb-4 h-14 w-full rounded-xl border-2 border-slate-700 bg-slate-900 px-4 text-lg font-semibold text-slate-100 outline-none focus:border-rose-500"
        />
        <button
          type="submit"
          disabled={saving || !firstName.trim() || !lastName.trim()}
          className="w-full rounded-2xl bg-rose-600 px-4 py-4 text-lg font-bold text-white active:bg-rose-700 disabled:opacity-50"
        >
          {saving ? 'DODAWANIE...' : 'Dodaj pracownika'}
        </button>
        {error && (
          <p className="mt-3 text-center text-sm text-rose-400">
            Nie udało się dodać pracownika (może już istnieje).
          </p>
        )}
      </form>

      <div className="rounded-3xl border border-emerald-800/50 bg-emerald-950/20 p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-emerald-200">
              Obecni dziś ({presentWorkers.length})
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Tylko obecni widzą ekran startowy i mogą liczyć.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="shrink-0 rounded-xl bg-slate-700 px-3 py-2 text-sm font-bold text-slate-200 active:bg-slate-600"
          >
            Reset obecności
          </button>
        </div>
        {presentWorkers.length === 0 ? (
          <p className="text-sm text-slate-500">Nikogo nie oznaczono jako obecnego.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {presentWorkers.map((worker) => (
              <button
                key={worker.id}
                type="button"
                onClick={() => handleTogglePresence(worker)}
                disabled={actionId === worker.id}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-lg font-bold text-white active:bg-emerald-700 disabled:opacity-50"
              >
                {formatWorkerFull(worker)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-400">
          Szukaj po imieniu lub nazwisku
        </label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Wpisz imię lub nazwisko..."
          className="mb-4 h-14 w-full rounded-xl border-2 border-slate-700 bg-slate-900 px-4 text-lg font-semibold text-slate-100 outline-none focus:border-rose-500"
        />

        <h3 className="mb-3 text-lg font-bold text-slate-300">
          Baza pracowników ({filteredWorkers.length}{query ? ' / ' + workers.length : ''})
        </h3>

        {workers.length === 0 ? (
          <p className="text-center text-slate-400">Brak pracowników w bazie.</p>
        ) : filteredWorkers.length === 0 ? (
          <p className="text-center text-slate-400">Brak wyników dla „{search.trim()}”.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filteredWorkers.map((worker) => (
              <li
                key={worker.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-800/60 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-bold text-slate-100">{formatWorkerFull(worker)}</p>
                  <p className="text-sm text-slate-500">
                    {worker.workingToday ? 'Obecny dziś' : 'Nieobecny'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePresence(worker)}
                  disabled={actionId === worker.id}
                  className={
                    'shrink-0 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50 ' +
                    (worker.workingToday
                      ? 'bg-slate-600 active:bg-slate-500'
                      : 'bg-emerald-600 active:bg-emerald-700')
                  }
                >
                  {worker.workingToday ? 'Usuń' : 'Obecny'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(worker)}
                  disabled={actionId === worker.id}
                  className="shrink-0 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white active:bg-rose-800 disabled:opacity-50"
                  aria-label={'Usuń ' + formatWorkerFull(worker)}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center">
            <h3 className="text-2xl font-extrabold text-slate-100">Reset obecności?</h3>
            <p className="mt-3 text-base text-slate-400">
              Wszyscy pracownicy zostaną oznaczeni jako nieobecni. Przygotowanie do nowego spotkania.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleResetPresence}
                disabled={saving}
                className="rounded-2xl bg-emerald-600 px-6 py-5 text-xl font-bold text-white active:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'RESETOWANIE...' : 'TAK, RESETUJ'}
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center">
            <h3 className="text-2xl font-extrabold text-slate-100">Usunąć pracownika?</h3>
            <p className="mt-3 text-base text-slate-400">
              {formatWorkerFull(deleteTarget)} zostanie trwale usunięty z bazy i przypisań do sekcji.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={actionId === deleteTarget.id}
                className="rounded-2xl bg-rose-600 px-6 py-5 text-xl font-bold text-white active:bg-rose-700 disabled:opacity-50"
              >
                {actionId === deleteTarget.id ? 'USUWANIE...' : 'TAK, USUŃ'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
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

export default function Admin() {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated())
  const [overview, setOverview] = useState(null)
  const [workers, setWorkers] = useState([])
  const [sectionList, setSectionList] = useState([])
  const [status, setStatus] = useState('loading')
  const [section, setSection] = useState(SECTIONS.menu)
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [exportState, setExportState] = useState('idle')
  const [resetState, setResetState] = useState('idle')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  function loadOverview() {
    setStatus('loading')
    Promise.all([fetchAdminOverview(), fetchWorkers(), fetchSections()])
      .then(([overviewData, workerList, sectionsData]) => {
        setOverview(overviewData)
        setWorkers(workerList)
        setSectionList(sectionsData)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  const refreshWorkersData = useCallback(() => {
    Promise.all([fetchWorkers(), fetchSections()])
      .then(([workerList, sectionsData]) => {
        setWorkers(workerList)
        setSectionList(sectionsData)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (authenticated) {
      loadOverview()
    }
  }, [authenticated])

  useEffect(() => {
    if (!authenticated || section !== SECTIONS.progress) {
      return
    }
    fetchAdminOverview()
      .then(setOverview)
      .catch(() => {})
  }, [authenticated, section])

  useEffect(() => {
    if (!authenticated || section !== SECTIONS.assignments) {
      return
    }
    refreshWorkersData()
  }, [authenticated, section, refreshWorkersData])

  function handleLogout() {
    logoutAdmin()
    setAuthenticated(false)
    navigate('/')
  }

  function goToMenu() {
    setSection(SECTIONS.menu)
    setSelectedSectionId(null)
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

  const totalProducts = overview.sections.reduce((sum, s) => sum + s.totalProducts, 0)
  const totalCompleted = overview.sections.reduce((sum, s) => sum + s.completedCount, 0)
  const selectedSectionData = overview.sections.find((s) => s.id === selectedSectionId)

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
            description="Status każdej sekcji"
            color="sky"
            onClick={() => setSection(SECTIONS.progress)}
          />
          <MenuTile
            label="Edycja liczb"
            description="Popraw wpisane ilości"
            color="amber"
            onClick={() => {
              setSelectedSectionId(null)
              setSection(SECTIONS.edit)
            }}
          />
          <MenuTile
            label="Przypisania"
            description="Przypisz pracowników do sekcji"
            color="violet"
            onClick={() => {
              setSelectedSectionId(null)
              setSection(SECTIONS.assignments)
            }}
          />
          <MenuTile
            label="Pracownicy"
            description="Obecność, baza i usuwanie"
            color="rose"
            onClick={() => setSection(SECTIONS.workers)}
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
          subtitle="Status każdej sekcji"
          onBack={goToMenu}
          onLogout={handleLogout}
        />
        <div className="mx-auto max-w-lg">
          {overview.sections.length === 0 ? (
            <p className="mt-8 text-center text-lg text-slate-400">Brak sekcji.</p>
          ) : (
            <ProgressSection sections={overview.sections} />
          )}
        </div>
      </div>
    )
  }

  if (section === SECTIONS.edit) {
    return (
      <div className="min-h-screen px-4 pb-10 pt-6">
        <AdminHeader
          title={selectedSectionData ? 'Edycja: ' + selectedSectionData.name : 'Edycja liczb'}
          subtitle={selectedSectionData ? 'Edytuj ilości w sekcji' : 'Wybierz sekcję'}
          onBack={selectedSectionData ? () => setSelectedSectionId(null) : goToMenu}
          onLogout={handleLogout}
        />
        <div className="mx-auto max-w-lg">
          {!selectedSectionId ? (
            <SectionPicker
              sections={overview.sections.filter((s) => s.totalProducts > 0)}
              onSelect={setSelectedSectionId}
            />
          ) : (
            <EntryEditor
              section={selectedSectionData}
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
          title="Przypisania"
          subtitle="Przypisania zapisują się automatycznie"
          onBack={goToMenu}
          onLogout={handleLogout}
        />
        <div className="mx-auto max-w-lg">
          <SectionAssignments
            sections={sectionList}
            workers={workers}
            onAssignmentsSaved={refreshWorkersData}
          />
        </div>
      </div>
    )
  }

  if (section === SECTIONS.workers) {
    return (
      <div className="min-h-screen px-4 pb-10 pt-6">
        <AdminHeader
          title="Pracownicy"
          subtitle="Obecność dziś, wyszukiwanie i baza pracowników"
          onBack={goToMenu}
          onLogout={handleLogout}
        />
        <div className="mx-auto max-w-lg">
          <WorkersManager workers={workers} onRefresh={refreshWorkersData} />
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
                To usunie wszystkie wpisane liczby. Przypisania pracowników do sekcji pozostaną bez zmian.
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
