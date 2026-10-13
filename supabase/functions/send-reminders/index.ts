import { createClient } from 'npm:@supabase/supabase-js@2'


const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Salon <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) console.error('Resend error:', await res.text())
  return res.ok
}

Deno.serve(async (req) => {
  // doar cine știe secretul poate porni funcția
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*, clients(name, email), profiles(name)')
    .eq('status', 'scheduled')
    .gte('starts_at', now.toISOString())
    .lte('starts_at', in24h.toISOString())
    .or('client_reminder_sent_at.is.null,artist_reminder_sent_at.is.null')

  if (error) return new Response(error.message, { status: 500 })

  let clientSent = 0
  let artistSent = 0

  for (const a of appointments ?? []) {
    const when = formatDate(a.starts_at)
    const desc = a.description ? escapeHtml(a.description) : ''

    // reminder pentru client (doar dacă are email)
    if (!a.client_reminder_sent_at && a.clients?.email) {
      const ok = await sendEmail(
        a.clients.email,
        'Reminder programare tatuaj',
        `<p>Salut, ${escapeHtml(a.clients.name)}!</p>
         <p>Te așteptăm la programare: <strong>${when}</strong>.</p>
         ${desc ? `<p>${desc}</p>` : ''}`
      )
      if (ok) {
        await supabase
          .from('appointments')
          .update({ client_reminder_sent_at: new Date().toISOString() })
          .eq('id', a.id)
        clientSent++
      }
    }

    // reminder pentru artist (emailul vine din contul de login)
    if (!a.artist_reminder_sent_at) {
      const { data: user } = await supabase.auth.admin.getUserById(a.artist_id)
      const artistEmail = user?.user?.email
      if (artistEmail) {
        const ok = await sendEmail(
          artistEmail,
          'Programare mâine',
          `<p>Ai o programare: <strong>${when}</strong></p>
           <p>Client: ${escapeHtml(a.clients?.name ?? '')}</p>
           ${desc ? `<p>${desc}</p>` : ''}
           <p>${a.deposit_paid ? 'Avans plătit' : 'Fără avans'}</p>`
        )
        if (ok) {
          await supabase
            .from('appointments')
            .update({ artist_reminder_sent_at: new Date().toISOString() })
            .eq('id', a.id)
          artistSent++
        }
      }
    }
  }

  return Response.json({ checked: appointments?.length ?? 0, clientSent, artistSent })
})