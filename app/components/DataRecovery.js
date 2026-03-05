'use client'

import { useState, useEffect } from 'react'
import { saveEvent } from '../lib/data'

const DEFAULT_EVENT = {
  id: 'mexican-midwinters-2026',
  eventName: 'ILCA Mexican Midwinter Regatta',
  eventDate: '2026-03-19T12:00:00-06:00',
  eventEndDate: '2026-03-21',
  venue: 'La Cruz, Nayarit, Mexico',
  organizer: 'International Sailing Academy',
  description: 'Join us for the premier ILCA regatta in Mexico!',
  classes: ['ILCA 7', 'ILCA 6'],
  mastersScoringEnabled: true,
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toLocaleString()
}

const DEFAULT_SAILORS = [
  { id: '1', sailNumber: 'TBD', name: 'Greg Jackson', country: 'USA', boatClass: 'ILCA 7', category: 'Legend', scores: {} },
  { id: '2', sailNumber: 'TBD', name: 'Don Hahl', country: 'USA', boatClass: 'ILCA 7', category: 'Legend', scores: {} },
  { id: '3', sailNumber: 'TBD', name: 'Russel Krause', country: 'CAN', boatClass: 'ILCA 7', category: 'Grand Master', scores: {} },
  { id: '4', sailNumber: 'TBD', name: 'Mark Kortbeek', country: 'CAN', boatClass: 'ILCA 7', category: 'Grand Master', scores: {} },
  { id: '5', sailNumber: 'TBD', name: 'Ksenia Mamontova', country: 'RUS', boatClass: 'ILCA 6', category: 'Apprentice Master', scores: {} },
  { id: '6', sailNumber: 'TBD', name: 'Elena Oetling Ramirez', country: 'MEX', boatClass: 'ILCA 6', category: '18-35', scores: {} },
  { id: '7', sailNumber: 'TBD', name: 'Bill Pagels', country: 'USA', boatClass: 'ILCA 6', category: 'Legend', scores: {} },
  { id: '8', sailNumber: 'TBD', name: 'Roy L Lamphier', country: 'USA', boatClass: 'ILCA 6', category: 'Grand Master', scores: {} },
  { id: '9', sailNumber: 'TBD', name: 'Angela de Leo', country: 'MEX', boatClass: 'ILCA 6', category: 'Youth', scores: {} },
  { id: '10', sailNumber: 'TBD', name: 'Alec Bostan', country: 'CAN', boatClass: 'ILCA 6', category: 'Youth', scores: {} },
  { id: '11', sailNumber: 'TBD', name: 'Luis E Barrios', country: 'MEX', boatClass: 'ILCA 6', category: 'Great Grand Master', scores: {} },
  { id: '12', sailNumber: 'TBD', name: 'Bruce Martinson', country: 'USA', boatClass: 'ILCA 6', category: 'Great Grand Master', scores: {} },
  { id: '13', sailNumber: 'TBD', name: 'Rachel Kortbeek', country: 'CAN', boatClass: 'ILCA 6', category: '18-35', scores: {} },
  { id: '14', sailNumber: 'TBD', name: 'Robert Hodson', country: 'USA', boatClass: 'ILCA 6', category: 'Great Grand Master', scores: {} },
  { id: '15', sailNumber: 'TBD', name: 'Walt Spevak', country: 'USA', boatClass: 'ILCA 6', category: 'Great Grand Master', scores: {} }
]

export default function DataRecovery() {
  const [localData, setLocalData] = useState(null)
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const saved = localStorage.getItem('regatta-events')
    if (saved) {
      try {
        const events = JSON.parse(saved)
        setLocalData(events)
        setStatus('loaded')
      } catch (e) {
        setStatus('error')
      }
    } else {
      setStatus('empty')
    }
  }, [])

  const restoreData = () => {
    const event = {
      ...DEFAULT_EVENT,
      sailors: DEFAULT_SAILORS,
      races: []
    }
    saveEvent(event)
    setStatus('restored')
    window.location.reload()
  }

  const clearAndRestore = () => {
    localStorage.removeItem('regatta-events')
    restoreData()
  }

  if (status === 'restored') {
    return (
      <div style={{ background: '#c6f6d5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <strong>✅ Data restored!</strong> Refreshing page...
      </div>
    )
  }

  return (
    <div style={{ background: '#fed7d7', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#c53030' }}>🚨 Data Recovery</h4>
      
      {status === 'checking' && <p>Checking localStorage...</p>}
      
      {status === 'loaded' && localData && (
        <>
          <p style={{ fontSize: '13px', margin: '0 0 10px 0' }}>
            Found {localData.length} event(s) in localStorage.<br/>
            Sailors: {localData[0]?.sailors?.length || 0}<br/>
            Event Date: {localData[0]?.eventDate || 'Not set'}
          </p>
          {localData[0]?.sailors?.length === 0 && (
            <>
              <p style={{ fontSize: '13px', color: '#c53030' }}>
                <strong>Warning:</strong> Your data appears to be empty. 
                Click below to restore the 15 sailors and correct event date.
              </p>
              <button 
                onClick={restoreData}
                style={{ padding: '10px 20px', background: '#c53030', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
              >
                Restore 15 Sailors
              </button>
            </>
          )}
        </>
      )}
      
      {status === 'empty' && (
        <>
          <p style={{ fontSize: '13px', margin: '0 0 10px 0', color: '#c53030' }}>
            <strong>No data found in localStorage!</strong><br/>
            Your data may have been cleared. Click below to restore:
          </p>
          <button 
            onClick={restoreData}
            style={{ padding: '10px 20px', background: '#c53030', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Restore All Data
          </button>
        </>
      )}
    </div>
  )
}
