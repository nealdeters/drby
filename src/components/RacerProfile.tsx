import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Racer, RaceEvent } from '../gameTypes';
import { theme, getHealthColor } from '../theme';
import { getRacerTrackAverages, TrackAverage } from '../utils/stats';
import { CompletedSeason, RacerSeasonStats } from '../hooks/useSeason';

interface RacerProfileProps {
  stats: Racer & { first: number; second: number; third: number; racesRun: number };
  currentSeasonPoints: number;
  currentSeasonNumber: number;
  schedule: RaceEvent[];
  completedSeasons: CompletedSeason[];
  roster?: Racer[];
  onBack: () => void;
  onOpenRacesDrawer?: () => void;
  onSeasonRacesClick?: (seasonNumber: number) => void;
  onTrackClick?: (trackId: string) => void;
}

export const RacerProfile = ({ stats, currentSeasonPoints, currentSeasonNumber, schedule, completedSeasons, roster = [], onBack, onOpenRacesDrawer, onSeasonRacesClick, onTrackClick }: RacerProfileProps) => {
  // Calculate career totals from all completed seasons + current season
  const careerTotals = useMemo(() => {
    let totalFirst = 0, totalSecond = 0, totalThird = 0, totalRaces = 0;
    
    // Current season
    const currentFirst = schedule.filter(r => r.completed && r.results?.[0] === stats.id).length;
    const currentSecond = schedule.filter(r => r.completed && r.results?.[1] === stats.id).length;
    const currentThird = schedule.filter(r => r.completed && r.results?.[2] === stats.id).length;
    const currentRaces = schedule.filter(r => r.completed && r.results?.includes(stats.id)).length;
    totalFirst += currentFirst;
    totalSecond += currentSecond;
    totalThird += currentThird;
    totalRaces += currentRaces;
    
    // Completed seasons
    completedSeasons.forEach(season => {
      const seasonStat = season.racerStats?.find(s => s.id === stats.id);
      if (seasonStat) {
        totalFirst += seasonStat.first;
        totalSecond += seasonStat.second;
        totalThird += seasonStat.third;
        totalRaces += seasonStat.racesRun;
      }
    });
    return { first: totalFirst, second: totalSecond, third: totalThird, racesRun: totalRaces };
  }, [completedSeasons, schedule, stats.id]);
  
  if (!stats) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.text.secondary }}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={{ 
        backgroundColor: theme.surface.card, 
        padding: 20, 
        marginBottom: 16, 
        borderRadius: 24,
        alignItems: 'center',
      }}>
        <View style={{ 
          width: 80, 
          height: 80, 
          borderRadius: 40, 
          marginBottom: 12, 
          backgroundColor: stats.color, 
          borderWidth: 4,
          borderColor: theme.surface.dark,
        }} />
        <Text style={{ 
          fontSize: 28, 
          fontWeight: '900', 
          color: theme.text.primary, 
          letterSpacing: -1,
          marginBottom: 8,
        }}>{stats.name}</Text>
        <View style={{ 
          backgroundColor: theme.surface.elevated, 
          paddingHorizontal: 16, 
          paddingVertical: 6, 
          borderRadius: 999,
        }}>
          <Text style={{ 
            color: theme.text.secondary, 
            fontSize: 12, 
            fontWeight: 'bold', 
            textTransform: 'uppercase', 
            letterSpacing: 2,
          }}>{stats.strategy}</Text>
        </View>
      </View>

      {/* Career Performance - moved to top */}
      <View style={{ 
        backgroundColor: theme.surface.card, 
        padding: 20, 
        marginBottom: 16, 
        borderRadius: 24,
      }}>
        <Text style={{ 
          color: theme.text.muted, 
          fontSize: 10, 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          marginBottom: 16, 
          letterSpacing: 1,
        }}>Career Performance</Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ 
            alignItems: 'center', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16, 
            width: '30%',
          }}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>🥇</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontSize: 28, 
              fontWeight: '900',
            }}>{careerTotals.first}</Text>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
            }}>1st</Text>
          </View>
          
          <View style={{ 
            alignItems: 'center', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16, 
            width: '30%',
          }}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>🥈</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontSize: 28, 
              fontWeight: '900',
            }}>{careerTotals.second}</Text>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
            }}>2nd</Text>
          </View>
          
          <View style={{ 
            alignItems: 'center', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16, 
            width: '30%',
          }}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>🥉</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontSize: 28, 
              fontWeight: '900',
            }}>{careerTotals.third}</Text>
            <Text style={{ 
              color: theme.text.tertiary, 
              fontSize: 10, 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
            }}>3rd</Text>
          </View>
        </View>
      </View>

      {/* Season History Card */}
      {(() => {
        // Build list of all seasons with this racer's stats
        const allSeasonStats: { seasonNumber: number; position: number; points: number; first: number; second: number; third: number; races: number; isCurrent: boolean }[] = [];
        
        // Add current season
        if (schedule.length > 0) {
          const currentSeasonRaces = schedule.filter(r => 
            r.completed && r.id && r.id.startsWith(`s${currentSeasonNumber}-`)
          );
          
          const racesRun = currentSeasonRaces.filter(r => r.results?.includes(stats.id)).length;
          const wins = currentSeasonRaces.filter(r => r.results?.[0] === stats.id).length;
          const seconds = currentSeasonRaces.filter(r => r.results?.[1] === stats.id).length;
          const thirds = currentSeasonRaces.filter(r => r.results?.[2] === stats.id).length;
          
          // Calculate current season position - only from current season races
          const currentStandings: { id: string; points: number }[] = [];
          roster.forEach((r: any) => {
            const rWins = currentSeasonRaces.filter(ev => ev.results?.[0] === r.id).length;
            const rSeconds = currentSeasonRaces.filter(ev => ev.results?.[1] === r.id).length;
            const rThirds = currentSeasonRaces.filter(ev => ev.results?.[2] === r.id).length;
            const points = rWins * 5 + rSeconds * 3 + rThirds;
            currentStandings.push({ id: r.id, points });
          });
          currentStandings.sort((a, b) => b.points - a.points);
          const position = currentStandings.findIndex(s => s.id === stats.id) + 1;
          
          const seasonPoints = currentStandings.find(s => s.id === stats.id)?.points || 0;
          
          allSeasonStats.push({
            seasonNumber: currentSeasonNumber,
            position,
            points: seasonPoints,
            first: wins,
            second: seconds,
            third: thirds,
            races: racesRun,
            isCurrent: true
          });
        }
        
        // Add completed seasons
        completedSeasons.forEach(season => {
          const seasonStat = season.racerStats?.find(s => s.id === stats.id);
          if (seasonStat) {
            const position = Object.entries(season.finalStandings)
              .sort(([, a], [, b]) => b - a)
              .findIndex(([id]) => id === stats.id) + 1;
            allSeasonStats.push({
              seasonNumber: season.number,
              position,
              points: seasonStat.points,
              first: seasonStat.first,
              second: seasonStat.second,
              third: seasonStat.third,
              races: seasonStat.racesRun,
              isCurrent: false
            });
          }
        });

        if (allSeasonStats.length === 0) return null;

        return (
          <View style={{ 
            backgroundColor: theme.surface.card, 
            padding: 20, 
            marginBottom: 16, 
            borderRadius: 24,
          }}>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              marginBottom: 16, 
              letterSpacing: 1,
            }}>Season History</Text>
            
            {allSeasonStats.sort((a, b) => b.seasonNumber - a.seasonNumber).map((season) => (
              <TouchableOpacity
                key={season.seasonNumber}
                style={{
                  backgroundColor: season.isCurrent ? theme.surface.elevated : theme.surface.dark,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => onSeasonRacesClick?.(season.seasonNumber)}
              >
                <View style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 18, 
                  backgroundColor: season.position === 1 ? theme.semantic.gold : (season.position === 2 ? '#C0C0C0' : (season.position === 3 ? '#CD7F32' : theme.surface.darkest)),
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ color: season.position <= 3 ? '#000' : theme.text.muted, fontWeight: '800', fontSize: 14 }}>
                    {season.position}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text.primary, fontWeight: '700', fontSize: 14 }}>
                    Season {season.seasonNumber}{season.isCurrent ? ' (Current)' : ''}
                  </Text>
                  <Text style={{ color: theme.text.secondary, fontSize: 12 }}>
                    {season.points} pts
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#FFD700', fontWeight: '700' }}>1st</Text>
                    <Text style={{ color: theme.text.primary, fontWeight: '600', fontSize: 12, marginLeft: 2 }}>{season.first}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#C0C0C0', fontWeight: '700' }}>2nd</Text>
                    <Text style={{ color: theme.text.primary, fontWeight: '600', fontSize: 12, marginLeft: 2 }}>{season.second}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#CD7F32', fontWeight: '700' }}>3rd</Text>
                    <Text style={{ color: theme.text.primary, fontWeight: '600', fontSize: 12, marginLeft: 2 }}>{season.third}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      })()}

      {/* Racer Stats */}
      <View style={{ 
        backgroundColor: theme.surface.card, 
        padding: 20, 
        marginBottom: 16, 
        borderRadius: 24,
      }}>
        <Text style={{ 
          color: theme.text.muted, 
          fontSize: 10, 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          marginBottom: 16, 
          letterSpacing: 1,
        }}>Racer Stats</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ 
            width: '48%', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16,
          }}>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              marginBottom: 4, 
              letterSpacing: 1,
            }}>Preference</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: 'bold', 
              fontSize: 20, 
              textTransform: 'capitalize',
            }}>{stats.trackPreference}</Text>
          </View>
          
          <View style={{ 
            width: '48%', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16,
          }}>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              marginBottom: 4, 
              letterSpacing: 1,
            }}>Strategy</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: 'bold', 
              fontSize: 20,
              textTransform: 'capitalize',
            }}>{stats.strategy}</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ 
            width: '48%', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16,
          }}>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              marginBottom: 4, 
              letterSpacing: 1,
            }}>Health</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: 'bold', 
              fontSize: 20,
              marginBottom: 8,
            }}>{stats.health.toFixed(0)}%</Text>
            <View style={{ 
              height: 6, 
              backgroundColor: theme.surface.dark, 
              borderRadius: 999, 
              overflow: 'hidden',
            }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: getHealthColor(stats.health), 
                width: `${stats.health}%`,
              }} />
            </View>
          </View>
          
          <View style={{ 
            width: '48%', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16,
          }}>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              marginBottom: 4, 
              letterSpacing: 1,
            }}>Speed</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: 'bold', 
              fontSize: 20,
              marginBottom: 8,
            }}>{stats.baseSpeed.toFixed(0)}</Text>
            <View style={{ 
              height: 6, 
              backgroundColor: theme.surface.dark, 
              borderRadius: 999, 
              overflow: 'hidden',
            }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: theme.primary[300], 
                width: `${Math.min(100, stats.baseSpeed)}%`,
              }} />
            </View>
          </View>
        </View>

        {/* Attributes - merged into Racer Stats */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ 
            width: '48%', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16,
          }}>
            <Text style={{ color: theme.text.muted, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }}>Acceleration</Text>
            <Text style={{ color: theme.text.primary, fontWeight: 'bold', fontSize: 18 }}>{(stats.acceleration || 50)}</Text>
            <View style={{ height: 4, backgroundColor: theme.surface.dark, borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
              <View style={{ height: '100%', backgroundColor: '#F59E0B', width: `${stats.acceleration || 50}%` }} />
            </View>
          </View>
          
          <View style={{ 
            width: '48%', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16,
          }}>
            <Text style={{ color: theme.text.muted, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }}>Endurance</Text>
            <Text style={{ color: theme.text.primary, fontWeight: 'bold', fontSize: 18 }}>{(stats.endurance || 50)}</Text>
            <View style={{ height: 4, backgroundColor: theme.surface.dark, borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
              <View style={{ height: '100%', backgroundColor: '#22C55E', width: `${stats.endurance || 50}%` }} />
            </View>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ 
            width: '48%', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16,
          }}>
            <Text style={{ color: theme.text.muted, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }}>Consistency</Text>
            <Text style={{ color: theme.text.primary, fontWeight: 'bold', fontSize: 18 }}>{(stats.consistency || 50)}</Text>
            <View style={{ height: 4, backgroundColor: theme.surface.dark, borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
              <View style={{ height: '100%', backgroundColor: '#3B82F6', width: `${stats.consistency || 50}%` }} />
            </View>
          </View>
          
          <View style={{ 
            width: '48%', 
            backgroundColor: theme.surface.elevated, 
            padding: 16, 
            borderRadius: 16,
          }}>
            <Text style={{ color: theme.text.muted, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }}>Stamina Rec</Text>
            <Text style={{ color: theme.text.primary, fontWeight: 'bold', fontSize: 18 }}>{(stats.staminaRecovery || 50)}</Text>
            <View style={{ height: 4, backgroundColor: theme.surface.dark, borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
              <View style={{ height: '100%', backgroundColor: '#8B5CF6', width: `${stats.staminaRecovery || 50}%` }} />
            </View>
          </View>
        </View>
      </View>

      {/* Track Averages Card */}
      {(() => {
        const trackAverages = useMemo(() => getRacerTrackAverages(stats.id, schedule), [stats.id, schedule]);
        console.log('🏁 trackAverages', { racerId: stats.id, count: trackAverages.length, data: trackAverages });
        if (trackAverages.length === 0) return null;

        const formatTime = (ms: number) => {
          const minutes = Math.floor(ms / 60000);
          const seconds = Math.floor((ms % 60000) / 1000);
          const milliseconds = ms % 1000;
          if (minutes > 0) {
            return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
          }
          return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
        };

        return (
          <View style={{ marginTop: 16, backgroundColor: theme.surface.card, padding: 20, borderRadius: 24 }}>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              marginBottom: 16, 
              letterSpacing: 1,
            }}>Track Averages</Text>
            
            {trackAverages.map((track: TrackAverage) => (
              <TouchableOpacity 
                key={track.trackId}
                onPress={() => onTrackClick?.(track.trackId)}
                disabled={!onTrackClick}
                style={{
                  backgroundColor: theme.surface.elevated,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: theme.text.primary, fontWeight: '700', fontSize: 15, flex: 1 }}>
                    {track.trackName}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: theme.text.muted, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Avg</Text>
                    <Text style={{ color: theme.text.primary, fontWeight: '600', fontSize: 14 }}>{formatTime(track.averageFinishTime)}</Text>
                  </View>
                  <View>
                    <Text style={{ color: theme.text.muted, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Best</Text>
                    <Text style={{ color: theme.primary[300], fontWeight: '600', fontSize: 14 }}>{formatTime(track.bestFinishTime)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      })()}
    </ScrollView>
  );
};
