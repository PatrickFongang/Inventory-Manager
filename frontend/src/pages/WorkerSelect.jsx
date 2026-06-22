import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSections } from '../api.js'
import Spinner from '../components/Spinner.jsx'
import StatusScreen from '../components/StatusScreen.jsx'
import { formatWorkerShort, workerMatchesSearch } from '../workerName.js'

export default function WorkerSelect() {
  const navigate = useNavigate()
  const [sections, setSections] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('loading')

  function load() {
    setStatus('loading')
    fetchSections(true)
      .then((data) => {
        setSections(data.filter((section) => section.workers.length > 0))
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(() => {
    load()
  }, [])

  const query = search.trim()
  const visibleSections = sections
    .map((section) => ({
      ...section,
      workers: section.workers.filter((worker) => workerMatchesSearch(worker, query)),
    }))
    .filter((section) => section.workers.length > 0)

  if (status === 'loading') {
    return <Spinner label="Pobieranie sekcji..." />
  }

  if (status === 'error') {
    return (
      <StatusScreen
        title="Nie udało się połączyć z serwerem"
        message="Sprawdź adres API i połączenie sieciowe."
        onRetry={load}
      />
    )
  }

  return (
    <div className="min-h-screen px-5 pb-10 pt-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-slate-100">Inwentaryzacja</h1>
        <p className="mt-2 text-lg text-slate-400">Wybierz swoje imię</p>
      </header>

      {sections.length > 0 && (
        <div className="mx-auto mb-6 max-w-md">
          <label className="mb-2 block text-sm font-semibold text-slate-400">
            Szukaj po imieniu
          </label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Wpisz imię..."
            className="h-14 w-full rounded-xl border-2 border-slate-700 bg-slate-900 px-4 text-lg font-semibold text-slate-100 outline-none focus:border-sky-500"
          />
        </div>
      )}

      {sections.length === 0 ? (
        <p className="mt-12 text-center text-lg text-slate-400">
          Brak przypisań lub obecnych pracowników. Poproś koordynatora o oznaczenie obecności i przypisanie sekcji.
        </p>
      ) : visibleSections.length === 0 ? (
        <p className="mt-12 text-center text-lg text-slate-400">
          Brak wyników dla „{query}”.
        </p>
      ) : (
        <div className="mx-auto flex max-w-md flex-col gap-4">
          {visibleSections.map((section) => (
            <div
              key={section.id}
              className="rounded-3xl bg-sky-600 px-6 py-5 shadow-lg"
            >
              <div className="flex flex-col gap-1">
                {section.workers.map((worker) => (
                  <button
                    key={worker.id}
                    onClick={() =>
                      navigate('/inventory/' + worker.id, {
                        state: {
                          workerDisplayName: formatWorkerShort(worker),
                          sectionName: section.name,
                        },
                      })
                    }
                    className="w-full rounded-2xl px-2 py-4 text-left text-3xl font-extrabold leading-tight text-white transition active:bg-sky-700"
                  >
                    {formatWorkerShort(worker)}
                  </button>
                ))}
              </div>
              <p className="mt-2 border-t border-sky-500/40 pt-3 text-sm font-medium text-sky-100/80">
                {section.name}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto mt-12 max-w-md">
        <button
          onClick={() => navigate('/admin')}
          className="w-full rounded-2xl border-2 border-slate-700 bg-slate-800/60 px-6 py-5 text-lg font-semibold text-slate-300 active:bg-slate-700"
        >
          Panel koordynatora
        </button>
      </div>
    </div>
  )
}
