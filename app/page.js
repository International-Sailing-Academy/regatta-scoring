'use client'

import { useState, useEffect } from 'react'

const MASTERS_HANDICAP = {
  'Apprentice': 4,
  'Master': 3,
  'Grand Master': 2,
  'Great Grand Master': 1,
  'Legend': 0
}

const LETTER_SCORES = {
  'DNS': 'DNS',
  'DNF': 'DNF',
  'DSQ': 'DSQ',
  'OCS': 'OCS',
  'BFD': 'BFD',
  'RET': 'RET',
  'UFD': 'UFD',
  'NSC': 'NSC'
}

export default function RegattaApp() {
  const [sailors, setSailors] = useState([])
  const [races, setRaces] = useState([])
  const [activeTab, setActiveTab] = useState('register')
  const [selectedClass, setSelectedClass] = useState('all')
  const [useHandicap, setUseHandicap] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('regatta-data')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          setSailors(data.sailors || [])
          setRaces(data.races || [])
        } catch (e) {}
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('regatta-data', JSON.stringify({ sailors, races }))
    }
  }, [sailors, races])

  const addSailor = (e) => {
    e.preventDefault()
    const form = e.target
    const newSailor = {
      id: Date.now(),
      sailNumber: form.sailNumber.value,
      name: form.name.value,
      boatClass: form.boatClass.value,
      ageGroup: form.ageGroup.value,
      scores: {}
    }
    setSailors([...sailors, newSailor])
    form.reset()
  }

  const addRace = () => {
    setRaces([...races, { number: races.length + 1 }])
  }

  const updateScore = (sailorId, raceNum, value) => {
    setSailors(sailors.map(s => {
      if (s.id === sailorId) {
        return { ...s, scores: { ...s.scores, [raceNum]: value.toUpperCase() } }
      }
      return s
    }))
  }

  const getHandicap = (ageGroup) => {
    if (!useHandicap) return 0
    for (const [cat, pts] of Object.entries(MASTERS_HANDICAP)) {
      if (ageGroup.includes(cat)) return pts
    }
    return 0
  }

  const parseScore = (score, totalSailors) => {
    if (!score) return { value: totalSailors + 1, display: 'DNS' }
    const upper = score.toUpperCase()
    if (LETTER_SCORES[upper]) return { value: totalSailors + 1, display: upper }
    const num = parseInt(score)
    if (!isNaN(num)) return { value: num, display: num.toString() }
    return { value: totalSailors + 1, display: 'DNS' }
  }

  const calculateResults = () => {
    const totalSailors = sailors.length
    
    return sailors.map(sailor => {
      const handicap = getHandicap(sailor.ageGroup)
      
      const raceScores = races.map(r => {
        const parsed = parseScore(sailor.scores[r.number], totalSailors)
        return {
          race: r.number,
          raw: parsed.value,
          adjusted: parsed.value + handicap,
          display: parsed.display
        }
      })

      // Sort by adjusted score (highest first) to find worst race to drop
      const sorted = [...raceScores].sort((a, b) => b.adjusted - a.adjusted)
      const droppedRace = sorted[0]?.race
      
      const counted = raceScores.filter(r => r.race !== droppedRace)
      const total = raceScores.reduce((sum, r) => sum + r.adjusted, 0)
      const net = counted.reduce((sum, r) => sum + r.adjusted, 0)

      return { ...sailor, total, net, raceScores, droppedRace, handicap }
    }).sort((a, b) => a.net - b.net)
  }

  const getFilteredResults = () => {
    let results = calculateResults()
    if (selectedClass !== 'all') {
      results = results.filter(r => r.boatClass === selectedClass)
    }
    return results
  }

  const clearData = () => {
    if (confirm('Clear all data?')) {
      setSailors([])
      setRaces([])
      localStorage.removeItem('regatta-data')
    }
  }

  const styles = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '20px' },
    header: { textAlign: 'center', color: '#1a365d' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
    tab: (active) => ({
      flex: 1,
      padding: '12px',
      background: active ? '#2b6cb0' : '#e2e8f0',
      color: active ? 'white' : '#4a5568',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 'bold'
    }),
    panel: { background: '#f7fafc', padding: '20px', borderRadius: '8px' },
    input: { padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', width: '100%' },
    button: { padding: '12px', background: '#38a169', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse', background: 'white' },
    th: { padding: '10px', textAlign: 'left', background: '#edf2f7' },
    td: { padding: '10px', borderTop: '1px solid #e2e8f0' }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>⛵ ISA Regatta Scoring</h1>
      
      <div style={styles.tabs}>
        {['register', 'races', 'scores', 'results'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={styles.tab(activeTab === tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#edf2f7', borderRadius: '8px' }}>
        <label>
          <input type="checkbox" checked={useHandicap} onChange={(e) => setUseHandicap(e.target.checked)} />
          Use ILCA NA Masters Handicap
        </label>
        {useHandicap && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>(App +4, M +3, GM +2, GGM +1, L +0)</span>}
      </div>

      {activeTab === 'register' && (
        <div style={styles.panel}>
          <h2>Register Sailor</h2>
          <form onSubmit={addSailor}>
            <input name="sailNumber" placeholder="Sail Number" required style={styles.input} />
            <br /><br />
            <input name="name" placeholder="Name" required style={styles.input} />
            <br /><br />
            <select name="boatClass" required style={styles.input}>
              <option value="">Select Class</option>
              <option value="ILCA 7">ILCA 7</option>
              <option value="Radial">Radial</option>
            </select>
            <br /><br />
            <select name="ageGroup" required style={styles.input}>
              <option value="">Age Group</option>
              <option value="Open">Open</option>
              <option value="Youth">Youth</option>
              <option value="18-35">18-35</option>
              <option value="Apprentice Master">Apprentice Master</option>
              <option value="Master">Master</option>
              <option value="Grand Master">Grand Master</option>
              <option value="Great Grand Master">Great Grand Master</option>
              <option value="Legend">Legend</option>
            </select>
            <br /><br />
            <button type="submit" style={styles.button}>Add Sailor</button>
          </form>

          <h3>Sailors ({sailors.length})</h3>
          {sailors.map(s => (
            <div key={s.id} style={{ padding: '10px', background: 'white', marginBottom: '8px', borderRadius: '4px' }}>
              <strong>{s.sailNumber}</strong> — {s.name} — {s.boatClass} — {s.ageGroup}
              {useHandicap && <span style={{ color: '#38a169' }}> (+{getHandicap(s.ageGroup)})</span>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'races' && (
        <div style={styles.panel}>
          <h2>Races ({races.length})</h2>
          <button onClick={addRace} style={styles.button}>Add Race {races.length + 1}</button>
          <div style={{ marginTop: '20px' }}>
            {races.map(r => (
              <div key={r.number} style={{ padding: '10px', background: 'white', marginBottom: '8px', borderRadius: '4px' }}>
                Race {r.number}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'scores' && (
        <div style={styles.panel}>
          <h2>Input Scores</h2>
          <p>Enter position (1,2,3...) or DNS/DNF/OCS/BFD/RET</p>
          {races.map(race => (
            <div key={race.number} style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px' }}>
              <h3>Race {race.number}</h3>
              {sailors.map(sailor => (
                <div key={sailor.id} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                  <span style={{ minWidth: '150px' }}>{sailor.sailNumber} — {sailor.name}</span>
                  <input
                    type="text"
                    value={sailor.scores[race.number] || ''}
                    onChange={(e) => updateScore(sailor.id, race.number, e.target.value)}
                    style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                    placeholder="Pos"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'results' && (
        <div style={styles.panel}>
          <h2>Results {useHandicap && '(with Handicap)'}</h2>
          <p>Worst race (highest score) dropped</p>
          
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ marginBottom: '20px', padding: '10px' }}>
            <option value="all">All Classes</option>
            <option value="ILCA 7">ILCA 7</option>
            <option value="Radial">Radial</option>
          </select>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}>Sail</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Age</th>
                {useHandicap && <th style={styles.th}>HCP</th>}
                {races.map(r => <th key={r.number} style={{ ...styles.th, textAlign: 'center' }}>R{r.number}</th>)}
                <th style={styles.th}>Net</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredResults().map((r, i) => (
                <tr key={r.id}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{r.sailNumber}</td>
                  <td style={styles.td}>{r.name}</td>
                  <td style={styles.td}>{r.boatClass}</td>
                  <td style={styles.td}>{r.ageGroup}</td>
                  {useHandicap && <td style={{ ...styles.td, textAlign: 'center', color: '#38a169' }}>+{r.handicap}</td>}
                  {r.raceScores.map(rs => (
                    <td key={rs.race} style={{ ...styles.td, textAlign: 'center' }}>
                      {rs.race === r.droppedRace ? (
                        <span style={{ textDecoration: 'line-through', color: '#a0aec0' }}>{rs.display}</span>
                      ) : (
                        rs.display
                      )}
                    </td>
                  ))}
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold', color: '#2b6cb0' }}>{r.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button onClick={clearData} style={{ padding: '10px 20px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Clear All Data
        </button>
      </div>
    </div>
  )
}
