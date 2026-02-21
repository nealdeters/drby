import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Racer } from '../gameTypes';
import { theme, getHealthColor } from '../theme';

interface RosterItemProps {
  racer: Racer;
  onPress: (id: string) => void;
}

export const RosterItem = ({ racer, onPress }: RosterItemProps) => (
  <TouchableOpacity 
    onPress={() => onPress(racer.id)}
    style={{ 
      backgroundColor: theme.surface.card, 
      padding: 20, 
      marginBottom: 16, 
      marginHorizontal: 16, 
      borderRadius: 24 
    }}
  >
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ 
        color: theme.text.primary, 
        fontWeight: 'bold', 
        fontSize: 20 
      }}>{racer.name}</Text>
      <Text style={{ 
        color: theme.text.muted, 
        fontSize: 12, 
        fontWeight: 'bold', 
        textTransform: 'uppercase', 
        letterSpacing: 1 
      }}>{racer.strategy}</Text>
    </View>
    
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ 
          color: theme.text.muted, 
          fontSize: 12, 
          fontWeight: 'bold' 
        }}>Health</Text>
        <Text style={{ 
          color: theme.text.primary, 
          fontSize: 12, 
          fontWeight: 'bold' 
        }}>{racer.health.toFixed(0)}%</Text>
      </View>
      <View style={{ 
        height: 8, 
        backgroundColor: theme.surface.elevated, 
        borderRadius: 999, 
        overflow: 'hidden' 
      }}>
        <View 
          style={{ 
            height: '100%', 
            borderRadius: 999,
            width: `${racer.health}%`,
            backgroundColor: getHealthColor(racer.health)
          }} 
        />
      </View>
    </View>

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ 
        color: theme.text.muted, 
        fontSize: 12 
      }}>
        Speed: <Text style={{ 
          color: theme.text.primary, 
          fontWeight: 'bold' 
        }}>{racer.baseSpeed.toFixed(0)}</Text>
      </Text>
      <Text style={{ 
        color: theme.text.muted, 
        fontSize: 12 
      }}>
        Pref: <Text style={{ 
          color: theme.text.primary, 
          fontWeight: 'bold', 
          textTransform: 'capitalize' 
        }}>{racer.trackPreference}</Text>
      </Text>
    </View>
  </TouchableOpacity>
);
