export const REGATTA_EVENT_ID = process.env.REGATTA_EVENT_ID || 'mexican-midwinters-2027'
export const REGATTA_PRICE_CENTS = Number(process.env.REGATTA_PRICE_CENTS || 10000)
export const REGATTA_CURRENCY = process.env.REGATTA_CURRENCY || 'usd'
export const REGATTA_REGISTER_FALLBACK_URL = 'https://fareharbor.com/embeds/book/internationalsailingacademy/items/637672/availability/2080738754/book/?full-items=yes'

export const BOAT_CLASSES = ['ILCA 6', 'ILCA 7']
export const SCORING_CATEGORIES = ['Open', 'Youth', '18-35', 'Apprentice Master', 'Master', 'Grand Master', 'Great Grand Master', 'Legend', 'Too Dusty to Remember']
export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const COMMON_COUNTRIES = ['Mexico', 'United States', 'Canada', 'Australia', 'New Zealand', 'Great Britain', 'Ireland', 'France', 'Germany', 'Greece', 'Netherlands', 'Brazil', 'Argentina', 'Chile', 'Peru', 'Guatemala', 'El Salvador']

export const ADD_ONS = {
  charterShort: { label: 'Charter Days (Less than 6)', unitAmount: 15000, max: 5 },
  charterExtended: { label: 'Charter Days (More than 5)', unitAmount: 13000, max: 100 },
  proKitRental: { label: 'Pro Kit Rental', unitAmount: 7500 },
  boatInsurance: { label: 'Boat Insurance', unitAmount: 8000 },
  sailBattenRental: { label: 'Sail + Batten Rental', unitAmount: 15000 },
}

export function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase()
}

function cleanPhoneDigits(value = '') {
  return String(value || '').replace(/[^0-9+]/g, '').trim()
}

function boundedInteger(value, min = 0, max = 100) {
  const parsed = Number(value || 0)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(min, Math.min(max, Math.floor(parsed)))
}

export function emptySailor() {
  return {
    fullName: '',
    country: '',
    sailNumber: '',
    boatClass: 'ILCA 6',
    scoringCategory: '',
    tshirtSize: '',
    birthYear: '',
    medicalConditions: '',
    charterDates: '',
    charterDaysShort: 0,
    charterDaysExtended: 0,
    proKitRental: false,
    boatInsurance: false,
    sailBattenRental: false,
    notes: '',
  }
}

export function cleanSailorPayload(input = {}) {
  return {
    fullName: String(input.fullName || '').trim(),
    country: String(input.country || '').trim(),
    sailNumber: String(input.sailNumber || '').trim().toUpperCase(),
    boatClass: String(input.boatClass || '').trim(),
    scoringCategory: String(input.scoringCategory || '').trim(),
    tshirtSize: String(input.tshirtSize || '').trim(),
    birthYear: input.birthYear ? Number(input.birthYear) : null,
    medicalConditions: String(input.medicalConditions || '').trim(),
    charterDates: String(input.charterDates || '').trim(),
    charterDaysShort: boundedInteger(input.charterDaysShort, 0, ADD_ONS.charterShort.max),
    charterDaysExtended: boundedInteger(input.charterDaysExtended, 0, ADD_ONS.charterExtended.max),
    proKitRental: Boolean(input.proKitRental),
    boatInsurance: Boolean(input.boatInsurance),
    sailBattenRental: Boolean(input.sailBattenRental),
    notes: String(input.notes || '').trim(),
  }
}

export function cleanRegistrationPayload(input = {}) {
  const purchaser = {
    fullName: String(input.purchaser?.fullName || input.purchaserName || input.fullName || '').trim(),
    email: normalizeEmail(input.purchaser?.email || input.purchaserEmail || input.email),
    phone: cleanPhoneDigits(input.purchaser?.phone || input.purchaserPhone || input.phone),
    whatsapp: cleanPhoneDigits(input.purchaser?.whatsapp || input.whatsapp || input.phone),
    emergencyContactName: String(input.purchaser?.emergencyContactName || input.emergencyContactName || '').trim(),
    emergencyContactPhone: cleanPhoneDigits(input.purchaser?.emergencyContactPhone || input.emergencyContactPhone),
  }

  const rawSailors = Array.isArray(input.sailors) && input.sailors.length ? input.sailors : [input]
  return {
    purchaser,
    sailors: rawSailors.slice(0, 20).map(cleanSailorPayload),
    waiverAccepted: Boolean(input.waiverAccepted),
  }
}

