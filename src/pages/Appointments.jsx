import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const emptyForm = {
  client_id: '',
  artist_id: '',
  start: '',        
  duration: 60,     
  description: '',
  deposit_paid: false,
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [artists, setArtists] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, clients(name, phone), profiles(name)')
      .neq('status', 'cancelled')
      .gte('ends_at', new Date().toISOString())
      .order('starts_at')
    if (error) setError(error.message)
    else setAppointments(data)
  }

  useEffect(() => {
    async function init() {
      const [c, a] = await Promise.all([
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('profiles').select('id, name').order('name'),
      ])
      setClients(c.data ?? [])
      setArtists(a.data ?? [])
      loadAppointments()
    }
    init()
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    
    const start = new Date(form.start)
    const end = new Date(start.getTime() + Number(form.duration) * 60000)

    const { error } = await supabase.from('appointments').insert({
      client_id: form.client_id,
      artist_id: form.artist_id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      description: form.description.trim() || null,
      deposit_paid: form.deposit_paid,
    })

    if (error) {
      
      setError(
        error.code === '23P01'
          ? 'Artistul are deja o programare în intervalul ăsta.'
          : error.message
      )
    } else {
      setForm(emptyForm)
      await loadAppointments()
    }
    setSaving(false)
  }

  async function cancelAppointment(id) {
    if (!confirm('Anulezi programarea?')) return
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    loadAppointments()
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString('ro-RO', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <Link to="/">← Înapoi</Link>
      <h1>Programări</h1>

      <form onSubmit={handleSubmit}>
        <h2>Programare nouă</h2>

        <select name="client_id" value={form.client_id} onChange={handleChange} required>
          <option value="">Alege client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select name="artist_id" value={form.artist_id} onChange={handleChange} required>
          <option value="">Alege artist</option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <input
          type="datetime-local"
          name="start"
          value={form.start}
          onChange={handleChange}
          required
        />

        <select name="duration" value={form.duration} onChange={handleChange}>
          <option value={30}>30 min</option>
          <option value={60}>1 oră</option>
          <option value={90}>1h 30</option>
          <option value={120}>2 ore</option>
          <option value={180}>3 ore</option>
          <option value={240}>4 ore</option>
          <option value={360}>6 ore</option>
        </select>

        <textarea
          name="description"
          placeholder="Descriere (ex: mânecă braț stâng, ședința 2)"
          value={form.description}
          onChange={handleChange}
        />

        <label>
          <input
            type="checkbox"
            name="deposit_paid"
            checked={form.deposit_paid}
            onChange={handleChange}
          />
          Avans plătit
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Se salvează...' : 'Adaugă programare'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <hr />

      <h2>Următoarele programări</h2>
      <ul>
        {appointments.map((a) => (
          <li key={a.id}>
            <strong>{formatDate(a.starts_at)}</strong> · {a.clients?.name}
            {a.clients?.phone && <> ({a.clients.phone})</>} · artist: {a.profiles?.name}
            {a.deposit_paid ? ' · avans ✔' : ' · fără avans'}
            {a.description && <div>{a.description}</div>}
            <button onClick={() => cancelAppointment(a.id)}>Anulează</button>
          </li>
        ))}
      </ul>
      {appointments.length === 0 && <p>Nicio programare viitoare.</p>}
    </div>
  )
}