import './polyfills';
import './index.css';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, FlatList, Text, SafeAreaView, TouchableOpacity, StatusBar, Dimensions, ScrollView, PanResponder } from 'react-native';
import { RaceTrack } from './components/RaceTrack';
import { useRace } from './hooks/useRace';
import { useRaceCoordinator } from './hooks/useRaceCoordinator';
import { useSeason, CompletedSeason } from './hooks/useSeason';
import { Racer, Track, RaceEvent } from './gameTypes';
import { useRouter, ViewState } from './hooks/useRouter';
import { formatCountdown } from './utils/format';
import { getRacerStats } from './utils/stats';
import { API_URL, headers } from './services/apiClient';
import { TabButton } from './components/TabButton';
import { RacerItem } from './components/RacerItem';
import { StandingsItem } from './components/StandingsItem';
import { TrackItem } from './components/TrackItem';
import { RacerProfile } from './components/RacerProfile';
import { HamburgerMenu } from './components/HamburgerMenu';
import { SeasonsList } from './components/SeasonsList';
import { ScheduleList } from './components/ScheduleList';
import { Toast } from './components/Toast';
import { RaceResultsDrawer } from './components/RaceResultsDrawer';
import { RacerRacesDrawer } from './components/RacerRacesDrawer';
import { theme } from './theme';

const LOADING_TRACK: Track = { id: '0', name: 'Loading', surface: 'asphalt', length: 1000, laps: 3 };

// Debug: Set to true to show test race button in development
const DEBUG_SHOW_TEST_RACE = process.env.NODE_ENV === 'development';

// Simple hook to detect mobile screen size
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

