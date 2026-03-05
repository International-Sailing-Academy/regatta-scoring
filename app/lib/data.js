// Data utilities - supports both Supabase (cross-device sync) and localStorage (fallback)
import { supabase, isSupabaseEnabled } from './supabase'

// Re-export for components
export { isSupabaseEnabled }

// Generate unique ID for events
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Create a new empty event
export const createNewEvent = (name = 'New Regatta') => ({
  id: generateId(),
  eventName: name,
  eventDate: '',
  eventEndDate: '',
  venue: '',
  organizer: 'International Sailing Academy',
  description: '',
  noticeOfRace: '',
  sailingInstructions: '',
  classes: ['ILCA 7', 'ILCA 6'],
  sailors: [],
  races: [],
  mastersScoringEnabled: false,
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toLocaleString()
})

// Field name mapping: lowercase PostgreSQL -> camelCase JavaScript
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

// Convert Supabase row (lowercase fields) to JavaScript object (camelCase)
const fromSupabaseRow = (row) => {
  if (!row) return null
  const result = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = FIELD_MAP[key] || key
    result[camelKey] = value
  }
  return result
}

// Convert JavaScript object to Supabase row
const toSupabaseRow = (event) => {
  const result = {}
  for (const [key, value] of Object.entries(event)) {
    // Convert camelCase to lowercase for PostgreSQL
    const lowerKey = key.toLowerCase()
    result[lowerKey] = value
  }
  return result
}

// ============== SUPABASE FUNCTIONS ==============

const getAllEventsSupabase = async () => {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('createdat', { ascending: false })
    
    if (error) throw error
    // Convert lowercase fields to camelCase
    return data?.map(fromSupabaseRow) || []
  } catch (e) {
    console.error('Supabase error:', e)
    return null
  }
}

const saveEventSupabase = async (event) => {
  if (!supabase) return null
  try {
    const row = toSupabaseRow({
      ...event,
      lastUpdated: new Date().toISOString()
    })
    
    const { data, error } = await supabase
      .from('events')
      .upsert(row, { onConflict: 'id' })
      .select()
    
    if (error) throw error
    return data?.[0] ? fromSupabaseRow(data[0]) : event
  } catch (e) {
    console.error('Supabase save error:', e)
    return null
  }
}

const deleteEventSupabase = async (id) => {
  if (!supabase) return null
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (e) {
    console.error('Supabase delete error:', e)
    return null
  }
}

// ============== LOCALSTORAGE FUNCTIONS ==============

const getAllEventsLocal = () => {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem('regatta-events')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {}
  return []
}

const saveAllEventsLocal = (events) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('regatta-events', JSON.stringify(events))
}

// ============== UNIFIED API ==============

// Check if we should use Supabase
const useSupabase = () => isSupabaseEnabled()

// Get all events - tries Supabase first, falls back to localStorage
export const getAllEvents = async () => {
  if (useSupabase()) {
    const data = await getAllEventsSupabase()
    if (data !== null) return data
  }
  return getAllEventsLocal()
}

// Get all events synchronously (for components that need immediate data)
export const getAllEventsSync = () => {
  return getAllEventsLocal()
}

// Save/update a specific event
export const saveEvent = async (event) => {
  const eventToSave = {
    ...event,
    lastUpdated: new Date().toLocaleString()
  }
  
  // Always save to localStorage as backup
  const events = getAllEventsLocal()
  const index = events.findIndex(e => e.id === event.id)
  
  if (index >= 0) {
    events[index] = eventToSave
  } else {
    events.push(eventToSave)
  }
  saveAllEventsLocal(events)
  
  // Also save to Supabase if available
  if (useSupabase()) {
    await saveEventSupabase(eventToSave)
  }
  
  return eventToSave
}

// Get a specific event by ID
export const getEventById = (id) => {
  const events = getAllEventsLocal()
  return events.find(e => e.id === id) || null
}

// Delete an event
export const deleteEvent = async (id) => {
  // Delete from localStorage
  const events = getAllEventsLocal()
  const filtered = events.filter(e => e.id !== id)
  saveAllEventsLocal(filtered)
  
  // Delete from Supabase if available
  if (useSupabase()) {
    await deleteEventSupabase(id)
  }
}

