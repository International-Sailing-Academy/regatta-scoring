'use client'

import { useState, useEffect } from 'react'

export default function RegattaApp() {
  // Load from localStorage on mount
  const [sailors, setSailors] = useState([])
  const [races, setRaces] = useState([])
  const [activeTab, setActiveTab] = useState('register')
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedAge, setSelectedAge] = useState('all')

  useEffect(() => {
    const saved = localStorage.getItem('regatta-data')
    if (saved) {
      const data = JSON.parse(saved)
      setSailors(data.sailors || [])
      setRaces(data.races || [])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('regatta-data', JSON.stringify({ sailors, races }))
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
      country: form.country.value || '',
      scores: {}
    }
    setSailors([...sailors, newSailor])
    form.reset()
  }

  const addRace = (e) => {
    e.preventDefault()
    const form = e.target
    const newRace = {
      number: races.length + 1,
      windSpeed: form.windSpeed.value,
      windDir: form.windDir.value,
      notes: form.notes.value
    }
    setRaces([...races, newRace])
    form.reset()
  }

  const updateScore = (sailorId, raceNum, position) => {
    setSailors(sailors.map(s => {
      if (s.id === sailorId) {
        return { ...s, scores: { ...s.scores, [raceNum]: position } }
      }
      return s
    }))
  }

  const calculateResults = () => {
    const numRaces = races.length
    const discards = numRaces >= 9 ? 2 : numRaces >= 5 ? 1 : 0

    return sailors.map(sailor => {
      const scores = races.map(r => {
        const score = sailor.scores[r.number]
        if (!score || score === 'DNS') return numRaces + 1
        if (['DNF', 'DSQ', 'RET'].includes(score)) return numRaces + 1
        return parseInt(score) || numRaces + 1
      })

      const total = scores.reduce((a, b) => a + b, 0)
      const sortedScores = [...scores].sort((a, b) => b - a)
      const netScores = sortedScores.slice(discards)
      const net = netScores.reduce((a, b) => a + b, 0)

      return { ...sailor, total, net, scores }
    }).sort((a, b) => a.net - b.net)
  }

  const getFilteredResults = () => {
    let results = calculateResults()
    if (selectedClass !== 'all') {
      results = results.filter(r => r.boatClass === selectedClass)
    }
    if (selectedAge !== 'all') {
      results = results.filter(r => r.ageGroup === selectedAge)
    }
    return results
  }

  const exportCSV = () => {
    const results = calculateResults()
    const csv = [
      ['Rank', 'Sail', 'Name', 'Class', 'Age', 'Country', 'Total', 'Net'].join(','),
      ...results.map((r, i) => [
        i + 1, r.sailNumber, `"${r.name}"`, r.boatClass, r.ageGroup, r.country, r.total, r.net
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `regatta-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const clearData = () => {
    if (confirm('Clear all data? This cannot be undone.')) {
      setSailors([])
      setRaces([])
      localStorage.removeItem('regatta-data')
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ textAlign: 'center', color: '#1a365d' }}>⛵ ISA Regatta Scoring</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['register', 'races', 'scores', 'results'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === tab ? '#2b6cb0' : '#e2e8f0',
              color: activeTab === tab ? 'white' : '#4a5568',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'register' && (
        <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px' }}>
          <h2>Register Sailor</h2>
          <form onSubmit={addSailor} style={{ display: 'grid', gap: '12px' }}>
            <input name="sailNumber" placeholder="Sail Number (e.g., 123456)" required 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }} />
            <input name="name" placeholder="Sailor Name" required 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }} />
            <select name="boatClass" required 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
              <option value="">Select Class</option>
              <option value="ILCA 7">ILCA 7</option>
              <option value="Radial">Radial</option>
            </select>
            <select name="ageGroup" required 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
              <option value="">Select Age Group</option>
              <option value="Open">Open</option>
              <option value="Masters">Masters</option>
            </select>
            <input name="country" placeholder="Country (optional)" 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }} />
            <button type="submit" 
              style={{ padding: '12px', background: '#38a169', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Add Sailor
            </button>
          </form>

          <h3 style={{ marginTop: '30px' }}>Registered Sailors ({sailors.length})</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {sailors.map(s => (
              <div key={s.id} style={{ padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <strong>{s.sailNumber}</strong> — {s.name} 
                <span style={{ color: '#718096', marginLeft: '10px' }}>
                  {s.boatClass} • {s.ageGroup}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'races' && (
        <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px' }}>
          <h2>Add Race</h2>
          <form onSubmit={addRace} style={{ display: 'grid', gap: '12px' }}>
            <input name="windSpeed" placeholder="Wind Speed (e.g., 12-15 knots)" 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }} />
            <input name="windDir" placeholder="Wind Direction (e.g., NW)" 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }} />
            <input name="notes" placeholder="Notes (e.g., Shifty, puffy)" 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }} />
            <button type="submit" 
              style={{ padding: '12px', background: '#38a169', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Add Race {races.length + 1}
            </button>
          </form>

          <h3 style={{ marginTop: '30px' }}>Races ({races.length})</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {races.map(r => (
              <div key={r.number} style={{ padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <strong>Race {r.number}</strong>
                {r.windSpeed && <span style={{ marginLeft: '10px', color: '#718096' }}>Wind: {r.windSpeed}</span>}
                {r.windDir && <span style={{ marginLeft: '10px', color: '#718096' }}>Dir: {r.windDir}</span>}
                {r.notes && <div style={{ marginTop: '4px', color: '#a0aec0', fontSize: '14px' }}>{r.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'scores' && (
        <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px' }}>
          <h2>Input Scores</h2>
          {races.length === 0 ? (
            <p>Add races first!</p>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {races.map(race => (
                <div key={race.number} style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <h3>Race {race.number}</h3>
                  <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflow: 'auto' }}>
                    {sailors.map(sailor => (
                      <div key={sailor.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ minWidth: '150px' }}>{sailor.sailNumber} — {sailor.name}</span>
                        <input
                          type="text"
                          placeholder="Pos"
                          value={sailor.scores[race.number] || ''}
                          onChange={(e) => updateScore(sailor.id, race.number, e.target.value)}
                          style={{ width: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                        />
                        <span style={{ color: '#718096', fontSize: '12px' }}>
                          {sailor.boatClass} • {sailor.ageGroup}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px' }}>
          <h2>Results</h2>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
              <option value="all">All Classes</option>
              <option value="ILCA 7">ILCA 7</option>
              <option value="Radial">Radial</option>
            </select>
            <select value={selectedAge} onChange={(e) => setSelectedAge(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
              <option value="all">All Ages</option>
              <option value="Open">Open</option>
              <option value="Masters">Masters</option>
            </select>
            <button onClick={exportCSV}
              style={{ padding: '10px 20px', background: '#4299e1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Export CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px' }}>
              <thead>
                <tr style={{ background: '#edf2f7' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Sail</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Class</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Age</th>
                  {races.map(r => (
                    <th key={r.number} style={{ padding: '12px', textAlign: 'center' }}>R{r.number}</th>
                  ))}
                  <th style={{ padding: '12px', textAlign: 'center' }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredResults().map((result, index) => (
                  <tr key={result.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>{index + 1}</td>
                    <td style={{ padding: '12px' }}>{result.sailNumber}</td>
                    <td style={{ padding: '12px' }}>{result.name}</td>
                    <td style={{ padding: '12px' }}>{result.boatClass}</td>
                    <td style={{ padding: '12px' }}>{result.ageGroup}</td>
                    {races.map(r => (
                      <td key={r.number} style={{ padding: '12px', textAlign: 'center' }}>
                        {result.scores[r.number] || '-'}
                      </td>
                    ))}
                    <td style={{ padding: '12px', textAlign: 'center' }}>{result.total}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{result.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button onClick={clearData} 
          style={{ padding: '10px 20px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Clear All Data
        </button>
      </div>
    </div>
  )
}
