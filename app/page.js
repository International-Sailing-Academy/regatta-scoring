'use client'

import { useState, useEffect } from 'react'
import { getAllEvents, saveEvent, FLAGS } from './lib/data'

// Default empty event - no sailors until added via admin
const DEFAULT_EVENT = {
  id: 'mexican-midwinters-2026',
  eventName: 'ILCA Mexican Midwinter Regatta',
  eventDate: '2026-03-19T12:00:00-06:00', // 12:00 PM CST (Mexico City)
  eventEndDate: '2026-03-21',
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
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors[place] || '#63b3ed'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
}

// Countdown Timer Component
function CountdownTimer({ targetDate }) {
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
    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} style={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '10px',
          padding: '15px 20px',
          textAlign: 'center',
          minWidth: '65px',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <div style={{ fontSize: 'clamp(28px, 8vw, 48px)', fontWeight: 'bold', lineHeight: 1 }}>{String(value).padStart(2, '0')}</div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>{unit}</div>
        </div>
      ))}
    </div>
  )
}

// Stat Card Component
function StatCard({ number, label, icon: Icon, delay }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 2000
      const steps = 60
      const increment = number / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= number) {
          setCount(number)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)
      
      return () => clearInterval(timer)
    }, delay)
    
    return () => clearTimeout(timeout)
  }, [number, delay])

  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.2)',
    }}>
      <div style={{ color: '#63b3ed', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
        <Icon />
      </div>
      <div style={{ fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 'bold', marginBottom: '5px' }}>{count || '-'}</div>
      <div style={{ fontSize: '14px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
    </div>
  )
}

export default function HomePage() {
  const [event, setEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const loadEvent = () => {
      const allEvents = getAllEvents()
      let evt = allEvents.find(e => 
        e.id === 'mexican-midwinters-2026' || 
        e.eventName?.toLowerCase().includes('mexican')
      )
      
      if (!evt) {
        evt = DEFAULT_EVENT
        saveEvent(evt)
      }
      
      setEvent(evt)
      setLoading(false)
    }

    loadEvent()
  }, [])

  // Separate sync effect that always runs with stored event ID
  useEffect(() => {
    if (!event?.id) return
    
    const interval = setInterval(() => {
      const allEvents = getAllEvents()
      const updated = allEvents.find(e => e.id === event.id)
      if (updated && JSON.stringify(updated) !== JSON.stringify(event)) {
        setEvent(updated)
      }
    }, 1000)

    return () => clearInterval(interval)
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
      }

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
      background: '#0a192f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#63b3ed', marginBottom: '20px' }}>
          <img src="/logo-icon.png" alt="" style={{ width: '32px', height: '32px' }} />
        </div>
        <p>Loading regatta data...</p>
      </div>
    </div>
  )

  const ilca7Sailors = event.sailors.filter(s => s.boatClass === 'ILCA 7')
  const ilca6Sailors = event.sailors.filter(s => s.boatClass === 'ILCA 6' || s.boatClass === 'Radial')
  const ilca7Races = event.races?.filter(r => r.raceClass === 'ILCA 7') || []
  const ilca6Races = event.races?.filter(r => r.raceClass === 'ILCA 6' || r.raceClass === 'Radial') || []

  return (
    <div style={{ minHeight: '100vh', background: '#0a192f', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrollY > 100 ? 'rgba(10, 25, 47, 0.95)' : 'transparent',
        backdropFilter: scrollY > 100 ? 'blur(20px)' : 'none',
        transition: 'all 0.3s ease',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo-icon.png" alt="ISA" style={{ width: '28px', height: '28px' }} />
          <span style={{ whiteSpace: 'nowrap' }}>ISA Regattas</span>
        </div>
        <button 
          onClick={() => setShowAdminLogin(true)}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)'
            e.target.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          Admin Login
        </button>
      </nav>

      {/* Hero Section */}
      <div style={{ 
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/banner.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translateY(${scrollY * 0.5}px)`,
          filter: 'brightness(0.4)',
        }} />
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(10,25,47,0.3) 0%, rgba(10,25,47,0.8) 70%, #0a192f 100%)',
        }} />

        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '40px',
          maxWidth: '900px',
        }}>
          <div className="animate-fadeInUp">
            <div style={{ 
              display: 'inline-block',
              background: 'rgba(99, 179, 237, 0.2)',
              border: '1px solid rgba(99, 179, 237, 0.4)',
              padding: '10px 24px',
              borderRadius: '50px',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '30px',
            }}>
              March 19-21, 2026 • La Cruz, Mexico
            </div>
          </div>

          <h1 className="animate-fadeInUp" style={{
            fontSize: 'clamp(40px, 8vw, 72px)',
            fontWeight: 'bold',
            margin: '0 0 20px 0',
            lineHeight: 1.1,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            {event.eventName}
          </h1>

          <p className="animate-fadeInUp" style={{
            fontSize: '20px',
            opacity: 0.9,
            marginBottom: '40px',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {event.venue}
          </p>

          <div className="animate-fadeInUp" style={{ marginBottom: '50px' }}>
            <p style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', opacity: 0.8 }}>
              Regatta Starts In
            </p>
            <CountdownTimer targetDate={event.eventDate} />
          </div>

          <div className="animate-fadeInUp" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveTab('sailors')}
              style={{
                background: '#63b3ed',
                color: '#0a192f',
                padding: '16px 32px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.05)'
                e.target.style.boxShadow = '0 10px 30px rgba(99, 179, 237, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = 'none'
              }}
            >
              View Sailors <Icons.ArrowRight />
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              style={{
                background: 'transparent',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.8)'
                e.target.style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.3)'
                e.target.style.background = 'transparent'
              }}
            >
              Live Results
            </button>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0.6,
        }}>
          <Icons.ArrowDown />
        </div>
      </div>

      {/* Stats Section */}
      <section style={{ padding: '60px 15px', background: '#0a192f' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '30px',
          }}>
            <StatCard 
              number={event.sailors.length} 
              label="Registered Sailors" 
              icon={Icons.Users} 
              delay={0}
            />
            <StatCard 
              number={ilca7Sailors.length} 
              label="ILCA 7 Fleet" 
              icon: () => <img src="/logo-icon.png" alt="" style={{ width: '24px', height: '24px' }} />, 
              delay={100}
            />
            <StatCard 
              number={ilca6Sailors.length} 
              label="ILCA 6 Fleet" 
              icon: () => <img src="/logo-icon.png" alt="" style={{ width: '24px', height: '24px' }} />, 
              delay={200}
            />
            <StatCard 
              number={3} 
              label="Racing Days" 
              icon={Icons.Calendar} 
              delay={300}
            />
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
                  background: '#63b3ed', 
                  color: '#0a192f', 
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px 40px' }}>
        
        {/* Tab Navigation */}
        <div style={{
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
          {['info', 'sailors', 'schedule', 'results'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: '1 1 auto',
                minWidth: '70px',
                padding: '12px 16px',
                background: activeTab === tab ? '#63b3ed' : 'transparent',
                color: activeTab === tab ? '#0a192f' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'capitalize',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '400px' }}>
          
          {/* INFO TAB */}
          {activeTab === 'info' && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              
              {/* Event Overview */}
              <section style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: '#63b3ed' }}><Icons.Flag /></span>
                  Event Overview
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>Dates</h4>
                      <p>March 19 – 21, 2026</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>
                        <a href="https://fareharbor.com/embeds/book/internationalsailingacademy/items/24490/availability/1754243089/book/?full-items=yes" target="_blank" style={{ color: '#63b3ed' }}>
                          Optional Pre-Clinic: March 16-18 →
                        </a>
                      </p>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>Location</h4>
                      <p>La Cruz de Huanacaxtle, Nayarit, Mexico</p>
                      <p style={{ fontSize: '14px', opacity: 0.7 }}>Bahía de Banderas</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>Classes</h4>
                      <p>ILCA 4, ILCA 6, ILCA 7</p>
                      <p style={{ fontSize: '14px', opacity: 0.7 }}>All levels including Masters</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>Host</h4>
                      <p>International Sailing Academy</p>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '25px', paddingTop: '25px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: '#63b3ed', marginBottom: '10px' }}>Highlights</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#63b3ed' }}>•</span> 3 days of racing (up to 9 races)
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#63b3ed' }}>•</span> "Whale Perpetual Trophy"
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#63b3ed' }}>•</span> Warm water sailing
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#63b3ed' }}>•</span> Friendly atmosphere
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Registration */}
              <section style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: '#63b3ed' }}><Icons.Trophy /></span>
                  Registration
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginBottom: '25px' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#63b3ed' }}>$100</div>
                    <a 
                      href="https://fareharbor.com/embeds/book/internationalsailingacademy/items/637672/availability/1772134672/book/?full-items=yes" 
                      target="_blank"
                      style={{
                        background: '#63b3ed',
                        color: '#0a192f',
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
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>What's Included</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, opacity: 0.8 }}>
                        <li>• Entry to regatta (up to 9 races)</li>
                        <li>• Event t-shirt</li>
                        <li>• Trophy awards ceremony</li>
                        <li>• Welcome reception</li>
                        <li>• Prize-giving party</li>
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>Important Notes</h4>
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

              {/* Venue & Travel */}
              <section style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: '#63b3ed' }}><Icons.Location /></span>
                  Venue & Travel
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '10px' }}>Racing Venue</h4>
                      <p style={{ marginBottom: '10px' }}>Bahía de Banderas, launching from Marina Riviera Nayarit and the International Sailing Academy</p>
                      <p style={{ fontSize: '14px', opacity: 0.7 }}>La Cruz de Huanacaxtle, Nayarit, Mexico</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '10px' }}>Getting There</h4>
                      <p>Fly into <strong>Puerto Vallarta (PVR)</strong> airport</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>Stay in Bucerías or La Cruz — hotels, Airbnbs, and restaurants nearby</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '10px' }}>Weather</h4>
                      <p>Warm water & stable thermal winds in March</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>Average daily high ~28°C (82°F), reliable breeze, scenic mountain backdrop</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '10px' }}>Boat Storage</h4>
                      <p>Available at ISA and Bourquin Sailing Yard</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>Contact ISA to reserve boat park space</p>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '25px' }}>
                    <a 
                      href="https://maps.app.goo.gl/R3H3UwEeaY8MSpjw6" 
                      target="_blank"
                      style={{ color: '#63b3ed', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Icons.Location /> View on Google Maps →
                    </a>
                  </div>
                </div>
              </section>

              {/* Classes & Awards */}
              <section style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src="/logo-icon.png" alt="" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                  Classes & Awards
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '10px' }}>Classes</h4>
                      <p>ILCA 4 • ILCA 6 • ILCA 7</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>Open (all ages) and Masters categories (35+)</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '10px' }}>Scoring</h4>
                      <p>Masters Handicap Low Point System</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>9 races scheduled • 1 discard after 4+ races</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '10px' }}>Awards</h4>
                      <p>Top 3 in each class • Masters recognition</p>
                      <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>The Whale Perpetual Trophy for overall champion</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Safety */}
              <section style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: '#63b3ed' }}><Icons.CheckeredFlag /></span>
                  Safety & Requirements
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>Eligibility</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, opacity: 0.8 }}>
                        <li>• Class association membership required</li>
                        <li>• Boat must conform to class rules</li>
                        <li>• Proof of insurance required</li>
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>Safety Equipment</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, opacity: 0.8 }}>
                        <li>• Whistle required</li>
                        <li>• Flotation device required</li>
                        <li>• Safety boat coverage provided</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: '#63b3ed' }}><Icons.Users /></span>
                  Contact & Support
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>Email</h4>
                      <a href="mailto:info@internationalsailingacademy.com" style={{ color: 'white' }}>
                        info@internationalsailingacademy.com
                      </a>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>WhatsApp</h4>
                      <a href="https://wa.me/523221177641" target="_blank" style={{ color: '#63b3ed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        +52 322 117 7641 →
                      </a>
                    </div>
                    <div>
                      <h4 style={{ color: '#63b3ed', marginBottom: '8px' }}>Race Office</h4>
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
              {event.sailors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <div style={{ color: '#63b3ed', marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                    <img src="/logo-icon.png" alt="" style={{ width: '32px', height: '32px' }} />
                  </div>
                  <h2 style={{ fontSize: '32px', marginBottom: '15px' }}>Registration Opening Soon</h2>
                  <p style={{ fontSize: '18px', opacity: 0.7 }}>Sailors will appear here once registration opens.</p>
                </div>
              ) : (
                <>
                  {ilca7Sailors.length > 0 && (
                    <div style={{ marginBottom: '50px' }}>
                      <h2 style={{ fontSize: '28px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ background: '#e53e3e', padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}>ILCA 7</span>
                        <span>{ilca7Sailors.length} Sailors</span>
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ilca7Sailors.map((sailor, index) => (
                          <SailorRow key={sailor.id} sailor={sailor} index={index} getHandicap={getHandicap} />
                        ))}
                      </div>
                    </div>
                  )}

                  {ilca6Sailors.length > 0 && (
                    <div>
                      <h2 style={{ fontSize: '28px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ background: '#38a169', padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}>ILCA 6</span>
                        <span>{ilca6Sailors.length} Sailors</span>
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ilca6Sailors.map((sailor, index) => (
                          <SailorRow key={sailor.id} sailor={sailor} index={index} getHandicap={getHandicap} />
                        ))}
                      </div>
                    </div>
                  )}
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
                  { day: 'Thursday, March 19', races: [1, 2, 3], active: true },
                  { day: 'Friday, March 20', races: [4, 5, 6], active: false },
                  { day: 'Saturday, March 21', races: [7, 8, 9], active: false },
                ].map((day, idx) => (
                  <div key={idx} style={{
                    background: day.active ? 'rgba(99, 179, 237, 0.15)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '30px',
                    border: day.active ? '1px solid rgba(99, 179, 237, 0.4)' : '1px solid rgba(255,255,255,0.1)',
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
                const hasIlca7Scores = ilca7Sailors.some(s => Object.keys(s.scores || {}).length > 0)
                const hasIlca6Scores = ilca6Sailors.some(s => Object.keys(s.scores || {}).length > 0)
                
                if (!hasIlca7Scores && !hasIlca6Scores) {
                  return (
                    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                      <div style={{ color: '#63b3ed', marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                        <Icons.CheckeredFlag />
                      </div>
                      <h2 style={{ fontSize: '32px', marginBottom: '15px' }}>Racing Hasn't Started Yet</h2>
                      <p style={{ fontSize: '18px', opacity: 0.7, marginBottom: '30px' }}>
                        Results will be updated live during the regatta.
                      </p>
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(99, 179, 237, 0.1)',
                        padding: '20px 40px',
                        borderRadius: '12px',
                        border: '1px solid rgba(99, 179, 237, 0.3)',
                      }}>
                        <p style={{ margin: 0 }}>Check back on March 19, 2026</p>
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div>
                    {hasIlca7Scores && ilca7Sailors.length > 0 && (
                      <div style={{ marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>ILCA 7 Results</h2>
                        <ResultsTable sailors={ilca7Sailors} races={ilca7Races} mastersScoringEnabled={event.mastersScoringEnabled} />
                      </div>
                    )}
                    {hasIlca6Scores && ilca6Sailors.length > 0 && (
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
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        background: 'rgba(255,255,255,0.03)', 
        padding: '40px 15px', 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
      }}
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
            <img src="/logo-horizontal.png" alt="International Sailing Academy" style={{ maxWidth: '200px', height: 'auto' }} />
          </div>
          <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>International Sailing Academy</h3>
          <p style={{ opacity: 0.6, marginBottom: '30px' }}>World-class ILCA coaching in Mexico and beyond</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
            <a href="https://internationalsailingacademy.com" style={{ color: '#63b3ed', textDecoration: 'none' }}>Website</a>
            <a href="https://isa-virtual-coaching.circle.so/" style={{ color: '#63b3ed', textDecoration: 'none' }}>Virtual Coaching</a>
          </div>
          <p style={{ marginTop: '30px', opacity: 0.4, fontSize: '14px' }}>© 2026 International Sailing Academy</p>
        </div>
      </footer>
    </div>
  )
}

// Sailor Card Component
function SailorRow({ sailor, index, getHandicap }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '10px',
      padding: '14px 20px',
      border: '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
      e.currentTarget.style.borderColor = 'rgba(99, 179, 237, 0.4)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
    }}
    >
      {/* Rank */}
      <div style={{ 
        minWidth: '36px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.5)',
      }}>
        #{index + 1}
      </div>
      
      {/* Flag */}
      <div style={{ fontSize: '24px', minWidth: '32px' }}>{FLAGS[sailor.country] || '○'}</div>
      
      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {sailor.name}
        </h3>
      </div>
      
      {/* Sail Number */}
      <div style={{ 
        fontSize: '14px', 
        color: 'rgba(255,255,255,0.5)',
        minWidth: '70px',
      }}>
        {sailor.sailNumber}
      </div>
      
      {/* Category */}
      <div style={{ 
        background: 'rgba(255,255,255,0.08)',
        padding: '5px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        whiteSpace: 'nowrap',
      }}>
        {sailor.category}
        {getHandicap(sailor.category) > 0 && (
          <span style={{ color: '#fc8181', marginLeft: '6px', fontWeight: 'bold' }}>
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

  const results = sailors.map(sailor => {
    const handicap = getHandicapForCategory(sailor.category)
    const raceScores = races.map(r => {
      const score = sailor.scores?.[r.number]
      if (!score) {
        const dncScore = sailors.length + 1 + handicap
        return { race: r.number, value: dncScore, display: `DNC`, isDropped: false, raw: 'DNC', handicap }
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
          handicap
        }
      }
      const specialScore = sailors.length + 1 + handicap
      return { race: r.number, value: specialScore, display: score.toUpperCase(), isDropped: false, raw: score, handicap }
    })

    const sorted = [...raceScores].sort((a, b) => b.value - a.value)
    const droppedRace = raceScores.length >= 2 ? sorted[0]?.race : null
    
    raceScores.forEach(rs => {
      if (rs.race === droppedRace) rs.isDropped = true
    })

    const total = raceScores.reduce((sum, r) => sum + r.value, 0)
    const net = raceScores.filter(r => !r.isDropped).reduce((sum, r) => sum + r.value, 0)

    return { ...sailor, total, net, raceScores, handicap }
  }).sort((a, b) => a.net - b.net)

  return (
    <div style={{ 
      overflowX: 'auto', 
      background: 'rgba(255,255,255,0.05)', 
      borderRadius: '16px', 
      padding: '30px',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
            <th style={{ padding: '15px', textAlign: 'left' }}>Rank</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Sailor</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Net</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Total</th>
            {races.map(r => (
              <th key={r.number} style={{ padding: '15px', textAlign: 'center' }}>R{r.number}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <td style={{ padding: '15px' }}>
                {i < 3 ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Icons.Medal place={i + 1} />
                  </div>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}>
                    {i + 1}
                  </span>
                )}
              </td>
              <td style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{FLAGS[r.country] || '○'}</span>
                  <span>{r.name}</span>
                  {mastersScoringEnabled && r.handicap > 0 && (
                    <span style={{ 
                      fontSize: '11px', 
                      background: 'rgba(252, 129, 129, 0.2)', 
                      color: '#fc8181',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      +{r.handicap}
                    </span>
                  )}
                </div>
              </td>
              <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#63b3ed', fontSize: '18px' }}>{r.net}</td>
              <td style={{ padding: '15px', textAlign: 'center', opacity: 0.6 }}>{r.total}</td>
              {r.raceScores.map(rs => (
                <td key={rs.race} style={{ padding: '15px', textAlign: 'center' }}>
                  {rs.isDropped ? (
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
