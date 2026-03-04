// Data utilities for encoding/decoding regatta data in URLs
// This allows shareable links without a backend

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
  classes: ['ILCA 7', 'Radial'],
  sailors: [],
  races: [],
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toLocaleString()
})

// Get all events from localStorage
export const getAllEvents = () => {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem('regatta-events')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {}
  return []
}

// Save all events to localStorage
export const saveAllEvents = (events) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('regatta-events', JSON.stringify(events))
}

// Get a specific event by ID
export const getEventById = (id) => {
  const events = getAllEvents()
  return events.find(e => e.id === id) || null
}

// Save/update a specific event
export const saveEvent = (event) => {
  const events = getAllEvents()
  const index = events.findIndex(e => e.id === event.id)
  
  const eventToSave = {
    ...event,
    lastUpdated: new Date().toLocaleString()
  }
  
  if (index >= 0) {
    events[index] = eventToSave
  } else {
    events.push(eventToSave)
  }
  
  saveAllEvents(events)
  return eventToSave
}

// Delete an event
export const deleteEvent = (id) => {
  const events = getAllEvents()
  const filtered = events.filter(e => e.id !== id)
  saveAllEvents(filtered)
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

// Country flags mapping (simplified using emoji flags)
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
  'IVB': '🇻🇬'
}
