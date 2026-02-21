#!/usr/bin/env node

/**
 * Script to check current season status and diagnose any issues
 */

const { getStore } = require('@netlify/blobs');

const BLOB_KEYS = {
  CURRENT_SEASON: 'current-season-number',
  SCHEDULE: 'season-schedule',
  STANDINGS: 'season-standings',
  COMPLETED_SEASONS: 'completed-seasons'
};

async function checkSeasonStatus() {
  console.log('🔍 Checking current season status...\n');
  
  try {
    const store = getStore('races', {
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });

    // Check current season number
    console.log('📊 Current Season Information:');
    try {
      const seasonData = await store.get(BLOB_KEYS.CURRENT_SEASON);
      if (seasonData) {
        const parsed = JSON.parse(String(seasonData));
        console.log(`  ✓ Current season: ${parsed.number}`);
      } else {
        console.log('  ⚠ No current season number found (will default to 1)');
      }
    } catch (err) {
      console.log('  ⚠ Error reading current season number');
    }

    // Check schedule
    console.log('\n📅 Season Schedule:');
    try {
      const scheduleData = await store.get(BLOB_KEYS.SCHEDULE);
      if (scheduleData) {
        const schedule = JSON.parse(String(scheduleData));
        console.log(`  ✓ Schedule contains ${schedule.length} races`);
        const completedRaces = schedule.filter(r => r.completed).length;
        console.log(`  ✓ ${completedRaces} races completed, ${schedule.length - completedRaces} remaining`);
      } else {
        console.log('  ⚠ No season schedule found');
      }
    } catch (err) {
      console.log('  ⚠ Error reading season schedule');
    }

    // Check standings
    console.log('\n🏆 Current Standings:');
    try {
      const standingsData = await store.get(BLOB_KEYS.STANDINGS);
      if (standingsData) {
        const standings = JSON.parse(String(standingsData));
        const entries = Object.entries(standings);
        if (entries.length > 0) {
          console.log(`  ✓ ${entries.length} racers have points`);
          // Show top 5
          const top5 = entries.sort(([,a], [,b]) => b - a).slice(0, 5);
          console.log('  📈 Top 5 racers:');
          top5.forEach(([racerId, points], index) => {
            console.log(`    ${index + 1}. Racer ${racerId}: ${points} points`);
          });
        } else {
          console.log('  ℹ No racers have points yet');
        }
      } else {
        console.log('  ⚠ No standings data found');
      }
    } catch (err) {
      console.log('  ⚠ Error reading standings');
    }

    // Check completed seasons
    console.log('\n📚 Completed Seasons History:');
    try {
      const completedData = await store.get(BLOB_KEYS.COMPLETED_SEASONS);
      if (completedData) {
        const completed = JSON.parse(String(completedData));
        console.log(`  ✓ ${completed.length} seasons completed`);
        if (completed.length > 0) {
          const latest = completed[completed.length - 1];
          console.log(`  📊 Latest season (${latest.seasonNumber}) winner: Racer ${latest.winnerId}`);
          console.log(`  🏁 Total races in latest season: ${latest.totalRaces}`);
        }
      } else {
        console.log('  ℹ No completed seasons yet');
      }
    } catch (err) {
      console.log('  ⚠ Error reading completed seasons');
    }

    // Check race results
    console.log('\n🏁 Race Results:');
    const { blobs } = await store.list();
    const raceResults = blobs.filter(b => 
      b.key.startsWith('s') && 
      b.key.includes('-race-') && 
      !Object.values(BLOB_KEYS).includes(b.key)
    );
    console.log(`  ✓ ${raceResults.length} total race results stored`);

    // Check for potential issues
    console.log('\n🔍 Potential Issues:');
    let issuesFound = 0;

    // Check for orphaned race results (no matching season)
    try {
      const seasonData = await store.get(BLOB_KEYS.CURRENT_SEASON);
      const currentSeason = seasonData ? JSON.parse(String(seasonData)).number : 1;
      const orphanedRaces = raceResults.filter(r => !r.key.startsWith(`s${currentSeason}-`));
      if (orphanedRaces.length > 0) {
        console.log(`  ⚠ ${orphanedRaces.length} race results from previous seasons`);
        issuesFound++;
      }
    } catch (err) {
      console.log('  ⚠ Could not check for orphaned races');
      issuesFound++;
    }

    if (issuesFound === 0) {
      console.log('  ✅ No issues detected');
    }

    console.log('\n✅ Season status check complete!');

  } catch (error) {
    console.error('❌ Error checking season status:', error);
    process.exit(1);
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  checkSeasonStatus();
}

module.exports = { checkSeasonStatus };