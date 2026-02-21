import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Racer } from '../gameTypes';
import { theme, getHealthColor } from '../theme';

interface RacerProfileProps {
  stats: Racer & { first: number; second: number; third: number; racesRun: number };
  currentSeasonPoints: number;
  currentSeasonNumber: number;
  onBack: () => void;
}

export const RacerProfile = ({ stats, currentSeasonPoints, currentSeasonNumber, onBack }: RacerProfileProps) => {
  if (!stats) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.text.secondary }}>Loading...</Text>
      </View>
    );
  }
  
  return (
  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
    {/* Header Card - Similar to StandingsItem */}
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

    {/* Season Stats Card */}
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
      }}>Season {currentSeasonNumber} Stats</Text>
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: theme.surface.elevated,
        borderRadius: 16,
        padding: 20,
        justifyContent: 'space-between',
      }}>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ 
            color: theme.text.primary, 
            fontSize: 24, 
            fontWeight: '900',
          }}>{currentSeasonPoints}</Text>
          <Text style={{ 
            color: theme.text.muted, 
            fontSize: 10, 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            marginTop: 4,
          }}>Points</Text>
        </View>
        <View style={{ width: 1, backgroundColor: theme.primary[400] }} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ 
            color: theme.text.primary, 
            fontSize: 24, 
            fontWeight: '900',
          }}>{stats.first}</Text>
          <Text style={{ 
            color: theme.text.muted, 
            fontSize: 10, 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            marginTop: 4,
          }}>Wins</Text>
        </View>
        <View style={{ width: 1, backgroundColor: theme.primary[400] }} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ 
            color: theme.text.primary, 
            fontSize: 24, 
            fontWeight: '900',
          }}>{stats.racesRun}</Text>
          <Text style={{ 
            color: theme.text.muted, 
            fontSize: 10, 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            marginTop: 4,
          }}>Races</Text>
        </View>
      </View>
    </View>

    {/* Stats Grid Card */}
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
      
      {/* Health & Speed Row */}
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
      
      {/* Preference & Strategy Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
          }}>{stats.strategy}</Text>
        </View>
      </View>
    </View>

    {/* Career Performance Card */}
    <View style={{ 
      backgroundColor: theme.surface.card, 
      padding: 20, 
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
          }}>{stats.first}</Text>
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
          }}>{stats.second}</Text>
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
          }}>{stats.third}</Text>
          <Text style={{ 
            color: theme.text.tertiary, 
            fontSize: 10, 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
          }}>3rd</Text>
        </View>
      </View>
    </View>
  </ScrollView>
  );
};