export default function App() {
  const { view, selectedRacerId, selectedHistoricalSeason, selectedHistoricalRacerId, navigate, goBack, goForward, refresh, canGoBack, canGoForward } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeRaceId, setActiveRaceId] = useState<string>(''); // Track active test race
  const [testRaceRacers, setTestRaceRacers] = useState<Racer[]>([]); // Racers for test race
  const [testRaceTrack, setTestRaceTrack] = useState<Track | null>(null); // Track for test race
  const isMobile = useIsMobile();
  const { roster, schedule, standings, nextRace, completeRace, skipOverdueRace, tracks, completedSeasons, currentSeasonNumber } = useSeason();
  
  // Resolve actual historical season from completedSeasons if only id is provided
  const resolvedHistoricalSeason = useMemo(() => {
    if (!selectedHistoricalSeason) return null;
    if (selectedHistoricalSeason.finalStandings) return selectedHistoricalSeason;
    // Look up season by id in completedSeasons
    return completedSeasons.find(s => s.id === selectedHistoricalSeason.id) || null;
  }, [selectedHistoricalSeason, completedSeasons]);
  
  // Redirect to seasons list if trying to view historical season that can't be resolved
  useEffect(() => {
    if (completedSeasons.length > 0 && selectedHistoricalSeason && !resolvedHistoricalSeason) {
      console.log('🔍 Season not found, redirecting to seasons');
      navigate({ view: 'seasons' });
    }
  }, [completedSeasons, selectedHistoricalSeason, resolvedHistoricalSeason, navigate]);
  
  // Helper function to find next upcoming race (even if not immediate next)
  const getNextUpcomingRace = useCallback(() => {
    const now = Date.now();
    return schedule.find(race => !race.completed && race.startTime > now);
  }, [schedule]);
  
  // Prepare racers for the current/next race
  // Fix: Memoize this array to prevent infinite re-renders in useRace
  const currentRaceRacers = useMemo(() => {
    // Use test race racers if in test mode
    if (activeRaceId.startsWith('test-')) {
      return testRaceRacers;
    }
    if (!nextRace || !roster.length) return [];
    const raceRacers = roster.filter(r => nextRace.racerIds.includes(r.id));
    // Debug log if mismatch detected
    if (nextRace.racerIds.length > 0 && raceRacers.length === 0) {
      console.warn('⚠️ Race has racerIds but none found in roster:', nextRace.racerIds, 'roster IDs:', roster.map(r => r.id));
    }
    return raceRacers;
  }, [nextRace, roster, activeRaceId, testRaceRacers]);

  // Fix: Memoize callback to prevent unnecessary updates
  const handleRaceFinish = useCallback((results: Racer[]) => {
    // Show results drawer
    setRaceResults(results);
    setShowResultsDrawer(true);
    
    // Clear the last triggered race ID so new races can be triggered
    localStorage.removeItem('drby-last-race-id');
    
    // Skip completing test races - they don't affect standings or schedule
    if (activeRaceId.startsWith('test-')) {
      console.log('🧪 Test race finished, skipping completion');
      setActiveRaceId(''); // Clear test race
      setTestRaceRacers([]);
      setTestRaceTrack(null);
      return;
    }
    if (nextRace) completeRace(nextRace.id, results);
  }, [nextRace, completeRace, activeRaceId]);

  // Determine which race to show - test race takes priority
  const displayRaceId = activeRaceId || nextRace?.id || '';
  const displayTrack = activeRaceId.startsWith('test-') 
    ? (testRaceTrack || LOADING_TRACK)
    : nextRace?.track || LOADING_TRACK;
  const displayIsActive = !!(activeRaceId || (nextRace && !nextRace.completed));

  // Real-time race hook - subscribes to Ably channel
  const { racers, isRacing, raceStartTime, progressMap } = useRace({
    racers: currentRaceRacers,
    track: displayTrack,
    raceId: displayRaceId,
    isActive: displayIsActive,
    onRaceFinish: handleRaceFinish
  });

  // Coordinator hook - handles race triggering via Ably presence
  const { isCoordinator, isConnected } = useRaceCoordinator({
    raceId: displayRaceId,
    racers: currentRaceRacers,
    track: displayTrack,
    isActive: displayIsActive,
  });

  // Detect injuries during race and show toast
  useEffect(() => {
    if (!isRacing) return;
    
    racers.forEach(racer => {
      const prevStatus = previousRacerStatuses.current[racer.id];
      if (prevStatus === 'active' && racer.status === 'injured') {
        setToastMessage(`🏥 ${racer.name} got injured!`);
        setToastVisible(true);
      }
      previousRacerStatuses.current[racer.id] = racer.status;
    });
  }, [racers, isRacing]);

  // Countdown Timer & Race Trigger
  const [timeLeft, setTimeLeft] = useState(0);
  const [showNextRaceCountdown, setShowNextRaceCountdown] = useState(false);
  const [raceElapsedTime, setRaceElapsedTime] = useState(0);
  
  // Toast state for notifications
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Race results drawer state
  const [showResultsDrawer, setShowResultsDrawer] = useState(false);
  const [raceResults, setRaceResults] = useState<Racer[]>([]);
  const [resultsTrackName, setResultsTrackName] = useState<string | undefined>();
  
  // Racer races drawer state
  const [showRacerRacesDrawer, setShowRacerRacesDrawer] = useState(false);
  const [racerRacesSchedule, setRacerRacesSchedule] = useState<RaceEvent[]>([]);
  
  // Track previous racer statuses for injury detection
  const previousRacerStatuses = useRef<Record<string, string>>({});
  
  const raceStartTriggered = useRef(false);
  const raceStartTimeout = useRef<NodeJS.Timeout | null>(null);
  const currentRaceId = useRef<string | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear countdown interval helper
  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Safety: reset trigger flag if race doesn't start within 30 seconds
  const resetRaceTrigger = useCallback(() => {
    raceStartTriggered.current = false;
    if (raceStartTimeout.current) {
      clearTimeout(raceStartTimeout.current);
      raceStartTimeout.current = null;
    }
  }, []);
  
  // Clear safety timeout when race actually starts
  useEffect(() => {
    if (isRacing && raceStartTimeout.current) {
      clearTimeout(raceStartTimeout.current);
      raceStartTimeout.current = null;
    }
  }, [isRacing]);
  
  // Race elapsed time tracker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRacing) {
      if (raceStartTime) {
        interval = setInterval(() => {
          setRaceElapsedTime(Date.now() - raceStartTime);
        }, 100);
      } else {
        const startTime = Date.now() - raceElapsedTime;
        interval = setInterval(() => {
          setRaceElapsedTime(Date.now() - startTime);
        }, 100);
      }
    } else {
      setRaceElapsedTime(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRacing, raceStartTime]);

  // Reset trigger flag when race state changes
  useEffect(() => {
    if (!isRacing && currentRaceId.current) {
      // Race finished, reset trigger for next race
      raceStartTriggered.current = false;
      currentRaceId.current = null;
      setShowNextRaceCountdown(true);
      console.log('🏁 Race state cleared, ready for next race');
      
      // Clear any existing interval and start fresh countdown for next race
      clearCountdownInterval();
      
      // Find next upcoming race and start countdown
      const nextUpcoming = getNextUpcomingRace();
      if (nextUpcoming && !nextUpcoming.completed) {
        const updateCountdown = () => {
          const diff = nextUpcoming.startTime - Date.now();
          if (diff > 0) {
            setTimeLeft(diff);
          } else {
            setTimeLeft(0);
            clearCountdownInterval();
          }
        };
        updateCountdown();
        countdownIntervalRef.current = setInterval(updateCountdown, 1000);
      }
    }
  }, [isRacing, getNextUpcomingRace, clearCountdownInterval]);

  // Enhanced race trigger with retry mechanism
  const triggerRaceWithRetry = useCallback(async (race: any, racers: Racer[], retryCount = 0) => {
    console.log(`🚀 Triggering race ${race.id} (attempt ${retryCount + 1})`, { 
      apiUrl: API_URL, 
      racersCount: racers.length,
      isDev: import.meta.env.DEV 
    });
    try {
      const response = await fetch(`${API_URL}/race-manager`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          raceId: race.id,
          racers: racers,
          track: race.track
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Race manager returned ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Race triggered successfully:', race.id, result);
      // Clear the safety timeout since request succeeded
      if (raceStartTimeout.current) {
        clearTimeout(raceStartTimeout.current);
        raceStartTimeout.current = null;
      }
    } catch (err) {
      console.error('❌ Failed to start race:', err);
      
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Retrying race trigger in ${delay}ms (attempt ${retryCount + 2})`);
        setTimeout(() => triggerRaceWithRetry(race, racers, retryCount + 1), delay);
      } else {
        // Reset trigger flag on final failure
        resetRaceTrigger();
        console.log('❌ Race trigger failed after 3 retries, giving up');
      }
    }
  }, [API_URL, headers, resetRaceTrigger]);

  // Debug: Start a test race with random racers and track
  const startTestRace = useCallback(async () => {
    if (!roster.length || !tracks.length) {
      console.warn('Cannot start test race: no racers or tracks available');
      return;
    }

    // Pick 4-8 random racers
    const shuffledRacers = [...roster].sort(() => 0.5 - Math.random());
    const numRacers = 4 + Math.floor(Math.random() * 5); // 4-8
    const selectedRacers = shuffledRacers.slice(0, numRacers);

    // Use the same track as the next scheduled race
    const nextScheduledTrack = nextRace?.track || tracks[0];
    const testTrack = nextScheduledTrack || tracks[Math.floor(Math.random() * tracks.length)];

    // Create test race ID
    const testRaceId = `test-race-${Date.now()}`;

    // Set active race ID and racers so UI displays the test race
    setActiveRaceId(testRaceId);
    setTestRaceRacers(selectedRacers);
    setTestRaceTrack(testTrack);

    console.log('🧪 Starting test race:', testRaceId, 'with', numRacers, 'racers on', testTrack.name);

    try {
      const response = await fetch(`${API_URL}/race-manager`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          raceId: testRaceId,
          racers: selectedRacers,
          track: testTrack
        })
      });

      if (!response.ok) {
        throw new Error(`Race manager returned ${response.status}`);
      }

      console.log('✅ Test race started:', testRaceId);
    } catch (err) {
      console.error('❌ Failed to start test race:', err);
      setActiveRaceId('');
      setTestRaceRacers([]);
    }
  }, [roster, tracks, API_URL, headers]);

  // Debug: Kill the current race and clear state
  const killRace = useCallback(async () => {
    console.log('🛑 Killing active race');
    
    const raceIdToKill = activeRaceId || nextRace?.id;
    
    // Call API to stop race (deletes from blob store)
    if (raceIdToKill) {
      try {
        await fetch(`${API_URL}/race-manager?raceId=${raceIdToKill}`, {
          method: 'DELETE',
          headers,
        });
        console.log('🛑 Race stopped on server');
      } catch (err) {
        console.error('Failed to stop race on server:', err);
      }
    }
    
    setActiveRaceId('');
    setTestRaceRacers([]);
    setTestRaceTrack(null);
    raceStartTriggered.current = false;
    if (raceStartTimeout.current) {
      clearTimeout(raceStartTimeout.current);
      raceStartTimeout.current = null;
    }
    // Clear the last triggered race ID so coordinator doesn't try to re-trigger
    localStorage.removeItem('drby-last-race-id');
  }, [activeRaceId, nextRace, API_URL, headers]);
  
  useEffect(() => {
    // Clear any existing interval first
    clearCountdownInterval();
    
    const upcomingRace = nextRace || getNextUpcomingRace();
    
    if (!upcomingRace || upcomingRace.completed) {
      setTimeLeft(0);
      setShowNextRaceCountdown(false);
      return;
    }
    
    // Reset trigger flag when race changes
    if (currentRaceId.current !== upcomingRace.id) {
      currentRaceId.current = upcomingRace.id;
      raceStartTriggered.current = false;
      setShowNextRaceCountdown(false);
    }
    
    // Check if race should have already started (on refresh)
    const shouldHaveStarted = Date.now() >= upcomingRace.startTime;
    const overdueMinutes = shouldHaveStarted ? (Date.now() - upcomingRace.startTime) / (1000 * 60) : 0;
    
    // If race is more than 5 minutes overdue, skip it automatically
    if (shouldHaveStarted && overdueMinutes > 5) {
      console.log(`⏰ Race ${upcomingRace.id} is ${overdueMinutes.toFixed(1)} minutes overdue, skipping...`);
      skipOverdueRace(upcomingRace.id);
      return;
    }
    
    // If race should have started, don't show countdown, just wait for race data
    if (shouldHaveStarted) {
      setTimeLeft(0);
      setShowNextRaceCountdown(false);
      
      // Only trigger race start if not already triggered and not racing
      if (!raceStartTriggered.current && !isRacing) {
        // Check if race already exists (finished or in progress) before triggering
        const checkAndTrigger = async () => {
          try {
            const statusResponse = await fetch(`${API_URL}/race-manager?action=status&raceId=${upcomingRace.id}`, {
              method: 'GET',
              headers
            });
            if (statusResponse.ok) {
              const statusResult = await statusResponse.json();
              if (statusResult.exists) {
                if (statusResult.isFinished) {
                  console.log('⏭️ Race already finished, marking complete:', upcomingRace.id);
                  skipOverdueRace(upcomingRace.id);
                  return;
                } else {
                  console.log('⏭️ Race already in progress, skipping trigger');
                  raceStartTriggered.current = true;
                  return;
                }
              }
            }
          } catch (err) {
            console.warn('⚠️ Could not check race status:', err);
          }
          
          raceStartTriggered.current = true;
          // Set safety timeout to reset flag if race doesn't start
          raceStartTimeout.current = setTimeout(resetRaceTrigger, 30000);
          console.log('🚀 Triggering overdue race:', upcomingRace.id, 'with racers:', currentRaceRacers.map(r => r.id));
          if (currentRaceRacers.length === 0) {
            console.error('❌ Cannot start race - no valid racers found');
            resetRaceTrigger();
            return;
          }
          triggerRaceWithRetry(upcomingRace, currentRaceRacers);
        };
        
        checkAndTrigger();
      }
      return;
    }
    
    // Normal countdown for future races
    const updateCountdown = async () => {
      const diff = upcomingRace.startTime - Date.now();
      if (diff <= 0 && !raceStartTriggered.current) {
        raceStartTriggered.current = true;
        // Set safety timeout to reset flag if race doesn't start
        raceStartTimeout.current = setTimeout(resetRaceTrigger, 30000);
        setTimeLeft(0);
        setShowNextRaceCountdown(false);
        console.log('🚀 Triggering scheduled race:', upcomingRace.id, 'with racers:', currentRaceRacers.map(r => r.id));
        if (currentRaceRacers.length === 0) {
          console.error('❌ Cannot start race - no valid racers found');
          resetRaceTrigger();
          return;
        }
        
        // Check if race was already triggered by server-side scheduled function
        try {
          const checkResponse = await fetch(`${API_URL}/race-manager?action=status&raceId=${upcomingRace.id}`, {
            method: 'GET',
            headers
          });
          if (checkResponse.ok) {
            const checkResult = await checkResponse.json();
            if (checkResult.exists) {
              if (checkResult.isFinished) {
                console.log('⏭️ Race already finished, skipping trigger');
                clearCountdownInterval();
                return;
              } else {
                console.log('⏭️ Race already in progress, skipping trigger');
                clearCountdownInterval();
                return;
              }
            }
          }
        } catch (err) {
          console.warn('⚠️ Could not check race status, proceeding with trigger:', err);
        }
        
        triggerRaceWithRetry(upcomingRace, currentRaceRacers);
        clearCountdownInterval();
      } else if (diff > 0) {
        setTimeLeft(diff);
      }
    };
    
    // Initial update
    updateCountdown();
    
    // Set up interval
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
    
    // Cleanup
    return () => {
      clearCountdownInterval();
    };
  }, [nextRace, getNextUpcomingRace, isRacing, currentRaceRacers, clearCountdownInterval, resetRaceTrigger, triggerRaceWithRetry]);

  const formatRaceTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  };

  const handleRacerClick = (racerId: string) => {
    navigate({ selectedRacerId: racerId, view: 'profile' });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
        },
        onPanResponderRelease: (_, gestureState) => {
          const SWIPE_THRESHOLD = 50;
          
          if (gestureState.dy > SWIPE_THRESHOLD && Math.abs(gestureState.dx) < SWIPE_THRESHOLD * 2) {
            refresh();
          } else if (gestureState.dx > SWIPE_THRESHOLD && Math.abs(gestureState.dy) < SWIPE_THRESHOLD * 2) {
            if (canGoBack) goBack();
          } else if (gestureState.dx < -SWIPE_THRESHOLD && Math.abs(gestureState.dy) < SWIPE_THRESHOLD * 2) {
            if (canGoForward) goForward();
          }
        },
      }),
    [canGoBack, canGoForward, goBack, goForward, refresh]
  );

  return (
    <SafeAreaView {...panResponder.panHandlers} className="flex-1" style={{ flex: 1, backgroundColor: theme.surface.page }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header / Nav */}
       <View className="flex-row justify-between items-center px-4 py-6 sm:px-6" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: isMobile ? 16 : 24, paddingVertical: 24, backgroundColor: theme.surface.page }}>
           <TouchableOpacity onPress={() => navigate({ view: 'race' })}>
            <Text className="text-3xl font-black italic tracking-tighter" style={{ fontSize: 30, fontWeight: '900', fontStyle: 'italic', color: theme.text.primary, letterSpacing: -1 }}>DRBY<Text style={{ color: theme.primary[600] }}>.</Text></Text>
          </TouchableOpacity>
          
           {/* Desktop Navigation */}
           {!isMobile && (
             <View className="flex-row p-1.5 rounded-full" style={{ flexDirection: 'row', backgroundColor: theme.surface.card, padding: 6, borderRadius: 999 }}>
               <TabButton title="Race" active={view === 'race'} onPress={() => navigate({ view: 'race' })} />
               <TabButton title="Schedule" active={view === 'schedule'} onPress={() => navigate({ view: 'schedule' })} />
               <TabButton title="Standings" active={view === 'standings'} onPress={() => navigate({ view: 'standings' })} />
               <TabButton title="Seasons" active={view === 'seasons'} onPress={() => navigate({ view: 'seasons' })} />
               <TabButton title="Tracks" active={view === 'tracks'} onPress={() => navigate({ view: 'tracks' })} />
            </View>
          )}
         
         {/* Mobile Navigation */}
         {isMobile && (
           <>
             <TouchableOpacity onPress={() => setMenuOpen(true)} className="p-2" style={{ padding: 8, marginRight: -8 }}>
               <Text className="text-white text-2xl" style={{ color: 'white', fontSize: 24 }}>☰</Text>
             </TouchableOpacity>
              <HamburgerMenu
                visible={menuOpen}
                onClose={() => setMenuOpen(false)}
                activeView={view}
                items={[
                   { id: 'race', title: 'Race', onPress: () => navigate({ view: 'race' }) },
                   { id: 'schedule', title: 'Schedule', onPress: () => navigate({ view: 'schedule' }) },
                   { id: 'standings', title: 'Standings', onPress: () => navigate({ view: 'standings' }) },
                   { id: 'seasons', title: 'Seasons', onPress: () => navigate({ view: 'seasons' }) },
                   { id: 'tracks', title: 'Tracks', onPress: () => navigate({ view: 'tracks' }) },
                ]}
              />
           </>
         )}
       </View>

      {view === 'race' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            <View className="p-2 items-center" style={{ padding: 8, alignItems: 'center' }}>
              <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.text.secondary, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 }}>
               {nextRace ? `Next: ${nextRace.track?.name || 'Loading...'} (${nextRace.track?.length || 0}m x ${nextRace.track?.laps || 0} laps)` : 'Season Finished'}
             </Text>
             {!isRacing && (nextRace || getNextUpcomingRace()) && (
                <>
                  {showNextRaceCountdown && timeLeft > 0 && (
                    <Text className="text-sm font-bold uppercase tracking-widest mt-2" style={{ color: theme.text.muted, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }}>
                      Next Race In
                    </Text>
                  )}
                  <Text className="text-5xl font-black mt-1 tracking-tight" style={{ color: theme.text.primary, fontSize: 48, fontWeight: '900', marginTop: 4, letterSpacing: -1 }}>
                    {timeLeft > 0 ? formatCountdown(timeLeft) : 'Starting...'}
                  </Text>
                </>
              )}
              {DEBUG_SHOW_TEST_RACE && !isRacing && (
                <TouchableOpacity
                  onPress={startTestRace}
                  style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.semantic.warning, borderRadius: 8 }}
                >
                  <Text style={{ color: '#000', fontWeight: 'bold' }}>🧪 Start Test Race</Text>
                </TouchableOpacity>
              )}
              {DEBUG_SHOW_TEST_RACE && (activeRaceId || isRacing) && (
                <TouchableOpacity
                  onPress={killRace}
                  style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.semantic.error, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>🛑 Kill Race</Text>
                </TouchableOpacity>
              )}
            {/* {isRacing && (
               <Text className="text-2xl font-black mt-2 tracking-tight" style={{ color: theme.text.muted, fontSize: 24, fontWeight: '900', marginTop: 8, letterSpacing: -1 }}>
                Racing!
              </Text>
            )} */}
          </View>

          {/* Race Timer */}
          {isRacing && (
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ 
                fontSize: 32, 
                fontWeight: '900', 
                color: theme.text.primary,
                fontVariant: ['tabular-nums'],
              }}>
                {(() => {
                  const totalSeconds = Math.floor(raceElapsedTime / 1000);
                  const minutes = Math.floor(totalSeconds / 60);
                  const seconds = totalSeconds % 60;
                  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                })()}
              </Text>
            </View>
          )}

          <View className="h-[300px] w-full" style={{ height: 300, width: '100%' }}>
            <RaceTrack racers={racers} track={displayTrack} progressMap={progressMap} />
          </View>

          <FlatList
            data={racers.sort((a, b) => {
              // Finished racers stay at top in their finish order
              if (a.status === 'finished' && b.status !== 'finished') return -1;
              if (a.status !== 'finished' && b.status === 'finished') return 1;
              // Injured racers drop to the bottom
              if (a.status === 'injured' && b.status !== 'injured') return 1;
              if (a.status !== 'injured' && b.status === 'injured') return -1;
              // Among same status, sort by total distance (most advanced first)
              if (a.totalDistance !== b.totalDistance) {
                return b.totalDistance - a.totalDistance;
              }
              // If same distance, sort by progress within current lap
              return b.progress - a.progress;
            })}
            renderItem={({ item, index }) => <RacerItem racer={item} index={index} onPress={handleRacerClick} track={nextRace?.track} />}
            keyExtractor={(item) => item.id}
            className="flex-1 mt-2.5"
            style={{ flex: 1, marginTop: 10 }}
            contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}
          />
        </ScrollView>
      )}

      {view === 'schedule' && (
        <ScheduleList 
          schedule={schedule} 
          roster={roster}
          onBack={() => navigate({ view: 'race' })}
          onRaceClick={(race) => {
            if (!race.completed && race.startTime > Date.now()) {
              // Future race - show expected racers with no times
              const expectedRacers = (race.racerIds || []).map((id, index) => {
                const racer = roster.find(r => r.id === id);
                if (racer) {
                  return {
                    ...racer,
                    finishTime: undefined,
                    lane: index + 1,
                    status: 'waiting' as const,
                    position: 0,
                  };
                }
                return null;
              }).filter(Boolean) as Racer[];
              setRaceResults(expectedRacers);
              setResultsTrackName(race.track?.name);
              setShowResultsDrawer(true);
            } else if (!race.completed) {
              navigate({ view: 'race' });
            } else if (race.results && race.results.length > 0) {
              const results = race.results.map((id, index) => {
                const racer = roster.find(r => r.id === id);
                if (racer) {
                  return {
                    ...racer,
                    finishTime: race.finishTimes?.[id],
                    lane: index + 1,
                  };
                }
                return null;
              }).filter(Boolean) as Racer[];
              setRaceResults(results);
              setResultsTrackName(race.track?.name);
              setShowResultsDrawer(true);
            }
          }}
          onKillRace={killRace}
        />
      )}

      {view === 'standings' && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ 
            backgroundColor: theme.surface.card, 
            borderRadius: 24, 
            flex: 1,
            overflow: 'hidden'
          }}>
            {/* Header */}
            <View style={{ 
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <View>
                <Text style={{ 
                  fontSize: 24, 
                  fontWeight: '900', 
                  color: theme.text.primary,
                  letterSpacing: -0.5
                }}>
                  Standings
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: theme.text.secondary,
                  marginTop: 4,
                  fontWeight: '600'
                }}>
                  Season {currentSeasonNumber}
                </Text>
              </View>
            </View>
            {Object.keys(standings).length === 0 ? (
              <View style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center',
                padding: 40
              }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🏆</Text>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '700', 
                  color: theme.text.primary,
                  textAlign: 'center'
                }}>
                  No races completed yet
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: theme.text.tertiary,
                  textAlign: 'center',
                  marginTop: 8
                }}>
                  Standings will appear here after the first race finishes
                </Text>
              </View>
            ) : roster.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: theme.text.secondary }}>Loading racers...</Text>
              </View>
            ) : (
              <FlatList
                data={roster
                  .map(racer => ({ 
                    racer, 
                    points: standings[racer.id] || 0,
                    stats: getRacerStats(racer.id, roster, schedule) || { first: 0, second: 0, third: 0, racesRun: 0 }
                  }))
                  .sort((a, b) => b.points - a.points)}
                renderItem={({ item, index }) => (
                  <StandingsItem racer={item.racer} index={index} points={item.points} stats={item.stats} onPress={handleRacerClick} />
                )}
                keyExtractor={(item) => item.racer.id}
                contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      )}

      {view === 'profile' && selectedRacerId && roster.length > 0 && (() => {
        const racerStats = getRacerStats(selectedRacerId, roster, schedule);
        if (!racerStats) return null;
        return (
        <RacerProfile 
          stats={racerStats} 
          currentSeasonPoints={standings[selectedRacerId] || 0}
          currentSeasonNumber={currentSeasonNumber}
          schedule={schedule}
          completedSeasons={completedSeasons}
          roster={roster}
          onBack={() => goBack()}
          onOpenRacesDrawer={() => {
            const racerSchedule = schedule.filter(r => r.racerIds.includes(selectedRacerId) && r.completed);
            setRacerRacesSchedule(racerSchedule);
            setShowRacerRacesDrawer(true);
          }}
          onSeasonRacesClick={(seasonNumber) => {
            if (seasonNumber === currentSeasonNumber) {
              const racerSchedule = schedule.filter(r => r.racerIds.includes(selectedRacerId) && r.completed);
              setRacerRacesSchedule(racerSchedule);
              setShowRacerRacesDrawer(true);
            } else {
              const season = completedSeasons.find(s => s.number === seasonNumber);
              if (season && season.races) {
                const racerSchedule = season.races.filter(r => r.racerIds.includes(selectedRacerId));
                setRacerRacesSchedule(racerSchedule);
                setShowRacerRacesDrawer(true);
              }
            }
          }}
          onTrackClick={() => navigate({ view: 'tracks' })}
        />
        );
      })()}

      {view === 'historical-racer-profile' && resolvedHistoricalSeason && selectedHistoricalRacerId && (
        (() => {
          // Try to use racerStats if available, otherwise generate from finalStandings
          let historicalStats;
          if (resolvedHistoricalSeason.racerStats && Array.isArray(resolvedHistoricalSeason.racerStats)) {
            historicalStats = resolvedHistoricalSeason.racerStats.find((r: any) => r.id === selectedHistoricalRacerId);
            console.log('Found racer in racerStats:', historicalStats?.name);
          }
          
          if (!historicalStats) {
            // Fallback: Try to generate from finalStandings and current roster
            const points = resolvedHistoricalSeason.finalStandings?.[selectedHistoricalRacerId];
            if (points !== undefined) {
              console.log('Generating fallback racer data from finalStandings for', selectedHistoricalRacerId);
              
              // Try to find the actual racer in current roster
              const actualRacer = roster.find(r => r.id === selectedHistoricalRacerId);
              
              if (actualRacer) {
                historicalStats = {
                  id: selectedHistoricalRacerId,
                  name: actualRacer.name,
                  color: actualRacer.color,
                  baseSpeed: actualRacer.baseSpeed,
                  health: actualRacer.health,
                  strategy: actualRacer.strategy,
                  trackPreference: actualRacer.trackPreference,
                  points: points,
                  first: 0,
                  second: 0,
                  third: 0,
                  racesRun: resolvedHistoricalSeason.totalRaces || 0
                };
              } else {
                historicalStats = {
                  id: selectedHistoricalRacerId,
                  name: `Racer ${selectedHistoricalRacerId}`,
                  color: '#888888',
                  baseSpeed: 50,
                  health: 100,
                  strategy: 'balanced' as const,
                  trackPreference: 'asphalt' as const,
                  points: points,
                  first: 0,
                  second: 0,
                  third: 0,
                  racesRun: resolvedHistoricalSeason.totalRaces || 0
                };
              }
            }
          }
          
          if (!historicalStats) {
            console.error('Racer not found in historical season:', selectedHistoricalRacerId);
            return (
              <View style={{ flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: theme.text.secondary, fontSize: 16 }}>
                  Racer data not found for this season
                </Text>
                <TouchableOpacity
                  onPress={() => navigate({ view: 'seasons' })}
                  style={{
                    backgroundColor: theme.surface.elevated,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    marginTop: 16
                  }}
                >
                  <Text style={{ color: theme.text.primary, fontWeight: '600' }}>
                    Back to Seasons
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }
          
          return (
            <RacerProfile 
              stats={{
                id: historicalStats.id,
                name: historicalStats.name,
                color: historicalStats.color,
                baseSpeed: historicalStats.baseSpeed,
                health: historicalStats.health,
                strategy: historicalStats.strategy as any,
                trackPreference: historicalStats.trackPreference as any,
                acceleration: historicalStats.acceleration || 50,
                endurance: historicalStats.endurance || 50,
                consistency: historicalStats.consistency || 50,
                staminaRecovery: historicalStats.staminaRecovery || 50,
                lane: 0,
                progress: 0,
                laps: 0,
                totalDistance: 0,
                status: 'finished',
                currentSpeed: 0,
                first: historicalStats.first,
                second: historicalStats.second,
                third: historicalStats.third,
                racesRun: resolvedHistoricalSeason.totalRaces
              }}
              currentSeasonPoints={historicalStats.points}
              currentSeasonNumber={resolvedHistoricalSeason.number}
              schedule={[]}
              completedSeasons={completedSeasons}
              onBack={() => goBack()}
              onTrackClick={() => navigate({ view: 'tracks' })}
            />
          );
        })()
      )}

      {view === 'seasons' && (
        <SeasonsList 
          seasons={completedSeasons} 
          onBack={() => goBack()} 
          onSelectSeason={(season) => {
            navigate({ selectedHistoricalSeason: season, view: 'historical-standings' });
          }}
          onSelectChampion={(season, racerId) => {
            navigate({ selectedHistoricalSeason: season, view: 'historical-standings' });
          }}
        />
      )}

      {view === 'historical-standings' && resolvedHistoricalSeason && (
        (() => {
          // Check if we have valid data to work with
          if (!resolvedHistoricalSeason.finalStandings || typeof resolvedHistoricalSeason.finalStandings !== 'object') {
            console.error('Invalid historical season data: missing finalStandings');
            return (
              <View style={{ flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: theme.text.secondary, fontSize: 16, marginBottom: 16 }}>
                  Season data is corrupted or incomplete
                </Text>
                <TouchableOpacity
                  onPress={() => navigate({ view: 'seasons' })}
                  style={{
                    backgroundColor: theme.surface.elevated,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: theme.text.primary, fontWeight: '600' }}>
                    Back to Seasons
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          // Try to use racerStats if available, otherwise merge with current roster data
          let standingsData;
          if (resolvedHistoricalSeason.racerStats && Array.isArray(resolvedHistoricalSeason.racerStats) && resolvedHistoricalSeason.racerStats.length > 0) {
            // Use the saved racerStats which should have full racer info
            standingsData = resolvedHistoricalSeason.racerStats;
          } else {
            // Fallback: Merge finalStandings with current roster to get actual racer data
            standingsData = Object.entries(resolvedHistoricalSeason.finalStandings).map(([racerId, points]) => {
              // Find the actual racer from current roster
              const actualRacer = roster.find(r => r.id === racerId);
              
              if (actualRacer) {
                // Use actual racer data but with historical points and stats
                return {
                  id: racerId,
                  name: actualRacer.name,
                  color: actualRacer.color,
                  baseSpeed: actualRacer.baseSpeed,
                  health: actualRacer.health,
                  strategy: actualRacer.strategy,
                  trackPreference: actualRacer.trackPreference,
                  points: points as number,
                  first: 0, // These would come from historical stats if available
                  second: 0,
                  third: 0,
                  racesRun: resolvedHistoricalSeason.totalRaces || 0
                };
              } else {
                // Racer not found in current roster, use fallback
                return {
                  id: racerId,
                  name: `Racer ${racerId}`,
                  color: '#888888',
                  baseSpeed: 50,
                  health: 100,
                  strategy: 'balanced' as const,
                  trackPreference: 'asphalt' as const,
                  points: points as number,
                  first: 0,
                  second: 0,
                  third: 0,
                  racesRun: resolvedHistoricalSeason.totalRaces || 0
                };
              }
            });
          }

          return (
            <View style={{ flex: 1, padding: 16 }}>
              <View style={{ 
                backgroundColor: theme.surface.card, 
                borderRadius: 24, 
                flex: 1,
                overflow: 'hidden'
              }}>
                {/* Header */}
                <View style={{ 
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <View>
                    <Text style={{ 
                      fontSize: 24, 
                      fontWeight: '900', 
                      color: theme.text.primary,
                      letterSpacing: -0.5
                    }}>
                      Season {resolvedHistoricalSeason.number}
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: theme.text.secondary,
                      marginTop: 4,
                      fontWeight: '600'
                    }}>
                      Final Standings
                    </Text>
                  </View>
                  <TouchableOpacity
                  onPress={() => navigate({ view: 'seasons' })}
                    style={{
                      backgroundColor: theme.surface.elevated,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{
                      color: theme.text.primary,
                      fontWeight: '600',
                      fontSize: 14,
                    }}>
                      Back
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* Podium for Top 3 */}
                {(() => {
                  const sortedData = standingsData.sort((a: any, b: any) => b.points - a.points);
                  const topThree = sortedData.slice(0, 3);
                  const rest = sortedData.slice(3);
                  
                  return (
                    <>
                      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                        {/* Podium */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 24 }}>
                          {/* 2nd Place */}
                          {topThree[1] && (
                            <TouchableOpacity
                              onPress={() => navigate({ selectedRacerId: topThree[1].id, view: 'profile' })}
                              style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}
                              activeOpacity={0.7}
                            >
                              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: topThree[1].color, marginBottom: 8, borderWidth: 2, borderColor: '#C0C0C0' }} />
                              <Text style={{ fontSize: 28, marginBottom: 4 }}>🥈</Text>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text.primary, textAlign: 'center' }} numberOfLines={1}>{topThree[1].name}</Text>
                              <Text style={{ fontSize: 11, color: theme.text.secondary }}>{topThree[1].points} pts</Text>
                              <View style={{ width: '100%', height: 60, backgroundColor: '#C0C0C0', borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 8, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
                                <Text style={{ color: '#333', fontWeight: '800', fontSize: 16 }}>2</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                          {/* 1st Place */}
                          {topThree[0] && (
                            <TouchableOpacity
                              onPress={() => navigate({ selectedRacerId: topThree[0].id, view: 'profile' })}
                              style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}
                              activeOpacity={0.7}
                            >
                              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: topThree[0].color, marginBottom: 8, borderWidth: 3, borderColor: '#FFD700' }} />
                              <Text style={{ fontSize: 36, marginBottom: 4 }}>🥇</Text>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text.primary, textAlign: 'center' }} numberOfLines={1}>{topThree[0].name}</Text>
                              <Text style={{ fontSize: 12, color: theme.text.secondary }}>{topThree[0].points} pts</Text>
                              <View style={{ width: '100%', height: 80, backgroundColor: '#FFD700', borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 8, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
                                <Text style={{ color: '#333', fontWeight: '800', fontSize: 20 }}>1</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                          {/* 3rd Place */}
                          {topThree[2] && (
                            <TouchableOpacity
                              onPress={() => navigate({ selectedRacerId: topThree[2].id, view: 'profile' })}
                              style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}
                              activeOpacity={0.7}
                            >
                              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: topThree[2].color, marginBottom: 8, borderWidth: 2, borderColor: '#CD7F32' }} />
                              <Text style={{ fontSize: 24, marginBottom: 4 }}>🥉</Text>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text.primary, textAlign: 'center' }} numberOfLines={1}>{topThree[2].name}</Text>
                              <Text style={{ fontSize: 11, color: theme.text.secondary }}>{topThree[2].points} pts</Text>
                              <View style={{ width: '100%', height: 48, backgroundColor: '#CD7F32', borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 8, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
                                <Text style={{ color: '#333', fontWeight: '800', fontSize: 14 }}>3</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      {/* Rest of standings */}
                      <FlatList
                        data={rest}
                        renderItem={({ item, index }) => (
                          <StandingsItem 
                            racer={{
                              id: item.id,
                              name: item.name,
                              color: item.color,
                              baseSpeed: item.baseSpeed,
                              health: item.health,
                              strategy: item.strategy as any,
                              trackPreference: item.trackPreference as any,
                              acceleration: item.acceleration || 50,
                              endurance: item.endurance || 50,
                              consistency: item.consistency || 50,
                              staminaRecovery: item.staminaRecovery || 50,
                              lane: 0,
                              progress: 0,
                              laps: 0,
                              totalDistance: 0,
                              status: 'finished',
                              currentSpeed: 0
                            }} 
                            index={index + 3}
                            points={item.points} 
                            stats={{ first: item.first || 0, second: item.second || 0, third: item.third || 0 }} 
                            onPress={() => navigate({ selectedRacerId: item.id, view: 'profile' })} 
                          />
                        )}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}
                      />
                    </>
                  );
                })()}
              </View>
            </View>
          );
        })()
      )}

      {view === 'tracks' && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ 
            backgroundColor: theme.surface.card, 
            borderRadius: 24, 
            flex: 1,
            overflow: 'hidden'
          }}>
            {/* Header */}
            <View style={{ 
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <View>
                <Text style={{ 
                  fontSize: 24, 
                  fontWeight: '900', 
                  color: theme.text.primary,
                  letterSpacing: -0.5
                }}>
                  Tracks
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: theme.text.secondary,
                  marginTop: 4,
                  fontWeight: '600'
                }}>
                  {tracks.length} Track{tracks.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <FlatList
              data={tracks}
              renderItem={({ item }) => <TrackItem track={item} schedule={schedule} completedSeasons={completedSeasons} />}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}
            />
          </View>
        </View>
      )}

      {/* Toast notifications */}
      <Toast 
        message={toastMessage} 
        visible={toastVisible} 
        onHide={() => setToastVisible(false)}
        type="warning"
      />

      {/* Race Results Drawer */}
      <RaceResultsDrawer
        visible={showResultsDrawer}
        results={raceResults}
        trackName={resultsTrackName || nextRace?.track?.name}
        onClose={() => setShowResultsDrawer(false)}
        onRacerClick={(racerId) => navigate({ selectedRacerId: racerId, view: 'profile' })}
      />

      {/* Racer Races Drawer */}
      <RacerRacesDrawer
        visible={showRacerRacesDrawer}
        racerId={selectedRacerId || ''}
        roster={roster}
        races={racerRacesSchedule}
        onClose={() => setShowRacerRacesDrawer(false)}
        onRacerClick={(racerId) => {
          setShowRacerRacesDrawer(false);
          navigate({ selectedRacerId: racerId, view: 'profile' });
        }}
      />
    </SafeAreaView>
  );
}