const { getStore } = require('@netlify/blobs');

const siteId = process.env.NETLIFY_SITE_ID;
const token = process.env.NETLIFY_AUTH_TOKEN;

if (!siteId || !token) {
  console.error('Missing NETLIFY_SITE_ID or NETLIFY_AUTH_TOKEN');
  process.exit(1);
}

const store = getStore('races', { siteID: siteId, token });

async function clearData() {
  console.log('Clearing all race data...');
  
  // Clear all keys by setting empty values
  await store.set('season-schedule', '[]');
  console.log('✓ Cleared season-schedule');
  
  await store.set('season-standings', '{}');
  console.log('✓ Cleared season-standings');
  
  await store.set('completed-seasons', '[]');
  console.log('✓ Cleared completed-seasons');
  
  await store.set('current-season-number', '1');
  console.log('✓ Reset season number to 1');
  
  await store.set('roster', '[]');
  console.log('✓ Cleared roster');
  
  console.log('All data cleared!');
}

clearData().catch(console.error);
