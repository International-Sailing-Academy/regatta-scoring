// Data utilities - Supabase only (no localStorage fallback)
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
  eventStartTime: '12:00',
  eventEndDate: '',
  venue: '',
  organizer: 'International Sailing Academy',
  description: '',
  noticeOfRace: '',
  sailingInstructions: '',
  classes: ['ILCA 7', 'ILCA 6'],
  sailors: [],
  races: [],
  documents: [],
  mastersScoringEnabled: false,
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toLocaleString()
})

// Field name mapping: lowercase PostgreSQL -> camelCase JavaScript
const FIELD_MAP = {
  id: 'id',
  eventname: 'eventName',
  eventdate: 'eventDate',
  eventstarttime: 'eventStartTime',
  eventenddate: 'eventEndDate',
  venue: 'venue',
  organizer: 'organizer',
  description: 'description',
  noticeofrace: 'noticeOfRace',
  sailinginstructions: 'sailingInstructions',
  classes: 'classes',
  sailors: 'sailors',
  races: 'races',
  documents: 'documents',
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
    const lowerKey = key.toLowerCase()
    result[lowerKey] = value
  }
  return result
}

// ============== SUPABASE FUNCTIONS ONLY ==============

export const getAllEvents = async () => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('createdat', { ascending: false })
  
  if (error) throw error
  return data?.map(fromSupabaseRow) || []
}

export const getEventById = async (id) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return fromSupabaseRow(data)
}

export const saveEvent = async (event) => {
  if (!supabase) throw new Error('Supabase not configured')
  
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
}

export const deleteEvent = async (id) => {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Duplicate an event
export const duplicateEvent = async (event) => {
  const newEvent = {
    ...event,
    id: generateId(),
    eventName: `${event.eventName} (Copy)`,
    sailors: event.sailors.map(s => ({ ...s, id: generateId(), scores: {} })),
    races: [],
    documents: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toLocaleString()
  }
  return saveEvent(newEvent)
}

// Subscribe to real-time changes
export const subscribeToEvents = (callback) => {
  if (!supabase) return null
  
  const subscription = supabase
    .channel('events-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'events' },
      (payload) => {
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

export const encodeRegatta = (event) => {
  try {
    const jsonStr = JSON.stringify(event)
    return btoa(jsonStr)
  } catch (e) {
    console.error('Encode error:', e)
    return null
  }
}

export const decodeRegatta = (encoded) => {
  try {
    const jsonStr = atob(encoded)
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('Decode error:', e)
    return null
  }
}

// ============== FLAGS ==============

export const FLAGS = {
  'Afghanistan': '🇦🇫',
  'Albania': '🇦🇱',
  'Algeria': '🇩🇿',
  'Andorra': '🇦🇩',
  'Angola': '🇦🇴',
  'Argentina': '🇦🇷',
  'Armenia': '🇦🇲',
  'Australia': '🇦🇺',
  'Austria': '🇦🇹',
  'Azerbaijan': '🇦🇿',
  'Bahamas': '🇧🇸',
  'Bahrain': '🇧🇭',
  'Bangladesh': '🇧🇩',
  'Barbados': '🇧🇧',
  'Belarus': '🇧🇾',
  'Belgium': '🇧🇪',
  'Belize': '🇧🇿',
  'Benin': '🇧🇯',
  'Bhutan': '🇧🇹',
  'Bolivia': '🇧🇴',
  'Bosnia and Herzegovina': '🇧🇦',
  'Botswana': '🇧🇼',
  'Brazil': '🇧🇷',
  'Bulgaria': '🇧🇬',
  'Burkina Faso': '🇧🇫',
  'Burundi': '🇧🇮',
  'Cambodia': '🇰🇭',
  'Cameroon': '🇨🇲',
  'Canada': '🇨🇦',
  'Chile': '🇨🇱',
  'China': '🇨🇳',
  'Colombia': '🇨🇴',
  'Costa Rica': '🇨🇷',
  'Croatia': '🇭🇷',
  'Cuba': '🇨🇺',
  'Cyprus': '🇨🇾',
  'Czech Republic': '🇨🇿',
  'Denmark': '🇩🇰',
  'Dominican Republic': '🇩🇴',
  'Ecuador': '🇪🇨',
  'Egypt': '🇪🇬',
  'El Salvador': '🇸🇻',
  'Estonia': '🇪🇪',
  'Ethiopia': '🇪🇹',
  'Fiji': '🇫🇯',
  'Finland': '🇫🇮',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'Ghana': '🇬🇭',
  'Greece': '🇬🇷',
  'Guatemala': '🇬🇹',
  'Honduras': '🇭🇳',
  'Hong Kong': '🇭🇰',
  'Hungary': '🇭🇺',
  'Iceland': '🇮🇸',
  'India': '🇮🇳',
  'Indonesia': '🇮🇩',
  'Iran': '🇮🇷',
  'Iraq': '🇮🇶',
  'Ireland': '🇮🇪',
  'Israel': '🇮🇱',
  'Italy': '🇮🇹',
  'Jamaica': '🇯🇲',
  'Japan': '🇯🇵',
  'Jordan': '🇯🇴',
  'Kazakhstan': '🇰🇿',
  'Kenya': '🇰🇪',
  'Kuwait': '🇰🇼',
  'Latvia': '🇱🇻',
  'Lebanon': '🇱🇧',
  'Libya': '🇱🇾',
  'Lithuania': '🇱🇹',
  'Luxembourg': '🇱🇺',
  'Malaysia': '🇲🇾',
  'Maldives': '🇲🇻',
  'Malta': '🇲🇹',
  'Mexico': '🇲🇽',
  'Monaco': '🇲🇨',
  'Mongolia': '🇲🇳',
  'Montenegro': '🇲🇪',
  'Morocco': '🇲🇦',
  'Namibia': '🇳🇦',
  'Nepal': '🇳🇵',
  'Netherlands': '🇳🇱',
  'New Zealand': '🇳🇿',
  'Nicaragua': '🇳🇮',
  'Nigeria': '🇳🇬',
  'North Korea': '🇰🇵',
  'North Macedonia': '🇲🇰',
  'Norway': '🇳🇴',
  'Oman': '🇴🇲',
  'Pakistan': '🇵🇰',
  'Panama': '🇵🇦',
  'Paraguay': '🇵🇾',
  'Peru': '🇵🇪',
  'Philippines': '🇵🇭',
  'Poland': '🇵🇱',
  'Portugal': '🇵🇹',
  'Qatar': '🇶🇦',
  'Romania': '🇷🇴',
  'Russia': '🇷🇺',
  'Saudi Arabia': '🇸🇦',
  'Senegal': '🇸🇳',
  'Serbia': '🇷🇸',
  'Singapore': '🇸🇬',
  'Slovakia': '🇸🇰',
  'Slovenia': '🇸🇮',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  'Spain': '🇪🇸',
  'Sri Lanka': '🇱🇰',
  'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭',
  'Syria': '🇸🇾',
  'Taiwan': '🇹🇼',
  'Tajikistan': '🇹🇯',
  'Thailand': '🇹🇭',
  'Tunisia': '🇹🇳',
  'Turkey': '🇹🇷',
  'Turkmenistan': '🇹🇲',
  'Ukraine': '🇺🇦',
  'UAE': '🇦🇪',
  'United Arab Emirates': '🇦🇪',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Uruguay': '🇺🇾',
  'Uzbekistan': '🇺🇿',
  'Venezuela': '🇻🇪',
  'Vietnam': '🇻🇳',
  'Yemen': '🇾🇪',
  'Zimbabwe': '🇿🇼'
}
