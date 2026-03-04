'use client'

import { useState, useEffect } from 'react'
import { FLAGS, LETTER_SCORES, decodeRegatta, getAllEvents, getEventById } from './lib/data'

export default function EventPage() {
  const [activeTab, setActiveTab] = useState('details')
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState(null)
  const [error, setError] = useState(null)

  // Load event data
  useEffect(() => {
    const loadEvent = () => {
      try {
        // Check for event ID in URL
        const urlParams = new URLSearchParams(window.location.search)
        const eventId = urlParams.get('event')
        
        // Check for encoded data in hash
        const hash = window.location.hash.slice(1)
        
        if (hash) {
          // Load from encoded URL (shared link)
          const decoded = decodeRegatta(hash)
          if (decoded) {
            setEvent(decoded)
            if (decoded.classes && decoded.classes.length > 0) {
              setSelectedClass(decoded.classes[0])
            }
            setLoading(false)
            return
          }
        }
        
        if (eventId) {
          // Load specific event by ID from localStorage
          const evt = getEventById(eventId)
          if (evt) {
            setEvent(evt)
            if (evt.classes && evt.classes.length > 0) {
              setSelectedClass(evt.classes[0])
            }
            setLoading(false)
            return
          } else {
            setError('Event not found. It may have been deleted.')
          }
        }
        
        // No specific event requested - show first available
        const allEvents = getAllEvents()
        if (allEvents.length > 0) {
          setEvent(allEvents[0])
          if (allEvents[0].classes && allEvents[0].classes.length > 0) {
            setSelectedClass(allEvents[0].classes[0])
          }
        } else {
          setError('No regattas available. Create one in the admin.')
        }
        
        setLoading(false)
      } catch (e) {
        console.error('Error loading event:', e)
        setError('Error loading event data.')
        setLoading(false)
      }
    }

    loadEvent()

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'regatta-events') {
        const urlParams = new URLSearchParams(window.location.search)
        const eventId = urlParams.get('event')
        
        if (eventId) {
          const updated = getEventById(eventId)
          if (updated) {
            setEvent(prev => {
              // Only update if data actually changed
              if (JSON.stringify(prev) !== JSON.stringify(updated)) {
                return updated
              }
              return prev
            })
          }
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // More frequent refresh for current event (handles same-tab updates)
    const interval = setInterval(() => {
      const urlParams = new URLSearchParams(window.location.search)
      const eventId = urlParams.get('event')
      const hash = window.location.hash.slice(1)
      
      // Only poll if not using encoded URL
      if (eventId && !hash) {
        const updated = getEventById(eventId)
        if (updated) {
          setEvent(prev => {
            if (!prev || JSON.stringify(prev) !== JSON.stringify(updated)) {
              return updated
            }
            return prev
          })
        }
      }
    }, 1000) // Check every second

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [event?.id])

  if (loading) return <div style={styles.loading}>Loading...</div>
  
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>⚠️ {error}</h2>
          <a href="/admin" style={styles.link}>Go to Admin →</a>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>No Regatta Found</h2>
          <a href="/admin" style={styles.link}>Create a Regatta →</a>
        </div>
      </div>
    )
  }

  const { sailors, races, classes } = event

  // Filter sailors by selected class
  const filteredSailors = selectedClass 
    ? sailors.filter(s => s.boatClass === selectedClass)
    : []

  // Get races for selected class only
  const classRaces = selectedClass
    ? races.filter(r => r.raceClass === selectedClass)
    : []

  // Calculate results for selected class only
  const results = selectedClass 
    ? calculateResults(filteredSailors, classRaces)
    : []

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>⛵ ISA Regatta Scoring</div>
        <a href="/admin" style={styles.adminLink}>Admin →</a>
      </header>

      {/* Event Title */}
      <div style={styles.eventHeader}>
        <h1 style={styles.eventTitle}>{event.eventName}</h1>
        <div style={styles.eventDate}>
          📅 {formatDate(event.eventDate)} — {formatDate(event.eventEndDate)}
        </div>
        <div style={styles.eventVenue}>📍 {event.venue || 'TBA'}</div>
        {event.lastUpdated && (
          <div style={styles.lastUpdated}>Last updated: {event.lastUpdated}</div>
        )}
      </div>

      {/* Navigation Tabs */}
      <nav style={styles.nav}>
        {[
          { id: 'details', label: 'Details' },
          { id: 'entries', label: `Entries (${sailors.length})` },
          { id: 'results', label: 'Results' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.navTab,
              ...(activeTab === tab.id ? styles.navTabActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={styles.main}>
        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div style={styles.tabContent}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>About This Event</h2>
              <p style={styles.description}>{event.description || 'No description available.'}</p>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Event Information</h2>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <strong>Organizer:</strong> {event.organizer || 'TBA'}
                </div>
                <div style={styles.infoItem}>
                  <strong>Venue:</strong> {event.venue || 'TBA'}
                </div>
                <div style={styles.infoItem}>
                  <strong>Start Date:</strong> {formatDate(event.eventDate)}
                </div>
                <div style={styles.infoItem}>
                  <strong>End Date:</strong> {formatDate(event.eventEndDate)}
                </div>
                <div style={styles.infoItem}>
                  <strong>Classes:</strong> {(classes || []).join(', ')}
                </div>
                <div style={styles.infoItem}>
                  <strong>Entries:</strong> {sailors.length} sailors
                </div>
              </div>
            </section>

            {(event.noticeOfRace || event.sailingInstructions) && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Documents</h2>
                <div style={styles.documents}>
                  {event.noticeOfRace && (
                    <a href={event.noticeOfRace} style={styles.docLink} target="_blank" rel="noreferrer">
                      📄 Notice of Race
                    </a>
                  )}
                  {event.sailingInstructions && (
                    <a href={event.sailingInstructions} style={styles.docLink} target="_blank" rel="noreferrer">
                      📄 Sailing Instructions
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ENTRIES TAB */}
        {activeTab === 'entries' && (
          <div style={styles.tabContent}>
            {/* Class Tabs */}
            {(classes || []).length > 0 && (
              <div style={styles.classTabs}>
                {classes.map(cls => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    style={{
                      ...styles.classTab,
                      ...(selectedClass === cls ? styles.classTabActive : {})
                    }}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}

            <h2 style={styles.sectionTitle}>
              {selectedClass ? `${selectedClass} Entries` : 'Select a Class'}
            </h2>

            {!selectedClass ? (
              <p style={styles.empty}>Please select a class above.</p>
            ) : filteredSailors.length === 0 ? (
              <p style={styles.empty}>No entries in this class yet.</p>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Sail</th>
                      <th style={styles.th}>Helmsman</th>
                      <th style={styles.th}>Crew</th>
                      <th style={styles.th}>Club</th>
                      <th style={styles.th}>Cat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSailors.map((s, i) => (
                      <tr key={s.id} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                        <td style={styles.td}>{i + 1}</td>
                        <td style={styles.td}>
                          <span style={styles.flag}>{FLAGS[s.country] || '🏳️'}</span>
                          <strong>{s.sailNumber}</strong>
                        </td>
                        <td style={styles.td}>{s.name}</td>
                        <td style={styles.td}>{s.crewName || '-'}</td>
                        <td style={styles.td}>{s.club || '-'}</td>
                        <td style={styles.td}>{s.category || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* RESULTS TAB - Always by Class */}
        {activeTab === 'results' && (
          <div style={styles.tabContent}>
            {/* Class Tabs */}
            {(classes || []).length > 0 && (
              <div style={styles.classTabs}>
                {classes.map(cls => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    style={{
                      ...styles.classTab,
                      ...(selectedClass === cls ? styles.classTabActive : {})
                    }}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}

            {classRaces.length === 0 ? (
              <p style={styles.empty}>No races for {selectedClass} yet.</p>
            ) : !selectedClass ? (
              <p style={styles.empty}>Please select a class above.</p>
            ) : (
              <>
                <h2 style={styles.sectionTitle}>{selectedClass} Results ({classRaces.length} races)</h2>
                
                {results.length === 0 ? (
                  <p style={styles.empty}>No sailors in this class.</p>
                ) : (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeader}>
                          <th style={styles.th}>Rank</th>
                          <th style={styles.th}>Sail</th>
                          <th style={styles.th}>Helmsman / Crew</th>
                          <th style={styles.th}>Club</th>
                          <th style={styles.th}>Cat</th>
                          <th style={{...styles.th, ...styles.pointsCol}}>Net</th>
                          <th style={{...styles.th, ...styles.pointsCol}}>Total</th>
                          {classRaces.map(r => (
                            <th key={r.id} style={{...styles.th, ...styles.raceCol}}>
                              R{r.number}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => (
                          <tr key={r.id} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                            <td style={styles.td}><strong>{i + 1}</strong></td>
                            <td style={styles.td}>
                              <span style={styles.flag}>{FLAGS[r.country] || '🏳️'}</span>
                              {r.sailNumber}
                            </td>
                            <td style={styles.td}>
                              <div style={styles.helmsman}>{r.name}</div>
                              {r.crewName && <div style={styles.crew}>{r.crewName}</div>}
                            </td>
                            <td style={styles.td}>{r.club || '-'}</td>
                            <td style={styles.td}>{r.category || '-'}</td>
                            <td style={{...styles.td, ...styles.pointsCol, ...styles.netPoints}}>
                              {r.net}
                            </td>
                            <td style={{...styles.td, ...styles.pointsCol}}>{r.total}</td>
                            {r.raceScores.map(rs => (
                              <td key={rs.race} style={{...styles.td, ...styles.raceCol}}>
                                {rs.isDropped ? (
                                  <span style={styles.dropped}>({rs.display})</span>
                                ) : rs.isPenalty ? (
                                  <span>{rs.code}<span style={styles.penaltyVal}>({rs.points})</span></span>
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
                )}

                <div style={styles.legend}>
                  <span style={styles.dropped}>(X)</span> = Dropped race (worst score discarded)
                  <span style={{marginLeft: '20px'}}>DNC/DNS/DNF/etc. = Penalty points</span>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Powered by ISA Regatta Scoring System</p>
      </footer>
    </div>
  )
}

// Helper functions
function calculateResults(sailors, races) {
  const totalSailors = sailors.length
  
  return sailors.map(sailor => {
    const raceScores = races.map(r => {
      const score = sailor.scores?.[r.number]
      const parsed = parseScore(score, totalSailors)
      return {
        race: r.number,
        raw: parsed.value,
        display: parsed.display,
        isPenalty: parsed.isPenalty,
        code: parsed.code,
        points: parsed.points
      }
    })

    // Sort by value (highest first) to find worst race to drop
    const sorted = [...raceScores].sort((a, b) => b.raw - a.raw)
    const droppedRace = raceScores.length >= 2 ? sorted[0]?.race : null
    
    // Mark dropped race
    raceScores.forEach(rs => {
      if (rs.race === droppedRace) {
        rs.isDropped = true
      }
    })

    const total = raceScores.reduce((sum, r) => sum + r.raw, 0)
    const net = raceScores
      .filter(r => r.race !== droppedRace)
      .reduce((sum, r) => sum + r.raw, 0)

    return { 
      ...sailor, 
      total, 
      net, 
      raceScores, 
      droppedRace 
    }
  }).sort((a, b) => a.net - b.net)
}

function parseScore(score, totalSailors) {
  const LETTER_SCORES = {
    'DNS': true, 'DNF': true, 'DSQ': true, 'OCS': true, 'BFD': true,
    'RET': true, 'UFD': true, 'NSC': true, 'DNC': true, 'DNE': true,
    'DGM': true, 'RDG': true
  }
  
  if (!score) {
    return { 
      value: totalSailors + 1, 
      display: 'DNC',
      isPenalty: true,
      code: 'DNC',
      points: totalSailors + 1
    }
  }
  
  const upper = score.toUpperCase().trim()
  
  // Check for penalty codes with points (e.g., "BFD 23" or "BFD(23)")
  const penaltyMatch = upper.match(/^([A-Z]+)\s*\(?([0-9]+)\)?$/)
  if (penaltyMatch) {
    const code = penaltyMatch[1]
    const points = parseInt(penaltyMatch[2])
    if (LETTER_SCORES[code]) {
      return {
        value: points,
        display: `${code}(${points})`,
        isPenalty: true,
        code,
        points
      }
    }
  }
  
  // Simple penalty codes (DNS, DNF, etc.)
  if (LETTER_SCORES[upper]) {
    const points = totalSailors + 1
    return {
      value: points,
      display: upper,
      isPenalty: true,
      code: upper,
      points
    }
  }
  
  // Numeric score
  const num = parseInt(score)
  if (!isNaN(num)) {
    return { 
      value: num, 
      display: num.toString(),
      isPenalty: false,
      code: null,
      points: num
    }
  }
  
  return { 
    value: totalSailors + 1, 
    display: 'DNC',
    isPenalty: true,
    code: 'DNC',
    points: totalSailors + 1
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBA'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px'
  },
  error: {
    textAlign: 'center',
    padding: '100px 20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  link: {
    color: '#2b6cb0',
    fontSize: '18px',
    textDecoration: 'none'
  },
  header: {
    background: '#1a365d',
    color: 'white',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  adminLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '4px',
    fontSize: '14px'
  },
  eventHeader: {
    background: 'white',
    padding: '30px',
    borderBottom: '1px solid #e2e8f0'
  },
  eventTitle: {
    margin: '0 0 10px 0',
    color: '#1a365d',
    fontSize: '28px'
  },
  eventDate: {
    color: '#4a5568',
    fontSize: '16px',
    marginBottom: '5px'
  },
  eventVenue: {
    color: '#718096',
    fontSize: '14px'
  },
  lastUpdated: {
    color: '#a0aec0',
    fontSize: '12px',
    marginTop: '10px'
  },
  nav: {
    display: 'flex',
    background: 'white',
    borderBottom: '2px solid #e2e8f0',
    padding: '0 30px'
  },
  navTab: {
    padding: '15px 25px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
    borderBottom: '3px solid transparent',
    marginBottom: '-2px'
  },
  navTabActive: {
    color: '#2b6cb0',
    borderBottomColor: '#2b6cb0'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px'
  },
  tabContent: {
    background: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  classTabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  classTab: {
    padding: '10px 20px',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#4a5568'
  },
  classTabActive: {
    background: '#2b6cb0',
    color: 'white'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    color: '#1a365d',
    fontSize: '20px',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e2e8f0'
  },
  description: {
    color: '#4a5568',
    lineHeight: '1.6',
    fontSize: '15px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  infoItem: {
    padding: '12px',
    background: '#f7fafc',
    borderRadius: '6px',
    fontSize: '14px'
  },
  documents: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },
  docLink: {
    padding: '12px 20px',
    background: '#ebf8ff',
    color: '#2b6cb0',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '500'
  },
  empty: {
    textAlign: 'center',
    padding: '50px',
    color: '#718096',
    fontSize: '16px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  tableHeader: {
    background: '#2d3748',
    color: 'white'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'top'
  },
  evenRow: {
    background: '#f7fafc'
  },
  oddRow: {
    background: 'white'
  },
  flag: {
    marginRight: '8px',
    fontSize: '16px'
  },
  helmsman: {
    fontWeight: '500',
    color: '#2d3748'
  },
  crew: {
    color: '#718096',
    fontSize: '13px',
    marginTop: '2px'
  },
  pointsCol: {
    textAlign: 'center',
    fontWeight: 'bold'
  },
  netPoints: {
    color: '#2b6cb0',
    fontSize: '16px'
  },
  raceCol: {
    textAlign: 'center',
    minWidth: '50px'
  },
  dropped: {
    color: '#a0aec0',
    fontStyle: 'italic'
  },
  penaltyVal: {
    color: '#e53e3e',
    fontSize: '11px',
    marginLeft: '2px'
  },
  legend: {
    marginTop: '20px',
    padding: '15px',
    background: '#f7fafc',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#4a5568'
  },
  footer: {
    textAlign: 'center',
    padding: '30px',
    color: '#718096',
    fontSize: '13px'
  }
}
