import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, PanResponder, Animated } from 'react-native';
import { Racer, RaceEvent } from '../gameTypes';
import { theme } from '../theme';
import { RaceResultsDrawer } from './RaceResultsDrawer';

type DrawerMode = 'list' | 'results';

interface RacerRacesDrawerProps {
  visible: boolean;
  racerId: string;
  roster: Racer[];
  races: RaceEvent[];
  onClose: () => void;
  onRacerClick?: (racerId: string) => void;
}

export const RacerRacesDrawer: React.FC<RacerRacesDrawerProps> = ({
  visible,
  racerId,
  roster,
  races,
  onClose,
  onRacerClick,
}) => {
  const [mode, setMode] = useState<DrawerMode>('list');
  const [selectedRace, setSelectedRace] = useState<RaceEvent | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollOffsetY = useRef(0);

  const racer = roster.find(r => r.id === racerId);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5 && scrollOffsetY.current <= 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            setMode('list');
            setSelectedRace(null);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return theme.text.secondary;
    }
  };

  const getPositionEmoji = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${position}`;
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  };

  const handleRacePress = (race: RaceEvent) => {
    setSelectedRace(race);
    setMode('results');
  };

  const handleBack = () => {
    setSelectedRace(null);
    setMode('list');
  };

  const sortedRaces = [...races]
    .filter(race => race.results && race.results.length > 0)
    .sort((a, b) => b.startTime - a.startTime);

  // In results mode, just render RaceResultsDrawer directly
  if (mode === 'results' && selectedRace) {
    return (
      <RaceResultsDrawer
        visible={visible}
        results={selectedRace.results?.map((resultRacerId, index) => {
          const resultRacer = roster.find(r => r.id === resultRacerId);
          if (!resultRacer) return null;
          return {
            ...resultRacer,
            finishTime: selectedRace.finishTimes?.[resultRacerId],
            lane: index + 1,
          };
        }).filter(Boolean) as Racer[] || []}
        trackName={selectedRace.track?.name}
        onClose={handleBack}
        onRacerClick={onRacerClick}
      />
    );
  }

  if (!visible) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.surface.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        zIndex: 100,
        transform: [{ translateY }],
      }}
    >
      {/* Handle bar */}
      <View style={{ alignItems: 'center', paddingVertical: 12 }}>
        <View style={{ width: 40, height: 4, backgroundColor: theme.text.muted, borderRadius: 2 }} />
      </View>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {mode === 'results' && (
            <TouchableOpacity onPress={handleBack} style={{ marginRight: 12, padding: 4 }}>
              <Text style={{ fontSize: 20, color: theme.text.primary }}>←</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: theme.text.primary, letterSpacing: -0.5 }}>
              {mode === 'list' ? `${racer?.name}'s Races` : 'Race Results'}
            </Text>
            {mode === 'list' && (
              <Text style={{ fontSize: 14, color: theme.text.secondary, marginTop: 4 }}>
                {sortedRaces.length} race{sortedRaces.length !== 1 ? 's' : ''} this season
              </Text>
            )}
            {mode === 'results' && selectedRace?.track?.name && (
              <Text style={{ fontSize: 14, color: theme.text.secondary, marginTop: 4 }}>
                {selectedRace.track.name} • {new Date(selectedRace.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Content */}
      {mode === 'list' ? (
        <ScrollView 
          style={{ maxHeight: 400 }} 
          showsVerticalScrollIndicator={false}
          onScroll={(e) => { scrollOffsetY.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
        >
          {sortedRaces.map((race, index) => {
            const position = race.results ? race.results.indexOf(racerId) + 1 : -1;
            const racerFinishTime = race.finishTimes?.[racerId];
            
            return (
              <TouchableOpacity
                key={race.id}
                onPress={() => handleRacePress(race)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  marginHorizontal: 16,
                  marginBottom: 8,
                  backgroundColor: theme.surface.elevated,
                  borderRadius: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: position > 0 ? getPositionColor(position) : theme.surface.dark,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text.primary }}>
                    {race.track?.name || 'Unknown Track'}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 2 }}>
                    <Text style={{ fontSize: 12, color: theme.text.muted }}>
                      {new Date(race.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {racerFinishTime && (
                      <Text style={{ fontSize: 12, color: theme.primary[300], marginLeft: 8, fontWeight: '600' }}>
                        {formatTime(racerFinishTime)}
                      </Text>
                    )}
                  </View>
                </View>
                {position > 0 && (
                  <View style={{
                    backgroundColor: getPositionColor(position) + '20',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: getPositionColor(position) }}>
                      {getPositionEmoji(position)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Close button - only show in list mode */}
      {mode === 'list' && (
        <View style={{ padding: 20 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: theme.surface.dark,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: theme.text.primary, fontWeight: '700', fontSize: 16 }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};
