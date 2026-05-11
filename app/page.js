'use client'

import { useState, useEffect } from 'react'
import { getAllEvents, getEventById, saveEvent, FLAGS, subscribeToEvents } from './lib/data'
import { clinicOptions } from './lib/clinic-options'

// Default empty event - no sailors until added via admin
const DEFAULT_EVENT = {
  id: 'mexican-midwinters-2027',
  eventName: 'ILCA Mexican Midwinter Regatta 2027',
  eventDate: '2027-03-11',
  eventStartTime: '12:00',
  eventEndDate: '2027-03-13',
  venue: 'La Cruz, Nayarit, Mexico',
  organizer: 'International Sailing Academy',
  description: 'Join us for the premier ILCA regatta in Mexico! Open to all ILCA 7 and ILCA 6 sailors.',
  classes: ['ILCA 7', 'ILCA 6'],
  sailors: [],
  races: [],
  mastersScoringEnabled: true, // NA ILCA Masters scoring system toggle
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toLocaleString()
}

const LANGUAGE_COPY = {
  en: {
    switchLabel: 'EN / ES',
    brandSub: 'An ISA Regatta · Est. 2009',
    nav: { info: 'Regatta', sailors: 'Sailors', archive: 'Past Winners', results: 'Results', docs: 'Docs' },
    race: 'Race 2027',
    open: 'Registration Open',
    eyebrow: 'ILCA · Open Fleet · Mar 11–13, 2027',
    titleA: 'Mexican',
    titleB: 'Midwinters.',
    lede: 'Three days of championship ILCA racing on Banderas Bay — steady thermal breeze, big fleets, world-class race management.',
    registerShort: 'Register',
    register: 'Register for 2027',
    viewResults: 'View 2026 results',
    scroll: 'Scroll ↓ the regatta',
    countdown: 'Racing commences in',
    units: { days: 'days', hours: 'hours', minutes: 'minutes', seconds: 'seconds' },
  },
  es: {
    switchLabel: 'ES / EN',
    brandSub: 'Una regata ISA · Desde 2009',
    nav: { info: 'Regata', sailors: 'Veleristas', archive: 'Ganadores', results: 'Resultados', docs: 'Docs' },
    race: 'Regata 2027',
    open: 'Inscripción abierta',
    eyebrow: 'ILCA · Flota abierta · 11–13 marzo, 2027',
    titleA: 'Mexican',
    titleB: 'Midwinters.',
    lede: 'Tres días de regata ILCA en Bahía de Banderas: brisa térmica constante, flotas competitivas y organización de primer nivel.',
    registerShort: 'Inscríbete',
    register: 'Inscríbete para 2027',
    viewResults: 'Ver resultados 2026',
    scroll: 'Baja ↓ la regata',
    countdown: 'La regata comienza en',
    units: { days: 'días', hours: 'horas', minutes: 'minutos', seconds: 'segundos' },
  },
}

const getEventStartMs = (evt) => {
  if (!evt?.eventDate) return Number.POSITIVE_INFINITY
  const time = evt?.eventStartTime || '12:00'
  const parsed = new Date(`${evt.eventDate}T${time}:00-06:00`).getTime()
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed
}

const pickCurrentEvent = (events) => {
  if (!events?.length) return null
  const now = Date.now()
  const sorted = [...events].sort((a, b) => getEventStartMs(a) - getEventStartMs(b))
  const upcoming = sorted.find(evt => getEventStartMs(evt) >= now)
  return upcoming || sorted[sorted.length - 1] || events[0]
}

const pickPrimaryEvent = (events, requestedId) => {
  if (!events?.length) return null
  if (requestedId) {
    const requested = events.find(e => e.id === requestedId)
    if (requested) return requested
  }

  return pickCurrentEvent(events)
}

const buildArchiveEvents = (events, primaryEventId) => {
  return [...(events || [])]
    .filter(evt => evt.id !== primaryEventId)
    .sort((a, b) => getEventStartMs(b) - getEventStartMs(a))
}

// NA ILCA Masters Scoring System (Low Point - points ADDED to each race score)
const MASTERS_HANDICAP = {
  'Legend': 0,
  'Great Grand Master': 1,
  'Grand Master': 2,
  'Master': 3,
  'Apprentice': 4,
  'Open': 4
}

// Custom SVG Icons
const Icons = {
  Sailboat: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2-1c.6.6 1.3 1 2 1s1.4-.4 2-1c.6.6 1.3 1 2 1s1.4-.4 2-1c.6.6 1.3 1 2 1s1.4-.4 2-1c.6.6 1.3 1 2 1a2.4 2.4 0 0 0 2-1" />
      <path d="M4 18L12 4l8 14H4z" />
      <path d="M12 4v14" />
    </svg>
  ),
  Location: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Trophy: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Calendar: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Wind: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
  ),
  Flag: () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  CheckeredFlag: () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15c.5.5 2.5 1 4 0s2.5-2 4-1.5 2.5 1.5 4 1 2.5-.5 4-1V3c-1.5.5-2.5 1-4 .5s-2.5-1.5-4-1.5-2.5 1-4 1.5-2.5.5-4 0z" />
      <path d="M4 22v-7" />
      <path d="M8 6v4" />
      <path d="M12 5v5" />
      <path d="M16 7v3" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  Users: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Medal: ({ place }) => {
    const colors = {
      1: '#FFD700', // Gold
      2: '#C0C0C0', // Silver  
      3: '#CD7F32', // Bronze
    }
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors[place] || 'var(--mm-sun)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    )
  },
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  FileIcon: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
}

// Countdown Timer Component
function buildEventStartDateTime(event) {
  if (!event?.eventDate) return null
  const time = event?.eventStartTime || '12:00'
  return `${event.eventDate}T${time}:00-06:00`
}

