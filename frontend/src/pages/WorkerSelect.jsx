import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWorkers } from '../api.js'
import Spinner from '../components/Spinner.jsx'
import StatusScreen from '../components/StatusScreen.jsx'

export default function WorkerSelect() {
  const navigate = useNavigate()
  const [workers, setWorkers] = useState([])
  const [status, setStatus] = useState('loading')

  function load() {
    setStatus('loading')
    fetchWorkers()
      .then((data) => {
        setWorkers(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(() => {
    load()
  }, [])

  if (status === 'loading') {
    return <Spinner label="Pobieranie pracowników..." />
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
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-100">Inwentaryzacja</h1>
        <p className="mt-2 text-lg text-slate-400">Wybierz swoje imię</p>
      </header>

      {workers.length === 0 ? (
        <p className="mt-12 text-center text-lg text-slate-400">
          Brak pracowników do wyświetlenia.
        </p>
      ) : (
        <div className="mx-auto grid max-w-md grid-cols-1 gap-4">
          {workers.map((worker) => (
            <button
              key={worker}
              onClick={() => navigate('/inventory/' + encodeURIComponent(worker))}
              className="w-full rounded-3xl bg-sky-600 px-6 py-8 text-2xl font-bold text-white shadow-lg active:scale-[0.98] active:bg-sky-700 transition"
            >
              {worker}
            </button>
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
