require('dotenv').config();
const { getStore } = require('@netlify/blobs');

const SITE_ID = process.env.NETLIFY_SITE_ID;
const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

if (!SITE_ID || !TOKEN) {
  console.error('❌ Error: NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN must be set');
  process.exit(1);
}

const racersStore = getStore('racers', { siteID: SITE_ID, token: TOKEN });
const racesStore = getStore('races', { siteID: SITE_ID, token: TOKEN });

const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const strategyDefaults = {
  aggressive: { acceleration: [70, 90], endurance: [40, 60], consistency: [30, 50], staminaRecovery: [40, 60] },
  balanced: { acceleration: [50, 70], endurance: [50, 70], consistency: [50, 70], staminaRecovery: [50, 70] },
  conservative: { acceleration: [30, 50], endurance: [70, 90], consistency: [70, 90], staminaRecovery: [60, 80] },
};

const generateAttributes = (strategy) => {
  const defaults = strategyDefaults[strategy] || strategyDefaults.balanced;
  return {
    acceleration: randomInRange(defaults.acceleration[0], defaults.acceleration[1]),
    endurance: randomInRange(defaults.endurance[0], defaults.endurance[1]),
    consistency: randomInRange(defaults.consistency[0], defaults.consistency[1]),
    staminaRecovery: randomInRange(defaults.staminaRecovery[0], defaults.staminaRecovery[1]),
  };
};

async function migrate() {
  console.log('🔄 Migrating roster in races store...\n');

  try {
    const rosterData = await racesStore.get('roster');
    if (!rosterData) {
      console.log('❌ No roster found in races store');
      return;
    }

    let roster = JSON.parse(rosterData);
    console.log(`Found ${roster.length} racers in roster`);

    let updated = 0;
    roster = roster.map(racer => {
      // Check if already has new attributes
      if (racer.acceleration !== undefined) {
        return racer;
      }

      // Generate new attributes
      const strategy = racer.strategy || 'balanced';
      const newAttrs = generateAttributes(strategy);

      // Update baseSpeed to 70-90 if needed
      let newBaseSpeed = racer.baseSpeed;
      if (newBaseSpeed < 70) newBaseSpeed = 70 + randomInRange(0, 10);
      else if (newBaseSpeed > 90) newBaseSpeed = 80 + randomInRange(0, 10);
      else newBaseSpeed = 70 + randomInRange(0, 20);

      updated++;
      console.log(`   ✅ ${racer.name}: baseSpeed ${racer.baseSpeed} → ${newBaseSpeed}`);

      return {
        ...racer,
        ...newAttrs,
        baseSpeed: newBaseSpeed,
      };
    });

    await racesStore.set('roster', JSON.stringify(roster));
    console.log(`\n📊 Updated ${updated} racers in roster`);

  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

migrate();
