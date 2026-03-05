'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getAllEventsSync } from '../lib/data'

export default function MigrationTool() {
  const [status, setStatus] = useState('idle') // idle, migrating, done, error
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState('')

  const handleMigrate = async () => {
    if (!supabase) {
      setStatus('error')
      setMessage('Supabase not configured. Check environment variables.')
      return
    }

    setStatus('migrating')
    setMessage('Migrating data to cloud...')
    setDetails('')

    try {
      const events = getAllEventsSync()
      console.log('Local events to migrate:', events)
      
      if (events.length === 0) {
        setStatus('error')
        setMessage('No local data found. Make sure you have events created.')
        return
      }

      let successCount = 0
      let errorDetails = []
      
      for (const event of events) {
        console.log('Migrating event:', event.id, event.eventName)
        
        // Ensure all required fields are present
        const eventToSave = {
          id: event.id,
          eventName: event.eventName || 'Untitled',
          eventDate: event.eventDate || '',
          eventEndDate: event.eventEndDate || '',
          venue: event.venue || '',
          organizer: event.organizer || '',
          description: event.description || '',
          noticeOfRace: event.noticeOfRace || '',
          sailingInstructions: event.sailingInstructions || '',
          classes: event.classes || ['ILCA 7', 'ILCA 6'],
          sailors: event.sailors || [],
          races: event.races || [],
          mastersScoringEnabled: event.mastersScoringEnabled || false,
          createdAt: event.createdAt || new Date().toISOString(),
          lastUpdated: new Date().toLocaleString()
        }
        
        const { data, error } = await supabase
          .from('events')
          .upsert(eventToSave, { onConflict: 'id' })
          .select()
        
        if (error) {
          console.error('Migration error for', event.id, ':', error)
          errorDetails.push(`${event.eventName}: ${error.message}`)
        } else {
          console.log('Successfully migrated:', data)
          successCount++
        }
      }

      if (errorDetails.length > 0) {
        setStatus('error')
        setMessage(`Migration partially failed. ${successCount} of ${events.length} succeeded.`)
        setDetails(errorDetails.join('\n'))
      } else {
        setStatus('done')
        setMessage(`Successfully migrated ${successCount} of ${events.length} events to the cloud!`)
      }
    } catch (err) {
      console.error('Migration exception:', err)
      setStatus('error')
      setMessage('Migration failed: ' + err.message)
      setDetails(err.stack || '')
    }
  }

  if (status === 'done') {
    return (
      <div style={{ 
        background: '#c6f6d5', 
        color: '#22543d', 
        padding: '15px 20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <strong>✓ Success!</strong> {message}
        <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
          Your phone should now show the same data. Try refreshing on your phone!
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ 
        background: '#fed7d7', 
        color: '#c53030', 
        padding: '15px 20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <strong>✗ Error:</strong> {message}
        {details && (
          <pre style={{ 
            background: 'rgba(0,0,0,0.1)', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '11px',
            marginTop: '10px',
            overflow: 'auto',
            maxHeight: '150px'
          }}>
            {details}
          </pre>
        )}
        <button 
          onClick={() => setStatus('idle')}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            background: '#c53030',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div style={{ 
      background: '#ebf8ff', 
      border: '1px solid #90cdf4',
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#2c5282' }}>☁️ Cloud Sync Setup</h3>
      <p style={{ margin: '0 0 15px 0', color: '#4a5568', fontSize: '14px' }}>
        Your phone is showing different data because it&apos;s using local storage. 
        Click below to migrate your data to the cloud for cross-device sync.
      </p>
      <button
        onClick={handleMigrate}
        disabled={status === 'migrating'}
        style={{
          padding: '10px 20px',
          background: status === 'migrating' ? '#a0aec0' : '#3182ce',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: status === 'migrating' ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        {status === 'migrating' ? '↻ Migrating...' : 'Migrate to Cloud'}
      </button>
    </div>
  )
}
