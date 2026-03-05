# Supabase Migration Guide

## Step 1: Add Environment Variables to Vercel

1. Go to [vercel.com](https://vercel.com) → Your project → Settings → Environment Variables
2. Add these two variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL (e.g., `https://abc123.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon/public key
3. Click "Save" and redeploy the project

## Step 2: Migrate Existing Data

Since your desktop browser has the correct data, you need to migrate it to Supabase:

### Option A: Browser Console (Easiest)

1. On your **desktop browser** (where data is correct), open the site
2. Open DevTools (F12) → Console
3. Paste this code (replace with your actual Supabase credentials):

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_KEY = 'your-anon-key'

async function migrate() {
  const saved = localStorage.getItem('regatta-events')
  if (!saved) return alert('No data found')
  
  const events = JSON.parse(saved)
  console.log(`Migrating ${events.length} events...`)
  
  for (const event of events) {
    await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(event)
    })
    console.log('✓', event.eventName)
  }
  alert('Migration complete! Refresh on your phone.')
}

migrate()
```

### Option B: Admin Page Migration Button

After you redeploy with Supabase env vars, the admin page will have a "Sync to Cloud" button.

## Step 3: Verify Sync

1. After migration, refresh the site on your **desktop**
2. Open the site on your **phone**
3. Both should now show:
   - Same countdown (13 days 11 hours)
   - Same sailor count (15 sailors)
   - Same data

## Troubleshooting

**Phone still shows old data?**
- Clear phone browser cache/cookies
- Or open in incognito/private mode

**Data not syncing?**
- Check browser console for errors
- Verify environment variables are set in Vercel
- Check Supabase table has data (Database → Table Editor → events)

**Countdown wrong on phone?**
- The countdown uses the `eventDate` field - verify it's set to `2026-03-19T12:00:00-06:00`
