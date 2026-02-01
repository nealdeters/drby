// scripts/seed-data.js
const API_URL = 'http://localhost:8888/.netlify/functions';

const NAMES = ['Speedy', 'Zoomer', 'Dasher', 'Flash', 'Bolt', 'Turbo', 'Nitro', 'Drift', 'Apex', 'Redline', 'Mach', 'Vortex'];
const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3', '#FF8833', '#8833FF', '#FF3388', '#88FF33', '#3388FF', '#FFFFFF'];

const TRACKS = [
  { id: 't1', name: 'Oval Circuit', surface: 'asphalt', length: 1000, laps: 3 },
  { id: 't2', name: 'Dirt Derby', surface: 'dirt', length: 800, laps: 5 },
  { id: 't3', name: 'Grasslands', surface: 'grass', length: 1200, laps: 2 },
];

const RACERS = NAMES.map((name, i) => ({
  id: `r-${i}`,
  name,
  color: COLORS[i],
  baseSpeed: 40 + Math.random() * 20,
  health: 80 + Math.random() * 20,
  strategy: Math.random() > 0.5 ? 'aggressive' : 'balanced',
  trackPreference: TRACKS[Math.floor(Math.random() * TRACKS.length)].surface,
  lane: 0,
  progress: 0,
  laps: 0,
  totalDistance: 0,
  status: 'waiting',
  currentSpeed: 0,
}));

async function seed() {
  console.log('🌱 Seeding data to', API_URL);

  // Seed Tracks
  console.log('🏁 Seeding Tracks...');
  for (const track of TRACKS) {
    try {
      const res = await fetch(`${API_URL}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track),
      });
      if (res.ok) console.log(`   Created track: ${track.name}`);
      else console.error(`   Failed to create track ${track.name}:`, await res.text());
    } catch (e) {
      console.error(`   Error creating track ${track.name}:`, e.message);
    }
  }

  // Seed Racers
  console.log('🏎️  Seeding Racers...');
  for (const racer of RACERS) {
    try {
      const res = await fetch(`${API_URL}/racers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(racer),
      });
      if (res.ok) console.log(`   Created racer: ${racer.name}`);
      else console.error(`   Failed to create racer ${racer.name}:`, await res.text());
    } catch (e) {
      console.error(`   Error creating racer ${racer.name}:`, e.message);
    }
  }

  console.log('✅ Seeding complete!');
}

seed();
