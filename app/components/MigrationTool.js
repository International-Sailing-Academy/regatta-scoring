'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getAllEventsSync } from '../lib/data'

export default function MigrationTool() {
  const [status, setStatus] = useState('idle') // idle, migrating, done, error
  const [message, setMessage] = useState('')

  const handleMigrate = async () => {
    if (!supabase) {
      setStatus('error')
      setMessage('Supabase not configured. Check environment variables.')
      return
    }

    setStatus('migrating')
    setMessage('Migrating data to cloud...')

    try {
      const events = getAllEventsSync()
      
      if (events.length === 0) {
        setStatus('error')
        setMessage('No local data found. Make sure you have events created.')
        return
      }

      let successCount = 0
      
      for (const event of events) {
        const { error } = await supabase
          .from('events')
          .upsert(event, { onConflict: 'id' })
        
        if (error) {
          console.error('Migration error:', error)
        } else {
          successCount++
        }
      }

      setStatus('done')
      setMessage(`Successfully migrated ${successCount} of ${events.length} events to the cloud!`)
    } catch (err) {
      setStatus('error')
      setMessage('Migration failed: ' + err.message)
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
        <button 
          onClick={() => setStatus('idle')}
          style={{
            marginLeft: '15px',
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
