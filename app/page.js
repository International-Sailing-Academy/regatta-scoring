'use client'

import { useState, useEffect } from 'react'
import { getAllEvents, saveEvent, FLAGS } from './lib/data'

// Default empty event - no sailors until added via admin
const DEFAULT_EVENT = {
  id: 'mexican-midwinters-2026',
  eventName: 'ILCA Mexican Midwinter Regatta',
  eventDate: '2026-03-19',
  eventEndDate: '2026-03-21',
  venue: 'La Cruz, Nayarit, Mexico',
  organizer: 'International Sailing Academy',
  description: 'Join us for the premier ILCA regatta in Mexico! Open to all ILCA 7 and ILCA 6 sailors.',
  classes: ['ILCA 7', 'ILCA 6'],
  sailors: [],
  races: [],
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toLocaleString()
}

const MASTERS_HANDICAP = {
  'Apprentice': 4, 'Master': 3, 'Grand Master': 2, 'Great Grand Master': 1, 'Legend': 0
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
    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} style={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '20px 30px',
          textAlign: 'center',
          minWidth: '80px',
          border: '1px solid rgba(255,255,255,0.2)',
          transform: 'translateY(0)',
          transition: 'transform 0.3s ease',
        }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold', lineHeight: 1 }}>{String(value).padStart(2, '0')}</div>
          <div style={{ fontSize: '14px', textTransform: 'uppercase', opacity: 0.8, marginTop: '5px' }}>{unit}</div>
        </div>
      ))}
    </div>
  )
}

