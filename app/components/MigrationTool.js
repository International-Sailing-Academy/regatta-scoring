'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getAllEventsSync, saveEvent } from '../lib/data'

// Field mapping for Supabase
const FIELD_MAP = {
  id: 'id',
  eventname: 'eventName',
  eventdate: 'eventDate',
  eventenddate: 'eventEndDate',
  venue: 'venue',
  organizer: 'organizer',
  description: 'description',
  noticeofrace: 'noticeOfRace',
  sailinginstructions: 'sailingInstructions',
  classes: 'classes',
  sailors: 'sailors',
  races: 'races',
  mastersscoringenabled: 'mastersScoringEnabled',
  createdat: 'createdAt',
  lastupdated: 'lastUpdated'
}

const fromSupabaseRow = (row) => {
  if (!row) return null
  const result = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = FIELD_MAP[key] || key
    result[camelKey] = value
  }
  return result
}

const toSupabaseRow = (event) => {
  const result = {}
  for (const [key, value] of Object.entries(event)) {
    result[key.toLowerCase()] = value
  }
  return result
}

export default function MigrationTool() {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleMigrate = async () => {
    if (!supabase) {
      setStatus('error')
      setMessage('Supabase not configured.')
      return
    }

    setStatus('migrating')
    setMessage('Checking for data...')

    try {
      // First check localStorage
      let events = getAllEventsSync()
      let source = 'localStorage'
      
      // If no local data, try to fetch from Supabase first
      if (events.length === 0) {
        setMessage('No local data. Fetching from Supabase...')
        const { data, error } = await supabase.from('events').select('*')
        if (!error && data && data.length > 0) {
          // Convert and save to localStorage
          events = data.map(fromSupabaseRow)
          for (const evt of events) {
            saveEvent(evt)
          }
          setStatus('done')
          setMessage(`Synced ${events.length} events from cloud to this device.`)
          window.location.reload()
          return
        }
      }
      
      if (events.length === 0) {
        setStatus('error')
        setMessage('No data found anywhere. Please create an event first.')
        return
      }

      // Migrate local data to Supabase
      setMessage(`Migrating ${events.length} events to cloud...`)
      let successCount = 0
      
      for (const evt of events) {
        const row = toSupabaseRow({
          ...evt,
          lastUpdated: new Date().toISOString()
        })
        
        const { error } = await supabase
          .from('events')
          .upsert(row, { onConflict: 'id' })
        
        if (!error) successCount++
      }

      setStatus('done')
      setMessage(`Successfully synced ${successCount} of ${events.length} events!`)
    } catch (err) {
      setStatus('error')
      setMessage('Error: ' + err.message)
    }
  }

  if (status === 'done') {
    return (
      <div style={{ background: '#c6f6d5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <strong>✓ {message}</strong>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
          Refresh the page to see the updated data.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ background: '#fed7d7', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <strong>✗ {message}</strong>
        <button 
          onClick={() => setStatus('idle')}
          style={{ marginLeft: '15px', padding: '5px 10px', background: '#c53030', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: '#ebf8ff', border: '1px solid #90cdf4', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#2c5282' }}>☁️ Cloud Sync</h3>
      <p style={{ margin: '0 0 15px 0', color: '#4a5568', fontSize: '14px' }}>
        Sync data between devices via Supabase cloud.
      </p>
      <button
        onClick={handleMigrate}
        disabled={status === 'migrating'}
        style={{ padding: '10px 20px', background: status === 'migrating' ? '#a0aec0' : '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        {status === 'migrating' ? message : 'Sync with Cloud'}
      </button>
    </div>
  )
}
