import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const emptyForm = { name: '', phone: '', email: '', notes: '' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    if (error) setError(error.message)
    else setClients(data)
  }

  useEffect(() => {
    loadClients()
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
    }

    const { error } = await supabase.from('clients').insert(payload)

    if (error) {
      setError(error.message)
    } else {
      setForm(emptyForm)
      await loadClients()
    }
    setSaving(false)
  }

  const q = search.toLowerCase()
  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(search))
  )

  return (
    <div>
      <Link to="/">← Înapoi</Link>
      <h1>Clienți</h1>

      <form onSubmit={handleSubmit}>
        <h2>Client nou</h2>
        <input
          name="name"
          placeholder="Nume *"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="phone"
          placeholder="Telefon"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <textarea
          name="notes"
          placeholder="Notițe"
          value={form.notes}
          onChange={handleChange}
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Se salvează...' : 'Adaugă'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <hr />

      <input
        placeholder="Caută după nume sau telefon"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ul>
        {filtered.map((c) => (
          <li key={c.id}>
            <strong>{c.name}</strong>
            {c.phone && <> · {c.phone}</>}
            {c.email && <> · {c.email}</>}
            {c.notes && <div>{c.notes}</div>}
          </li>
        ))}
      </ul>

      {filtered.length === 0 && <p>Niciun client găsit.</p>}
    </div>
  )
}