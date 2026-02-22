require('dotenv').config();
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

// Strategy-based attribute defaults with some variance
// These match the seed data logic
const strategyDefaults = {
  aggressive: {
    acceleration: [70, 90],
    endurance: [40, 60],
    consistency: [30, 50],
    staminaRecovery: [40, 60],
  },
  balanced: {
    acceleration: [50, 70],
    endurance: [50, 70],
    consistency: [50, 70],
    staminaRecovery: [50, 70],
  },
  conservative: {
    acceleration: [30, 50],
    endurance: [70, 90],
    consistency: [70, 90],
    staminaRecovery: [60, 80],
  },
};

// Helper to get random value in range
const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate attributes based on strategy with some randomization
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
  console.log('🔄 Starting racer migration...\n');

  // List all existing racers
  const { blobs } = await store.list();
  console.log(`Found ${blobs.length} racers in database\n`);

  let migrated = 0;
  let skipped = 0;

  for (const blob of blobs) {
    try {
      const data = await store.get(blob.key);
      const racer = JSON.parse(data);

      // Always update - we want to also adjust baseSpeed
      // Check if racer already has new attributes but might need baseSpeed update
      const needsBaseSpeedUpdate = racer.baseSpeed < 70 || racer.baseSpeed > 90;
      
      if (racer.acceleration !== undefined && racer.endurance !== undefined && 
          racer.consistency !== undefined && racer.staminaRecovery !== undefined && !needsBaseSpeedUpdate) {
        console.log(`   ⏭️  Skipped (already migrated): ${racer.name}`);
        skipped++;
        continue;
      }

      // Generate new attributes based on strategy
      const strategy = racer.strategy || 'balanced';
      const newAttributes = generateAttributes(strategy);

      // Update baseSpeed to 70-90 range if needed
      let newBaseSpeed = racer.baseSpeed;
      if (newBaseSpeed < 70) newBaseSpeed = 70 + randomInRange(0, 10);
      else if (newBaseSpeed > 90) newBaseSpeed = 80 + randomInRange(0, 10);
      else newBaseSpeed = 70 + randomInRange(0, 20);

      // Add new attributes to racer
      const updatedRacer = {
        ...racer,
        ...newAttributes,
        baseSpeed: newBaseSpeed,
      };

      await store.set(racer.id, JSON.stringify(updatedRacer));
      console.log(`   ✅ Migrated: ${racer.name} (${strategy})`);
      console.log(`      baseSpeed: ${newBaseSpeed}, acceleration: ${newAttributes.acceleration}, endurance: ${newAttributes.endurance}, consistency: ${newAttributes.consistency}, staminaRecovery: ${newAttributes.staminaRecovery}`);
      migrated++;
    } catch (e) {
      console.error(`   ❌ Failed to migrate ${blob.key}: ${e.message}`);
    }
  }

  console.log(`\n📊 Migration complete:`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped: ${skipped}`);
}

migrate().catch(console.error);
