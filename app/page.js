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
  description: 'Join us for the premier ILCA regatta in Mexico! Open to all ILCA 7 and ILCA 6 sailors. Masters handicap scoring will be used for overall results.',
  classes: ['ILCA 7', 'ILCA 6'],
  sailors: [], // Empty - add via admin
  races: [],
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toLocaleString()
}

const MASTERS_HANDICAP = {
  'Apprentice': 4, 'Master': 3, 'Grand Master': 2, 'Great Grand Master': 1, 'Legend': 0
}

export default function HomePage() {
  const [event, setEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(true)

  // Load event from admin's localStorage
  useEffect(() => {
    const loadEvent = () => {
      const allEvents = getAllEvents()
      
      // Look for Mexican Midwinters event
      let evt = allEvents.find(e => 
        e.id === 'mexican-midwinters-2026' || 
        e.eventName?.toLowerCase().includes('mexican')
      )
      
      // If not found, create empty event
      if (!evt) {
        evt = DEFAULT_EVENT
        saveEvent(evt)
      }
      
      setEvent(evt)
      setLoading(false)
    }

    loadEvent()

    // Sync with admin changes
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

      // Drop worst race if 2+ races
      const sorted = [...raceScores].sort((a, b) => b.value - a.value)
      const dropped = raceScores.length >= 2 ? sorted[0] : null
      if (dropped) dropped.isDropped = true

      const total = raceScores.reduce((sum, r) => sum + r.value, 0)
      const net = raceScores.filter(r => !r.isDropped).reduce((sum, r) => sum + r.value, 0)

      return { ...sailor, total, net, raceScores }
    }).sort((a, b) => a.net - b.net)
  }

  if (loading || !event) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>

  const ilca7Sailors = event.sailors.filter(s => s.boatClass === 'ILCA 7')
  const ilca6Sailors = event.sailors.filter(s => s.boatClass === 'ILCA 6' || s.boatClass === 'Radial')
  
  // Get class-specific races
  const ilca7Races = event.races?.filter(r => r.raceClass === 'ILCA 7') || []
  const ilca6Races = event.races?.filter(r => r.raceClass === 'ILCA 6' || r.raceClass === 'Radial') || []

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)', color: 'white' }}>
      {/* Banner Image */}
      <div style={{ 
        width: '100%', 
        height: '300px', 
        backgroundImage: 'url(/banner.jpg)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(30,58,95,1) 0%, rgba(30,58,95,0) 100%)',
          height: '150px'
        }} />
      </div>

      {/* Admin Button */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <button 
          onClick={() => setShowAdminLogin(true)}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'rgba(255,255,255,0.7)',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Admin
        </button>
      </div>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', color: '#333' }}>
            <h3>Admin Access</h3>
            <input 
              type="password" 
              placeholder="Password" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{ padding: '10px', width: '200px', marginBottom: '10px' }}
            />
            <br />
            <button onClick={handleAdminLogin} style={{ padding: '10px 20px', background: '#2b6cb0', color: 'white', border: 'none', borderRadius: '4px' }}>Login</button>
            <button onClick={() => setShowAdminLogin(false)} style={{ padding: '10px 20px', marginLeft: '10px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '42px', margin: '0 0 10px 0', fontWeight: 'bold' }}>{event.eventName}</h1>
        <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '30px' }}>{event.venue}</p>
        
        <div style={{ 
          display: 'inline-block', 
          background: 'rgba(255,255,255,0.15)', 
          padding: '20px 40px', 
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>March 19-21, 2026</div>
          <div style={{ fontSize: '16px', opacity: 0.8, marginTop: '5px' }}>3 Days of World-Class Racing</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{event.sailors.length || '-'}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Registered Sailors</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{ilca7Sailors.length || '-'}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>ILCA 7</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{ilca6Sailors.length || '-'}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>ILCA 6</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px', 
        padding: '0 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        {['info', 'sailors', 'schedule', 'results'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              background: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              borderRadius: '4px',
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        
        {activeTab === 'info' && (
          <div>
            <h2 style={{ borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>About the Regatta</h2>
            <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '30px' }}>{event.description}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px' }}>
                <h3>📍 Venue</h3>
                <p>{event.venue}</p>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>Hosted by International Sailing Academy</p>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px' }}>
                <h3>🏆 Scoring</h3>
                <p>ILCA North America Masters Handicap System</p>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>Apprentice +4, Master +3, Grand Master +2, Great Grand Master +1, Legend +0</p>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px' }}>
                <h3>⛵ Classes</h3>
                <p>ILCA 7 & ILCA 6 scoring separately</p>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>All sailors race together, scored by class</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sailors' && (
          <div>
            <h2 style={{ borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>Registered Sailors</h2>
            
            {event.sailors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⛵</div>
                <h3>No Sailors Registered Yet</h3>
                <p>Sailors will appear here once registered via the admin panel.</p>
              </div>
            ) : (
              <>
                {/* ILCA 7 Section */}
                {ilca7Sailors.length > 0 && (
                  <>
                    <h3 style={{ marginTop: '30px', color: '#fc8181' }}>ILCA 7 ({ilca7Sailors.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                      {ilca7Sailors.map((sailor, index) => (
                        <div key={sailor.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>{index + 1}. {FLAGS[sailor.country] || '🏳️'} {sailor.name}</span>
                            <span style={{ background: '#e53e3e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>ILCA 7</span>
                          </div>
                          <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
                            Sail: {sailor.sailNumber} | {sailor.category}
                            {getHandicap(sailor.category) > 0 && <span style={{ color: '#fc8181' }}> (+{getHandicap(sailor.category)})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ILCA 6 Section */}
                {ilca6Sailors.length > 0 && (
                  <>
                    <h3 style={{ color: '#68d391' }}>ILCA 6 ({ilca6Sailors.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                      {ilca6Sailors.map((sailor, index) => (
                        <div key={sailor.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>{index + 1}. {FLAGS[sailor.country] || '🏳️'} {sailor.name}</span>
                            <span style={{ background: '#38a169', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>ILCA 6</span>
                          </div>
                          <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
                            Sail: {sailor.sailNumber} | {sailor.category}
                            {getHandicap(sailor.category) > 0 && <span style={{ color: '#fc8181' }}> (+{getHandicap(sailor.category)})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <h2 style={{ borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>Race Schedule</h2>
            <p style={{ marginBottom: '20px', opacity: 0.8 }}>3 races per day - 9 races total</p>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              {[
                { day: 'Thursday, March 19', races: ['Race 1', 'Race 2', 'Race 3'], time: '12:00 PM' },
                { day: 'Friday, March 20', races: ['Race 4', 'Race 5', 'Race 6'], time: '12:00 PM' },
                { day: 'Saturday, March 21', races: ['Race 7', 'Race 8', 'Race 9'], time: '12:00 PM' }
              ].map((day, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>{day.day}</div>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {day.races.map(race => (
                      <span key={race} style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '4px' }}>
                        {race}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.8 }}>First Warning: {day.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            <h2 style={{ borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>Live Results</h2>
            
            {/* Check if any scores have been entered */}
            {(() => {
              const hasIlca7Scores = ilca7Sailors.some(s => Object.keys(s.scores || {}).length > 0)
              const hasIlca6Scores = ilca6Sailors.some(s => Object.keys(s.scores || {}).length > 0)
              
              if (!hasIlca7Scores && !hasIlca6Scores) {
                return (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏁</div>
                    <h3>Racing Hasn't Started Yet</h3>
                    <p>Results will be updated live during the regatta.</p>
                    <p style={{ opacity: 0.7 }}>Check back on March 19, 2026!</p>
                  </div>
                )
              }
              
              return (
                <div>
                  {/* ILCA 7 Results */}
                  {hasIlca7Scores && ilca7Sailors.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                      <h3 style={{ color: '#fc8181' }}>ILCA 7 Results</h3>
                      <ResultsTable sailors={ilca7Sailors} races={ilca7Races} />
                    </div>
                  )}

                  {/* ILCA 6 Results */}
                  {hasIlca6Scores && ilca6Sailors.length > 0 && (
                    <div>
                      <h3 style={{ color: '#68d391' }}>ILCA 6 Results</h3>
                      <ResultsTable sailors={ilca6Sailors} races={ilca6Races} />
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <p>© 2026 International Sailing Academy</p>
        <p style={{ fontSize: '14px', opacity: 0.7 }}>World-class ILCA coaching in Mexico and beyond</p>
        <div style={{ marginTop: '20px' }}>
          <a href="https://internationalsailingacademy.com" style={{ color: '#63b3ed', marginRight: '20px' }}>ISA Website</a>
          <a href="https://isa-virtual-coaching.circle.so/" style={{ color: '#63b3ed' }}>Virtual Coaching</a>
        </div>
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

    // Sort by value (highest first) to find worst race to drop
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
    <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.3)' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Rank</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Sailor</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>Net</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>Total</th>
            {races.map(r => (
              <th key={r.number} style={{ padding: '10px', textAlign: 'center' }}>R{r.number}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <td style={{ padding: '10px' }}><strong>{i + 1}</strong></td>
              <td style={{ padding: '10px' }}>{r.name}</td>
              <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#63b3ed' }}>{r.net}</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>{r.total}</td>
              {r.raceScores.map(rs => (
                <td key={rs.race} style={{ padding: '10px', textAlign: 'center' }}>
                  {rs.isDropped ? (
                    <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>({rs.display})</span>
                  ) : (
                    rs.display
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
