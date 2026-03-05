'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getAllEventsSync, isSupabaseEnabled } from '../lib/data'

export default function SyncDiagnostics() {
  const [diagnostics, setDiagnostics] = useState({
    supabaseConfigured: false,
    supabaseConnected: false,
    tableExists: false,
    canWrite: false,
    localEvents: 0,
    localSailors: 0,
    cloudEvents: 0,
    cloudSailors: 0,
    error: null,
    checking: true
  })

  useEffect(() => {
    async function runDiagnostics() {
      const results = {
        supabaseConfigured: isSupabaseEnabled(),
        supabaseConnected: false,
        tableExists: false,
        canWrite: false,
        localEvents: 0,
        localSailors: 0,
        cloudEvents: 0,
        cloudSailors: 0,
        error: null,
        checking: true
      }

      // Check localStorage
      const localEvents = getAllEventsSync()
      results.localEvents = localEvents.length
      results.localSailors = localEvents[0]?.sailors?.length || 0

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
            results.cloudSailors = data?.[0]?.sailors?.length || 0
            
            // Try a test insert to verify write permissions - use snake_case
            const testId = 'test-' + Date.now()
            const { error: insertError } = await supabase
              .from('events')
              .insert({
                id: testId,
                eventname: 'Test Event',
                createdat: new Date().toISOString()
              })
            
            if (!insertError) {
              results.canWrite = true
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
    if (diagnostics.canWrite) return '#c6f6d5'
    return '#fefcbf'
  }

  const getTextColor = () => {
    if (diagnostics.checking) return '#2c5282'
    if (diagnostics.error) return '#c53030'
    if (diagnostics.canWrite) return '#22543d'
    return '#744210'
  }

  // Compact view if everything is working
  if (!diagnostics.checking && diagnostics.canWrite && diagnostics.cloudEvents > 0 && diagnostics.cloudSailors > 0) {
    return (
      <div style={{ 
        background: '#c6f6d5', 
        color: '#22543d',
        padding: '10px 15px', 
        borderRadius: '6px',
        marginBottom: '15px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span>☁️</span>
        <span><strong>Cloud sync active</strong> — {diagnostics.cloudSailors} sailors synced</span>
      </div>
    )
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
        <div style={{ display: 'grid', gap: '6px' }}>
          <div><strong>Supabase:</strong> {diagnostics.supabaseConfigured ? '✅ Configured' : '❌ Not configured'} | {diagnostics.supabaseConnected ? '✅ Connected' : '❌ Not connected'}</div>
          <div><strong>Table:</strong> {diagnostics.tableExists ? '✅ Exists' : '❌ Missing'} | <strong>Write:</strong> {diagnostics.canWrite ? '✅ Yes' : '❌ No'}</div>
          
          <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <strong>Local:</strong> {diagnostics.localEvents} events, {diagnostics.localSailors} sailors<br/>
            <strong>Cloud:</strong> {diagnostics.cloudEvents} events, {diagnostics.cloudSailors} sailors
          </div>
          
          {diagnostics.error && (
            <div style={{ 
              background: 'rgba(0,0,0,0.1)', 
              padding: '8px 10px', 
              borderRadius: '4px',
              fontSize: '12px',
              marginTop: '5px'
            }}>
              {diagnostics.error}
            </div>
          )}
          
          {diagnostics.canWrite && diagnostics.cloudSailors === 0 && diagnostics.localSailors > 0 && (
            <div style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '13px' }}>
              ⚠️ Ready to migrate {diagnostics.localSailors} sailors to cloud
            </div>
          )}
        </div>
      )}
    </div>
  )
}
