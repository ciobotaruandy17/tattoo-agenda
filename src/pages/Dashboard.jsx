import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'


export default function Dashboard() {
  const { profile } = useAuth()

  return (
    <div>
      <h1>Salut, {profile?.name}</h1>
      <p>Rol: {profile?.role}</p>
      <Link to="/clients">Clienți</Link>
      <Link to="/appointments">Programări</Link>
      <Link to="/calendar">Calendar</Link>
      <button onClick={() => supabase.auth.signOut()}>Deconectare</button>
    </div>
  )
}