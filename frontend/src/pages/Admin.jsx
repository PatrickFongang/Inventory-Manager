import { useState } from 'react'
import { downloadExport } from '../api.js'

export default function Admin() {
  const [state, setState] = useState('idle')

  function handleDownload() {
    setState('downloading')
    downloadExport()
      .then(() => setState('done'))
      .catch(() => setState('error'))
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-6 text-center">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-100">Panel Koordynatora</h1>
        <p className="mt-2 text-lg text-slate-400">Eksport zebranych danych</p>
      </header>

      <button
        onClick={handleDownload}
        disabled={state === 'downloading'}
        className="w-full max-w-sm rounded-3xl bg-emerald-600 px-8 py-10 text-2xl font-extrabold text-white shadow-lg active:bg-emerald-700 disabled:opacity-50"
      >
        {state === 'downloading' ? 'POBIERANIE...' : 'POBIERZ PLIK CSV'}
      </button>

      {state === 'done' && (
        <p className="text-lg font-semibold text-emerald-400">
          Plik został pobrany.
        </p>
      )}
      {state === 'error' && (
        <p className="text-lg font-semibold text-rose-400">
          Nie udało się pobrać pliku. Sprawdź połączenie z serwerem.
        </p>
      )}
    </div>
  )
}
