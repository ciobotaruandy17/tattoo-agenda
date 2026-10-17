import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  
  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email sau parolă greșită')

    setSubmitting(false)
  }

   return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-6"
      >
        <h1 className="text-2xl font-bold">Autentificare</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none placeholder:text-muted focus:border-accent"
        />
        <input
          type="password"
          placeholder="Parolă"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none placeholder:text-muted focus:border-accent"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent py-3 font-semibold transition hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? 'Se conectează...' : 'Intră'}
        </button>
      </form>
    </div>
  )
}