'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SimpleMigration() {
  const [status, setStatus] = useState('idle')
  const [log, setLog] = useState([])

  const addLog = (msg) => {
    setLog(prev => [...prev, msg])
    console.log(msg)
  }

  const handleMigrate = async () => {
    setStatus('migrating')
    setLog([])

    try {
      // Get data from localStorage directly
      const saved = localStorage.getItem('regatta-events')
      if (!saved) {
        addLog('❌ No localStorage data found')
        setStatus('error')
        return
      }

      const events = JSON.parse(saved)
      addLog(`📦 Found ${events.length} events in localStorage`)

      for (const evt of events) {
        addLog(`🔄 Migrating: ${evt.eventName} (${evt.id})`)
        
        // Clean up the data
        const cleanEvent = {
          id: evt.id,
          eventName: evt.eventName || 'Untitled',
          eventDate: evt.eventDate || null,
          eventEndDate: evt.eventEndDate || null,
          venue: evt.venue || null,
          organizer: evt.organizer || 'International Sailing Academy',
          description: evt.description || null,
          noticeOfRace: evt.noticeOfRace || null,
          sailingInstructions: evt.sailingInstructions || null,
          classes: evt.classes || ['ILCA 7', 'ILCA 6'],
          sailors: evt.sailors || [],
          races: evt.races || [],
          mastersScoringEnabled: evt.mastersScoringEnabled || false,
          createdAt: evt.createdAt || new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }

        // Try insert (not upsert)
        const { data, error } = await supabase
          .from('events')
          .insert(cleanEvent)
          .select()

        if (error) {
          // If already exists, try update
          if (error.code === '23505') {
            addLog(`  ⚠️ Already exists, updating...`)
            const { error: updateError } = await supabase
              .from('events')
              .update(cleanEvent)
              .eq('id', evt.id)
            
            if (updateError) {
              addLog(`  ❌ Update failed: ${updateError.message}`)
            } else {
              addLog(`  ✅ Updated`)
            }
          } else {
            addLog(`  ❌ Error: ${error.message} (code: ${error.code})`)
          }
        } else {
          addLog(`  ✅ Inserted successfully`)
        }
      }

      addLog(`✅ Migration complete!`)
      setStatus('done')
    } catch (err) {
      addLog(`❌ Exception: ${err.message}`)
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div style={{ background: '#c6f6d5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <strong>✅ Done!</strong>
        <pre style={{ fontSize: '11px', marginTop: '10px', maxHeight: '200px', overflow: 'auto' }}>
          {log.join('\n')}
        </pre>
      </div>
    )
  }

  return (
    <div style={{ background: '#faf089', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
      <h4 style={{ margin: '0 0 10px 0' }}>🔧 Manual Migration Tool</h4>
      <p style={{ fontSize: '13px', margin: '0 0 10px 0' }}>
        If the regular migration doesn&apos;t work, try this debug version.
      </p>
      <button 
        onClick={handleMigrate}
        disabled={status === 'migrating'}
        style={{ padding: '8px 16px', background: '#d69e2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        {status === 'migrating' ? 'Running...' : 'Run Debug Migration'}
      </button>
      {log.length > 0 && (
        <pre style={{ fontSize: '11px', marginTop: '10px', maxHeight: '150px', overflow: 'auto', background: 'rgba(0,0,0,0.1)', padding: '10px' }}>
          {log.join('\n')}
        </pre>
      )}
    </div>
  )
}
