#!/usr/bin/env node

/**
 * Script to reset all race season data and start fresh
 * This will:
 * 1. Reset current season number to 1
 * 2. Clear all race results
 * 3. Reset all standings
 * 4. Clear completed seasons history
 * 5. Reset racer health and stats
 */

const { getStore } = require('@netlify/blobs');

const BLOB_KEYS = {
  CURRENT_SEASON: 'current-season-number',
  SCHEDULE: 'season-schedule',
  STANDINGS: 'season-standings', 
  COMPLETED_SEASONS: 'completed-seasons'
};

async function resetSeasonData() {
  console.log('🔄 Starting season data reset...');
  
  try {
    const store = getStore('races', {
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });

    // 1. Reset current season number to 1
    console.log('📊 Resetting current season number...');
    await store.set(BLOB_KEYS.CURRENT_SEASON, JSON.stringify({ number: 1 }));

    // 2. Clear schedule
    console.log('📅 Clearing season schedule...');
    await store.delete(BLOB_KEYS.SCHEDULE);

    // 3. Clear standings
    console.log('🏆 Clearing season standings...');
    await store.delete(BLOB_KEYS.STANDINGS);

    // 4. Clear completed seasons history
    console.log('📚 Clearing completed seasons history...');
    await store.delete(BLOB_KEYS.COMPLETED_SEASONS);

    // 5. Get all race result keys and delete them
    console.log('🏁 Clearing all race results...');
    const { blobs } = await store.list();
    let raceResultsDeleted = 0;
    
    for (const blob of blobs) {
      if (blob.key.startsWith('s') && blob.key.includes('-race-')) {
        await store.delete(blob.key);
        raceResultsDeleted++;
      }
    }
    
    console.log(`✅ Deleted ${raceResultsDeleted} race results`);

    console.log('🎉 Season data reset complete!');
    console.log('');
    console.log('📋 Summary of changes:');
    console.log('  • Current season reset to 1');
    console.log('  • Season schedule cleared');
    console.log('  • Season standings cleared'); 
    console.log('  • Completed seasons history cleared');
    console.log(`  • ${raceResultsDeleted} race results deleted`);
    console.log('');
    console.log('🚀 System is ready for fresh season data!');

  } catch (error) {
    console.error('❌ Error resetting season data:', error);
    process.exit(1);
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetSeasonData();
}

module.exports = { resetSeasonData };