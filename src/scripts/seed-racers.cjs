const { getStore } = require('@netlify/blobs');

const SITE_ID = process.env.NETLIFY_SITE_ID;
const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

if (!SITE_ID || !TOKEN) {
  console.error('❌ Error: NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN must be set in environment variables');
  console.error('   Make sure you have a .env file with these values or they are exported in your shell');
  process.exit(1);
}

const store = getStore('racers', {
  siteID: SITE_ID,
  token: TOKEN,
});

const RACERS = [
  { id: 'r1', name: 'Lightning Bolt', color: '#FF6B6B', baseSpeed: 92, health: 100, strategy: 'aggressive', trackPreference: 'asphalt', lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r2', name: 'Mud Slinger', color: '#8B4513', baseSpeed: 78, health: 100, strategy: 'aggressive', trackPreference: 'dirt', lane: 1, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r3', name: 'Green Machine', color: '#22C55E', baseSpeed: 85, health: 100, strategy: 'balanced', trackPreference: 'grass', lane: 2, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r4', name: 'Silver Streak', color: '#94A3B8', baseSpeed: 88, health: 100, strategy: 'balanced', trackPreference: 'asphalt', lane: 3, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r5', name: 'Thunder Bird', color: '#F59E0B', baseSpeed: 90, health: 100, strategy: 'aggressive', trackPreference: 'asphalt', lane: 4, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r6', name: 'Dirt Devil', color: '#A0522D', baseSpeed: 75, health: 100, strategy: 'conservative', trackPreference: 'dirt', lane: 5, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r7', name: 'Road Runner', color: '#3B82F6', baseSpeed: 86, health: 100, strategy: 'balanced', trackPreference: 'asphalt', lane: 6, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r8', name: 'Turbo Turtle', color: '#10B981', baseSpeed: 65, health: 100, strategy: 'conservative', trackPreference: 'grass', lane: 7, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r9', name: 'Midnight Runner', color: '#1E293B', baseSpeed: 82, health: 100, strategy: 'balanced', trackPreference: 'asphalt', lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r10', name: 'Red Rocket', color: '#EF4444', baseSpeed: 95, health: 100, strategy: 'aggressive', trackPreference: 'asphalt', lane: 1, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r11', name: 'Yellow Jacket', color: '#EAB308', baseSpeed: 80, health: 100, strategy: 'conservative', trackPreference: 'dirt', lane: 2, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r12', name: 'Purple Passion', color: '#8B5CF6', baseSpeed: 83, health: 100, strategy: 'balanced', trackPreference: 'grass', lane: 3, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r13', name: 'Blue Thunder', color: '#06B6D4', baseSpeed: 87, health: 100, strategy: 'balanced', trackPreference: 'asphalt', lane: 4, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r14', name: 'Iron Horse', color: '#78716C', baseSpeed: 70, health: 100, strategy: 'conservative', trackPreference: 'dirt', lane: 5, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r15', name: 'Pink Panther', color: '#EC4899', baseSpeed: 84, health: 100, strategy: 'balanced', trackPreference: 'grass', lane: 6, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  { id: 'r16', name: 'Golden Boy', color: '#FCD34D', baseSpeed: 89, health: 100, strategy: 'aggressive', trackPreference: 'asphalt', lane: 7, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
];

async function seed() {
  console.log('🚀 Seeding 16 racers...');

  for (const racer of RACERS) {
    try {
      await store.set(racer.id, JSON.stringify(racer));
      console.log(`   ✅ Created racer: ${racer.name}`);
    } catch (e) {
      console.error(`   ❌ Failed: ${racer.name} - ${e.message}`);
    }
  }
  
  console.log('\n📋 Verifying...');
  const { blobs } = await store.list();
  console.log('Racers count:', blobs.length);
}

seed();
