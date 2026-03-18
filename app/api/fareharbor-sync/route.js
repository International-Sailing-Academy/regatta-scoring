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

const extractMatchingRegattaDescriptions = (icsText) => {
  const unfolded = unfoldIcs(icsText)
  const events = [...unfolded.matchAll(/BEGIN:VEVENT(.*?)END:VEVENT/gms)]

  return events
    .map(match => match[1])
    .filter(block => block.includes(REGATTA_SUMMARY_PREFIX))
    .map(block => {
      const summary = block.match(/SUMMARY:(.*?)(?:\r?\n|$)/)?.[1]?.trim() || ''
      const description = block.match(/DESCRIPTION:(.*?)(?:\r?\n[A-Z-]+[:;]|$)/s)?.[1] || ''
      return { summary, description }
    })
    .filter(item => item.description)
}

const parseEntrants = (descriptions = []) => {
  const entrants = []

  for (const description of descriptions) {
    const sections = description.split('----------')

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
  }

  const seen = new Set()
  const unique = []
  const duplicates = []

  for (const entrant of entrants) {
    const key = `${normalizeName(entrant.name)}|${entrant.boatClass.toLowerCase()}`
    if (seen.has(key)) {
      duplicates.push({ ...entrant, duplicateKey: key })
      continue
    }
    seen.add(key)
    unique.push({ ...entrant, duplicateKey: key })
  }

  return {
    entrants: unique,
    duplicateCount: duplicates.length,
    duplicates
  }
}

export async function GET() {
  try {
    const response = await fetch(FAREHARBOR_ICS_URL, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`FareHarbor returned ${response.status}`)
    }

    const icsText = await response.text()
    const matches = extractMatchingRegattaDescriptions(icsText)

    if (matches.length === 0) {
      return NextResponse.json({ error: 'Could not find Mexican Midwinter regatta in FareHarbor feed' }, { status: 404 })
    }

    const { entrants, duplicateCount, duplicates } = parseEntrants(matches.map(item => item.description))

    return NextResponse.json({
      source: FAREHARBOR_ICS_URL,
      matchedEvents: matches.map(item => item.summary),
      matchedEventCount: matches.length,
      entrants,
      duplicateCount,
      duplicates,
      uniqueEntrantCount: entrants.length
    })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'FareHarbor sync failed' }, { status: 500 })
  }
}
