'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getAllEventsSync, isSupabaseEnabled } from '../lib/data'

export default function SyncDiagnostics() {
  const [diagnostics, setDiagnostics] = useState({
    supabaseConfigured: false,
    supabaseConnected: false,
    tableExists: false,
    canInsert: false,
    localEvents: 0,
    cloudEvents: 0,
    error: null,
    checking: true
  })

  useEffect(() => {
    async function runDiagnostics() {
      const results = {
        supabaseConfigured: isSupabaseEnabled(),
        supabaseConnected: false,
        tableExists: false,
        canInsert: false,
        localEvents: 0,
        cloudEvents: 0,
        error: null,
        checking: true
      }

      // Check localStorage
      const localEvents = getAllEventsSync()
      results.localEvents = localEvents.length

      // Check Supabase connection and table
      if (results.supabaseConfigured && supabase) {
        try {
          // Try to query the events table
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .limit(10)
          
          if (error) {
            results.error = error.message + ' (code: ' + error.code + ')'
          } else {
            results.supabaseConnected = true
            results.tableExists = true
            results.cloudEvents = data?.length || 0
            
            // Try a test insert to verify write permissions
            const testId = 'test-' + Date.now()
            const { error: insertError } = await supabase
              .from('events')
              .insert({
                id: testId,
                eventName: 'Test Event',
                createdAt: new Date().toISOString()
              })
            
            if (!insertError) {
              results.canInsert = true
              // Clean up test record
              await supabase.from('events').delete().eq('id', testId)
            } else {
              results.error = 'Cannot write: ' + insertError.message
            }
          }
        } catch (err) {
          results.error = err.message
        }
      }

      results.checking = false
      setDiagnostics(results)
    }

    runDiagnostics()
  }, [])

  const getStatusColor = () => {
    if (diagnostics.checking) return '#90cdf4'
    if (diagnostics.error) return '#fed7d7'
    if (diagnostics.canInsert) return '#c6f6d5'
    return '#fefcbf'
  }

  const getTextColor = () => {
    if (diagnostics.checking) return '#2c5282'
    if (diagnostics.error) return '#c53030'
    if (diagnostics.canInsert) return '#22543d'
    return '#744210'
  }

  return (
    <div style={{ 
      background: getStatusColor(), 
      color: getTextColor(),
      padding: '15px 20px', 
      borderRadius: '8px',
      marginBottom: '20px',
      fontSize: '14px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>🔍 Sync Diagnostics</h3>
      
      {diagnostics.checking ? (
        <p>Checking configuration...</p>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          <div><strong>Supabase Configured:</strong> {diagnostics.supabaseConfigured ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Supabase Connected:</strong> {diagnostics.supabaseConnected ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Table Exists:</strong> {diagnostics.tableExists ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Can Write:</strong> {diagnostics.canInsert ? '✅ Yes' : '❌ No'}</div>
          
          <div><strong>Local Events:</strong> {diagnostics.localEvents}</div>
          <div><strong>Cloud Events:</strong> {diagnostics.cloudEvents}</div>
          
          {diagnostics.error && (
            <div style={{ 
              background: 'rgba(0,0,0,0.1)', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              marginTop: '5px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              <strong>Error:</strong> {diagnostics.error}
            </div>
          )}
          
          {diagnostics.canInsert && diagnostics.cloudEvents === 0 && diagnostics.localEvents > 0 && (
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
              ⚠️ Ready to migrate! Click &quot;Migrate to Cloud&quot; above.
            </div>
          )}
          
          {diagnostics.cloudEvents > 0 && (
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
              ✅ Cloud has {diagnostics.cloudEvents} events.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
