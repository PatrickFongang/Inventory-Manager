import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin } from '../auth.js'

export default function AdminLogin({ onSuccess }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    if (loginAdmin(password)) {
      setError(false)
      onSuccess()
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-100">Panel Koordynatora</h1>
        <p className="mt-2 text-lg text-slate-400">Wprowadź hasło</p>
      </header>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Hasło"
          className="h-16 rounded-2xl border-2 border-slate-700 bg-slate-900 px-5 text-xl text-slate-100 outline-none focus:border-sky-500"
        />
        {error && (
          <p className="text-center text-base font-semibold text-rose-400">
            Nieprawidłowe hasło
          </p>
        )}
        <button
          type="submit"
          className="rounded-2xl bg-sky-600 px-6 py-5 text-xl font-bold text-white active:bg-sky-700"
        >
          ZALOGUJ
        </button>
      </form>

      <button
        onClick={() => navigate('/')}
        className="text-lg text-slate-400 underline"
      >
        Powrót do startu
      </button>
    </div>
  )
}
