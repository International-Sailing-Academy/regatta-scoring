'use client'

import { useState, useEffect } from 'react'

// Default Mexican Midwinters Regatta Data
const DEFAULT_EVENT = {
  id: 'mexican-midwinters-2026',
  eventName: 'ILCA Mexican Midwinter Regatta',
  eventDate: '2026-03-19',
  eventEndDate: '2026-03-21',
  venue: 'La Cruz, Nayarit, Mexico',
  organizer: 'International Sailing Academy',
  description: 'Join us for the premier ILCA regatta in Mexico! Open to all ILCA 7 and Radial sailors. Masters handicap scoring will be used for overall results.',
  classes: ['ILCA 7', 'Radial'],
  sailors: [
    { id: 1, sailNumber: '123456', name: 'Ksenia Mamontova', boatClass: 'Radial', ageGroup: 'Apprentice Master', country: 'Russia', scores: {} },
    { id: 2, sailNumber: '123457', name: 'Elena Oetling Ramírez', boatClass: 'Radial', ageGroup: '18-35', country: 'Mexico', scores: {} },
    { id: 3, sailNumber: '123458', name: 'Greg Jackson', boatClass: 'ILCA 7', ageGroup: 'Legend', country: 'USA', scores: {} },
    { id: 4, sailNumber: '123459', name: 'Bill Pagels', boatClass: 'Radial', ageGroup: 'Legend', country: 'USA', scores: {} },
    { id: 5, sailNumber: '123460', name: 'Roy L Lamphier', boatClass: 'Radial', ageGroup: 'Grand Master', country: 'USA', scores: {} },
    { id: 6, sailNumber: '123461', name: 'Angela de Leo', boatClass: 'Radial', ageGroup: 'Youth', country: 'Mexico', scores: {} },
    { id: 7, sailNumber: '123462', name: 'Alec Bostan', boatClass: 'Radial', ageGroup: 'Youth', country: 'USA', scores: {} },
    { id: 8, sailNumber: '123463', name: 'Luis E Barrios', boatClass: 'Radial', ageGroup: 'Great Grand Master', country: 'Mexico', scores: {} },
    { id: 9, sailNumber: '123464', name: 'Bruce Martinson', boatClass: 'Radial', ageGroup: 'Great Grand Master', country: 'USA', scores: {} },
    { id: 10, sailNumber: '123465', name: 'Don Hahl', boatClass: 'ILCA 7', ageGroup: 'Legend', country: 'USA', scores: {} },
    { id: 11, sailNumber: '123466', name: 'Russel Krause', boatClass: 'ILCA 7', ageGroup: 'Grand Master', country: 'USA', scores: {} },
    { id: 12, sailNumber: '123467', name: 'Mark Kortbeek', boatClass: 'ILCA 7', ageGroup: 'Grand Master', country: 'USA', scores: {} },
    { id: 13, sailNumber: '123468', name: 'Rachel Kortbeek', boatClass: 'Radial', ageGroup: '18-35', country: 'USA', scores: {} },
    { id: 14, sailNumber: '123469', name: 'Ryan Kortbeek', boatClass: 'Radial', ageGroup: '18-35', country: 'USA', scores: {} },
    { id: 15, sailNumber: '123470', name: 'Robert Hodson', boatClass: 'ILCA 7', ageGroup: 'Great Grand Master', country: 'USA', scores: {} },
    { id: 16, sailNumber: '123471', name: 'Walt Spevak', boatClass: 'Radial', ageGroup: 'Great Grand Master', country: 'USA', scores: {} }
  ],
  races: [
    { number: 1, date: '2026-03-19', wind: 'TBD' },
    { number: 2, date: '2026-03-19', wind: 'TBD' },
    { number: 3, date: '2026-03-20', wind: 'TBD' },
    { number: 4, date: '2026-03-20', wind: 'TBD' },
    { number: 5, date: '2026-03-21', wind: 'TBD' },
    { number: 6, date: '2026-03-21', wind: 'TBD' }
  ],
  results: []
}

const MASTERS_HANDICAP = {
  'Apprentice': 4, 'Master': 3, 'Grand Master': 2, 'Great Grand Master': 1, 'Legend': 0
}

export default function HomePage() {
  const [event, setEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('regatta-midwinters-2026')
    if (saved) {
      setEvent(JSON.parse(saved))
    } else {
      setEvent(DEFAULT_EVENT)
      localStorage.setItem('regatta-midwinters-2026', JSON.stringify(DEFAULT_EVENT))
    }
  }, [])

  const handleAdminLogin = () => {
    if (adminPassword === 'isa2026') {
      window.location.href = '/admin'
    } else {
      alert('Incorrect password')
    }
  }

  const getHandicap = (ageGroup) => {
    for (const [cat, pts] of Object.entries(MASTERS_HANDICAP)) {
      if (ageGroup.includes(cat)) return pts
    }
    return 0
  }

  if (!event) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>

  const ilca7Count = event.sailors.filter(s => s.boatClass === 'ILCA 7').length
  const radialCount = event.sailors.filter(s => s.boatClass === 'Radial').length

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)', color: 'white' }}>
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
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>⛵</div>
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
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{event.sailors.length}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Registered Sailors</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{ilca7Count}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>ILCA 7</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{radialCount}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Radial</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{event.races.length}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Races</div>
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
                <p>{event.classes.join(' & ')} scoring separately</p>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>All sailors race together, scored by class</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sailors' && (
          <div>
            <h2 style={{ borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>Registered Sailors</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
              {event.sailors.map((sailor, index) => (
                <div key={sailor.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>{index + 1}. {sailor.name}</span>
                    <span style={{ 
                      background: sailor.boatClass === 'ILCA 7' ? '#e53e3e' : '#38a169',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {sailor.boatClass}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
                    Sail: {sailor.sailNumber} | {sailor.ageGroup}
                    {getHandicap(sailor.ageGroup) > 0 && <span style={{ color: '#fc8181' }}> (+{getHandicap(sailor.ageGroup)})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <h2 style={{ borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>Race Schedule</h2>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              {[
                { day: 'Thursday, March 19', races: ['Race 1', 'Race 2'], time: '12:00 PM' },
                { day: 'Friday, March 20', races: ['Race 3', 'Race 4'], time: '12:00 PM' },
                { day: 'Saturday, March 21', races: ['Race 5', 'Race 6'], time: '12:00 PM' }
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
            
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏁</div>
              <h3>Racing Hasn't Started Yet</h3>
              <p>Results will be updated live during the regatta.</p>
              <p style={{ opacity: 0.7 }}>Check back on March 19, 2026!</p>
            </div>
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
