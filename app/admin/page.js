'use client'

import { useState, useEffect } from 'react'
import { 
  FLAGS, 
  createNewEvent, 
  getAllEventsSync, 
  saveEvent, 
  deleteEvent, 
  duplicateEvent,
  encodeRegatta,
  isSupabaseEnabled
} from '../lib/data'
import MigrationTool from '../components/MigrationTool'
import SyncDiagnostics from '../components/SyncDiagnostics'
import SimpleMigration from '../components/SimpleMigration'
import DataRecovery from '../components/DataRecovery'

const COUNTRIES = Object.keys(FLAGS).sort()
const BOAT_CLASSES = ['ILCA 7', 'ILCA 6', '4.7', '470', '49er', '49erFX', 'Nacra 17', 'Optimist', 'Snipe', 'Star']
const CATEGORIES = ['Open', 'Youth', 'Junior', 'Senior', 'Apprentice', 'Master', 'Grand Master', 'Great Grand Master', 'Legend']

export default function AdminPage() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [savedEvent, setSavedEvent] = useState(null) // Track last saved state
  const [activeTab, setActiveTab] = useState('event')
  const [shareUrl, setShareUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedScoreClass, setSelectedScoreClass] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, synced, error
  const [showMigrationTools, setShowMigrationTools] = useState(false)
  const supabaseEnabled = isSupabaseEnabled()

  // Computed values for scores tab
  const classRaces = selectedScoreClass 
    ? event?.races?.filter(r => r.raceClass === selectedScoreClass) || []
    : []
  const classSailors = selectedScoreClass
    ? event?.sailors?.filter(s => s.boatClass === selectedScoreClass) || []
    : []

  // Check for unsaved changes
  useEffect(() => {
    if (event && savedEvent) {
      const isDifferent = JSON.stringify(event) !== JSON.stringify(savedEvent)
      setHasUnsavedChanges(isDifferent)
    }
  }, [event, savedEvent])

  // Load events on mount
  useEffect(() => {
    const allEvents = getAllEventsSync()
    setEvents(allEvents)
    
    // Select first event if exists
    if (allEvents.length > 0) {
      setSelectedEventId(allEvents[0].id)
      setEvent(allEvents[0])
      setSavedEvent(allEvents[0])
    }
    
    setLoading(false)
  }, [])

  // Manual save function
  const handleSave = () => {
    if (event) {
      saveEvent(event)
      setSavedEvent({...event})
      setHasUnsavedChanges(false)
      setEvents(getAllEventsSync())
      alert('✅ Changes saved and synced to public page!')
    }
  }

  // Handle event selection
  const selectEvent = (id) => {
    const selected = events.find(e => e.id === id)
    if (selected) {
      setSelectedEventId(id)
      setEvent(selected)
      setShareUrl('') // Clear share URL
    }
  }

  // Create new event
  const handleCreateEvent = () => {
    const name = prompt('Enter regatta name:', 'New Regatta')
    if (name) {
      const newEvent = createNewEvent(name)
      saveEvent(newEvent)
      const allEvents = getAllEventsSync()
      setEvents(allEvents)
      setSelectedEventId(newEvent.id)
      setEvent(newEvent)
      setActiveTab('event')
    }
  }

  // Delete event
  const handleDeleteEvent = (id) => {
    if (confirm('Delete this regatta? This cannot be undone.')) {
      deleteEvent(id)
      const allEvents = getAllEventsSync()
      setEvents(allEvents)
      
      if (selectedEventId === id) {
        if (allEvents.length > 0) {
          setSelectedEventId(allEvents[0].id)
          setEvent(allEvents[0])
        } else {
          setSelectedEventId(null)
          setEvent(null)
        }
      }
    }
  }

  // Duplicate event
  const handleDuplicateEvent = (evt) => {
    const newEvent = duplicateEvent(evt)
    const allEvents = getAllEventsSync()
    setEvents(allEvents)
    setSelectedEventId(newEvent.id)
    setEvent(newEvent)
  }

  // Update event field
  const updateEventField = (field, value) => {
    setEvent(prev => ({ ...prev, [field]: value }))
  }

  // Add/remove class
  const addClass = (cls) => {
    if (cls && !event.classes.includes(cls)) {
      setEvent(prev => ({ ...prev, classes: [...prev.classes, cls] }))
    }
  }
  const removeClass = (cls) => {
    setEvent(prev => ({ ...prev, classes: prev.classes.filter(c => c !== cls) }))
  }

  // Sailor management
  const addSailor = (e) => {
    e.preventDefault()
    const form = e.target
    const newSailor = {
      id: Date.now().toString(),
      sailNumber: form.sailNumber.value,
      name: form.helmsman.value,
      crewName: form.crew.value || '',
      country: form.country.value,
      boatClass: form.boatClass.value,
      boatName: form.boatName.value || '',
      club: form.club.value || '',
      category: form.category.value || '',
      scores: {}
    }
    setEvent(prev => ({ 
      ...prev, 
      sailors: [...prev.sailors, newSailor] 
    }))
    form.reset()
  }

  const deleteSailor = (id) => {
    if (confirm('Delete this sailor?')) {
      setEvent(prev => ({ 
        ...prev, 
        sailors: prev.sailors.filter(s => s.id !== id) 
      }))
    }
  }

  const editSailor = (id, field, value) => {
    setEvent(prev => ({
      ...prev,
      sailors: prev.sailors.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
    }))
  }

  // Race management - now class-specific
  const addRace = (raceClass) => {
    // Count existing races for this class
    const classRaces = event.races.filter(r => r.raceClass === raceClass)
    const nextNumber = classRaces.length + 1
    
    const newRace = {
      id: `race_${Date.now()}`,
      number: nextNumber,
      raceClass: raceClass,  // Which class this race is for
      date: new Date().toISOString().split('T')[0]
    }
    setEvent(prev => ({ ...prev, races: [...prev.races, newRace] }))
  }

  const deleteRace = (raceId) => {
    if (confirm('Delete this race and all its scores?')) {
      const raceToDelete = event.races.find(r => r.id === raceId)
      setEvent(prev => ({
        ...prev,
        races: prev.races.filter(r => r.id !== raceId),
        sailors: prev.sailors.map(s => {
          const newScores = { ...s.scores }
          // Delete by race number since scores are stored by number
          if (raceToDelete) {
            delete newScores[raceToDelete.number]
          }
          return { ...s, scores: newScores }
        })
      }))
    }
  }

  // Score management
  const updateScore = (sailorId, raceNum, value) => {
    setEvent(prev => ({
      ...prev,
      sailors: prev.sailors.map(s => {
        if (s.id === sailorId) {
          return { 
            ...s, 
            scores: { 
              ...s.scores, 
              [raceNum]: value.trim() 
            } 
          }
        }
        return s
      })
    }))
  }

  // Bulk import sailors
  const bulkImportSailors = (csvText) => {
    const lines = csvText.trim().split('\n')
    const newSailors = lines.map((line, idx) => {
      const cols = line.split(/[,\t]/).map(s => s.trim())
      return {
        id: `import_${Date.now()}_${idx}`,
        sailNumber: cols[0] || '',
        name: cols[1] || '',
        country: cols[2] || 'URU',
        boatClass: cols[3] || event.classes[0] || 'ILCA 7',
        club: cols[4] || '',
        category: cols[5] || '',
        scores: {}
      }
    }).filter(s => s.sailNumber && s.name)
    
    setEvent(prev => ({
      ...prev,
      sailors: [...prev.sailors, ...newSailors]
    }))
  }

  // Calculate results
  const calculateResults = (sailors, races) => {
    const totalSailors = sailors.length
    
    return sailors.map(sailor => {
      const raceScores = races.map(r => {
        const score = sailor.scores?.[r.number]
        const parsed = parseScore(score, totalSailors)
        return {
          race: r.number,
          raw: parsed.value,
          display: parsed.display,
          isPenalty: parsed.isPenalty,
          isDropped: false
        }
      })

      const sorted = [...raceScores].sort((a, b) => b.raw - a.raw)
      const droppedRace = raceScores.length >= 2 ? sorted[0]?.race : null
      
      raceScores.forEach(rs => {
        if (rs.race === droppedRace) rs.isDropped = true
      })

      const total = raceScores.reduce((sum, r) => sum + r.raw, 0)
      const net = raceScores
        .filter(r => !r.isDropped)
        .reduce((sum, r) => sum + r.raw, 0)

      return { ...sailor, total, net, raceScores, droppedRace }
    }).sort((a, b) => a.net - b.net)
  }

  const parseScore = (score, totalSailors) => {
    const LETTER_SCORES = {
      'DNS': true, 'DNF': true, 'DSQ': true, 'OCS': true, 'BFD': true,
      'RET': true, 'UFD': true, 'NSC': true, 'DNC': true, 'DNE': true,
      'DGM': true, 'RDG': true
    }
    
    if (!score) {
      return { value: totalSailors + 1, display: 'DNC', isPenalty: true }
    }
    
    const upper = score.toUpperCase().trim()
    
    const penaltyMatch = upper.match(/^([A-Z]+)\s*\(?([0-9]+)\)?$/)
    if (penaltyMatch && LETTER_SCORES[penaltyMatch[1]]) {
      return {
        value: parseInt(penaltyMatch[2]),
        display: `${penaltyMatch[1]}(${penaltyMatch[2]})`,
        isPenalty: true
      }
    }
    
    if (LETTER_SCORES[upper]) {
      return {
        value: totalSailors + 1,
        display: upper,
        isPenalty: true
      }
    }
    
    const num = parseInt(score)
    if (!isNaN(num)) {
      return { value: num, display: num.toString(), isPenalty: false }
    }
    
    return { value: totalSailors + 1, display: 'DNC', isPenalty: true }
  }

  // Generate share link (for external sharing - includes full data)
  const generateShareLink = () => {
    const encoded = encodeRegatta(event)
    if (encoded) {
      const url = `${window.location.origin}/?event=${event.id}#${encoded}`
      setShareUrl(url)
      navigator.clipboard.writeText(url)
    }
  }
  
  // Generate simple link (for same-device use only)
  const generateSimpleLink = () => {
    const url = `${window.location.origin}/?event=${event.id}`
    setShareUrl(url)
    navigator.clipboard.writeText(url)
  }

  // Export/Import
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(event, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.eventName.replace(/\s+/g, '_')}.json`
    a.click()
  }

  const importJson = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        // Create as new event
        const newEvent = {
          ...data,
          id: Date.now().toString(),
          eventName: data.eventName + ' (Imported)',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toLocaleString()
        }
        saveEvent(newEvent)
        const allEvents = getAllEventsSync()
        setEvents(allEvents)
        setSelectedEventId(newEvent.id)
        setEvent(newEvent)
        alert('Event imported successfully!')
      } catch (err) {
        alert('Error importing: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (loading) return <div style={styles.loading}>Loading...</div>

  // No events - show create button
  if (events.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.noEvents}>
          <h1>⛵ Regatta Manager</h1>
          <p>No regattas yet. Create your first one!</p>
          <button onClick={handleCreateEvent} style={styles.btnPrimary}>
            Create New Regatta
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Data Recovery - Show if no sailors */}
      {event?.sailors?.length === 0 && <DataRecovery />}

      {/* Migration Tools Toggle */}
      {supabaseEnabled && (
        <div style={{ marginBottom: '15px' }}>
          <button 
            onClick={() => setShowMigrationTools(!showMigrationTools)}
            style={{
              padding: '8px 16px',
              background: showMigrationTools ? '#e2e8f0' : '#f7fafc',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#4a5568'
            }}
          >
            {showMigrationTools ? '▼ Hide Sync Tools' : '▶ Show Sync Tools'}
          </button>
          
          {showMigrationTools && (
            <div style={{ marginTop: '15px' }}>
              <MigrationTool />
              <SimpleMigration />
              <SyncDiagnostics />
            </div>
          )}
        </div>
      )}

      {/* Event Manager Header */}
      <div style={styles.eventManager}>
        <div style={styles.eventSelector}>
          <label style={styles.label}>Regatta:</label>
          <select 
            value={selectedEventId || ''} 
            onChange={(e) => selectEvent(e.target.value)}
            style={styles.eventSelect}
          >
            {events.map(evt => (
              <option key={evt.id} value={evt.id}>
                {evt.eventName} ({evt.sailors.length} entries)
              </option>
            ))}
          </select>
          
          <button onClick={handleCreateEvent} style={styles.btnSmall}>
            + New
          </button>
          
          {event && (
            <>
              <button onClick={() => handleDuplicateEvent(event)} style={styles.btnSmall}>
                Duplicate
              </button>
              <button onClick={() => handleDeleteEvent(event.id)} style={styles.btnDangerSmall}>
                Delete
              </button>
            </>
          )}
        </div>
        
        {event && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {hasUnsavedChanges && (
              <span style={{ 
                color: '#ed8936', 
                fontSize: '13px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                ● Unsaved Changes
              </span>
            )}
            {supabaseEnabled && (
              <span style={{ 
                color: '#48bb78', 
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }} title="Cloud sync enabled">
                ☁️ Cloud
              </span>
            )}
            <button 
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                background: hasUnsavedChanges ? '#ed8936' : '#38a169',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {hasUnsavedChanges ? '💾 Save & Sync' : '✓ Saved'}
            </button>
            <a href={`/?event=${event.id}`} target="_blank" style={styles.viewLink}>
              View Public Page →
            </a>
          </div>
        )}
      </div>

      {!event ? (
        <div style={styles.noEventSelected}>Select or create a regatta</div>
      ) : (
        <>
          {/* Navigation */}
          <nav style={styles.nav}>
            {[
              { id: 'event', label: 'Event Details' },
              { id: 'entries', label: `Entries (${event.sailors.length})` },
              { id: 'races', label: `Races (${event.races.filter(r => r.raceClass).length})` },
              { id: 'scores', label: 'Input Scores' },
              { id: 'results', label: 'Results' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.navTab,
                  ...(activeTab === tab.id ? styles.navTabActive : {})
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* EVENT DETAILS TAB */}
          {activeTab === 'event' && (
            <div style={styles.panel}>
              <h2>Event Details</h2>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label>Event Name *</label>
                  <input 
                    value={event.eventName}
                    onChange={(e) => updateEventField('eventName', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label>Organizer</label>
                  <input 
                    value={event.organizer}
                    onChange={(e) => updateEventField('organizer', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label>Venue</label>
                  <input 
                    value={event.venue}
                    onChange={(e) => updateEventField('venue', e.target.value)}
                    placeholder="e.g., Punta del Este, Uruguay"
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label>Start Date</label>
                  <input 
                    type="date"
                    value={event.eventDate}
                    onChange={(e) => updateEventField('eventDate', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label>End Date</label>
                  <input 
                    type="date"
                    value={event.eventEndDate}
                    onChange={(e) => updateEventField('eventEndDate', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  value={event.description}
                  onChange={(e) => updateEventField('description', e.target.value)}
                  rows={4}
                  style={styles.textarea}
                  placeholder="Enter event description..."
                />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label>Notice of Race URL</label>
                  <input 
                    value={event.noticeOfRace}
                    onChange={(e) => updateEventField('noticeOfRace', e.target.value)}
                    placeholder="https://..."
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label>Sailing Instructions URL</label>
                  <input 
                    value={event.sailingInstructions}
                    onChange={(e) => updateEventField('sailingInstructions', e.target.value)}
                    placeholder="https://..."
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={event.mastersScoringEnabled || false}
                    onChange={(e) => updateEventField('mastersScoringEnabled', e.target.checked)}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span>Enable NA ILCA Masters Scoring System</span>
                </label>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px', marginLeft: '30px' }}>
                  When enabled, handicaps are applied: Legend +0, GGM +1, GM +2, Master +3, Apprentice/Open +4
                </p>
              </div>

              <h3>Classes</h3>
              <div style={styles.classesBox}>
                {event.classes.map(cls => (
                  <span key={cls} style={styles.classTag}>
                    {cls}
                    <button onClick={() => removeClass(cls)} style={styles.classRemove}>×</button>
                  </span>
                ))}
              </div>
              <select 
                onChange={(e) => { addClass(e.target.value); e.target.value = '' }}
                style={{...styles.input, maxWidth: '200px'}}
              >
                <option value="">Add class...</option>
                {BOAT_CLASSES.filter(c => !event.classes.includes(c)).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* ENTRIES TAB */}
          {activeTab === 'entries' && (
            <div style={styles.panel}>
              <h2>Manage Entries</h2>
              
              <div style={styles.subSection}>
                <h3>Add Sailor</h3>
                <form onSubmit={addSailor} style={styles.formGrid}>
                  <input name="sailNumber" placeholder="Sail Number *" required style={styles.input} />
                  <input name="helmsman" placeholder="Helmsman Name *" required style={styles.input} />
                  <input name="crew" placeholder="Crew Name" style={styles.input} />
                  <select name="country" required style={styles.input}>
                    <option value="">Country *</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select name="boatClass" required style={styles.input}>
                    <option value="">Class *</option>
                    {event.classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input name="boatName" placeholder="Boat Name" style={styles.input} />
                  <input name="club" placeholder="Club" style={styles.input} />
                  <select name="category" style={styles.input}>
                    <option value="">Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="submit" style={styles.btnPrimary}>Add Sailor</button>
                </form>
              </div>

              <div style={styles.subSection}>
                <h3>Bulk Import (CSV Format)</h3>
                <p style={styles.help}>Format: SailNumber, Helmsman, Country, Class, Club, Category</p>
                <textarea 
                  id="bulkImport"
                  rows={5}
                  style={styles.textarea}
                  placeholder="168123, John Smith, USA, ILCA 7, Miami YC, Master&#10;168456, Jane Doe, GBR, ILCA 6, RYA, Youth"
                />
                <button 
                  onClick={() => {
                    const text = document.getElementById('bulkImport').value
                    bulkImportSailors(text)
                    document.getElementById('bulkImport').value = ''
                  }}
                  style={styles.btnSecondary}
                >
                  Import Sailors
                </button>
              </div>

              {/* Import from FareHarbor */}
              {event.eventName.toLowerCase().includes('mexican') && (
                <div style={{...styles.subSection, background: '#fffbeb', border: '2px solid #f6ad55'}}>
                  <h3>📥 Import from FareHarbor</h3>
                  <p style={styles.help}>
                    Import racers from ILCA Mexican Midwinter Regatta (March 19-21)<br/>
                    <strong>15 racers:</strong> Ksenia Mamontova, Elena Oetling, Greg Jackson, Bill Pagels, 
                    Roy Lamphier, Angela de Leo, Alec Bostan, Luis Barrios, Bruce Martinson, Don Hahl, 
                    Russel Krause, Mark/Rachel Kortbeek, Robert Hodson, Walt Spevak
                  </p>
                  
                  {/* Check if already imported */}
                  {(() => {
                    const importNames = ['Ksenia Mamontova', 'Elena Oetling Ramirez', 'Greg Jackson', 'Bill Pagels', 
                      'Roy L Lamphier', 'Angela de Leo', 'Alec Bostan', 'Luis E Barrios', 'Bruce Martinson', 
                      'Don Hahl', 'Russel Krause', 'Mark Kortbeek', 'Rachel Kortbeek', 'Robert Hodson', 'Walt Spevak']
                    const existingNames = event.sailors.map(s => s.name.toLowerCase())
                    const alreadyImported = importNames.filter(n => existingNames.includes(n.toLowerCase()))
                    const alreadyImportedCount = alreadyImported.length
                    
                    if (alreadyImportedCount > 0) {
                      return (
                        <div style={{marginBottom: '15px', padding: '10px', background: '#fed7d7', borderRadius: '4px'}}>
                          <strong>⚠️ {alreadyImportedCount} racers already imported:</strong> {alreadyImported.join(', ')}
                        </div>
                      )
                    }
                    return null
                  })()}
                  
                  <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                    <button 
                      onClick={() => {
                        const racers = [
                          { sailNumber: 'TBD', name: 'Ksenia Mamontova', country: 'RUS', boatClass: 'ILCA 6', category: 'Apprentice Master' },
                          { sailNumber: 'TBD', name: 'Elena Oetling Ramirez', country: 'MEX', boatClass: 'ILCA 6', category: '18-35' },
                          { sailNumber: 'TBD', name: 'Greg Jackson', country: 'USA', boatClass: 'ILCA 7', category: 'Legend' },
                          { sailNumber: 'TBD', name: 'Bill Pagels', country: 'USA', boatClass: 'ILCA 6', category: 'Legend' },
                          { sailNumber: 'TBD', name: 'Roy L Lamphier', country: 'USA', boatClass: 'ILCA 6', category: 'Grand Master' },
                          { sailNumber: 'TBD', name: 'Angela de Leo', country: 'MEX', boatClass: 'ILCA 6', category: 'Youth' },
                          { sailNumber: 'TBD', name: 'Alec Bostan', country: 'CAN', boatClass: 'ILCA 6', category: 'Youth' },
                          { sailNumber: 'TBD', name: 'Luis E Barrios', country: 'MEX', boatClass: 'ILCA 6', category: 'Great Grand Master' },
                          { sailNumber: 'TBD', name: 'Bruce Martinson', country: 'USA', boatClass: 'ILCA 6', category: 'Great Grand Master' },
                          { sailNumber: 'TBD', name: 'Don Hahl', country: 'USA', boatClass: 'ILCA 7', category: 'Legend' },
                          { sailNumber: 'TBD', name: 'Russel Krause', country: 'CAN', boatClass: 'ILCA 7', category: 'Grand Master' },
                          { sailNumber: 'TBD', name: 'Mark Kortbeek', country: 'CAN', boatClass: 'ILCA 7', category: 'Grand Master' },
                          { sailNumber: 'TBD', name: 'Rachel Kortbeek', country: 'CAN', boatClass: 'ILCA 6', category: '18-35' },
                          { sailNumber: 'TBD', name: 'Robert Hodson', country: 'USA', boatClass: 'ILCA 6', category: 'Great Grand Master' },
                          { sailNumber: 'TBD', name: 'Walt Spevak', country: 'USA', boatClass: 'ILCA 6', category: 'Great Grand Master' }
                        ]
                        
                        // Filter out duplicates by name
                        const existingNames = event.sailors.map(s => s.name.toLowerCase())
                        const newRacers = racers.filter(r => !existingNames.includes(r.name.toLowerCase()))
                        
                        if (newRacers.length === 0) {
                          alert('All 15 racers are already imported!')
                          return
                        }
                        
                        const newSailors = newRacers.map((r, idx) => ({
                          id: `fh_${Date.now()}_${idx}`,
                          sailNumber: r.sailNumber,
                          name: r.name,
                          crewName: '',
                          country: r.country,
                          boatClass: r.boatClass,
                          boatName: '',
                          club: '',
                          category: r.category,
                          scores: {}
                        }))
                        
                        setEvent(prev => ({
                          ...prev,
                          sailors: [...prev.sailors, ...newSailors]
                        }))
                        
                        if (newRacers.length < racers.length) {
                          alert(`✅ Imported ${newRacers.length} new racers! (${racers.length - newRacers.length} were already imported)`)
                        } else {
                          alert(`✅ Imported ${newSailors.length} racers from FareHarbor!`)
                        }
                      }}
                      style={{...styles.btnPrimary, background: '#ed8936'}}
                    >
                      Import Racers (Skip Duplicates)
                    </button>
                    
                    <button 
                      onClick={() => {
                        if (confirm('Remove all imported FareHarbor racers?')) {
                          const importNames = ['Ksenia Mamontova', 'Elena Oetling Ramirez', 'Greg Jackson', 'Bill Pagels', 
                            'Roy L Lamphier', 'Angela de Leo', 'Alec Bostan', 'Luis E Barrios', 'Bruce Martinson', 
                            'Don Hahl', 'Russel Krause', 'Mark Kortbeek', 'Rachel Kortbeek', 'Robert Hodson', 'Walt Spevak']
                          const importNamesLower = importNames.map(n => n.toLowerCase())
                          
                          setEvent(prev => ({
                            ...prev,
                            sailors: prev.sailors.filter(s => !importNamesLower.includes(s.name.toLowerCase()))
                          }))
                          
                          alert('🗑️ Removed all imported FareHarbor racers')
                        }
                      }}
                      style={styles.btnDanger}
                    >
                      Clear All Imports
                    </button>
                    
                    <button 
                      onClick={() => {
                        const beforeCount = event.sailors.length
                        const seen = new Set()
                        const unique = event.sailors.filter(s => {
                          const key = s.name.toLowerCase()
                          if (seen.has(key)) return false
                          seen.add(key)
                          return true
                        })
                        
                        if (unique.length < beforeCount) {
                          setEvent(prev => ({ ...prev, sailors: unique }))
                          alert(`🗑️ Removed ${beforeCount - unique.length} duplicate(s)`)
                        } else {
                          alert('No duplicates found!')
                        }
                      }}
                      style={{...styles.btnSecondary, background: '#805ad5'}}
                    >
                      Remove Duplicates
                    </button>
                  </div>
                </div>
              )}

              <h3>Registered Sailors ({event.sailors.length})</h3>
              {event.sailors.length === 0 ? (
                <p style={styles.empty}>No sailors registered yet.</p>
              ) : (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>Sail</th>
                        <th>Helmsman</th>
                        <th>Crew</th>
                        <th>Country</th>
                        <th>Class</th>
                        <th>Club</th>
                        <th>Category</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.sailors.map(s => (
                        <tr key={s.id}>
                          <td>
                            <input 
                              value={s.sailNumber}
                              onChange={(e) => editSailor(s.id, 'sailNumber', e.target.value)}
                              style={styles.smallInput}
                            />
                          </td>
                          <td>
                            <input 
                              value={s.name}
                              onChange={(e) => editSailor(s.id, 'name', e.target.value)}
                              style={styles.smallInput}
                            />
                          </td>
                          <td>
                            <input 
                              value={s.crewName || ''}
                              onChange={(e) => editSailor(s.id, 'crewName', e.target.value)}
                              style={styles.smallInput}
                            />
                          </td>
                          <td>
                            <select 
                              value={s.country}
                              onChange={(e) => editSailor(s.id, 'country', e.target.value)}
                              style={styles.smallInput}
                            >
                              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td>
                            <select 
                              value={s.boatClass}
                              onChange={(e) => editSailor(s.id, 'boatClass', e.target.value)}
                              style={styles.smallInput}
                            >
                              {event.classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td>
                            <input 
                              value={s.club || ''}
                              onChange={(e) => editSailor(s.id, 'club', e.target.value)}
                              style={styles.smallInput}
                            />
                          </td>
                          <td>
                            <select 
                              value={s.category || ''}
                              onChange={(e) => editSailor(s.id, 'category', e.target.value)}
                              style={styles.smallInput}
                            >
                              <option value="">-</option>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td>
                            <button onClick={() => deleteSailor(s.id)} style={styles.btnDanger}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* RACES TAB */}
          {activeTab === 'races' && (
            <div style={styles.panel}>
              <h2>Manage Races by Class</h2>
              <p style={styles.help}>Races are separate for each class. Add races for each fleet independently.</p>
              
              {/* Debug info */}
              <div style={{marginBottom: '15px', padding: '10px', background: '#edf2f7', borderRadius: '4px', fontSize: '13px'}}>
                <strong>Total Races: {event.races.length}</strong> | 
                ILCA 7: {event.races.filter(r => r.raceClass === 'ILCA 7').length} | 
                ILCA 6: {event.races.filter(r => r.raceClass === 'ILCA 6').length}
                {event.races.filter(r => !r.raceClass).length > 0 && (
                  <span style={{color: '#e53e3e'}}> | Unassigned: {event.races.filter(r => !r.raceClass).length}</span>
                )}
                {event.races.filter(r => !r.raceClass).length > 0 && (
                  <button 
                    onClick={() => {
                      if (confirm('Delete unassigned races?')) {
                        setEvent(prev => ({
                          ...prev,
                          races: prev.races.filter(r => r.raceClass)
                        }))
                      }
                    }}
                    style={{marginLeft: '10px', padding: '4px 8px', fontSize: '12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    Clean Up Unassigned
                  </button>
                )}
              </div>
              
              {event.classes.map(cls => {
                const classRaces = event.races.filter(r => r.raceClass === cls)
                
                return (
                  <div key={cls} style={{...styles.subSection, marginBottom: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                      <h3 style={{margin: 0}}>{cls} ({classRaces.length} races)</h3>
                      <button 
                        onClick={() => addRace(cls)} 
                        style={{...styles.btnPrimary, padding: '8px 16px', fontSize: '13px'}}
                      >
                        + Add Race {classRaces.length + 1}
                      </button>
                    </div>
                    
                    {classRaces.length === 0 ? (
                      <p style={{...styles.empty, padding: '15px'}}>No races for {cls} yet.</p>
                    ) : (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        {classRaces.map(r => (
                          <div key={r.id} style={styles.raceCard}>
                            <div>
                              <strong>Race {r.number}</strong>
                              <input 
                                type="date"
                                value={r.date}
                                onChange={(e) => {
                                  setEvent(prev => ({
                                    ...prev,
                                    races: prev.races.map(race => 
                                      race.id === r.id 
                                        ? { ...race, date: e.target.value }
                                        : race
                                    )
                                  }))
                                }}
                                style={{...styles.smallInput, marginLeft: '15px'}}
                              />
                            </div>
                            <button onClick={() => deleteRace(r.id)} style={styles.btnDanger}>
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* SCORES TAB */}
          {activeTab === 'scores' && (
            <div style={styles.panel}>
              <h2>Input Scores by Class</h2>
              <p style={styles.help}>
                Select a class to input scores for that fleet only.<br/>
                Enter: position number (1, 2, 3...) or penalty codes (DNS, DNF, BFD, DNC, DSQ, OCS, RET)
              </p>
              
              {/* Class Selector */}
              <div style={{marginBottom: '20px'}}>
                <label style={{...styles.label, marginRight: '10px'}}>Select Class:</label>
                <select 
                  value={selectedScoreClass || ''}
                  onChange={(e) => setSelectedScoreClass(e.target.value)}
                  style={{...styles.input, maxWidth: '200px', display: 'inline-block'}}
                >
                  <option value="">-- Choose Class --</option>
                  {event.classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              
              {!selectedScoreClass ? (
                <p style={styles.empty}>Please select a class above to input scores.</p>
              ) : classRaces.length === 0 ? (
                <p style={styles.empty}>No races for {selectedScoreClass} yet. Add races in the Races tab.</p>
              ) : classSailors.length === 0 ? (
                <p style={styles.empty}>No sailors in {selectedScoreClass} yet. Add sailors in the Entries tab.</p>
              ) : (
                <div style={styles.scoresContainer}>
                  {classRaces.map(race => (
                    <div key={race.id} style={styles.raceScores}>
                      <h3>{selectedScoreClass} - Race {race.number}</h3>
                      {classSailors.map(sailor => (
                        <div key={sailor.id} style={styles.scoreRow}>
                          <span style={styles.sailorInfo}>
                            {FLAGS[sailor.country]} {sailor.sailNumber} — {sailor.name}
                          </span>
                          <input
                            type="text"
                            value={sailor.scores[race.number] || ''}
                            onChange={(e) => updateScore(sailor.id, race.number, e.target.value)}
                            style={styles.scoreInput}
                            placeholder="-"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && (
            <div style={styles.panel}>
              <h2>Results Preview</h2>
              <p style={styles.help}>
                Preview how results will appear to the public. Results are calculated separately for each class using only that class's races.
                Dropped races (worst score) are shown in <span style={styles.dropped}>(parentheses)</span>.
              </p>
              
              {event.races.length === 0 ? (
                <p style={styles.empty}>No races to display. Add races in the Races tab.</p>
              ) : event.sailors.length === 0 ? (
                <p style={styles.empty}>No sailors registered. Add entries in the Entries tab.</p>
              ) : (
                <>
                  {event.classes.map(cls => {
                    const classSailors = event.sailors.filter(s => s.boatClass === cls)
                    const classRaces = event.races.filter(r => r.raceClass === cls)
                    
                    if (classSailors.length === 0) return null
                    
                    const classResults = calculateResults(classSailors, classRaces)
                    
                    return (
                      <div key={cls} style={styles.resultsSection}>
                        <h3 style={styles.classTitle}>{cls} ({classRaces.length} races)</h3>
                        {classRaces.length === 0 ? (
                          <p style={styles.empty}>No races added for {cls} yet.</p>
                        ) : (
                          <div style={styles.tableContainer}>
                            <table style={styles.table}>
                              <thead>
                                <tr style={styles.tableHeader}>
                                  <th style={styles.th}>Rank</th>
                                  <th style={styles.th}>Sail</th>
                                  <th style={styles.th}>Helmsman / Crew</th>
                                  <th style={styles.th}>Club</th>
                                  <th style={styles.th}>Cat</th>
                                  <th style={{...styles.th, ...styles.pointsCol}}>Net</th>
                                  <th style={{...styles.th, ...styles.pointsCol}}>Total</th>
                                  {classRaces.map(r => (
                                    <th key={r.id} style={{...styles.th, ...styles.raceCol}}>
                                      R{r.number}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {classResults.map((r, i) => (
                                  <tr key={r.id} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                    <td style={styles.td}><strong>{i + 1}</strong></td>
                                    <td style={styles.td}>
                                      {FLAGS[r.country] || '🏳️'} {r.sailNumber}
                                    </td>
                                    <td style={styles.td}>
                                      <div>{r.name}</div>
                                      {r.crewName && <div style={styles.crewName}>{r.crewName}</div>}
                                    </td>
                                    <td style={styles.td}>{r.club || '-'}</td>
                                    <td style={styles.td}>{r.category || '-'}</td>
                                    <td style={{...styles.td, ...styles.pointsCol, ...styles.netPoints}}>
                                      {r.net}
                                    </td>
                                    <td style={{...styles.td, ...styles.pointsCol}}>{r.total}</td>
                                    {r.raceScores.map(rs => (
                                      <td key={rs.race} style={{...styles.td, ...styles.raceCol}}>
                                        {rs.isDropped ? (
                                          <span style={styles.dropped}>({rs.display})</span>
                                        ) : (
                                          rs.display
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div style={styles.legend}>
                    <span style={styles.dropped}>(X)</span> = Dropped race (worst score discarded)
                    <span style={{marginLeft: '20px'}}>DNC = Did Not Compete, DNS = Did Not Start, DNF = Did Not Finish, BFD = Black Flag, etc.</span>
                  </div>
                </>
              )}
            </div>
          )}


        </>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px'
  },
  noEvents: {
    textAlign: 'center',
    padding: '100px 20px'
  },
  eventManager: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    background: '#1a365d',
    color: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  eventSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  label: {
    fontWeight: 'bold'
  },
  eventSelect: {
    padding: '8px 15px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '14px',
    minWidth: '250px'
  },
  btnSmall: {
    padding: '6px 12px',
    background: '#4a5568',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  btnDangerSmall: {
    padding: '6px 12px',
    background: '#e53e3e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  viewLink: {
    padding: '8px 16px',
    background: '#38a169',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px'
  },
  noEventSelected: {
    textAlign: 'center',
    padding: '60px',
    color: '#718096'
  },
  nav: {
    display: 'flex',
    gap: '5px',
    marginBottom: '20px',
    borderBottom: '2px solid #e2e8f0',
    flexWrap: 'wrap'
  },
  navTab: {
    padding: '12px 20px',
    background: '#e2e8f0',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: '6px 6px 0 0',
    fontSize: '14px'
  },
  navTabActive: {
    background: '#2b6cb0',
    color: 'white'
  },
  panel: {
    background: '#f7fafc',
    padding: '30px',
    borderRadius: '8px'
  },
  btnPrimary: {
    padding: '12px 24px',
    background: '#2b6cb0',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  btnSecondary: {
    padding: '10px 20px',
    background: '#718096',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  input: {
    padding: '10px',
    border: '1px solid #cbd5e0',
    borderRadius: '4px',
    fontSize: '14px'
  },
  smallInput: {
    padding: '6px',
    border: '1px solid #cbd5e0',
    borderRadius: '4px',
    fontSize: '13px',
    width: '100%'
  },
  textarea: {
    padding: '10px',
    border: '1px solid #cbd5e0',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  classesBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '15px'
  },
  classTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    background: '#ebf8ff',
    color: '#2b6cb0',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500'
  },
  classRemove: {
    background: 'none',
    border: 'none',
    color: '#e53e3e',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0 2px'
  },
  subSection: {
    marginBottom: '30px',
    padding: '20px',
    background: 'white',
    borderRadius: '8px'
  },
  help: {
    color: '#718096',
    fontSize: '13px',
    marginBottom: '15px'
  },
  empty: {
    color: '#718096',
    textAlign: 'center',
    padding: '40px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  raceList: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  raceCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    background: 'white',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  },
  scoresContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  raceScores: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px'
  },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  sailorInfo: {
    fontSize: '14px'
  },
  scoreInput: {
    width: '80px',
    padding: '8px',
    border: '1px solid #cbd5e0',
    borderRadius: '4px',
    textAlign: 'center'
  },
  resultsSection: {
    marginBottom: '40px',
    padding: '20px',
    background: 'white',
    borderRadius: '8px'
  },
  classTitle: {
    color: '#1a365d',
    fontSize: '18px',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e2e8f0'
  },
  tableHeader: {
    background: '#2d3748',
    color: 'white'
  },
  th: {
    padding: '10px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '13px'
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '13px'
  },
  evenRow: {
    background: '#f7fafc'
  },
  oddRow: {
    background: 'white'
  },
  pointsCol: {
    textAlign: 'center',
    fontWeight: 'bold'
  },
  netPoints: {
    color: '#2b6cb0',
    fontSize: '15px'
  },
  raceCol: {
    textAlign: 'center',
    minWidth: '45px'
  },
  dropped: {
    color: '#a0aec0',
    fontStyle: 'italic'
  },
  crewName: {
    color: '#718096',
    fontSize: '12px'
  },
  legend: {
    marginTop: '20px',
    padding: '15px',
    background: '#f7fafc',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#4a5568'
  },
  shareSection: {
    marginBottom: '30px',
    padding: '20px',
    background: 'white',
    borderRadius: '8px'
  },
  shareBox: {
    marginTop: '15px',
    padding: '15px',
    background: '#f0fff4',
    borderRadius: '6px'
  },
  urlInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #cbd5e0',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '10px'
  },
  success: {
    color: '#38a169',
    fontWeight: 'bold'
  },
  link: {
    color: '#2b6cb0'
  },
  fileInput: {
    padding: '10px'
  },
  btnDanger: {
    padding: '6px 12px',
    background: '#e53e3e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  }
}
