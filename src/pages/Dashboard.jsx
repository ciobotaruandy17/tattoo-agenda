import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { profile } = useAuth()
  const [today, setToday] = useState([])

  useEffect(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    supabase
      .from('appointments')
      .select('*, clients(name, phone), profiles(name)')
      .neq('status', 'cancelled')
      .gte('starts_at', start.toISOString())
      .lt('starts_at', end.toISOString())
      .order('starts_at')
      .then(({ data }) => setToday(data ?? []))
  }, [])

  const time = (iso) =>
    new Date(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

    const noDeposit = today.filter((a) => !a.deposit_paid).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">Bine ai venit</p>
          <h1 className="text-3xl font-bold">{profile?.name}</h1>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-2xl bg-surface-2 px-4 py-2 text-sm text-muted transition hover:text-white"
        >
          Deconectare
        </button>
      </div>

      {/* două blocuri pătrate cu statistici */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card flex aspect-square flex-col justify-between p-5">
          <span className="text-sm text-muted">Programări azi</span>
          <span className="text-6xl font-bold">{today.length}</span>
        </div>
        <div className="card flex aspect-square flex-col justify-between p-5">
          <span className="text-sm text-muted">Fără avans</span>
          <span className="text-6xl font-bold text-pink">{noDeposit}</span>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Azi</h2>

        {today.length === 0 && (
          <div className="card p-6 text-muted">Nicio programare azi.</div>
        )}

        <div className="space-y-4">
          {today.map((a) => {
            const [h, m] = time(a.starts_at).split(':')
            return (
              <div key={a.id} className="card flex items-center gap-4 p-4">
                <div className="tile">
                  <span className="text-xl font-bold leading-none">{h}</span>
                  <span className="text-xs leading-none opacity-80">{m}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{a.clients?.name}</p>
                  <p className="truncate text-sm text-muted">
                    {a.description || 'Fără descriere'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    a.deposit_paid
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-surface-2 text-muted'
                  }`}
                >
                  {a.deposit_paid ? 'Avans' : 'Fără avans'}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
  
}