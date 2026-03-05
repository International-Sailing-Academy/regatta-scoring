'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getAllEventsSync, isSupabaseEnabled } from '../lib/data'

export default function SyncDiagnostics() {
  const [diagnostics, setDiagnostics] = useState({
    supabaseConfigured: false,
    supabaseConnected: false,
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
        localEvents: 0,
        cloudEvents: 0,
        error: null,
        checking: true
      }

      // Check localStorage
      const localEvents = getAllEventsSync()
      results.localEvents = localEvents.length

      // Check Supabase connection
      if (results.supabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .limit(10)
          
          if (error) {
            results.error = error.message
          } else {
            results.supabaseConnected = true
            results.cloudEvents = data?.length || 0
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
    if (diagnostics.supabaseConnected && diagnostics.cloudEvents > 0) return '#c6f6d5'
    return '#fefcbf'
  }

  const getTextColor = () => {
    if (diagnostics.checking) return '#2c5282'
    if (diagnostics.error) return '#c53030'
    if (diagnostics.supabaseConnected && diagnostics.cloudEvents > 0) return '#22543d'
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
          <div>
            <strong>Supabase Configured:</strong> {diagnostics.supabaseConfigured ? '✅ Yes' : '❌ No'}
            {!diagnostics.supabaseConfigured && (
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                Environment variables not set. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.
              </div>
            )}
          </div>
          
          <div>
            <strong>Supabase Connected:</strong> {diagnostics.supabaseConnected ? '✅ Yes' : '❌ No'}
            {diagnostics.supabaseConfigured && !diagnostics.supabaseConnected && (
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                Cannot connect to Supabase. Check your URL and key are correct.
              </div>
            )}
          </div>
          
          <div><strong>Local Events:</strong> {diagnostics.localEvents}</div>
          <div><strong>Cloud Events:</strong> {diagnostics.cloudEvents}</div>
          
          {diagnostics.error && (
            <div style={{ 
              background: 'rgba(0,0,0,0.1)', 
              padding: '10px', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              marginTop: '5px'
            }}>
              Error: {diagnostics.error}
            </div>
          )}
          
          {diagnostics.supabaseConnected && diagnostics.cloudEvents === 0 && diagnostics.localEvents > 0 && (
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
              ⚠️ You have {diagnostics.localEvents} local events but 0 in the cloud. 
              Click &quot;Migrate to Cloud&quot; above to sync them.
            </div>
          )}
          
          {diagnostics.supabaseConnected && diagnostics.cloudEvents > 0 && (
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
              ✅ Cloud sync is working! {diagnostics.cloudEvents} events in cloud.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
