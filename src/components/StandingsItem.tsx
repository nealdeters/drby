import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Racer } from '../gameTypes';
import { theme, getHealthColor } from '../theme';

interface StandingsItemProps {
  racer: Racer;
  index: number;
  points: number;
  stats: { first: number; second: number; third: number };
  onPress: (id: string) => void;
}

export const StandingsItem = ({ racer, index, points, stats, onPress }: StandingsItemProps) => (
  <TouchableOpacity 
    onPress={() => onPress(racer.id)}
    style={{ 
      backgroundColor: theme.surface.elevated, 
      padding: 20, 
      marginBottom: 12, 
      marginHorizontal: 16, 
      borderRadius: 16 
    }}
  >
    {/* Header: Rank, Color dot, Name, Points */}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Text style={{ 
        color: theme.text.muted, 
        fontFamily: 'monospace', 
        fontWeight: 'bold', 
        fontSize: 20, 
        marginRight: 12 
      }}>
        {(index + 1).toString().padStart(2, '0')}
      </Text>
      <View 
        style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          backgroundColor: racer.color, 
          marginRight: 12 
        }} 
      />
      <View style={{ flex: 1 }}>
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
        }}>
          {racer.strategy} • {racer.trackPreference}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ 
          color: theme.text.secondary, 
          fontWeight: '900', 
          fontSize: 24 
        }}>{points}</Text>
        <Text style={{ 
          color: theme.text.tertiary, 
          fontSize: 10, 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          letterSpacing: 1 
        }}>PTS</Text>
      </View>
    </View>

    {/* Health Bar */}
    <View style={{ marginBottom: 12 }}>
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

    {/* Stats Row: Speed & Podiums */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ 
          color: theme.text.muted, 
          fontSize: 12 
        }}>
          Speed: <Text style={{ 
            color: theme.text.primary, 
            fontWeight: 'bold' 
          }}>{racer.baseSpeed.toFixed(0)}</Text>
        </Text>
        
        {/* Attribute icons */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: theme.surface.card, 
            paddingHorizontal: 5, 
            paddingVertical: 2, 
            borderRadius: 4 
          }}>
            <Text style={{ fontSize: 9, marginRight: 2 }}>⚡</Text>
            <Text style={{ color: theme.text.primary, fontSize: 9, fontWeight: 'bold' }}>{racer.acceleration || 50}</Text>
          </View>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: theme.surface.card, 
            paddingHorizontal: 5, 
            paddingVertical: 2, 
            borderRadius: 4 
          }}>
            <Text style={{ fontSize: 9, marginRight: 2 }}>♥</Text>
            <Text style={{ color: theme.text.primary, fontSize: 9, fontWeight: 'bold' }}>{racer.endurance || 50}</Text>
          </View>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: theme.surface.card, 
            paddingHorizontal: 5, 
            paddingVertical: 2, 
            borderRadius: 4 
          }}>
            <Text style={{ fontSize: 9, marginRight: 2 }}>🎯</Text>
            <Text style={{ color: theme.text.primary, fontSize: 9, fontWeight: 'bold' }}>{racer.consistency || 50}</Text>
          </View>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: theme.surface.card, 
            paddingHorizontal: 5, 
            paddingVertical: 2, 
            borderRadius: 4 
          }}>
            <Text style={{ fontSize: 9, marginRight: 2 }}>🔄</Text>
            <Text style={{ color: theme.text.primary, fontSize: 9, fontWeight: 'bold' }}>{racer.staminaRecovery || 50}</Text>
          </View>
        </View> 

      </View>

      <View style={{ flexDirection: 'row' }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginRight: 12, 
          backgroundColor: theme.surface.elevated, 
          paddingHorizontal: 8, 
          paddingVertical: 4, 
          borderRadius: 6 
        }}>
          <Text style={{ fontSize: 10, marginRight: 4 }}>🥇</Text>
          <Text style={{ 
            color: theme.text.primary, 
            fontSize: 12, 
            fontWeight: 'bold' 
          }}>{stats.first}</Text>
        </View>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginRight: 12, 
          backgroundColor: theme.surface.elevated, 
          paddingHorizontal: 8, 
          paddingVertical: 4, 
          borderRadius: 6 
        }}>
          <Text style={{ fontSize: 10, marginRight: 4 }}>🥈</Text>
          <Text style={{ 
            color: theme.text.muted, 
            fontSize: 12, 
            fontWeight: 'bold' 
          }}>{stats.second}</Text>
        </View>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: theme.surface.elevated, 
          paddingHorizontal: 8, 
          paddingVertical: 4, 
          borderRadius: 6 
        }}>
          <Text style={{ fontSize: 10, marginRight: 4 }}>🥉</Text>
          <Text style={{ 
            color: theme.text.tertiary, 
            fontSize: 12, 
            fontWeight: 'bold' 
          }}>{stats.third}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);
