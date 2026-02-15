const { getStore } = require('@netlify/blobs');

const SITE_ID = process.env.NETLIFY_SITE_ID;
const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

if (!SITE_ID || !TOKEN) {
  console.error('❌ Error: NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN must be set in environment variables');
  console.error('   Make sure you have a .env file with these values or they are exported in your shell');
  process.exit(1);
}

const store = getStore('tracks', {
  siteID: SITE_ID,
  token: TOKEN,
});

const TRACKS = [
  { id: 't1', name: 'Oval Circuit', surface: 'asphalt', length: 1000, laps: 3 },
  { id: 't2', name: 'Dirt Derby', surface: 'dirt', length: 800, laps: 5 },
  { id: 't3', name: 'Grasslands', surface: 'grass', length: 1200, laps: 2 },
];

async function seed() {
  console.log('🚀 Seeding with Netlify Blobs SDK...');

  for (const track of TRACKS) {
    try {
      await store.set(track.id, JSON.stringify(track));
      console.log(`   ✅ Created track: ${track.name}`);
    } catch (e) {
      console.error(`   ❌ Failed: ${track.name} - ${e.message}`);
    }
  }
  
  console.log('\n📋 Verifying...');
  const { blobs } = await store.list();
  console.log('Blobs:', blobs);
}

seed();
