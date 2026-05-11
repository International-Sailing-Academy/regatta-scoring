export const REGATTA_EVENT_ID = process.env.REGATTA_EVENT_ID || 'mexican-midwinters-2027'
export const REGATTA_PRICE_CENTS = Number(process.env.REGATTA_PRICE_CENTS || 10000)
export const REGATTA_CURRENCY = process.env.REGATTA_CURRENCY || 'usd'
export const REGATTA_REGISTER_FALLBACK_URL = 'https://fareharbor.com/embeds/book/internationalsailingacademy/items/637672/availability/2080738754/book/?full-items=yes'

export const BOAT_CLASSES = ['ILCA 6', 'ILCA 7']
export const SCORING_CATEGORIES = ['Youth', '18-35', 'Apprentice Master', 'Master', 'Grand Master', 'Great Grand Master', 'Legend', 'Too Dusty to Remember']
export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const COMMON_COUNTRIES = ['Mexico', 'United States', 'Canada', 'Australia', 'New Zealand', 'Great Britain', 'Ireland', 'France', 'Germany', 'Greece', 'Netherlands', 'Brazil', 'Argentina', 'Chile', 'Peru', 'Guatemala', 'El Salvador']

export const ADD_ONS = {
  charterShort: { label: 'Charter Days (Less than 6)', unitAmount: 15000, max: 5 },
  charterExtended: { label: 'Charter Days (More than 5)', unitAmount: 13000, max: 100 },
  proKitRental: { label: 'Pro Kit Rental', unitAmount: 7500 },
  boatInsurance: { label: 'Boat Insurance', unitAmount: 8000 },
}

export function normalizeEmail(email = '') {
  return email.trim().toLowerCase()
}

function cleanPhoneDigits(value = '') {
  return String(value || '').replace(/[^0-9+]/g, '').trim()
}

function boundedInteger(value, min = 0, max = 100) {
  const parsed = Number(value || 0)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(min, Math.min(max, Math.floor(parsed)))
}

export function cleanRegistrationPayload(input = {}) {
  return {
    fullName: String(input.fullName || '').trim(),
    email: normalizeEmail(input.email),
    phone: cleanPhoneDigits(input.phone),
    whatsapp: cleanPhoneDigits(input.whatsapp || input.phone),
    country: String(input.country || '').trim(),
    sailNumber: String(input.sailNumber || '').trim().toUpperCase(),
    boatClass: String(input.boatClass || '').trim(),
    scoringCategory: String(input.scoringCategory || '').trim(),
    tshirtSize: String(input.tshirtSize || '').trim(),
    birthYear: input.birthYear ? Number(input.birthYear) : null,
    emergencyContactName: String(input.emergencyContactName || '').trim(),
    emergencyContactPhone: cleanPhoneDigits(input.emergencyContactPhone),
    medicalConditions: String(input.medicalConditions || '').trim(),
    charterDates: String(input.charterDates || '').trim(),
    charterDaysShort: boundedInteger(input.charterDaysShort, 0, ADD_ONS.charterShort.max),
    charterDaysExtended: boundedInteger(input.charterDaysExtended, 0, ADD_ONS.charterExtended.max),
    proKitRental: Boolean(input.proKitRental),
    boatInsurance: Boolean(input.boatInsurance),
    notes: String(input.notes || '').trim(),
    waiverAccepted: Boolean(input.waiverAccepted),
  }
}

export function validateRegistration(data) {
  const errors = []
  if (!data.fullName) errors.push('Full name is required')
  if (!/^\S+@\S+\.\S+$/.test(data.email)) errors.push('Valid email is required')
  if (!data.whatsapp || data.whatsapp.replace(/\D/g, '').length < 8) errors.push('WhatsApp number with country code is required')
  if (!data.country) errors.push('Country is required')
  if (!data.sailNumber) errors.push('Sail number is required')
  if (!BOAT_CLASSES.includes(data.boatClass)) errors.push('Rig / boat class is required')
  if (!SCORING_CATEGORIES.includes(data.scoringCategory)) errors.push('Scoring category is required')
  if (!TSHIRT_SIZES.includes(data.tshirtSize)) errors.push('T-shirt size is required')
  if (data.birthYear && (data.birthYear < 1920 || data.birthYear > new Date().getFullYear())) errors.push('Birth year looks invalid')
  if (!data.emergencyContactName) errors.push('Emergency contact name is required')
  if (!data.emergencyContactPhone || data.emergencyContactPhone.replace(/\D/g, '').length < 8) errors.push('Emergency contact phone is required')
  if (data.charterDaysShort > 0 && data.charterDaysExtended > 0) errors.push('Use either short charter days or extended charter days, not both')
  if ((data.charterDaysShort > 0 || data.charterDaysExtended > 0) && !data.charterDates) errors.push('Charter/facility dates are required when charter days are selected')
  if (!data.waiverAccepted) errors.push('Waiver acknowledgement is required')
  return errors
}

export function registrationAddOns(data) {
  const items = []
  if (data.charterDaysShort > 0) items.push({ key: 'charterDaysShort', label: ADD_ONS.charterShort.label, quantity: data.charterDaysShort, unitAmount: ADD_ONS.charterShort.unitAmount })
  if (data.charterDaysExtended > 0) items.push({ key: 'charterDaysExtended', label: ADD_ONS.charterExtended.label, quantity: data.charterDaysExtended, unitAmount: ADD_ONS.charterExtended.unitAmount })
  if (data.proKitRental) items.push({ key: 'proKitRental', label: ADD_ONS.proKitRental.label, quantity: 1, unitAmount: ADD_ONS.proKitRental.unitAmount })
  if (data.boatInsurance) items.push({ key: 'boatInsurance', label: ADD_ONS.boatInsurance.label, quantity: 1, unitAmount: ADD_ONS.boatInsurance.unitAmount })
  return items
}

export function registrationTotalCents(data) {
  return REGATTA_PRICE_CENTS + registrationAddOns(data).reduce((total, item) => total + item.quantity * item.unitAmount, 0)
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
    tshirtSize: registration.tshirt_size || registration.tshirtSize || '',
    registrationSource: 'Stripe',
    registrationId: registration.id,
    scores: {},
  }
}
