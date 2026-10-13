import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { supabase } from '../lib/supabase'


const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2']

export default function CalendarPage() {
  const [events, setEvents] = useState([])
  const [artists, setArtists] = useState([])
  const [artistFilter, setArtistFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  async function load() {
    const [apps, profs] = await Promise.all([
      supabase
        .from('appointments')
        .select('*, clients(name, phone), profiles(name)')
        .neq('status', 'cancelled'),
      supabase.from('profiles').select('id, name').order('name'),
    ])

    if (apps.error) {
      setError(apps.error.message)
      return
    }

    const artistList = profs.data ?? []
    setArtists(artistList)

    setEvents(
      apps.data.map((a) => {
        const idx = artistList.findIndex((p) => p.id === a.artist_id)
        return {
          id: a.id,
          title: `${a.clients?.name} (${a.profiles?.name})`,
          start: a.starts_at,
          end: a.ends_at,
          backgroundColor: COLORS[idx % COLORS.length],
          borderColor: COLORS[idx % COLORS.length],
          extendedProps: { ...a, artist_id: a.artist_id },
        }
      })
    )
  }

  useEffect(() => {
    load()
  }, [])

  const visibleEvents = artistFilter
    ? events.filter((e) => e.extendedProps.artist_id === artistFilter)
    : events

  return (
    <div>
      <Link to="/">← Înapoi</Link>
      <h1>Calendar</h1>

      <select value={artistFilter} onChange={(e) => setArtistFilter(e.target.value)}>
        <option value="">Toți artiștii</option>
        {artists.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        locale="ro"
        firstDay={1}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        height="auto"
        events={visibleEvents}
        eventClick={(info) => setSelected(info.event.extendedProps)}
      />

      {selected && (
        <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 12 }}>
          <strong>{selected.clients?.name}</strong>
          {selected.clients?.phone && <> · {selected.clients.phone}</>}
          <div>Artist: {selected.profiles?.name}</div>
          <div>
            {new Date(selected.starts_at).toLocaleString('ro-RO')} →{' '}
            {new Date(selected.ends_at).toLocaleTimeString('ro-RO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div>{selected.deposit_paid ? 'Avans plătit' : 'Fără avans'}</div>
          {selected.description && <div>{selected.description}</div>}
          <button onClick={() => setSelected(null)}>Închide</button>
        </div>
      )}
    </div>
  )
}