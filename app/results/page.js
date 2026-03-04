'use client'

import { useState, useEffect } from 'react'
import { FLAGS, LETTER_SCORES, decodeRegatta } from '../lib/data'

export default function ResultsPage() {
  const [data, setData] = useState(null)
  const [selectedClass, setSelectedClass] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load from URL hash first (shareable link)
    const hash = window.location.hash.slice(1)
    if (hash) {
      const decoded = decodeRegatta(hash)
      if (decoded) {
        setData(decoded)
        setLoading(false)
        return
      }
    }
    
    // Try to load from localStorage (local admin data)
    const saved = localStorage.getItem('regatta-data')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setData(parsed)
      } catch (e) {}
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div style={styles.loading}>Loading results...</div>
  }

  if (!data || !data.sailors || data.sailors.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.noData}>
          <h2>No Regatta Data</h2>
          <p>Go to <a href="/admin" style={styles.link}>Admin</a> to create a regatta.</p>
        </div>
      </div>
    )
  }

  const { sailors, races, regattaName = 'Regatta Results', lastUpdated } = data

  // Get unique boat classes for tabs
  const classes = [...new Set(sailors.map(s => s.boatClass))]
  const filteredSailors = selectedClass === 'all' 
    ? sailors 
    : sailors.filter(s => s.boatClass === selectedClass)

  // Calculate results
  const results = calculateResults(filteredSailors, races)

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>⛵ {regattaName}</h1>
        <div style={styles.lastUpdate}>
          Last update: {lastUpdated || new Date().toLocaleString()}
        </div>
      </div>

      {/* Class Tabs */}
      <div style={styles.tabs}>
        <button 
          style={{...styles.tab, ...(selectedClass === 'all' ? styles.tabActive : {})}}
          onClick={() => setSelectedClass('all')}
        >
          ALL
        </button>
        {classes.map(cls => (
          <button 
            key={cls}
            style={{...styles.tab, ...(selectedClass === cls ? styles.tabActive : {})}}
            onClick={() => setSelectedClass(cls)}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Results Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>SAIL</th>
              <th style={styles.th}>SPONSOR/BOAT</th>
              <th style={styles.th}>CREW</th>
              <th style={styles.th}>CLUB</th>
              <th style={styles.th}>CAT</th>
              <th style={{...styles.th, ...styles.pointsCol}}>NET<br/>points</th>
              <th style={{...styles.th, ...styles.pointsCol}}>TOTAL<br/>points</th>
              {races.map(r => (
                <th key={r.number} style={{...styles.th, ...styles.raceCol}}>
                  {r.number}
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
                  <div style={styles.sailNum}>{r.sailNumber}</div>
                </td>
                <td style={styles.td}>{r.boatName || '-'}</td>
                <td style={styles.td}>
                  <div style={styles.crewName}>{r.name}</div>
                  {r.crewName && <div style={styles.crewName2}>{r.crewName}</div>}
                </td>
                <td style={styles.td}>{r.club || '-'}</td>
                <td style={styles.td}>{r.category || '-'}</td>
                <td style={{...styles.td, ...styles.pointsCol, ...styles.netPoints}}>{r.net}</td>
                <td style={{...styles.td, ...styles.pointsCol}}>{r.total}</td>
                {r.raceScores.map(rs => (
                  <td key={rs.race} style={{...styles.td, ...styles.raceCol}}>
                    {rs.isDropped ? (
                      <span style={styles.dropped}>({rs.display})</span>
                    ) : rs.isPenalty ? (
                      <span>{rs.code}<span style={styles.penaltyPoints}>({rs.points})</span></span>
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

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.legend}>
          <span style={styles.dropped}>(X)</span> = Dropped race (worst score) 
          <span style={{marginLeft: '20px'}}>BFD(X) = Black Flag Disqualification with X points</span>
        </div>
        <div style={styles.printOnly}>
          Results generated from ISA Regatta Scoring System
        </div>
      </div>
    </div>
  )
}

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
    // Only drop if 2+ races
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

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#f5f5f5',
    minHeight: '100vh'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px'
  },
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '8px',
    marginTop: '40px'
  },
  link: {
    color: '#2b6cb0',
    textDecoration: 'underline'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  title: {
    color: '#1a365d',
    margin: 0,
    fontSize: '28px'
  },
  lastUpdate: {
    color: '#666',
    fontSize: '13px'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    background: '#4a5568',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    textTransform: 'uppercase',
    borderRadius: '4px 4px 0 0'
  },
  tabActive: {
    background: '#2b6cb0'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '0 8px 8px 8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  headerRow: {
    background: '#4a5568',
    color: 'white'
  },
  th: {
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '2px solid #2d3748',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '10px 8px',
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
    fontSize: '20px',
    marginRight: '8px'
  },
  sailNum: {
    fontWeight: 'bold',
    color: '#2d3748',
    fontSize: '14px'
  },
  crewName: {
    color: '#2b6cb0',
    fontWeight: '500'
  },
  crewName2: {
    color: '#4a5568',
    marginTop: '4px'
  },
  pointsCol: {
    textAlign: 'center',
    fontWeight: 'bold'
  },
  netPoints: {
    color: '#2b6cb0',
    fontSize: '15px'
  },
  raceCol: {
    textAlign: 'center',
    minWidth: '45px'
  },
  dropped: {
    color: '#a0aec0',
    fontStyle: 'italic'
  },
  penaltyPoints: {
    color: '#666',
    fontSize: '11px'
  },
  footer: {
    marginTop: '20px',
    padding: '15px',
    fontSize: '12px',
    color: '#666'
  },
  legend: {
    marginBottom: '10px'
  },
  printOnly: {
    display: 'none',
    '@media print': {
      display: 'block',
      marginTop: '20px',
      textAlign: 'center',
      fontSize: '10px',
      color: '#999'
    }
  }
}
