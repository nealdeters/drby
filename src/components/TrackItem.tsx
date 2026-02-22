import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Track, RaceEvent } from '../gameTypes';
import { theme } from '../theme';
import { CompletedSeason } from '../hooks/useSeason';

interface TrackItemProps {
  track: Track;
  schedule?: RaceEvent[];
  completedSeasons?: CompletedSeason[];
}

export const TrackItem = ({ track, schedule = [], completedSeasons = [] }: TrackItemProps) => {
  let surfaceColor = '#334155';
  if (track.surface === 'grass') surfaceColor = '#14532d';
  if (track.surface === 'dirt') surfaceColor = '#78350f';

  // Calculate track stats from all races (current season + historical)
  const trackStats = useMemo(() => {
    let totalRaces = 0;
    const allFinishTimes: number[] = [];
    const wins: Record<string, number> = {};

    // Current season races
    schedule.forEach(event => {
      if (event.completed && event.track?.id === track.id && event.finishTimes) {
        totalRaces++;
        const winnerId = event.results?.[0];
        if (winnerId) {
          wins[winnerId] = (wins[winnerId] || 0) + 1;
        }
        Object.values(event.finishTimes).forEach(time => {
          if (time) allFinishTimes.push(time);
        });
      }
    });

    // Historical seasons
    completedSeasons.forEach(season => {
      season.racerStats?.forEach(racer => {
        // We can't easily get race-level data from season stats
        // This would require storing race-level data in completed seasons
      });
    });

    const avgTime = allFinishTimes.length > 0
      ? Math.round(allFinishTimes.reduce((a, b) => a + b, 0) / allFinishTimes.length)
      : null;

    const bestTime = allFinishTimes.length > 0
      ? Math.min(...allFinishTimes)
      : null;

    return { totalRaces, avgTime, bestTime, wins };
  }, [track.id, schedule, completedSeasons]);

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
    <View 
      style={{ 
        backgroundColor: theme.surface.elevated, 
        marginBottom: 12, 
        marginHorizontal: 16, 
        borderRadius: 16, 
        overflow: 'hidden' 
      }}
    >
      <View style={{ height: 8, width: '100%', backgroundColor: surfaceColor }} />
      <View style={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: '900', 
              fontSize: 24 
            }}>{track.name}</Text>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 12, 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              letterSpacing: 2 
            }}>{track.surface} Circuit</Text>
          </View>
          <View style={{ 
            backgroundColor: theme.surface.elevated, 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 999 
          }}>
            <Text style={{ 
              color: theme.text.primary, 
              fontSize: 12, 
              fontWeight: 'bold' 
            }}>ID: {track.id.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: theme.surface.elevated, 
          padding: 20, 
          borderRadius: 16, 
          justifyContent: 'space-between' 
        }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              textTransform: 'uppercase', 
              fontWeight: 'bold', 
              marginBottom: 4, 
              letterSpacing: 1 
            }}>Distance</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: 'bold', 
              fontSize: 20 
            }}>{track.length}m</Text>
          </View>
          <View style={{ width: 1, backgroundColor: theme.primary[400] }} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              textTransform: 'uppercase', 
              fontWeight: 'bold', 
              marginBottom: 4, 
              letterSpacing: 1 
            }}>Laps</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: 'bold', 
              fontSize: 20 
            }}>{track.laps}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: theme.primary[400] }} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              textTransform: 'uppercase', 
              fontWeight: 'bold', 
              marginBottom: 4, 
              letterSpacing: 1 
            }}>Total</Text>
            <Text style={{ 
              color: theme.text.secondary, 
              fontWeight: 'bold', 
              fontSize: 20 
            }}>{track.length * track.laps}m</Text>
          </View>
        </View>

        {/* Track Stats */}
        {trackStats.totalRaces > 0 && (
          <View style={{ 
            marginTop: 16,
            flexDirection: 'row', 
            backgroundColor: theme.surface.card, 
            padding: 16, 
            borderRadius: 16, 
            justifyContent: 'space-between' 
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ 
                color: theme.text.muted, 
                fontSize: 10, 
                textTransform: 'uppercase', 
                fontWeight: 'bold', 
                marginBottom: 4 
              }}>Races</Text>
              <Text style={{ 
                color: theme.text.primary, 
                fontWeight: 'bold', 
                fontSize: 18 
              }}>{trackStats.totalRaces}</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ 
                color: theme.text.muted, 
                fontSize: 10, 
                textTransform: 'uppercase', 
                fontWeight: 'bold', 
                marginBottom: 4 
              }}>Avg Time</Text>
              <Text style={{ 
                color: theme.primary[300], 
                fontWeight: 'bold', 
                fontSize: 18 
              }}>{trackStats.avgTime ? formatTime(trackStats.avgTime) : '--'}</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ 
                color: theme.text.muted, 
                fontSize: 10, 
                textTransform: 'uppercase', 
                fontWeight: 'bold', 
                marginBottom: 4 
              }}>Best</Text>
              <Text style={{ 
                color: '#22C55E', 
                fontWeight: 'bold', 
                fontSize: 18 
              }}>{trackStats.bestTime ? formatTime(trackStats.bestTime) : '--'}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
