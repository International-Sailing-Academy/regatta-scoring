'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const MASTERS_HANDICAP = {
  'Apprentice': 4, 'Master': 3, 'Grand Master': 2, 'Great Grand Master': 1, 'Legend': 0
}

export default function AdminPage() {
  const [event, setEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('sailors')
  const [newSailor, setNewSailor] = useState({ sailNumber: '', name: '', boatClass: 'Radial', ageGroup: 'Open' })

  useEffect(() => {
    const saved = localStorage.getItem('regatta-midwinters-2026')
    if (saved) {
      setEvent(JSON.parse(saved))
    }
  }, [])

  const saveEvent = (updated) => {
    setEvent(updated)
    localStorage.setItem('regatta-midwinters-2026', JSON.stringify(updated))
  }

  const addSailor = () => {
    if (!newSailor.name || !newSailor.sailNumber) return
    const sailor = { ...newSailor, id: Date.now(), scores: {} }
    saveEvent({ ...event, sailors: [...event.sailors, sailor] })
    setNewSailor({ sailNumber: '', name: '', boatClass: 'Radial', ageGroup: 'Open' })
  }

  const removeSailor = (id) => {
    saveEvent({ ...event, sailors: event.sailors.filter(s => s.id !== id) })
  }

  const addRace = () => {
    const newRace = { number: event.races.length + 1, date: '2026-03-19', wind: '' }
    saveEvent({ ...event, races: [...event.races, newRace] })
  }

  const updateScore = (sailorId, raceNum, value) => {
    const updatedSailors = event.sailors.map(s => {
      if (s.id === sailorId) {
        return { ...s, scores: { ...s.scores, [raceNum]: value } }
      }
      return s
    })
    saveEvent({ ...event, sailors: updatedSailors })
  }

  const getHandicap = (ageGroup) => {
    for (const [cat, pts] of Object.entries(MASTERS_HANDICAP)) {
      if (ageGroup.includes(cat)) return pts
    }
    return 0
  }

  const calculateResults = () => {
    const totalSailors = event.sailors.length
    return event.sailors.map(sailor => {
      const handicap = getHandicap(sailor.ageGroup)
      const raceScores = event.races.map(r => {
        const score = sailor.scores[r.number]
        let value = totalSailors + 1
        let display = 'DNS'
        if (score) {
          const num = parseInt(score)
          if (!isNaN(num)) { value = num; display = score }
          else { value = totalSailors + 1; display = score.toUpperCase() }
        }
        return { race: r.number, adjusted: value + handicap, display }
      })
      const sorted = [...raceScores].sort((a, b) => b.adjusted - a.adjusted)
      const dropped = sorted[0]?.race
      const net = raceScores.filter(r => r.race !== dropped).reduce((sum, r) => sum + r.adjusted, 0)
      return { ...sailor, net, raceScores, dropped, handicap }
    }).sort((a, b) => a.net - b.net)
  }

  if (!event) return <div>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ background: '#1e3a5f', color: 'white', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>⛵ Admin: {event.eventName}</h1>
            <p style={{ opacity: 0.8 }}>Manage sailors, scores, and results</p>
          </div>
          <Link href="/" style={{ color: 'white', textDecoration: 'none', padding: '10px 20px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
            ← Back to Public Site
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #ddd', padding: '0 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '10px' }}>
          {['sailors', 'races', 'scores', 'results'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '15px 20px',
                border: 'none',
                background: activeTab === tab ? '#e2e8f0' : 'transparent',
                borderBottom: activeTab === tab ? '3px solid #2b6cb0' : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        
        {activeTab === 'sailors' && (
          <div>
            <h2>Manage Sailors ({event.sailors.length})</h2>
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3>Add New Sailor</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                <input placeholder="Sail Number" value={newSailor.sailNumber} onChange={e => setNewSailor({...newSailor, sailNumber: e.target.value})} style={{ padding: '10px' }} />
                <input placeholder="Name" value={newSailor.name} onChange={e => setNewSailor({...newSailor, name: e.target.value})} style={{ padding: '10px' }} />
                <select value={newSailor.boatClass} onChange={e => setNewSailor({...newSailor, boatClass: e.target.value})} style={{ padding: '10px' }}>
                  <option value="ILCA 7">ILCA 7</option>
                  <option value="Radial">Radial</option>
                </select>
                <select value={newSailor.ageGroup} onChange={e => setNewSailor({...newSailor, ageGroup: e.target.value})} style={{ padding: '10px' }}>
                  {['Open', 'Youth', '18-35', 'Apprentice Master', 'Master', 'Grand Master', 'Great Grand Master', 'Legend'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <button onClick={addSailor} style={{ marginTop: '10px', padding: '10px 20px', background: '#38a169', color: 'white', border: 'none', borderRadius: '4px' }}>Add Sailor</button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {event.sailors.map((s, i) => (
                <div key={s.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{i + 1}. {s.name}</strong> ({s.sailNumber}) - {s.boatClass} - {s.ageGroup}
                    {getHandicap(s.ageGroup) > 0 && <span style={{ color: '#e53e3e' }}> (+{getHandicap(s.ageGroup)})</span>}
                  </div>
                  <button onClick={() => removeSailor(s.id)} style={{ padding: '5px 10px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px' }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'races' && (
          <div>
            <h2>Manage Races ({event.races.length})</h2>
            <button onClick={addRace} style={{ padding: '10px 20px', background: '#38a169', color: 'white', border: 'none', borderRadius: '4px', marginBottom: '20px' }}>Add Race</button>
            
            <div style={{ display: 'grid', gap: '10px' }}>
              {event.races.map(r => (
                <div key={r.number} style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  Race {r.number} - {r.date}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scores' && (
          <div>
            <h2>Input Scores</h2>
            <p>Enter position numbers or DNS/DNF/OCS/BFD/RET</p>
            
            {event.races.map(race => (
              <div key={race.number} style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>Race {race.number}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  {event.sailors.map(sailor => (
                    <div key={sailor.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px' }}>{sailor.name}</span>
                      <input
                        type="text"
                        value={sailor.scores[race.number] || ''}
                        onChange={(e) => updateScore(sailor.id, race.number, e.target.value)}
                        style={{ width: '60px', padding: '5px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            <h2>Live Results (with Handicap)</h2>
            <p>Worst race dropped for each sailor</p>
            
            <table style={{ width: '100%', background: 'white', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#e2e8f0' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Rank</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Sailor</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Class</th>
                  <th style={{ padding: '10px' }}>HCP</th>
                  {event.races.map(r => <th key={r.number} style={{ padding: '10px', textAlign: 'center' }}>R{r.number}</th>)}
                  <th style={{ padding: '10px' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {calculateResults().map((r, i) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{i + 1}</td>
                    <td style={{ padding: '10px' }}>{r.name}</td>
                    <td style={{ padding: '10px' }}>{r.boatClass}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>+{r.handicap}</td>
                    {r.raceScores.map(rs => (
                      <td key={rs.race} style={{ padding: '10px', textAlign: 'center' }}>
                        {rs.race === r.dropped ? <span style={{ textDecoration: 'line-through', color: '#999' }}>{rs.display}</span> : rs.display}
                      </td>
                    ))}
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{r.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