export function validateSailor(sailor, index = 0) {
  const prefix = `Sailor ${index + 1}: `
  const errors = []
  if (!sailor.fullName) errors.push(`${prefix}full name is required`)
  if (!sailor.country) errors.push(`${prefix}country is required`)
  if (!sailor.sailNumber) errors.push(`${prefix}sail number is required`)
  if (!BOAT_CLASSES.includes(sailor.boatClass)) errors.push(`${prefix}rig / boat class is required`)
  if (!SCORING_CATEGORIES.includes(sailor.scoringCategory)) errors.push(`${prefix}scoring category is required`)
  if (!TSHIRT_SIZES.includes(sailor.tshirtSize)) errors.push(`${prefix}T-shirt size is required`)
  if (sailor.birthYear && (sailor.birthYear < 1920 || sailor.birthYear > new Date().getFullYear())) errors.push(`${prefix}birth year looks invalid`)
  if (sailor.charterDaysShort > 0 && sailor.charterDaysExtended > 0) errors.push(`${prefix}use either short charter days or extended charter days, not both`)
  if ((sailor.charterDaysShort > 0 || sailor.charterDaysExtended > 0) && !sailor.charterDates) errors.push(`${prefix}charter/facility dates are required when charter days are selected`)
  return errors
}

export function validateRegistration(data) {
  const errors = []
  if (!data.purchaser.fullName) errors.push('Purchaser name is required')
  if (!/^\S+@\S+\.\S+$/.test(data.purchaser.email)) errors.push('Valid purchaser email is required')
  if (!data.purchaser.whatsapp || data.purchaser.whatsapp.replace(/\D/g, '').length < 8) errors.push('Purchaser WhatsApp number with country code is required')
  if (!data.purchaser.emergencyContactName) errors.push('Emergency contact name is required')
  if (!data.purchaser.emergencyContactPhone || data.purchaser.emergencyContactPhone.replace(/\D/g, '').length < 8) errors.push('Emergency contact phone is required')
  if (!data.sailors.length) errors.push('At least one sailor is required')
  if (data.sailors.length > 20) errors.push('Maximum 20 sailors per checkout')
  data.sailors.forEach((sailor, index) => errors.push(...validateSailor(sailor, index)))
  if (!data.waiverAccepted) errors.push('Waiver acknowledgement is required')
  return errors
}

export function registrationAddOns(sailor) {
  const items = []
  if (sailor.charterDaysShort > 0) items.push({ key: 'charterDaysShort', label: ADD_ONS.charterShort.label, quantity: sailor.charterDaysShort, unitAmount: ADD_ONS.charterShort.unitAmount })
  if (sailor.charterDaysExtended > 0) items.push({ key: 'charterDaysExtended', label: ADD_ONS.charterExtended.label, quantity: sailor.charterDaysExtended, unitAmount: ADD_ONS.charterExtended.unitAmount })
  if (sailor.proKitRental) items.push({ key: 'proKitRental', label: ADD_ONS.proKitRental.label, quantity: 1, unitAmount: ADD_ONS.proKitRental.unitAmount })
  if (sailor.boatInsurance) items.push({ key: 'boatInsurance', label: ADD_ONS.boatInsurance.label, quantity: 1, unitAmount: ADD_ONS.boatInsurance.unitAmount })
  if (sailor.sailBattenRental) items.push({ key: 'sailBattenRental', label: ADD_ONS.sailBattenRental.label, quantity: 1, unitAmount: ADD_ONS.sailBattenRental.unitAmount })
  return items
}

export function sailorTotalCents(sailor) {
  return REGATTA_PRICE_CENTS + registrationAddOns(sailor).reduce((total, item) => total + item.quantity * item.unitAmount, 0)
}

export function registrationTotalCents(data) {
  const sailors = Array.isArray(data.sailors) ? data.sailors : [data]
  return sailors.reduce((total, sailor) => total + sailorTotalCents(sailor), 0)
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
