import React from 'react';
import { View, Text } from 'react-native';
import { Track } from '../gameTypes';
import { theme } from '../theme';

interface TrackItemProps {
  track: Track;
}

export const TrackItem = ({ track }: TrackItemProps) => {
  let surfaceColor = '#334155';
  if (track.surface === 'grass') surfaceColor = '#14532d';
  if (track.surface === 'dirt') surfaceColor = '#78350f';

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
      </View>
    </View>
  );
};
