// Data utilities - supports both Supabase (cross-device sync) and localStorage (fallback)
import { supabase, isSupabaseEnabled as checkSupabase } from './supabase'

// Re-export for components
export { checkSupabase as isSupabaseEnabled }

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

// ============== SUPABASE FUNCTIONS ==============

// Deep convert camelCase to snake_case for PostgreSQL
const toSnakeCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }
  if (obj && typeof obj === 'object') {
    const result = {}
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      result[snakeKey] = toSnakeCase(value)
    }
    return result
  }
  return obj
}

// Deep convert snake_case to camelCase for JavaScript
const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  }
  if (obj && typeof obj === 'object') {
    const result = {}
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = toCamelCase(value)
    }
    return result
  }
  return obj
}

const getAllEventsSupabase = async () => {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('createdat', { ascending: false })
    
    if (error) throw error
    // Convert snake_case back to camelCase
    return data?.map(toCamelCase) || []
  } catch (e) {
    console.error('Supabase error:', e)
    return null
  }
}

const saveEventSupabase = async (event) => {
  if (!supabase) return null
  try {
    const eventToSave = toSnakeCase({
      ...event,
      lastUpdated: new Date().toISOString()
    })
    
    const { data, error } = await supabase
      .from('events')
      .upsert(eventToSave, { onConflict: 'id' })
      .select()
    
    if (error) throw error
    return data?.[0] ? toCamelCase(data[0]) : event
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
const useSupabase = () => checkSupabase()

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
        callback(payload)
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
