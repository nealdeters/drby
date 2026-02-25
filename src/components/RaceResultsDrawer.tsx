import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, PanResponder, Animated } from 'react-native';
import { Racer } from '../gameTypes';
import { theme } from '../theme';

interface RaceResultsDrawerProps {
  visible: boolean;
  results: Racer[];
  trackName?: string;
  onClose: () => void;
  onRacerClick?: (racerId: string) => void;
}

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

export const RaceResultsDrawer: React.FC<RaceResultsDrawerProps> = ({
  visible,
  results,
  trackName,
  onClose,
  onRacerClick,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollOffsetY = useRef(0);

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
          }).start(() => onClose());
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

  const hasResults = results.some(r => r.finishTime);

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
        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.text.primary, letterSpacing: -0.5 }}>
          {hasResults ? 'Race Results' : 'Expected Racers'}
        </Text>
        {trackName && (
          <Text style={{ fontSize: 14, color: theme.text.secondary, marginTop: 4 }}>
            {trackName}
          </Text>
        )}
      </View>

      {/* Results list */}
      <ScrollView 
        style={{ maxHeight: 400 }} 
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollOffsetY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {results.map((racer, index) => (
          <TouchableOpacity
            key={racer.id}
            onPress={() => onRacerClick?.(racer.id)}
            disabled={!onRacerClick}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 12,
              marginHorizontal: 16,
              marginBottom: 8,
              backgroundColor: theme.surface.elevated,
              borderRadius: 12,
            }}
          >
            {/* Position */}
            <View style={{ width: 40, alignItems: 'center' }}>
              {index < 3 && hasResults ? (
                <Text style={{ fontSize: 24 }}>{getPositionEmoji(index + 1)}</Text>
              ) : (
                <Text style={{ fontSize: 18, fontWeight: '700', color: hasResults ? getPositionColor(index + 1) : theme.text.secondary }}>
                  {index + 1}
                </Text>
              )}
            </View>

            {/* Color indicator */}
            <View
              style={{
                width: 4,
                height: 40,
                backgroundColor: racer.color,
                borderRadius: 2,
                marginRight: 12,
              }}
            />

            {/* Racer info */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text.primary }}>
                {racer.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Text style={{ fontSize: 12, color: theme.text.muted }}>
                  Lane {racer.lane || index + 1}
                </Text>
                {racer.status === 'injured' && (
                  <View style={{ 
                    backgroundColor: '#EF4444', 
                    paddingHorizontal: 8, 
                    paddingVertical: 2, 
                    borderRadius: 8,
                    marginLeft: 8 
                  }}>
                    <Text style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}>INJURED</Text>
                  </View>
                )}
                {racer.status === 'dnf' && (
                  <View style={{ 
                    backgroundColor: '#6B7280', 
                    paddingHorizontal: 8, 
                    paddingVertical: 2, 
                    borderRadius: 8,
                    marginLeft: 8 
                  }}>
                    <Text style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}>DNF</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Finish time */}
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text.primary }}>
                {racer.finishTime ? formatTime(racer.finishTime) : '--'}
              </Text>
              {racer.finishTime && (
                <Text style={{ fontSize: 10, color: theme.text.muted }}>finish time</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Close button */}
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
    </Animated.View>
  );
};
