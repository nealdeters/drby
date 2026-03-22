import './polyfills';
import './index.css';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, FlatList, Text, SafeAreaView, TouchableOpacity, StatusBar, Dimensions, ScrollView, PanResponder } from 'react-native';
import { RaceTrack } from './components/RaceTrack';
import { useRace } from './hooks/useRace';
import { useSeason, CompletedSeason } from './hooks/useSeason';
import { Racer, Track, RaceEvent } from './gameTypes';
import { useRouter, ViewState } from './hooks/useRouter';
import { formatCountdown } from './utils/format';
import { getRacerStats } from './utils/stats';
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
import { AdminPanel } from './components/AdminPanel';
import { theme } from './theme';

const LOADING_TRACK: Track = { id: '0', name: 'Loading', surface: 'asphalt', length: 1000, laps: 3 };

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
  const isMobile = useIsMobile();
  const { roster, schedule, standings, nextRace, completeRace, skipOverdueRace, tracks, completedSeasons, currentSeasonNumber, resetSeason, loading, refreshFromServer } = useSeason();
  
  const resolvedHistoricalSeason = useMemo(() => {
    if (!selectedHistoricalSeason) return null;
    if (selectedHistoricalSeason.finalStandings) return selectedHistoricalSeason;
    return completedSeasons.find(s => s.id === selectedHistoricalSeason.id) || null;
  }, [selectedHistoricalSeason, completedSeasons]);
  
  const previousRacerStatuses = useRef<Record<string, string>>({});

  const currentRaceRacers = useMemo(() => {
    if (!nextRace || !roster.length) return [];
    const raceRacers = roster.filter(r => nextRace.racerIds.includes(r.id));
    return raceRacers;
  }, [nextRace, roster]);

  const handleRaceFinish = useCallback((results: Racer[]) => {
    setRaceResults(results);
    setShowResultsDrawer(true);
    if (nextRace) completeRace(nextRace.id, results);
  }, [nextRace, completeRace]);

  const displayRaceId = nextRace?.id || '';
  const displayTrack = nextRace?.track || LOADING_TRACK;
  const displayIsActive = !!(nextRace && !nextRace.completed);

  const { racers, isRacing, raceStartTime, progressMap } = useRace({
    racers: currentRaceRacers,
    track: displayTrack,
    raceId: displayRaceId,
    isActive: displayIsActive,
    onRaceFinish: handleRaceFinish
  });

  useEffect(() => {
    if (!isRacing) return;
    
    racers.forEach(racer => {
      const prevStatus = previousRacerStatuses.current[racer.id];
      if (prevStatus === 'active' && racer.status === 'injured') {
        setToastMessage(`${racer.name} got injured!`);
        setToastVisible(true);
      }
      previousRacerStatuses.current[racer.id] = racer.status;
    });
  }, [racers, isRacing]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [raceElapsedTime, setRaceElapsedTime] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showResultsDrawer, setShowResultsDrawer] = useState(false);
  const [raceResults, setRaceResults] = useState<Racer[]>([]);
  const [resultsTrackName, setResultsTrackName] = useState<string | undefined>();
  const [showRacerRacesDrawer, setShowRacerRacesDrawer] = useState(false);
  const [racerRacesSchedule, setRacerRacesSchedule] = useState<RaceEvent[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRacing) {
      if (raceStartTime) {
        interval = setInterval(() => {
          setRaceElapsedTime(Date.now() - raceStartTime);
        }, 100);
      }
    } else {
      setRaceElapsedTime(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRacing, raceStartTime]);

  useEffect(() => {
    if (!nextRace || nextRace.completed) {
      setTimeLeft(0);
      return;
    }

    const updateCountdown = () => {
      const diff = nextRace.startTime - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
      } else {
        setTimeLeft(diff);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextRace]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
        },
        onPanResponderRelease: (_, gestureState) => {
          const SWIPE_THRESHOLD = 50;
          
          if (gestureState.dy > SWIPE_THRESHOLD && Math.abs(gestureState.dx) < SWIPE_THRESHOLD * 2) {
            refreshFromServer();
          } else if (gestureState.dx > SWIPE_THRESHOLD && Math.abs(gestureState.dy) < SWIPE_THRESHOLD * 2) {
            if (canGoBack) goBack();
          } else if (gestureState.dx < -SWIPE_THRESHOLD && Math.abs(gestureState.dy) < SWIPE_THRESHOLD * 2) {
            if (canGoForward) goForward();
          }
        },
      }),
    [canGoBack, canGoForward, goBack, goForward, refreshFromServer]
  );

  return (
    <SafeAreaView {...panResponder.panHandlers} className="flex-1" style={{ flex: 1, backgroundColor: theme.surface.page }}>
      <StatusBar barStyle="light-content" />
      
      <View className="flex-row justify-between items-center px-4 py-6 sm:px-6" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: isMobile ? 16 : 24, paddingVertical: 24, backgroundColor: theme.surface.page }}>
          <TouchableOpacity onPress={() => navigate({ view: 'race' })}>
          <Text className="text-3xl font-black italic tracking-tighter" style={{ fontSize: 30, fontWeight: '900', fontStyle: 'italic', color: theme.text.primary, letterSpacing: -1 }}>DRBY<Text style={{ color: theme.primary[600] }}>.</Text></Text>
        </TouchableOpacity>
        
         {!isMobile && (
           <View className="flex-row p-1.5 rounded-full" style={{ flexDirection: 'row', backgroundColor: theme.surface.card, padding: 6, borderRadius: 999 }}>
             <TabButton title="Race" active={view === 'race'} onPress={() => navigate({ view: 'race' })} />
             <TabButton title="Schedule" active={view === 'schedule'} onPress={() => navigate({ view: 'schedule' })} />
             <TabButton title="Standings" active={view === 'standings'} onPress={() => navigate({ view: 'standings' })} />
             <TabButton title="Seasons" active={view === 'seasons'} onPress={() => navigate({ view: 'seasons' })} />
             <TabButton title="Tracks" active={view === 'tracks'} onPress={() => navigate({ view: 'tracks' })} />
          </View>
        )}
       
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
             {!isRacing && nextRace && (
                <>
                  <Text className="text-sm font-bold uppercase tracking-widest mt-2" style={{ color: theme.text.muted, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }}>
                    {timeLeft > 0 ? 'Race Starts In' : 'Race Starting...'}
                  </Text>
                  <Text className="text-5xl font-black mt-1 tracking-tight" style={{ color: theme.text.primary, fontSize: 48, fontWeight: '900', marginTop: 4, letterSpacing: -1 }}>
                    {timeLeft > 0 ? formatCountdown(timeLeft) : 'Starting...'}
                  </Text>
                </>
                  )}
            </View>

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
              if (a.status === 'finished' && b.status !== 'finished') return -1;
              if (a.status !== 'finished' && b.status === 'finished') return 1;
              if (a.status === 'injured' && b.status !== 'injured') return 1;
              if (a.status !== 'injured' && b.status === 'injured') return -1;
              if (a.totalDistance !== b.totalDistance) {
                return b.totalDistance - a.totalDistance;
              }
              return b.progress - a.progress;
            })}
            renderItem={({ item, index }) => <RacerItem racer={item} index={index} onPress={(id) => navigate({ selectedRacerId: id, view: 'profile' })} track={nextRace?.track} />}
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
                  <StandingsItem racer={item.racer} index={index} points={item.points} stats={item.stats} onPress={(id) => navigate({ selectedRacerId: id, view: 'profile' })} />
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
        <HistoricalStandingsView 
          resolvedHistoricalSeason={resolvedHistoricalSeason} 
          roster={roster}
          navigate={navigate}
          goBack={goBack}
        />
      )}

      {view === 'tracks' && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ 
            backgroundColor: theme.surface.card, 
            borderRadius: 24, 
            flex: 1,
            overflow: 'hidden'
          }}>
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

      <Toast 
        message={toastMessage} 
        visible={toastVisible} 
        onHide={() => setToastVisible(false)}
        type="warning"
      />

      <RaceResultsDrawer
        visible={showResultsDrawer}
        results={raceResults}
        trackName={resultsTrackName || nextRace?.track?.name}
        onClose={() => setShowResultsDrawer(false)}
        onRacerClick={(racerId) => navigate({ selectedRacerId: racerId, view: 'profile' })}
      />

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

