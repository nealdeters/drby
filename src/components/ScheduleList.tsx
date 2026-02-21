import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { RaceEvent, Racer } from '../gameTypes';

interface ScheduleListProps {
  schedule: RaceEvent[];
  roster: Racer[];
  onBack: () => void;
}

export const ScheduleList = ({ schedule, roster, onBack }: ScheduleListProps) => {
  const now = Date.now();
  
  // Filter to today's races (within 24 hours from now)
  const todayRaces = schedule
    .filter(race => race.startTime >= now - 24 * 60 * 60 * 1000)
    .sort((a, b) => a.startTime - b.startTime);

  // Separate upcoming and completed
  const upcomingRaces = todayRaces.filter(race => !race.completed && race.startTime >= now);
  const completedRaces = todayRaces.filter(race => race.completed);
  const inProgressRaces = todayRaces.filter(race => !race.completed && race.startTime < now);

  const getRacerNames = (racerIds: string[]) => {
    const names = racerIds
      .map(id => roster.find(r => r.id === id)?.name || 'Unknown')
      .slice(0, 3);
    return names.join(', ') + (racerIds.length > 3 ? ` +${racerIds.length - 3}` : '');
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeUntil = (timestamp: number) => {
    const diff = timestamp - now;
    if (diff < 0) return 'Finished';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderRaceItem = (race: RaceEvent, index: number, isCompleted: boolean) => {
    const isInProgress = !race.completed && race.startTime < now;
    
    return (
      <View
        key={race.id}
        style={{
          backgroundColor: isCompleted 
            ? theme.surface.elevated + '80' 
            : theme.surface.elevated,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          opacity: isCompleted ? 0.6 : 1,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: isInProgress ? theme.semantic.warning : theme.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}>
                {isInProgress ? '🔴 LIVE' : formatTime(race.startTime)}
              </Text>
              {!isCompleted && !isInProgress && (
                <Text style={{
                  fontSize: 11,
                  color: theme.text.tertiary,
                  marginLeft: 8,
                }}>
                  in {formatTimeUntil(race.startTime)}
                </Text>
              )}
              {isCompleted && (
                <Text style={{
                  fontSize: 11,
                  color: theme.text.tertiary,
                  marginLeft: 8,
                }}>
                  {race.results ? `Finished: ${race.results.length} racers` : 'Completed'}
                </Text>
              )}
            </View>
            
            <Text style={{
              fontSize: 18,
              fontWeight: '800',
              color: theme.text.primary,
              marginBottom: 4,
            }}>
              {race.track?.name || 'Unknown Track'}
            </Text>
            
            <Text style={{
              fontSize: 13,
              color: theme.text.secondary,
            }}>
              {race.track?.length}m × {race.track?.laps} laps • {race.racerIds.length} racers
            </Text>
            
            {race.racerIds.length > 0 && (
              <Text style={{
                fontSize: 12,
                color: theme.text.tertiary,
                marginTop: 6,
              }}>
                {getRacerNames(race.racerIds)}
              </Text>
            )}
          </View>

          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.surface.darkest,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '900',
              color: theme.text.muted,
            }}>
              #{index + 1}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
              Today's Schedule
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: theme.text.secondary,
              marginTop: 4,
              fontWeight: '600'
            }}>
              {todayRaces.length} race{todayRaces.length !== 1 ? 's' : ''} today
            </Text>
          </View>
          {/* <TouchableOpacity
            onPress={onBack}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: theme.surface.elevated,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: theme.text.primary, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity> */}
        </View>

        {todayRaces.length === 0 ? (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: 40
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '700', 
              color: theme.text.primary,
              textAlign: 'center'
            }}>
              No races scheduled today
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: theme.text.tertiary,
              textAlign: 'center',
              marginTop: 8
            }}>
              New races will appear soon
            </Text>
          </View>
        ) : (
          <FlatList
            data={todayRaces}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item, index }) => renderRaceItem(item, index, item.completed)}
            ListHeaderComponent={
              <View>
                {inProgressRaces.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: theme.semantic.warning,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}>
                      🔴 In Progress
                    </Text>
                    {inProgressRaces.map((race, idx) => renderRaceItem(race, idx, false))}
                  </View>
                )}
                {upcomingRaces.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: theme.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                      Upcoming
                    </Text>
                  </View>
                )}
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};
