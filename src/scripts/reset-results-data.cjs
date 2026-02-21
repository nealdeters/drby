#!/usr/bin/env node

/**
 * Script to reset all race results data and start fresh
 * This will:
 * 1. Reset current season number to 1
 * 2. Clear all race results from all seasons
 * 3. Reset all standings (current and historical)
 * 4. Clear completed seasons history
 * 5. Reset racer health and stats to initial values
 * 6. Clear all season schedules
 * 
 * This is a manual script that can be run to clear out all blob data when needed.
 */

const { getStore } = require('@netlify/blobs');

const BLOB_KEYS = {
  CURRENT_SEASON: 'current-season-number',
  SCHEDULE: 'season-schedule',
  STANDINGS: 'season-standings', 
  COMPLETED_SEASONS: 'completed-seasons',
  HISTORICAL_STANDINGS: 'historical-standings'
};

async function resetResultsData() {
  console.log('🔄 Starting complete results data reset...');
  
  try {
    const store = getStore('races', {
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });

    // 1. Reset current season number to 1
    console.log('📊 Resetting current season number to 1...');
    await store.set(BLOB_KEYS.CURRENT_SEASON, JSON.stringify({ number: 1 }));

    // 2. Clear current season schedule
    console.log('📅 Clearing current season schedule...');
    await store.delete(BLOB_KEYS.SCHEDULE);

    // 3. Clear current season standings
    console.log('🏆 Clearing current season standings...');
    await store.delete(BLOB_KEYS.STANDINGS);

    // 4. Clear completed seasons history
    console.log('📚 Clearing completed seasons history...');
    await store.delete(BLOB_KEYS.COMPLETED_SEASONS);

    // 5. Clear historical standings if it exists
    console.log('📈 Clearing historical standings...');
    await store.delete(BLOB_KEYS.HISTORICAL_STANDINGS);

    // 6. Get all race result keys from all seasons and delete them
    console.log('🏁 Clearing all race results from all seasons...');
    const { blobs } = await store.list();
    let raceResultsDeleted = 0;
    let otherDataDeleted = 0;
    
    for (const blob of blobs) {
      // Delete all race results (format: s{seasonNum}-race-{index}-{timestamp})
      if (blob.key.startsWith('s') && blob.key.includes('-race-')) {
        await store.delete(blob.key);
        raceResultsDeleted++;
      }
      // Also delete any racer stats or health data that might accumulate
      else if (blob.key.includes('racer-') && (blob.key.includes('stats') || blob.key.includes('health'))) {
        await store.delete(blob.key);
        otherDataDeleted++;
      }
    }
    
    console.log(`✅ Deleted ${raceResultsDeleted} race results`);
    console.log(`✅ Deleted ${otherDataDeleted} racer stat/health entries`);

    console.log('🎉 Complete results data reset finished!');
    console.log('');
    console.log('📋 Summary of changes:');
    console.log('  • Current season reset to 1');
    console.log('  • All season schedules cleared');
    console.log('  • All season standings cleared'); 
    console.log('  • All completed seasons history cleared');
    console.log('  • Historical standings cleared');
    console.log(`  • ${raceResultsDeleted} race results deleted from all seasons`);
    console.log(`  • ${otherDataDeleted} racer stat/health entries cleared`);
    console.log('');
    console.log('🚀 System is completely reset and ready for fresh start!');
    console.log('');
    console.log('⚠️  Next steps:');
    console.log('  • Restart the season system to generate new schedule');
    console.log('  • All racer stats will be reset to initial values');
    console.log('  • Historical data will start accumulating from season 1');

  } catch (error) {
    console.error('❌ Error resetting results data:', error);
    process.exit(1);
  }
}

// Run the reset if this script is executed directly
resetResultsData();

module.exports = { resetResultsData };