function formatEventDateRange(event) {
  if (!event?.eventDate) return 'Dates TBA'

  const format = (date) => {
    const parsed = new Date(`${date}T12:00:00-06:00`)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const start = format(event.eventDate)
  const end = event.eventEndDate ? format(event.eventEndDate) : null
  return end ? `${start} – ${end}` : start
}

function CountdownTimer({ targetDate, labels }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date()
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        }
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="mm-count-row" style={{ display: 'flex', gap: '22px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {Object.entries(timeLeft).map(([unit, value], index) => (
        <div key={unit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="mm-count-n" style={{ fontFamily: 'var(--mm-display)', fontSize: unit === 'days' ? '72px' : '64px', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', color: index === 0 ? 'var(--mm-sun)' : 'var(--mm-cream)', fontVariantNumeric: 'tabular-nums' }}>{unit === 'days' ? String(value) : String(value).padStart(2, '0')}</div>
          <div className="mm-hero-mono" style={{ fontSize: '10px', letterSpacing: '0.24em', color: 'rgba(242,237,224,0.55)', marginTop: '8px' }}>{labels?.[unit] || unit}</div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  const [event, setEvent] = useState(null)
  const [allEvents, setAllEvents] = useState([])
  const [archiveEvents, setArchiveEvents] = useState([])
  const [currentEventId, setCurrentEventId] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState('loading')
  const [scrollY, setScrollY] = useState(0)
  const [sailorSort, setSailorSort] = useState({ field: 'boatClass', direction: 'asc' })
  const [language, setLanguage] = useState('en')
  const copy = LANGUAGE_COPY[language]

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load event from Supabase only
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const requestedId = params.get('event')
        const requestedTab = params.get('tab')
        if (requestedTab) setActiveTab(requestedTab)

        const supabaseEvents = await getAllEvents()
        console.log('All Supabase events:', supabaseEvents?.map(e => ({ 
          id: e.id?.slice(0,8), 
          name: e.eventName?.slice(0,20), 
          sailors: e.sailors?.length || 0 
        })))

        setAllEvents(supabaseEvents || [])
        const currentEvt = pickCurrentEvent(supabaseEvents || [])
        const evt = pickPrimaryEvent(supabaseEvents || [], requestedId)
        setCurrentEventId(currentEvt?.id || null)
        
        if (evt) {
          console.log('✅ Using Supabase event:', evt.id)
          setEvent(evt)
          setArchiveEvents(buildArchiveEvents(supabaseEvents || [], evt.id))
          setDataSource('supabase')
        } else {
          console.log('⚠️ No events found, using default')
          setEvent(DEFAULT_EVENT)
          setArchiveEvents([])
          setDataSource('default')
        }
      } catch (err) {
        console.error('Supabase error:', err)
        alert('Error loading data: ' + err.message)
        setEvent(DEFAULT_EVENT)
        setArchiveEvents([])
        setDataSource('error')
      }
      setLoading(false)
    }

    loadEvent()
  }, [])

  // Real-time sync via Supabase subscription + polling
  useEffect(() => {
    if (!event?.id) return
    
    let lastEventData = JSON.stringify(event)
    
    // Try Supabase real-time subscription first
    const subscription = subscribeToEvents((payload) => {
      if (payload.new?.id === event.id) {
        setEvent(payload.new)
        lastEventData = JSON.stringify(payload.new)
      } else if (payload.eventType === 'DELETE' && payload.old?.id === event.id) {
        // Event was deleted
      }
    })
    
    // Poll Supabase for updates (more reliable than realtime on mobile)
    const supabasePoll = setInterval(async () => {
      try {
        const updated = await getEventById(event.id)
        if (updated) {
          const updatedStr = JSON.stringify(updated)
          if (updatedStr !== lastEventData) {
            console.log('📥 Supabase poll: Updating event', updated.sailors?.length, 'sailors')
            setEvent(updated)
            lastEventData = updatedStr
          }
        }
      } catch (err) {
        // Silent fail - will retry next interval
      }
    }, 5000)

    return () => {
      if (subscription) subscription.unsubscribe()
      clearInterval(supabasePoll)
    }
  }, [event?.id])

  const handleAdminLogin = () => {
    if (adminPassword === 'isa2026') {
      window.location.href = '/admin'
    } else {
      alert('Incorrect password')
    }
  }

  const getHandicap = (category) => {
    if (!event?.mastersScoringEnabled || !category) return 0
    for (const [cat, pts] of Object.entries(MASTERS_HANDICAP)) {
      if (category.includes(cat)) return pts
    }
    return 0
  }

  const calculateResults = (sailors, races) => {
    if (!sailors.length || !races.length) return []
    
    return sailors.map(sailor => {
      const handicap = getHandicap(sailor.category)
      const raceScores = races.map(r => {
        const score = sailor.scores?.[r.number]
        if (!score) {
          // DNC = num sailors + 1 + handicap
          const dncScore = sailors.length + 1 + handicap
          return { race: r.number, value: dncScore, display: `DNC (${dncScore})`, raw: 'DNC' }
        }
        const num = parseInt(score)
        if (!isNaN(num)) {
          const finalScore = num + handicap
          return { 
            race: r.number, 
            value: finalScore, 
            display: handicap > 0 ? `${num}+${handicap}=${finalScore}` : String(finalScore),
            raw: num
          }
        }
        // For non-numeric scores (DNF, DSQ, etc.), still add handicap
        const specialScore = sailors.length + 1 + handicap
        return { race: r.number, value: specialScore, display: `${score} (${specialScore})`, raw: score }
      })

      const sorted = [...raceScores].sort((a, b) => b.value - a.value)
      const dropped = raceScores.length >= 2 ? sorted[0] : null
      if (dropped) dropped.isDropped = true

      const total = raceScores.reduce((sum, r) => sum + r.value, 0)
      const net = raceScores.filter(r => !r.isDropped).reduce((sum, r) => sum + r.value, 0)

      return { ...sailor, total, net, raceScores }
    }).sort((a, b) => a.net - b.net)
  }

  if (loading || !event) return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--mm-ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--mm-sun)', marginBottom: '20px' }}>
          <img src="/logo-icon.png" alt="" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <p>Loading regatta data...</p>
      </div>
    </div>
  )

  const eventStartDateTime = buildEventStartDateTime(event)
  const eventDateRange = formatEventDateRange(event)
  const publicSailors = [...(event.sailors || [])]
  const sortValue = (sailor, field) => String(sailor?.[field] || '').toLowerCase()
  const sortedSailors = [...publicSailors].sort((a, b) => {
    const classOrder = { 'ILCA 7': 1, 'ILCA 6': 2, Radial: 2, 'ILCA 4': 3, '4.7': 3 }
    let result = 0
    if (sailorSort.field === 'boatClass') result = (classOrder[a.boatClass] || 99) - (classOrder[b.boatClass] || 99) || sortValue(a, 'name').localeCompare(sortValue(b, 'name'))
    else result = sortValue(a, sailorSort.field).localeCompare(sortValue(b, sailorSort.field))
    return sailorSort.direction === 'asc' ? result : -result
  })
  const ilca7Sailors = sortedSailors.filter(s => s.boatClass === 'ILCA 7')
  const ilca6Sailors = sortedSailors.filter(s => s.boatClass === 'ILCA 6' || s.boatClass === 'Radial')
  const paidSailorCount = publicSailors.length
  const setSortField = (field) => setSailorSort(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))
  const exportManifestCsv = () => {
    const header = ['Name', 'Country', 'Class', 'Sail Number', 'Category', 'T-Shirt Size']
    const rows = sortedSailors.map(s => [s.name, s.country, s.boatClass, s.sailNumber, s.category, s.tshirtSize || ''])
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mexican-midwinters-2027-sailor-manifest.csv'
    link.click()
    URL.revokeObjectURL(url)
  }
  
  // Deduplicate races by race number to prevent duplicate columns
  const dedupeRaces = (races) => {
    const seen = new Set()
    return races.filter(r => {
      if (seen.has(r.number)) return false
      seen.add(r.number)
      return true
    }).sort((a, b) => a.number - b.number)
  }
  
  const ilca7Races = dedupeRaces(event.races?.filter(r => r.raceClass === 'ILCA 7') || [])
  const ilca6Races = dedupeRaces(event.races?.filter(r => r.raceClass === 'ILCA 6' || r.raceClass === 'Radial') || [])
  const archived2026Event = allEvents.find(evt => evt.id === 'mmcm1ps9woa49fdzxl')
  const archived2026Sailors = archived2026Event?.sailors?.filter(s => s.boatClass === 'ILCA 6') || []
  const archived2026Races = dedupeRaces(archived2026Event?.races?.filter(r => r.raceClass === 'ILCA 6' || r.raceClass === 'Radial') || [])
  const archived2026Results = archived2026Sailors.length && archived2026Races.length ? calculateResults(archived2026Sailors, archived2026Races).slice(0, 3) : [
    { name: 'Elena Oetling Ramirez', country: 'Mexico', boatClass: 'ILCA 6', sailNumber: '220644', net: 13 },
    { name: 'Namkhai Bourquin', country: 'Mexico', boatClass: 'ILCA 6', sailNumber: '212594', net: 15 },
    { name: 'Sanka Bourquin', country: 'Mexico', boatClass: 'ILCA 6', sailNumber: '194611', net: 18 },
  ]
  const archived2026Countries = archived2026Sailors.length ? new Set(archived2026Sailors.map(s => s.country).filter(Boolean)).size : 6
  const viewingArchivedEvent = currentEventId && event.id !== currentEventId
  const currentEvent = allEvents.find(evt => evt.id === currentEventId) || event
  const currentEventHref = currentEventId ? `/?event=${currentEventId}&tab=info` : '/'

  return (
    <div className="mm-page" style={{ minHeight: '100vh', background: 'var(--mm-ink)', color: 'var(--mm-cream)', fontFamily: 'var(--mm-body)' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800;900&family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        :root { --mm-ink:#0A1929; --mm-ink-2:#122337; --mm-ink-3:#1B304A; --mm-cream:#F2EDE0; --mm-cream-2:#E7E1D1; --mm-bone:#FAF6EC; --mm-tequila:#F4A82A; --mm-tequila-2:#FFC04A; --mm-sun:#F4A82A; --mm-sun-2:#FFC04A; --mm-rojo:#E76F51; --mm-bay:#1E4F6B; --mm-bay-2:#143A52; --mm-verde:#1E4F6B; --mm-sky:#4FB3D9; --mm-pink:#E76F51; --mm-lime:#B6E04A; --mm-display:'Archivo','Inter',system-ui,sans-serif; --mm-body:'Manrope',system-ui,sans-serif; --mm-mono:'JetBrains Mono',ui-monospace,monospace; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; }
        .mm-btn { display:inline-flex; align-items:center; gap:12px; padding:12px 20px; background:var(--mm-sun); color:var(--mm-ink); font-family:var(--mm-display); font-weight:800; font-size:13px; text-transform:uppercase; letter-spacing:.08em; border:none; border-radius:2px; cursor:pointer; text-decoration:none; transition:transform 180ms cubic-bezier(.2,.7,.1,1), background 180ms; }
        .mm-btn:hover { background:var(--mm-sun-2); transform:translateY(-1px); }
        .mm-btn--hero { font-size:16px; padding:18px 30px; letter-spacing:.1em; }
        .mm-btn-ghost { display:inline-flex; align-items:center; gap:10px; padding:16px 22px; background:transparent; color:var(--mm-cream); border:1px solid rgba(242,237,224,.35); font-family:var(--mm-mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; border-radius:2px; text-decoration:none; }
        .mm-btn-ghost:hover { border-color:var(--mm-sun); color:var(--mm-sun); background:rgba(244,168,42,.05); }
        .mm-hero-brand { font-family:var(--mm-display); font-weight:800; font-size:17px; letter-spacing:.04em; text-transform:uppercase; }
        .mm-hero-mono { font-family:var(--mm-mono); text-transform:uppercase; }
        .mm-flag { display:inline-flex; align-items:center; gap:8px; padding:5px 11px 5px 9px; background:rgba(242,237,224,.10); color:var(--mm-cream); border:1px solid rgba(242,237,224,.20); font-family:var(--mm-mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase; border-radius:2px; backdrop-filter:blur(6px); }
        .mm-flag::before { content:""; width:6px; height:6px; background:var(--mm-sun); border-radius:50%; box-shadow:0 0 8px var(--mm-sun); }
        .mm-flag--live { background:rgba(79,179,217,.08); border-color:rgba(79,179,217,.4); }
        .mm-flag--live::before { background:var(--mm-sky); box-shadow:0 0 8px var(--mm-sky); }
        @media (max-width: 900px) { .mm-nav-links, .mm-nav-lang { display:none !important; } .mm-hero-bottom { flex-direction:column !important; align-items:flex-start !important; gap:40px !important; } .mm-count-n { font-size:52px !important; } }
        .mm-page h2 { font-family:var(--mm-display) !important; font-weight:900; text-transform:uppercase; letter-spacing:-.01em; line-height:.9; color:var(--mm-cream); }
        .mm-page h3, .mm-page h4 { font-family:var(--mm-display) !important; font-style:italic; text-transform:uppercase; letter-spacing:.01em; }
        .mm-page h4 { color:var(--mm-sun) !important; }
        .mm-page section > div, .mm-page .mm-soft-panel { border-radius:4px !important; border-color:rgba(242,237,224,.14) !important; background:rgba(242,237,224,.045) !important; }
        .mm-page .mm-tabbar { background:rgba(242,237,224,.055) !important; border:1px solid rgba(242,237,224,.10); border-radius:4px !important; }
        .mm-page button, .mm-page a { transition:transform 180ms cubic-bezier(.2,.7,.1,1), background 180ms, border-color 180ms; }
        .mm-page a:focus-visible, .mm-page button:focus-visible { outline:2px solid var(--mm-sun); outline-offset:3px; }
        @media (max-width: 600px) { .mm-hero-inner { padding:20px 24px 32px !important; } .mm-chrome { flex-direction:column !important; } .mm-coords { text-align:left !important; } .mm-headline { font-size:72px !important; } .mm-count-row { flex-wrap:wrap !important; gap:12px !important; } .mm-count-n { font-size:40px !important; } }
      `}</style>

      {/* Hero Section */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', color: 'var(--mm-cream)', background: 'var(--mm-ink)' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/midwinters-hero-race.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 42%',
          transform: `translateY(${scrollY * 0.22}px) scale(1.02)`,
          filter: 'brightness(0.88) saturate(1.16) contrast(1.04)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 22% 8%, rgba(255,210,140,0.18) 0%, rgba(255,210,140,0) 60%), linear-gradient(90deg, rgba(10,25,41,0.72) 0%, rgba(10,25,41,0.36) 42%, rgba(10,25,41,0.08) 78%), linear-gradient(180deg, rgba(10,25,41,0.55) 0%, rgba(10,25,41,0.05) 35%, rgba(10,25,41,0.86) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, mixBlendMode: 'overlay', pointerEvents: 'none', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>")` }} />

        <div className="mm-hero-inner" style={{ position: 'relative', zIndex: 3, minHeight: '100vh', padding: '24px 48px 48px', display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--mm-cream)', textDecoration: 'none' }}>
              <img src="/logo-icon.png" alt="ISA" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span className="mm-hero-brand">Mexican Midwinters</span>
                <span className="mm-hero-mono" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(242,237,224,0.6)', marginTop: '5px' }}>{copy.brandSub}</span>
              </span>
            </a>
            <nav className="mm-nav-links" style={{ display: 'flex', gap: '28px', alignItems: 'center' }} aria-label="Primary">
              {[
                [copy.nav.info, 'info'],
                [copy.nav.sailors, 'sailors'],
                [copy.nav.archive, 'archive'],
                [copy.nav.results, 'results'],
                [copy.nav.docs, 'docs'],
              ].map(([label, tab]) => (
                <button key={label} onClick={() => setActiveTab(tab)} className="mm-hero-mono" style={{ background: 'transparent', border: 'none', borderBottom: activeTab === tab ? '1px solid var(--mm-sun)' : '1px solid transparent', paddingBottom: '4px', color: 'var(--mm-cream)', opacity: activeTab === tab ? 1 : 0.7, fontSize: '11px', letterSpacing: '0.18em', cursor: 'pointer' }}>{label}</button>
              ))}
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="mm-nav-lang mm-hero-mono"
                aria-label="Switch language"
                style={{ background: 'transparent', border: '1px solid rgba(242,237,224,0.24)', borderRadius: '999px', padding: '7px 10px', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.18em', color: 'rgba(242,237,224,0.72)' }}
              >{copy.switchLabel}</button>
              <a className="mm-btn" href="/register">{copy.registerShort} <span style={{ fontStyle: 'normal' }}>→</span></a>
            </div>
          </header>

          <div className="mm-chrome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '56px', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="mm-flag">{copy.race}</span>
              <span className="mm-flag mm-flag--live">{copy.open}</span>
            </div>
            <div className="mm-coords mm-hero-mono" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.24em', color: 'rgba(242,237,224,0.75)' }}>20°45'04&quot;N · 105°22'58&quot;W</div>
              <div style={{ fontSize: '10px', letterSpacing: '0.24em', color: 'rgba(242,237,224,0.5)', marginTop: '4px' }}>Bahía de Banderas, Nay.</div>
            </div>
          </div>

          <div className="mm-hero-bottom" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '64px', paddingTop: '80px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <span style={{ width: '64px', height: '1px', background: 'var(--mm-sun)' }} />
                <span className="mm-hero-mono" style={{ fontSize: '12px', letterSpacing: '0.3em', color: 'var(--mm-sun)' }}>{copy.eyebrow}</span>
              </div>
              <h1 className="mm-headline" style={{ fontFamily: 'var(--mm-display)', fontWeight: 900, fontSize: 'clamp(72px, 11vw, 180px)', lineHeight: 0.92, letterSpacing: '-0.025em', textTransform: 'uppercase', margin: 0, color: 'var(--mm-cream)' }}>
                {copy.titleA}<br />
                <span style={{ color: 'var(--mm-sun)' }}>{copy.titleB}</span>
              </h1>
              <p style={{ maxWidth: '540px', marginTop: '28px', fontSize: '17px', lineHeight: 1.55, color: 'rgba(242,237,224,0.82)', fontFamily: 'var(--mm-body)', fontWeight: 300 }}>
                {copy.lede}
              </p>
              <div style={{ marginTop: '36px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <a className="mm-btn mm-btn--hero" href="/register">{copy.register} <span style={{ fontStyle: 'normal' }}>→</span></a>
                <button className="mm-btn-ghost" type="button" onClick={() => setActiveTab('archive')}>{copy.viewResults}</button>
              </div>
              <div className="mm-hero-mono" style={{ marginTop: '32px', fontSize: '10px', letterSpacing: '0.24em', color: 'rgba(242,237,224,0.5)' }}>{copy.scroll}</div>
            </div>

            <aside style={{ minWidth: '380px' }} aria-label="Countdown">
              <div className="mm-hero-mono" style={{ fontSize: '10px', letterSpacing: '0.24em', color: 'rgba(242,237,224,0.6)', marginBottom: '18px' }}>{copy.countdown}</div>
              <CountdownTimer targetDate={eventStartDateTime} labels={copy.units} />
            </aside>
          </div>
        </div>
      </section>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <div style={{ 
            background: '#112240', 
            padding: '40px', 
            borderRadius: '16px', 
            color: 'white',
            maxWidth: '400px',
            width: '90%',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '24px' }}>Admin Access</h3>
            <input 
              type="password" 
              placeholder="Enter password" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{ 
                padding: '15px', 
                width: '100%', 
                marginBottom: '20px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleAdminLogin}
                style={{ 
                  flex: 1,
                  padding: '15px', 
                  background: 'var(--mm-sun)', 
                  color: 'var(--mm-cream)', 
                  border: 'none', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Login
              </button>
              <button 
                onClick={() => setShowAdminLogin(false)}
                style={{ 
                  flex: 1,
                  padding: '15px', 
                  background: 'transparent', 
                  color: 'white', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mm-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '26px 15px 48px' }}>
        
        {/* Tab Navigation */}
        <div className="mm-tabbar" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: '40px',
          background: 'rgba(255,255,255,0.05)',
          padding: '8px',
          borderRadius: '12px',
          maxWidth: '100%',
          margin: '0 auto 40px',
          flexWrap: 'wrap',
        }}>
          {['info', 'sailors', 'schedule', 'results', 'docs', 'archive'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: '1 1 auto',
                minWidth: '70px',
                padding: '12px 16px',
                background: activeTab === tab ? 'var(--mm-sun)' : 'transparent',
                color: activeTab === tab ? 'white' : 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontFamily: 'var(--mm-mono)',
                fontSize: '11px',
                letterSpacing: '0.16em',
                fontWeight: '600',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                boxShadow: activeTab === tab ? '0 4px 6px rgba(244, 168, 42, 0.3)' : 'none',
                transform: activeTab === tab ? 'translateY(-2px)' : 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {viewingArchivedEvent && (
          <div style={{
            maxWidth: '900px',
            margin: '0 auto 35px',
            padding: '18px 22px',
            borderRadius: '14px',
            background: 'rgba(244, 168, 42, 0.12)',
            border: '1px solid rgba(244, 168, 42, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--mm-sun)', fontWeight: 'bold', marginBottom: '4px' }}>Archive mode</div>
              <div style={{ fontSize: '16px', opacity: 0.9 }}>You are viewing an archived regatta. Use the button to return to the current event.</div>
            </div>
            <a
              href={currentEventHref}
              style={{
                background: 'var(--mm-sun)',
                color: 'var(--mm-cream)',
                padding: '12px 18px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              Back to Current Event
            </a>
          </div>
        )}

        {/* Tab Content */}
        <div style={{ minHeight: '400px' }}>
          
          {/* INFO TAB */}
          {activeTab === 'info' && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              
              {/* Event Overview */}
              <section style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: 'var(--mm-sun)' }}><Icons.Flag /></span>
                  Event Overview
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '8px' }}>Dates</h4>
                      <p>{event.eventDate || 'Date TBA'}{event.eventEndDate ? ` – ${event.eventEndDate}` : ''}</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>
                        Start time: {event.eventStartTime || '12:00'}
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '8px' }}>Location</h4>
                      <p>La Cruz de Huanacaxtle, Nayarit, Mexico</p>
                      <p style={{ fontSize: '14px', opacity: 0.7 }}>Bahía de Banderas</p>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '8px' }}>Classes</h4>
                      <p>ILCA 6, ILCA 7</p>
                      <p style={{ fontSize: '14px', opacity: 0.7 }}>All levels including Masters</p>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '8px' }}>Host</h4>
                      <p>International Sailing Academy</p>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '25px', paddingTop: '25px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: 'var(--mm-sun)', marginBottom: '10px' }}>Highlights</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--mm-sun)' }}>•</span> 3 days of racing (up to 9 races)
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--mm-sun)' }}>•</span> "Whale Perpetual Trophy"
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--mm-sun)' }}>•</span> Warm water sailing
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--mm-sun)' }}>•</span> Friendly atmosphere
                      </li>
                    </ul>
                  </div>
                </div>
              </section>


              {/* Past Winners / Record */}
              <section style={{ marginBottom: '60px', position: 'relative', overflow: 'hidden', background: 'var(--mm-ink-2)', border: '1px solid rgba(244,168,42,0.26)', borderRadius: '4px', padding: '34px clamp(22px, 4vw, 44px)' }}>
                <div style={{ position: 'absolute', top: '-110px', left: '-80px', width: '260px', height: '260px', borderRadius: '999px', background: 'rgba(244,168,42,0.20)', filter: 'blur(52px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: '24px', top: '24px', bottom: '24px', width: '38%', border: '1px solid rgba(244,168,42,0.34)', borderRight: 'none', transform: 'skewX(-6deg)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(28px, 5vw, 64px)', alignItems: 'center' }}>
                  <div>
                    <div className="mm-hero-mono" style={{ color: 'rgba(242,237,224,0.56)', fontSize: '11px', letterSpacing: '0.24em', marginBottom: '16px' }}>2026 · THE RECORD</div>
                    <h2 style={{ fontSize: 'clamp(54px, 8vw, 112px)', lineHeight: 0.88, margin: 0, color: 'var(--mm-cream)' }}>
                      Past<br /><span style={{ color: 'var(--mm-sun)' }}>winners.</span>
                    </h2>
                    <p style={{ maxWidth: '390px', margin: '24px 0 0', color: 'rgba(242,237,224,0.62)', fontSize: '15px', lineHeight: 1.65 }}>
                      The real 2026 Mexican Midwinters record: {archived2026Sailors.length || 20} sailors, {archived2026Countries} countries, {archived2026Races.length || 9} completed races in Banderas Bay.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', marginTop: '24px', maxWidth: '420px' }}>
                      {[['Entries', archived2026Sailors.length || 20], ['Countries', archived2026Countries], ['Races', archived2026Races.length || 9]].map(([label, value]) => (
                        <div key={label} style={{ borderTop: '1px solid rgba(244,168,42,0.42)', paddingTop: '10px' }}>
                          <div style={{ fontFamily: 'var(--mm-display)', fontWeight: 900, fontSize: '30px', color: 'var(--mm-cream)', lineHeight: 1 }}>{value}</div>
                          <div className="mm-hero-mono" style={{ fontSize: '9px', letterSpacing: '0.18em', color: 'rgba(242,237,224,0.46)', marginTop: '4px' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    {archived2026Results.map((sailor, index) => (
                      <div key={`${sailor.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: '74px 1fr auto', gap: '18px', alignItems: 'center', padding: '18px 0', borderTop: index === 0 ? '1px solid rgba(244,168,42,0.38)' : '1px solid rgba(242,237,224,0.14)' }}>
                        <div style={{ fontFamily: 'var(--mm-display)', fontWeight: 900, fontSize: '42px', color: index === 0 ? 'var(--mm-sun)' : 'rgba(242,237,224,0.76)', lineHeight: 1 }}>{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'}</div>
                        <div>
                          <div style={{ fontFamily: 'var(--mm-display)', fontWeight: 900, fontSize: 'clamp(24px, 3.2vw, 42px)', lineHeight: 0.98, textTransform: 'uppercase', color: index === 0 ? 'var(--mm-sun)' : 'var(--mm-cream)' }}>{sailor.name}</div>
                          <div className="mm-hero-mono" style={{ marginTop: '8px', fontSize: '10px', letterSpacing: '0.18em', color: 'rgba(242,237,224,0.48)' }}>{sailor.country || '—'} · {sailor.boatClass || 'ILCA 6'} · Sail #{sailor.sailNumber || '—'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--mm-display)', fontWeight: 900, fontSize: '34px', color: 'var(--mm-cream)', lineHeight: 1 }}>{sailor.net}</div>
                          <div className="mm-hero-mono" style={{ fontSize: '9px', letterSpacing: '0.18em', color: 'rgba(242,237,224,0.48)' }}>NET PTS</div>
                        </div>
                      </div>
                    ))}
                    <a href="/?event=mmcm1ps9woa49fdzxl&tab=results" style={{ display: 'inline-flex', marginTop: '18px', color: 'var(--mm-sun)', fontFamily: 'var(--mm-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none' }}>View full 2026 results →</a>
                  </div>
                </div>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '2px', background: 'var(--mm-sun)' }} />
              </section>

              {/* Registration */}
              <section style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: 'var(--mm-sun)' }}><Icons.Trophy /></span>
                  Registration
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginBottom: '25px' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--mm-sun)' }}>$100</div>
                    <a 
                      href="/register"
                      style={{
                        background: 'var(--mm-sun)',
                        color: 'var(--mm-cream)',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      Register Now <Icons.ArrowRight />
                    </a>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '8px' }}>What's Included</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, opacity: 0.8 }}>
                        <li>• Entry to regatta (up to 9 races)</li>
                        <li>• Event t-shirt</li>
                        <li>• Trophy awards ceremony</li>
                        <li>• Prize-giving party</li>
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '8px' }}>Important Notes</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, opacity: 0.8 }}>
                        <li>• No registration deadline</li>
                        <li>• No late fees</li>
                        <li>• Secure online payment</li>
                        <li>• Accommodation not included</li>
                        <li>• Boat charter available separately</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>



              {/* Pre / Post Clinic Options */}
              <section style={{ marginBottom: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '18px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  <div>
                    <div className="mm-hero-mono" style={{ color: 'var(--mm-sun)', fontSize: '11px', letterSpacing: '0.22em', marginBottom: '10px' }}>TRAIN AROUND THE REGATTA</div>
                    <h2 style={{ fontSize: '32px', margin: 0 }}>Pre-Regatta Clinic Options</h2>
                  </div>
                  <a href="https://internationalsailingacademy.com/clinics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--mm-sun)', fontFamily: 'var(--mm-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none' }}>View all ISA clinics →</a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  {clinicOptions.map((clinic, index) => (
                    <article key={clinic.id} style={{ overflow: 'hidden', background: index === 0 ? 'var(--mm-bay)' : 'var(--mm-ink-2)', border: '1px solid rgba(242,237,224,0.14)', borderRadius: '4px' }}>
                      <div style={{ position: 'relative', height: '190px', overflow: 'hidden', background: 'var(--mm-ink-3)' }}>
                        <img src={clinic.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(0.95) contrast(1.05)' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,25,41,0.05), rgba(10,25,41,0.64))' }} />
                        <div className="mm-hero-mono" style={{ position: 'absolute', top: '14px', left: '14px', background: 'var(--mm-sun)', color: 'var(--mm-ink)', padding: '6px 9px', borderRadius: '2px', fontSize: '10px', letterSpacing: '0.16em' }}>{clinic.badge}</div>
                      </div>
                      <div style={{ padding: '22px' }}>
                        <div className="mm-hero-mono" style={{ color: 'var(--mm-sun)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>{clinic.timing} · {clinic.fleet}</div>
                        <h3 style={{ margin: '0 0 10px', color: 'var(--mm-cream)', fontSize: '26px', lineHeight: 1 }}>{clinic.title}</h3>
                        <p style={{ margin: '0 0 18px', color: 'rgba(242,237,224,0.74)', lineHeight: 1.55 }}>{clinic.description}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 16px', color: 'rgba(242,237,224,0.72)', fontSize: '13px', marginBottom: '20px' }}>
                          <div><strong style={{ color: 'var(--mm-cream)' }}>{clinic.coach}</strong><br />Coach</div>
                          <div><strong style={{ color: 'var(--mm-cream)' }}>{clinic.dates}</strong><br />{clinic.duration}</div>
                          <div><strong style={{ color: 'var(--mm-cream)' }}>{clinic.price}</strong><br />Starting from</div>
                          <div><strong style={{ color: 'var(--mm-cream)' }}>Banderas Bay</strong><br />Mexico</div>
                        </div>
                        <a href={clinic.href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--mm-sun)', color: 'var(--mm-ink)', padding: '11px 16px', borderRadius: '4px', textDecoration: 'none', fontWeight: 900, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Learn More →</a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Venue & Travel */}
              <section style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: 'var(--mm-sun)' }}><Icons.Location /></span>
                  Venue & Travel
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '10px' }}>Racing Venue</h4>
                      <p style={{ marginBottom: '10px' }}>Bahía de Banderas, launching from Marina Riviera Nayarit and the International Sailing Academy</p>
                      <p style={{ fontSize: '14px', opacity: 0.7 }}>La Cruz de Huanacaxtle, Nayarit, Mexico</p>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '10px' }}>Getting There</h4>
                      <p>Fly into <strong>Puerto Vallarta (PVR)</strong> airport</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>Stay in Bucerías or La Cruz — hotels, Airbnbs, and restaurants nearby</p>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '10px' }}>Weather</h4>
                      <p>Warm water & stable thermal winds in March</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>Average daily high ~28°C (82°F), reliable breeze, scenic mountain backdrop</p>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '10px' }}>Boat Storage</h4>
                      <p>Available at ISA and Bourquin Sailing Yard</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>Contact ISA to reserve boat park space</p>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '25px' }}>
                    <a 
                      href="https://maps.app.goo.gl/R3H3UwEeaY8MSpjw6" 
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--mm-sun)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Icons.Location /> View on Google Maps →
                    </a>
                  </div>
                </div>
              </section>

              {/* Classes & Awards */}
              <section style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src="/logo-icon.png" alt="" style={{ height: '24px', width: 'auto', objectFit: 'contain', verticalAlign: 'middle' }} />
                  Classes & Awards
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '10px' }}>Classes</h4>
                      <p>ILCA 6 • ILCA 7</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>Open (all ages) and Masters categories (35+)</p>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '10px' }}>Scoring</h4>
                      <p>Low Point Scoring</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>9 races scheduled • 1 discard after 4+ races</p>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '10px' }}>Awards</h4>
                      <p>Top 3 in each class • Masters recognition</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>The Whale Perpetual Trophy for overall champion</p>
                    </div>
                  </div>
                </div>
              </section>


              {/* Contact */}
              <section>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: 'var(--mm-sun)' }}><Icons.Users /></span>
                  Contact & Support
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '8px' }}>Email</h4>
                      <a href="mailto:info@internationalsailingacademy.com" style={{ color: 'white' }}>
                        info@internationalsailingacademy.com
                      </a>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '8px' }}>WhatsApp</h4>
                      <a href="https://wa.me/523221177641" target="_blank" style={{ color: 'var(--mm-sun)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        +52 322 117 7641 →
                      </a>
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--mm-sun)', marginBottom: '8px' }}>Race Office</h4>
                      <p>ISA Office, Local 31 A Del Mar<br/>La Cruz de Huanacaxtle</p>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* SAILORS TAB */}
          {activeTab === 'sailors' && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
                <div>
                  <h2 style={{ fontSize: '32px', margin: '0 0 8px' }}>Registered Sailors</h2>
                  <p style={{ margin: 0, opacity: 0.72 }}>{paidSailorCount} paid registration{paidSailorCount === 1 ? '' : 's'} shown automatically from Stripe checkout.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a href="/register" style={{ background: 'var(--mm-sun)', color: 'var(--mm-cream)', padding: '11px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Register Now</a>
                  {paidSailorCount > 0 && <button onClick={exportManifestCsv} style={{ background: 'transparent', color: 'var(--mm-sun)', border: '1px solid rgba(244,168,42,0.45)', padding: '11px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Export Manifest CSV</button>}
                </div>
              </div>

              {event.sailors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                  <div style={{ color: 'var(--mm-sun)', marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                    <img src="/logo-icon.png" alt="" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                  </div>
                  <h2 style={{ fontSize: '32px', marginBottom: '15px' }}>Registration Open</h2>
                  <p style={{ fontSize: '18px', opacity: 0.7, marginBottom: '25px' }}>Sailors will appear here as paid registrations come in.</p>
                  <a href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--mm-sun)', color: 'var(--mm-cream)', padding: '12px 22px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Register Now <Icons.ArrowRight /></a>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', marginBottom: '40px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.16)' }}>
                          {[[ 'boatClass', 'Class' ], [ 'name', 'Sailor' ], [ 'country', 'Country' ], [ 'sailNumber', 'Sail #' ], [ 'category', 'Division' ]].map(([field, label]) => (
                            <th key={field} onClick={() => setSortField(field)} style={{ padding: '14px 12px', textAlign: field === 'sailNumber' ? 'center' : 'left', cursor: 'pointer', color: 'var(--mm-sun)', whiteSpace: 'nowrap' }}>
                              {label}{sailorSort.field === field ? (sailorSort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSailors.map((sailor, index) => (
                          <tr key={sailor.id || `${sailor.name}-${index}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <td style={{ padding: '12px', fontWeight: 800 }}>{sailor.boatClass}</td>
                            <td style={{ padding: '12px' }}>{sailor.name}</td>
                            <td style={{ padding: '12px' }}><span style={{ marginRight: '8px' }}>{FLAGS[sailor.country] || '○'}</span>{sailor.country || '—'}</td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>{sailor.sailNumber || '—'}</td>
                            <td style={{ padding: '12px' }}>{sailor.category || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {ilca7Sailors.length > 0 && <SailorClassSection title="ILCA 7" color="#e53e3e" sailors={ilca7Sailors} getHandicap={getHandicap} />}
                  {ilca6Sailors.length > 0 && <SailorClassSection title="ILCA 6" color="var(--mm-bay)" sailors={ilca6Sailors} getHandicap={getHandicap} />}
                </>
              )}
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h2 style={{ fontSize: '36px', marginBottom: '15px' }}>Race Schedule</h2>
                <p style={{ fontSize: '18px', opacity: 0.7 }}>3 races per day • First warning at 12:00 PM</p>
              </div>

              <div style={{ display: 'grid', gap: '25px', maxWidth: '800px', margin: '0 auto' }}>
                {[
                  { day: 'Thursday, March 11', races: [1, 2, 3], active: true },
                  { day: 'Friday, March 12', races: [4, 5, 6], active: false },
                  { day: 'Saturday, March 13', races: [7, 8, 9], active: false },
                ].map((day, idx) => (
                  <div key={idx} style={{
                    background: day.active ? 'rgba(244, 168, 42, 0.15)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '30px',
                    border: day.active ? '1px solid rgba(244, 168, 42, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '20px',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: '5px' }}>
                        Day {idx + 1}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{day.day}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {day.races.map(race => (
                        <div key={race} style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}>
                          R{race}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              {(() => {
                // Debug logging
                console.log('Results tab - ILCA 7 sailors:', ilca7Sailors.length, 'races:', ilca7Races.length)
                console.log('Results tab - ILCA 6 sailors:', ilca6Sailors.length, 'races:', ilca6Races.length)
                if (ilca7Sailors[0]) console.log('ILCA7 first sailor scores:', ilca7Sailors[0].scores)
                if (ilca6Sailors[0]) console.log('ILCA6 first sailor scores:', ilca6Sailors[0].scores)
                
                // Check if any sailor has actual scores (non-empty values)
                const hasScoredRaces = (sailors) => sailors.some(s => 
                  s.scores && Object.values(s.scores).some(score => 
                    score !== null && score !== undefined && score !== ''
                  )
                )
                const hasIlca7Scores = hasScoredRaces(ilca7Sailors)
                const hasIlca6Scores = hasScoredRaces(ilca6Sailors)
                
                console.log('Has scores - ILCA 7:', hasIlca7Scores, 'ILCA 6:', hasIlca6Scores)
                
                // Show results if there are sailors AND either scores exist OR races are defined
                const showIlca7 = ilca7Sailors.length > 0 && (hasIlca7Scores || ilca7Races.length > 0)
                const showIlca6 = ilca6Sailors.length > 0 && (hasIlca6Scores || ilca6Races.length > 0)
                
                if (!showIlca7 && !showIlca6) {
                  return (
                    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                      <div style={{ color: 'var(--mm-sun)', marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                        <Icons.CheckeredFlag />
                      </div>
                      <h2 style={{ fontSize: '32px', marginBottom: '15px' }}>Racing Hasn't Started Yet</h2>
                      <p style={{ fontSize: '18px', opacity: 0.7, marginBottom: '30px' }}>
                        Results will be updated live during the regatta.
                      </p>
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(244, 168, 42, 0.1)',
                        padding: '20px 40px',
                        borderRadius: '12px',
                        border: '1px solid rgba(244, 168, 42, 0.3)',
                      }}>
                        <p style={{ margin: 0 }}>Check back on March 11, 2027</p>
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div>
                    {showIlca7 && (
                      <div style={{ marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>ILCA 7 Results</h2>
                        <ResultsTable sailors={ilca7Sailors} races={ilca7Races} mastersScoringEnabled={event.mastersScoringEnabled} />
                      </div>
                    )}
                    {showIlca6 && (
                      <div>
                        <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>ILCA 6 Results</h2>
                        <ResultsTable sailors={ilca6Sailors} races={ilca6Races} mastersScoringEnabled={event.mastersScoringEnabled} />
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'docs' && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h2 style={{ fontSize: '36px', marginBottom: '15px' }}>Documents</h2>
                <p style={{ fontSize: '18px', opacity: 0.7 }}>Official documents for the regatta</p>
              </div>
              
              {(!event.documents || event.documents.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ color: 'var(--mm-sun)', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <Icons.FileIcon />
                  </div>
                  <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>No Documents Yet</h3>
                  <p style={{ fontSize: '16px', opacity: 0.6 }}>Check back later for sailing instructions and other documents.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '15px', maxWidth: '600px', margin: '0 auto' }}>
                  {event.documents.map((doc, idx) => (
                    <a 
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                        e.currentTarget.style.borderColor = 'rgba(244, 168, 42, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      }}
                    >
                      <div style={{ 
                        fontSize: '32px', 
                        color: 'var(--mm-sun)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '50px',
                        height: '50px',
                        background: 'rgba(244, 168, 42, 0.1)',
                        borderRadius: '8px',
                      }}>
                        📄
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', margin: '0 0 5px 0', fontWeight: '600' }}>{doc.name}</h3>
                        <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>{doc.description || 'Click to download'}</p>
                      </div>
                      <div style={{ opacity: 0.5 }}>↓</div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ARCHIVE TAB */}
          {activeTab === 'archive' && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '36px', marginBottom: '15px' }}>Results Archive</h2>
                <p style={{ fontSize: '18px', opacity: 0.7 }}>Open past regattas without losing year-over-year results.</p>
              </div>

              <div style={{ maxWidth: '760px', margin: '0 auto 28px' }}>
                <a
                  href={currentEventHref}
                  style={{
                    display: 'block',
                    background: 'linear-gradient(135deg, rgba(244, 168, 42, 0.22), rgba(244, 168, 42, 0.14))',
                    padding: '22px',
                    borderRadius: '14px',
                    border: '1px solid rgba(244, 168, 42, 0.45)',
                    color: 'white',
                    textDecoration: 'none',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: 'var(--mm-sun)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.4px', fontWeight: 'bold', marginBottom: '6px' }}>Current event</div>
                      <h3 style={{ fontSize: '22px', margin: '0 0 8px 0' }}>{currentEvent?.eventName || 'Current Regatta'}</h3>
                      <p style={{ margin: 0, opacity: 0.75 }}>Return to the live/current regatta page</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--mm-sun)' }}>{currentEvent?.eventDate || 'Date TBA'}</div>
                      <div style={{ opacity: 0.85, fontSize: '14px', marginTop: '6px' }}>Back to current →</div>
                    </div>
                  </div>
                </a>
              </div>

              {archiveEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ color: 'var(--mm-sun)', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <Icons.Trophy />
                  </div>
                  <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>No Archived Regattas Yet</h3>
                  <p style={{ fontSize: '16px', opacity: 0.6 }}>When you create future events, older regattas will stay clickable here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px', maxWidth: '760px', margin: '0 auto' }}>
                  {archiveEvents.map((archiveEvent) => (
                    <a
                      key={archiveEvent.id}
                      href={`/?event=${archiveEvent.id}&tab=results`}
                      style={{
                        display: 'block',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '22px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        textDecoration: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{ fontSize: '20px', margin: '0 0 8px 0' }}>{archiveEvent.eventName}</h3>
                          <p style={{ margin: 0, opacity: 0.7 }}>{archiveEvent.venue || 'Venue TBA'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--mm-sun)' }}>{archiveEvent.eventDate || 'Date TBA'}</div>
                          <div style={{ opacity: 0.7, fontSize: '14px' }}>{archiveEvent.sailors?.length || 0} sailors • {(archiveEvent.races || []).length || 0} races</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Debug Panel - at bottom */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          padding: '8px 12px', 
          borderRadius: '6px',
          marginTop: '40px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.4)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span>Source: {dataSource}</span>
          <span>|</span>
          <span>Sailors: {event?.sailors?.length || 0}</span>
          <span>|</span>
          <button 
            onClick={async () => {
              // Force refresh from Supabase by clearing and reloading
              setLoading(true)
              try {
                const supabaseEvents = await getAllEvents()
                console.log('Force refresh - Supabase events:', supabaseEvents)
                if (supabaseEvents && supabaseEvents.length > 0) {
                  // Find the event with the most sailors
                  const bestEvent = supabaseEvents.reduce((best, e) => 
                    (e.sailors?.length || 0) > (best?.sailors?.length || 0) ? e : best
                  , supabaseEvents[0])
                  console.log('Setting event with', bestEvent.sailors?.length, 'sailors')
                  setEvent(bestEvent)
                  setDataSource('supabase-force')
                }
              } catch (err) {
                console.error('Force refresh error:', err)
              } finally {
                setLoading(false)
              }
            }}
            style={{
              padding: '2px 8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        background: 'rgba(255,255,255,0.03)', 
        padding: '40px 15px', 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
            <img src="/logo-horizontal.png" alt="International Sailing Academy" style={{ maxWidth: '320px', height: 'auto' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
            <a href="https://internationalsailingacademy.com" style={{ color: 'var(--mm-sun)', textDecoration: 'none' }}>Website</a>
            <a href="https://isa-virtual-coaching.circle.so/" style={{ color: 'var(--mm-sun)', textDecoration: 'none' }}>Virtual Coaching</a>
          </div>
          <p style={{ marginTop: '30px', opacity: 0.4, fontSize: '14px' }}>© 2027 International Sailing Academy</p>
          <p style={{ marginTop: '10px', opacity: 0.3, fontSize: '11px', fontFamily: 'monospace' }}>
            Source: {dataSource} | Sailors: {event?.sailors?.length || 0} | Event: {event?.eventName?.slice(0, 20)}...
          </p>
        </div>
      </footer>
    </div>
  )
}

// Category abbreviations for mobile
const CATEGORY_ABBR = {
  'Great Grand Master': 'GGM',
  'Grand Master': 'GM',
  'Apprentice Master': 'AM',
  'Apprentice': 'AM',
  'Master': 'M',
  'Legend': 'L',
  'Youth': 'Y',
  'Junior': 'J',
  'Open': 'O',
  '18-35': '18-35'
}

function SailorClassSection({ title, color, sailors, getHandicap }) {
  return (
    <div style={{ marginBottom: '46px' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ background: color, padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}>{title}</span>
        <span>{sailors.length} Sailor{sailors.length === 1 ? '' : 's'}</span>
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowX: 'hidden' }}>
        {sailors.map((sailor, index) => (
          <SailorRow key={sailor.id || `${title}-${index}`} sailor={sailor} index={index} getHandicap={getHandicap} />
        ))}
      </div>
    </div>
  )
}

// Sailor Card Component
function SailorRow({ sailor, index, getHandicap }) {
  // Get abbreviated category
  const getCategoryAbbr = (cat) => {
    if (!cat) return '-'
    return CATEGORY_ABBR[cat] || cat
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '10px',
      padding: '10px 12px',
      border: '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
      e.currentTarget.style.borderColor = 'rgba(244, 168, 42, 0.4)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
    }}
    >
      {/* Rank */}
      <div style={{ 
        minWidth: '22px',
        textAlign: 'left',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.5)',
        flexShrink: 0,
      }}>
        #{index + 1}
      </div>
      
      {/* Flag */}
      <div style={{ fontSize: '18px', minWidth: '20px', flexShrink: 0 }}>{FLAGS[sailor.country] || '○'}</div>
      
      {/* Name */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <h3 style={{ 
          fontSize: 'clamp(11px, 3vw, 14px)', 
          fontWeight: 600, 
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.2
        }}>
          {sailor.name}
        </h3>
      </div>
      
      {/* Sail Number */}
      <div style={{ 
        fontSize: '12.5px',
        color: 'rgba(255,255,255,0.82)',
        minWidth: '52px',
        textAlign: 'center',
        flexShrink: 0,
        fontWeight: 600,
        letterSpacing: '0.02em',
        marginLeft: '6px'
      }}>
        {sailor.sailNumber}
      </div>
      
      {/* Category */}
      <div style={{ 
        background: 'rgba(255,255,255,0.08)',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '10px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        fontWeight: 'bold',
      }}>
        {getCategoryAbbr(sailor.category)}
        {getHandicap(sailor.category) > 0 && (
          <span style={{ color: '#fc8181', marginLeft: '3px' }}>
            +{getHandicap(sailor.category)}
          </span>
        )}
      </div>
    </div>
  )
}

// Results table component
function ResultsTable({ sailors, races, mastersScoringEnabled }) {
  if (!sailors.length || !races.length) return null

  // Get handicap for a sailor's category
  const getHandicapForCategory = (category) => {
    if (!mastersScoringEnabled || !category) return 0
    for (const [cat, pts] of Object.entries(MASTERS_HANDICAP)) {
      if (category.includes(cat)) return pts
    }
    return 0
  }

  // Determine which races have been completed (at least one sailor has a score)
  const completedRaces = new Set()
  races.forEach(r => {
    const hasAnyScore = sailors.some(s => {
      const score = s.scores?.[r.number]
      return score && score !== ''
    })
    if (hasAnyScore) completedRaces.add(r.number)
  })

  const results = sailors.map(sailor => {
    const handicap = getHandicapForCategory(sailor.category)
    
    const raceScores = races.map(r => {
      const score = sailor.scores?.[r.number]
      const raceIsCompleted = completedRaces.has(r.number)
      
      // If no score entered:
      // - If race is completed, assign DNC
      // - If race hasn't started yet, show empty cell
      if (!score || score === '') {
        if (raceIsCompleted) {
          // Race completed but sailor has no score = DNC
          const dncScore = sailors.length + 1 + handicap
          return { 
            race: r.number, 
            value: dncScore, 
            display: 'DNC', 
            isDropped: false, 
            raw: dncScore, 
            handicap, 
            notScored: false,
            isDNC: true
          }
        } else {
          // Race hasn't started yet
          return { race: r.number, value: null, display: '', isDropped: false, raw: null, handicap, notScored: true }
        }
      }
      
      const num = parseInt(score)
      if (!isNaN(num)) {
        const finalScore = num + handicap
        return { 
          race: r.number, 
          value: finalScore, 
          display: handicap > 0 ? `${num}` : String(num),
          isDropped: false,
          raw: num,
          handicap,
          notScored: false
        }
      }
      // Handle letter scores (DNF, DSQ, etc.)
      const letterScore = sailors.length + 1 + handicap
      return { race: r.number, value: letterScore, display: score.toUpperCase(), isDropped: false, raw: score, handicap, notScored: false }
    })

    // Only count scored races (including DNCs) for drop calculation
    const scoredRaceScores = raceScores.filter(rs => !rs.notScored)
    const sorted = [...scoredRaceScores].sort((a, b) => b.value - a.value)
    const droppedRace = scoredRaceScores.length >= 4 ? sorted[0]?.race : null
    
    raceScores.forEach(rs => {
      if (rs.race === droppedRace) rs.isDropped = true
    })

    // Sum all scored races (including DNCs)
    const total = scoredRaceScores.reduce((sum, r) => sum + r.value, 0)
    const net = scoredRaceScores.filter(r => !r.isDropped).reduce((sum, r) => sum + r.value, 0)

    return { ...sailor, total, net, raceScores, handicap }
  }).sort((a, b) => a.net - b.net)

  return (
    <div style={{ 
      overflowX: 'auto', 
      WebkitOverflowScrolling: 'touch',
      background: 'rgba(255,255,255,0.05)', 
      borderRadius: '12px', 
      padding: '15px 10px',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(12px, 3vw, 14px)', minWidth: '600px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
            <th style={{ padding: '10px 8px', textAlign: 'left', whiteSpace: 'nowrap' }}>Rank</th>
            <th style={{ padding: '10px 8px', textAlign: 'left', minWidth: '120px' }}>Sailor</th>
            <th style={{ padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>Net</th>
            <th style={{ padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>Tot</th>
            {races.map(r => (
              <th key={r.number} style={{ padding: '10px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>R{r.number}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                {i < 3 ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Icons.Medal place={i + 1} />
                  </div>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    fontWeight: 'bold',
                    fontSize: '12px',
                  }}>
                    {i + 1}
                  </span>
                )}
              </td>
              <td style={{ padding: '10px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>{FLAGS[r.country] || '○'}</span>
                  <span style={{ wordBreak: 'break-word' }}>{r.name}</span>
                  {mastersScoringEnabled && r.handicap > 0 && (
                    <span style={{ 
                      fontSize: '10px', 
                      background: 'rgba(252, 129, 129, 0.2)', 
                      color: '#fc8181',
                      padding: '1px 4px',
                      borderRadius: '3px',
                    }}>
                      +{r.handicap}
                    </span>
                  )}
                </div>
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--mm-sun)', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>{r.net}</td>
              <td style={{ padding: '10px 8px', textAlign: 'center', opacity: 0.6 }}>{r.total}</td>
              {r.raceScores.map(rs => (
                <td key={rs.race} style={{ padding: '10px 6px', textAlign: 'center' }}>
                  {rs.notScored ? (
                    <span style={{ opacity: 0.2 }}>—</span>
                  ) : rs.isDropped ? (
                    <span style={{ textDecoration: 'line-through', opacity: 0.4 }}>
                      ({mastersScoringEnabled && rs.handicap > 0 ? `${rs.value}*` : rs.display})
                    </span>
                  ) : (
                    <span style={{ fontWeight: '500' }}>
                      {mastersScoringEnabled && rs.handicap > 0 ? (
                        <span title={`Raw: ${rs.display}, +${rs.handicap} handicap = ${rs.value}`}>
                          {rs.value}*
                        </span>
                      ) : rs.display}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
