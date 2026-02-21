import React, { memo } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Racer, Track } from '../gameTypes';
import { formatRaceTime } from '../utils/format';
import { theme } from '../theme';

interface RacerItemProps {
  racer: Racer;
  index: number;
  onPress: (id: string) => void;
  track?: Track;
}

export const RacerItem = memo(({ racer, index, onPress, track }: RacerItemProps) => (
  <TouchableOpacity 
    onPress={() => onPress(racer.id)}
    style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: theme.surface.cardLight, 
      padding: 20, 
      marginBottom: 16, 
      marginHorizontal: 16,
      borderRadius: 24 
    }}
  >
    <Text style={{ 
      color: theme.text.onLight, 
      fontFamily: 'monospace', 
      fontWeight: 'bold', 
      width: 40, 
      fontSize: 20 
    }}>{(index + 1).toString().padStart(2, '0')}</Text>
    <View style={{ 
      width: 12, 
      height: 12, 
      borderRadius: 6, 
      marginRight: 16, 
      backgroundColor: racer.color 
    }} />
    <View style={{ flex: 1 }}>
      <Text style={{ 
        color: theme.text.onLight, 
        fontSize: 18, 
        fontWeight: 'bold' 
      }}>{racer.name}</Text>
      <Text style={{ 
        color: theme.text.onLightSecondary, 
        fontSize: 12, 
        fontWeight: 'bold', 
        textTransform: 'uppercase', 
        letterSpacing: 1, 
        marginTop: 4 
      }}>
        {racer.status === 'finished'
          ? `Time: ${formatRaceTime(racer.finishTime!)}`
          : racer.status === 'injured'
          ? 'Injured'
          : `Lap ${racer.laps + 1}`}
      </Text>
    </View>
    <Text style={{ 
      color: theme.text.onLightSecondary, 
      fontFamily: 'monospace', 
      fontWeight: 'bold', 
      fontSize: 18 
    }}>{racer.totalDistance.toFixed(0)}m</Text>
  </TouchableOpacity>
));