interface HistoricalStandingsViewProps {
  resolvedHistoricalSeason: CompletedSeason;
  roster: Racer[];
  navigate: (params: any) => void;
  goBack: () => void;
}

function HistoricalStandingsView({ resolvedHistoricalSeason, roster, navigate, goBack }: HistoricalStandingsViewProps) {
  const theme = require('./theme').theme;
  
  let standingsData;
  if (resolvedHistoricalSeason.racerStats && Array.isArray(resolvedHistoricalSeason.racerStats) && resolvedHistoricalSeason.racerStats.length > 0) {
    standingsData = resolvedHistoricalSeason.racerStats;
  } else {
    standingsData = Object.entries(resolvedHistoricalSeason.finalStandings).map(([racerId, points]) => {
      const actualRacer = roster.find(r => r.id === racerId);
      if (actualRacer) {
        return {
          id: racerId,
          name: actualRacer.name,
          color: actualRacer.color,
          baseSpeed: actualRacer.baseSpeed,
          health: actualRacer.health,
          strategy: actualRacer.strategy,
          trackPreference: actualRacer.trackPreference,
          points: points as number,
          first: 0,
          second: 0,
          third: 0,
          racesRun: resolvedHistoricalSeason.totalRaces || 0
        };
      }
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
    });
  }

  const sortedData = standingsData.sort((a: any, b: any) => b.points - a.points);
  const topThree: any[] = sortedData.slice(0, 3);
  const rest: any[] = sortedData.slice(3);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ 
        backgroundColor: theme.surface.card, 
        borderRadius: 24, 
        flex: 1,
        overflow: 'hidden'
      }}>
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
            <Text style={{ color: theme.text.primary, fontWeight: '600', fontSize: 14 }}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 24 }}>
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
              onPress={(id) => navigate({ selectedRacerId: id, view: 'profile' })} 
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}
        />
      </View>
    </View>
  );
}
