import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { RaceEvent, Racer } from '../gameTypes';

interface RacerRacesListProps {
  racerId: string;
  roster: Racer[];
  schedule: RaceEvent[];
  onBack: () => void;
  onRaceClick?: (race: RaceEvent) => void;
}

export const RacerRacesList = ({ racerId, roster, schedule, onBack, onRaceClick }: RacerRacesListProps): React.ReactElement => {
  const now = Date.now();
  
  const racerRaces = schedule
    .filter(race => race.racerIds.includes(racerId) && race.completed)
    .sort((a, b) => b.startTime - a.startTime);

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

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getRacerPosition = (race: RaceEvent): number => {
    if (!race.results) return -1;
    const position = race.results.indexOf(racerId);
    return position === -1 ? -1 : position + 1;
  };

  const getPositionColor = (position: number): string => {
    if (position === 1) return '#FFD700';
    if (position === 2) return '#C0C0C0';
    if (position === 3) return '#CD7F32';
    return theme.text.primary;
  };

  const renderRaceItem = (race: RaceEvent, index: number) => {
    const position = getRacerPosition(race);
    const isClickable = race.results && race.results.length > 0;
    
    const item = (
      <View
        key={race.id}
        style={{
          backgroundColor: theme.surface.elevated,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: position > 0 ? getPositionColor(position) : theme.surface.dark,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: theme.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}>
                {formatDate(race.startTime)} • {formatTime(race.startTime)}
              </Text>
              {position > 0 && (
                <View style={{
                  backgroundColor: getPositionColor(position) + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                  marginLeft: 8,
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '900',
                    color: getPositionColor(position),
                  }}>
                    P{position}
                  </Text>
                </View>
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

    if (isClickable && onRaceClick) {
      return (
        <TouchableOpacity key={race.id} onPress={() => onRaceClick(race)}>
          {item}
        </TouchableOpacity>
      );
    }

    return item;
  };

  const racer = roster.find(r => r.id === racerId);

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
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '900', 
              color: theme.text.primary,
              letterSpacing: -0.5
            }}>
              {racer?.name}'s Races
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: theme.text.secondary,
              marginTop: 4,
              fontWeight: '600'
            }}>
              {racerRaces.length} race{racerRaces.length !== 1 ? 's' : ''} this season
            </Text>
          </View>
          <TouchableOpacity
            onPress={onBack}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: theme.surface.elevated,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: theme.text.primary, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
        </View>

        {racerRaces.length === 0 ? (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: 40
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏎️</Text>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '700', 
              color: theme.text.primary,
              textAlign: 'center'
            }}>
              No races yet
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: theme.text.tertiary,
              textAlign: 'center',
              marginTop: 8
            }}>
              Races will appear here once completed
            </Text>
          </View>
        ) : (
          <FlatList
            data={racerRaces}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item, index }) => renderRaceItem(item, index)}
          />
        )}
      </View>
    </View>
  );
};
