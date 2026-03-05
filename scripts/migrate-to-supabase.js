// Migration script to push localStorage data to Supabase
// Run this in browser console on the desktop (where correct data is)

const SUPABASE_URL = 'YOUR_SUPABASE_URL' // Replace with your URL
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY' // Replace with your anon key

async function migrateToSupabase() {
  // Get data from localStorage
  const saved = localStorage.getItem('regatta-events')
  if (!saved) {
    console.log('No local data found')
    return
  }
  
  const events = JSON.parse(saved)
  console.log(`Found ${events.length} events to migrate`)
  
  for (const event of events) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(event)
      })
      
      if (response.ok) {
        console.log(`✓ Migrated: ${event.eventName}`)
      } else {
        console.error(`✗ Failed: ${event.eventName}`, await response.text())
      }
    } catch (e) {
      console.error(`✗ Error: ${event.eventName}`, e)
    }
  }
  
  console.log('Migration complete!')
}

migrateToSupabase()
