import { NextResponse } from 'next/server'

const FAREHARBOR_ICS_URL = 'https://fareharbor.com/integrations/ics/internationalsailingacademy/calendar/?token=4fe73056-a3cf-4822-a7bb-64c222d433f3'
const REGATTA_SUMMARY_PREFIX = 'SUMMARY:ILCA Mexican Midwinter Regatta - '

const normalizeName = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()

const mapFareHarborBoatClass = (boat = '') => {
  const value = boat.toLowerCase()
  if (value.includes('ilca 7') || value.includes('standard') || value.includes('full rig')) return 'ILCA 7'
  if (value.includes('ilca 6') || value.includes('radial')) return 'ILCA 6'
  if (value.includes('4.7') || value.includes('ilca 4')) return '4.7'
  return 'ILCA 6'
}

const unfoldIcs = (text) => text.replace(/\r?\n[ \t]/g, '')

const extractRegattaDescription = (icsText) => {
  const unfolded = unfoldIcs(icsText)
  const regex = new RegExp(`${REGATTA_SUMMARY_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?DESCRIPTION:(.*?)END:VEVENT`, 's')
  const match = unfolded.match(regex)
  return match?.[1] || null
}

const parseEntrants = (description) => {
  const sections = description.split('----------')
  const entrants = []

  for (const section of sections) {
    const bookingId = section.match(/BOOKING #(\d+)/)?.[1] || ''
    const blocks = section.split('* ILCA Regatta Participant').slice(1)

    for (const block of blocks) {
      const name = block.match(/Full Name: (.*?) \\n/)?.[1]?.trim() || ''
      const category = block.match(/Scoring Category: (.*?) \\n/)?.[1]?.trim() || ''
      const boatRaw = block.match(/What will you be sailing\?: (.*?) \\n/)?.[1]?.trim() || ''
      const phone = block.match(/Phone: (.*?) \\n/)?.[1]?.trim() || ''

      if (!name) continue

      entrants.push({
        bookingId,
        name,
        category,
        boatClass: mapFareHarborBoatClass(boatRaw),
        boatRaw,
        phone
      })
    }
  }

  const seen = new Set()
  const unique = []
  let duplicateCount = 0

  for (const entrant of entrants) {
    const key = `${normalizeName(entrant.name)}|${entrant.boatClass.toLowerCase()}`
    if (seen.has(key)) {
      duplicateCount += 1
      continue
    }
    seen.add(key)
    unique.push(entrant)
  }

  return { entrants: unique, duplicateCount }
}

export async function GET() {
  try {
    const response = await fetch(FAREHARBOR_ICS_URL, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`FareHarbor returned ${response.status}`)
    }

    const icsText = await response.text()
    const description = extractRegattaDescription(icsText)

    if (!description) {
      return NextResponse.json({ error: 'Could not find Mexican Midwinter regatta in FareHarbor feed' }, { status: 404 })
    }

    const { entrants, duplicateCount } = parseEntrants(description)

    return NextResponse.json({
      source: FAREHARBOR_ICS_URL,
      entrants,
      duplicateCount
    })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'FareHarbor sync failed' }, { status: 500 })
  }
}
