export const REGATTA_EVENT_ID = process.env.REGATTA_EVENT_ID || 'mexican-midwinters-2027'
export const REGATTA_PRICE_CENTS = Number(process.env.REGATTA_PRICE_CENTS || 10000)
export const REGATTA_CURRENCY = process.env.REGATTA_CURRENCY || 'usd'
export const REGATTA_REGISTER_FALLBACK_URL = 'https://fareharbor.com/embeds/book/internationalsailingacademy/items/637672/availability/2080738754/book/?full-items=yes'

export const BOAT_CLASSES = ['ILCA 4', 'ILCA 6', 'ILCA 7']
export const SCORING_CATEGORIES = ['Open', 'Youth', 'Apprentice', 'Master', 'Grand Master', 'Great Grand Master', 'Legend']

export function normalizeEmail(email = '') {
  return email.trim().toLowerCase()
}

export function cleanRegistrationPayload(input = {}) {
  return {
    fullName: String(input.fullName || '').trim(),
    email: normalizeEmail(input.email),
    phone: String(input.phone || '').trim(),
    country: String(input.country || '').trim(),
    sailNumber: String(input.sailNumber || '').trim(),
    boatClass: String(input.boatClass || '').trim(),
    scoringCategory: String(input.scoringCategory || '').trim(),
    birthYear: input.birthYear ? Number(input.birthYear) : null,
    emergencyContactName: String(input.emergencyContactName || '').trim(),
    emergencyContactPhone: String(input.emergencyContactPhone || '').trim(),
    notes: String(input.notes || '').trim(),
    waiverAccepted: Boolean(input.waiverAccepted),
  }
}

export function validateRegistration(data) {
  const errors = []
  if (!data.fullName) errors.push('Full name is required')
  if (!/^\S+@\S+\.\S+$/.test(data.email)) errors.push('Valid email is required')
  if (!BOAT_CLASSES.includes(data.boatClass)) errors.push('Boat class is required')
  if (!SCORING_CATEGORIES.includes(data.scoringCategory)) errors.push('Scoring category is required')
  if (data.birthYear && (data.birthYear < 1920 || data.birthYear > new Date().getFullYear())) errors.push('Birth year looks invalid')
  if (!data.waiverAccepted) errors.push('Waiver acknowledgement is required')
  return errors
}

export function registrationToSailor(registration) {
  const name = registration.full_name || registration.fullName
  const boatClass = registration.boat_class || registration.boatClass
  const category = registration.scoring_category || registration.scoringCategory
  return {
    id: registration.sailor_id || `stripe-${registration.id}`,
    name,
    boatClass,
    category,
    country: registration.country || '',
    sailNumber: registration.sail_number || '',
    phone: registration.phone || '',
    email: registration.email || '',
    scores: {},
  }
}
