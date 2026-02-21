// Simple test to verify routing is working
// This can be run in the browser console to test URL routing

export const testRouting = () => {
  console.log('🧪 Testing URL routing...');
  
  // Test 1: Check initial state
  console.log('📍 Initial URL:', window.location.href);
  console.log('📊 Initial view state:', window.history.state);
  
  // Test 2: Navigate to standings
  const testStandings = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'standings');
    window.history.pushState({ view: 'standings' }, '', url.toString());
    console.log('✅ Navigated to standings:', window.location.href);
  };
  
  // Test 3: Navigate to racer profile
  const testRacerProfile = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('racer', 'test-racer-123');
    window.history.pushState({ view: 'profile', selectedRacerId: 'test-racer-123' }, '', url.toString());
    console.log('✅ Navigated to racer profile:', window.location.href);
  };
  
  // Test 4: Navigate to seasons
  const testSeasons = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'seasons');
    window.history.pushState({ view: 'seasons' }, '', url.toString());
    console.log('✅ Navigated to seasons:', window.location.href);
  };
  
  // Test 5: Test back navigation
  const testBack = () => {
    window.history.back();
    console.log('⬅️  Navigated back:', window.location.href);
  };
  
  console.log('🎯 Routing test functions available:');
  console.log('   testStandings() - Navigate to standings');
  console.log('   testRacerProfile() - Navigate to racer profile');
  console.log('   testSeasons() - Navigate to seasons');
  console.log('   testBack() - Navigate back');
  
  return {
    testStandings,
    testRacerProfile,
    testSeasons,
    testBack
  };
};

console.log('🚀 Routing test utilities loaded. Run testRouting() to get test functions.');