// Duplicate an event
export const duplicateEvent = (event) => {
  const newEvent = {
    ...event,
    id: generateId(),
    eventName: `${event.eventName} (Copy)`,
    sailors: event.sailors.map(s => ({ ...s, id: generateId(), scores: {} })),
    races: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toLocaleString()
  }
  saveEvent(newEvent)
  return newEvent
}

// Subscribe to real-time changes (Supabase only)
export const subscribeToEvents = (callback) => {
  if (!supabase) return null
  
  const subscription = supabase
    .channel('events-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'events' },
      (payload) => {
        // Convert payload data
        const converted = {
          ...payload,
          new: fromSupabaseRow(payload.new),
          old: fromSupabaseRow(payload.old)
        }
        callback(converted)
      }
    )
    .subscribe()
  
  return subscription
}

// ============== URL ENCODING (for sharing) ==============

export const encodeRegatta = (data) => {
  try {
    const json = JSON.stringify(data)
    const compressed = btoa(json)
    return compressed
  } catch (e) {
    return null
  }
}

export const decodeRegatta = (encoded) => {
  try {
    const json = atob(encoded)
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

// ============== CONSTANTS ==============

export const LETTER_SCORES = {
  'DNS': 'DNS',
  'DNF': 'DNF', 
  'DSQ': 'DSQ',
  'OCS': 'OCS',
  'BFD': 'BFD',
  'RET': 'RET',
  'UFD': 'UFD',
  'NSC': 'NSC',
  'DNC': 'DNC',
  'DNE': 'DNE',
  'DGM': 'DGM',
  'RDG': 'RDG'
}

// Country flags mapping
export const FLAGS = {
  'POR': '🇵🇹',
  'GBR': '🇬🇧',
  'NOR': '🇳🇴',
  'ITA': '🇮🇹',
  'GER': '🇩🇪',
  'TUR': '🇹🇷',
  'GRE': '🇬🇷',
  'SWE': '🇸🇪',
  'USA': '🇺🇸',
  'BRA': '🇧🇷',
  'ARG': '🇦🇷',
  'CHI': '🇨🇱',
  'URU': '🇺🇾',
  'FRA': '🇫🇷',
  'ESP': '🇪🇸',
  'NED': '🇳🇱',
  'DEN': '🇩🇰',
  'FIN': '🇫🇮',
  'AUS': '🇦🇺',
  'NZL': '🇳🇿',
  'JPN': '🇯🇵',
  'CHN': '🇨🇳',
  'CAN': '🇨🇦',
  'MEX': '🇲🇽',
  'RSA': '🇿🇦',
  'CYP': '🇨🇾',
  'CRO': '🇭🇷',
  'SLO': '🇸🇮',
  'POL': '🇵🇱',
  'CZE': '🇨🇿',
  'AUT': '🇦🇹',
  'SUI': '🇨🇭',
  'BEL': '🇧🇪',
  'HUN': '🇭🇺',
  'ISR': '🇮🇱',
  'THA': '🇹🇭',
  'SIN': '🇸🇬',
  'MAS': '🇲🇾',
  'KOR': '🇰🇷',
  'HKG': '🇭🇰',
  'IND': '🇮🇳',
  'PAK': '🇵🇰',
  'EGY': '🇪🇬',
  'TUN': '🇹🇳',
  'MAR': '🇲🇦',
  'COL': '🇨🇴',
  'PER': '🇵🇪',
  'ECU': '🇪🇨',
  'VEN': '🇻🇪',
  'PAN': '🇵🇦',
  'GUA': '🇬🇹',
  'ESA': '🇸🇻',
  'HON': '🇭🇳',
  'NCA': '🇳🇮',
  'CRC': '🇨🇷',
  'BIZ': '🇧🇿',
  'JAM': '🇯🇲',
  'TTO': '🇹🇹',
  'BAR': '🇧🇧',
  'SVG': '🇻🇨',
  'GRN': '🇬🇩',
  'LCA': '🇱🇨',
  'DMA': '🇩🇲',
  'ANT': '🇦🇬',
  'SKN': '🇰🇳',
  'ISV': '🇻🇮',
  'PUR': '🇵🇷',
  'CUB': '🇨🇺',
  'DOM': '🇩🇴',
  'HAI': '🇭🇹',
  'BER': '🇧🇲',
  'CAY': '🇰🇾',
  'TCA': '🇹🇨',
  'BAH': '🇧🇸',
  'IVB': '🇻🇬',
  'RUS': '○'
}