// Stat Card Component
function StatCard({ number, label, icon, delay }) {
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
      padding: '30px',
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.2)',
      transform: 'translateY(0)',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ fontSize: '40px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '5px' }}>{count || '-'}</div>
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

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load event from admin's localStorage
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

    const interval = setInterval(() => {
      const allEvents = getAllEvents()
      const updated = allEvents.find(e => e.id === event?.id)
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
    if (!category) return 0
    for (const [cat, pts] of Object.entries(MASTERS_HANDICAP)) {
      if (category.includes(cat)) return pts
    }
    return 0
  }

  // Calculate results for a class
  const calculateResults = (sailors, races) => {
    if (!sailors.length || !races.length) return []
    
    return sailors.map(sailor => {
      const raceScores = races.map(r => {
        const score = sailor.scores?.[r.number]
        if (!score) return { race: r.number, value: sailors.length + 1, display: 'DNC' }
        const num = parseInt(score)
        if (!isNaN(num)) return { race: r.number, value: num, display: score }
        return { race: r.number, value: sailors.length + 1, display: score }
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
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '60px', animation: 'pulse 2s infinite' }}>⛵</div>
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
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
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
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '32px' }}>⛵</span>
          <span>ISA Regattas</span>
        </div>
        <button 
          onClick={() => setShowAdminLogin(true)}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s ease',
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

      {/* Hero Section with Banner */}
      <div style={{ 
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background Image with Parallax */}
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
        
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(10,25,47,0.3) 0%, rgba(10,25,47,0.8) 70%, #0a192f 100%)',
        }} />

        {/* Hero Content */}
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

          {/* Countdown */}
          <div className="animate-fadeInUp" style={{ marginBottom: '50px' }}>
            <p style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', opacity: 0.8 }}>
              Regatta Starts In
            </p>
            <CountdownTimer targetDate={event.eventDate} />
          </div>

          {/* CTA Buttons */}
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
              View Sailors →
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

        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          animation: 'pulse 2s infinite',
        }}>
          <div style={{ fontSize: '24px', opacity: 0.6 }}>↓</div>
        </div>
      </div>

      {/* Stats Section */}
      <section style={{ padding: '80px 40px', background: '#0a192f' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '30px',
          }}>
            <StatCard 
              number={event.sailors.length} 
              label="Registered Sailors" 
              icon="⛵" 
              delay={0}
            />
            <StatCard 
              number={ilca7Sailors.length} 
              label="ILCA 7 Fleet" 
              icon="🥇" 
              delay={100}
            />
            <StatCard 
              number={ilca6Sailors.length} 
              label="ILCA 6 Fleet" 
              icon="🥈" 
              delay={200}
            />
            <StatCard 
              number={3} 
              label="Racing Days" 
              icon="📅" 
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px 80px' }}>
        
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '60px',
          background: 'rgba(255,255,255,0.05)',
          padding: '10px',
          borderRadius: '16px',
          maxWidth: '600px',
          margin: '0 auto 60px',
        }}>
          {['info', 'sailors', 'schedule', 'results'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '16px 24px',
                background: activeTab === tab ? '#63b3ed' : 'transparent',
                color: activeTab === tab ? '#0a192f' : 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                textTransform: 'capitalize',
                transition: 'all 0.3s ease',
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
              <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h2 style={{ fontSize: '36px', marginBottom: '20px' }}>About the Regatta</h2>
                <p style={{ fontSize: '18px', opacity: 0.8, maxWidth: '700px', margin: '0 auto', lineHeight: 1.8 }}>
                  {event.description}
                </p>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '30px',
              }}>
                {[
                  { icon: '📍', title: 'Venue', content: event.venue, sub: 'La Cruz de Huanacaxtle' },
                  { icon: '🏆', title: 'Scoring', content: 'Masters Handicap', sub: 'Apprentice +4, Master +3, GM +2, GGM +1, Legend +0' },
                  { icon: '⛵', title: 'Classes', content: 'ILCA 7 & ILCA 6', sub: 'Scoring separately' },
                  { icon: '🌊', title: 'Conditions', content: 'Warm Water', sub: 'Expect 10-20 knots' },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '20px',
                    padding: '40px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)'
                    e.currentTarget.style.borderColor = 'rgba(99, 179, 237, 0.5)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>{item.icon}</div>
                    <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>{item.title}</h3>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#63b3ed', marginBottom: '5px' }}>{item.content}</p>
                    <p style={{ opacity: 0.6 }}>{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SAILORS TAB */}
          {activeTab === 'sailors' && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              {event.sailors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <div style={{ fontSize: '80px', marginBottom: '30px', opacity: 0.5 }}>⛵</div>
                  <h2 style={{ fontSize: '32px', marginBottom: '15px' }}>Registration Opening Soon</h2>
                  <p style={{ fontSize: '18px', opacity: 0.7 }}>Sailors will appear here once registration opens.</p>
                </div>
              ) : (
                <>
                  {/* ILCA 7 Fleet */}
                  {ilca7Sailors.length > 0 && (
                    <div style={{ marginBottom: '50px' }}>
                      <h2 style={{ fontSize: '28px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ background: '#e53e3e', padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}>ILCA 7</span>
                        <span>{ilca7Sailors.length} Sailors</span>
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {ilca7Sailors.map((sailor, index) => (
                          <SailorCard key={sailor.id} sailor={sailor} index={index} getHandicap={getHandicap} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ILCA 6 Fleet */}
                  {ilca6Sailors.length > 0 && (
                    <div>
                      <h2 style={{ fontSize: '28px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ background: '#38a169', padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}>ILCA 6</span>
                        <span>{ilca6Sailors.length} Sailors</span>
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {ilca6Sailors.map((sailor, index) => (
                          <SailorCard key={sailor.id} sailor={sailor} index={index} getHandicap={getHandicap} />
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
                      <div style={{ fontSize: '80px', marginBottom: '30px' }}>🏁</div>
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
                        <ResultsTable sailors={ilca7Sailors} races={ilca7Races} />
                      </div>
                    )}
                    {hasIlca6Scores && ilca6Sailors.length > 0 && (
                      <div>
                        <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>ILCA 6 Results</h2>
                        <ResultsTable sailors={ilca6Sailors} races={ilca6Races} />
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
        padding: '60px 40px', 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '40px', marginBottom: '20px' }}>⛵</div>
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
function SailorCard({ sailor, index, getHandicap }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '25px',
      border: '1px solid rgba(255,255,255,0.1)',
      transition: 'all 0.3s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'
      e.currentTarget.style.borderColor = 'rgba(99, 179, 237, 0.5)'
      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0) scale(1)'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div style={{ fontSize: '32px' }}>{FLAGS[sailor.country] || '🏳️'}</div>
        <div style={{ 
          background: 'rgba(99, 179, 237, 0.2)', 
          padding: '6px 12px', 
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          #{index + 1}
        </div>
      </div>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{sailor.name}</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <span style={{ opacity: 0.6, fontSize: '14px' }}>Sail: {sailor.sailNumber}</span>
      </div>
      <div style={{ 
        display: 'inline-block',
        background: 'rgba(255,255,255,0.1)',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '13px',
      }}>
        {sailor.category}
        {getHandicap(sailor.category) > 0 && (
          <span style={{ color: '#fc8181', marginLeft: '8px', fontWeight: 'bold' }}>
            +{getHandicap(sailor.category)}
          </span>
        )}
      </div>
    </div>
  )
}

// Results table component
function ResultsTable({ sailors, races }) {
  if (!sailors.length || !races.length) return null

  const results = sailors.map(sailor => {
    const raceScores = races.map(r => {
      const score = sailor.scores?.[r.number]
      if (!score) return { race: r.number, value: sailors.length + 1, display: 'DNC', isDropped: false }
      const num = parseInt(score)
      if (!isNaN(num)) return { race: r.number, value: num, display: score, isDropped: false }
      return { race: r.number, value: sailors.length + 1, display: score.toUpperCase(), isDropped: false }
    })

    const sorted = [...raceScores].sort((a, b) => b.value - a.value)
    const droppedRace = raceScores.length >= 2 ? sorted[0]?.race : null
    
    raceScores.forEach(rs => {
      if (rs.race === droppedRace) rs.isDropped = true
    })

    const total = raceScores.reduce((sum, r) => sum + r.value, 0)
    const net = raceScores.filter(r => !r.isDropped).reduce((sum, r) => sum + r.value, 0)

    return { ...sailor, total, net, raceScores }
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
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: i < 3 ? '#63b3ed' : 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}>
                  {i + 1}
                </span>
              </td>
              <td style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{FLAGS[r.country] || '🏳️'}</span>
                  <span>{r.name}</span>
                </div>
              </td>
              <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#63b3ed', fontSize: '18px' }}>{r.net}</td>
              <td style={{ padding: '15px', textAlign: 'center', opacity: 0.6 }}>{r.total}</td>
              {r.raceScores.map(rs => (
                <td key={rs.race} style={{ padding: '15px', textAlign: 'center' }}>
                  {rs.isDropped ? (
                    <span style={{ textDecoration: 'line-through', opacity: 0.4 }}>({rs.display})</span>
                  ) : (
                    <span style={{ fontWeight: '500' }}>{rs.display}</span>
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
