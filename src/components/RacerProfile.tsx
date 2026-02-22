import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Racer, RaceEvent } from '../gameTypes';
import { theme, getHealthColor } from '../theme';
import { getRacerTrackAverages, TrackAverage } from '../utils/stats';

interface RacerProfileProps {
  stats: Racer & { first: number; second: number; third: number; racesRun: number };
  currentSeasonPoints: number;
  currentSeasonNumber: number;
  schedule: RaceEvent[];
  onBack: () => void;
  onOpenRacesDrawer?: () => void;
}

export const RacerProfile = ({ stats, currentSeasonPoints, currentSeasonNumber, schedule, onBack, onOpenRacesDrawer }: RacerProfileProps) => {
  if (!stats) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.text.secondary }}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
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
          <TouchableOpacity style={{ alignItems: 'center', flex: 1 }} onPress={() => onOpenRacesDrawer?.()}>
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
          </TouchableOpacity>
        </View>
      </View>

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
        }}>Attributes</Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
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
            }}>Acceleration</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: 'bold', 
              fontSize: 20,
              marginBottom: 8,
            }}>{(stats.acceleration || 50)}</Text>
            <View style={{ 
              height: 6, 
              backgroundColor: theme.surface.dark, 
              borderRadius: 999, 
              overflow: 'hidden',
            }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: '#F59E0B', 
                width: `${stats.acceleration || 50}%`,
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
            }}>Endurance</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: 'bold', 
              fontSize: 20,
              marginBottom: 8,
            }}>{(stats.endurance || 50)}</Text>
            <View style={{ 
              height: 6, 
              backgroundColor: theme.surface.dark, 
              borderRadius: 999, 
              overflow: 'hidden',
            }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: '#22C55E', 
                width: `${stats.endurance || 50}%`,
              }} />
            </View>
          </View>
        </View>
        
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
            }}>Consistency</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: 'bold', 
              fontSize: 20,
              marginBottom: 8,
            }}>{(stats.consistency || 50)}</Text>
            <View style={{ 
              height: 6, 
              backgroundColor: theme.surface.dark, 
              borderRadius: 999, 
              overflow: 'hidden',
            }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: '#3B82F6', 
                width: `${stats.consistency || 50}%`,
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
            }}>Stamina Recovery</Text>
            <Text style={{ 
              color: theme.text.primary, 
              fontWeight: 'bold', 
              fontSize: 20,
              marginBottom: 8,
            }}>{(stats.staminaRecovery || 50)}</Text>
            <View style={{ 
              height: 6, 
              backgroundColor: theme.surface.dark, 
              borderRadius: 999, 
              overflow: 'hidden',
            }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: '#8B5CF6', 
                width: `${stats.staminaRecovery || 50}%`,
              }} />
            </View>
          </View>
        </View>
      </View>

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

      {/* Track Averages */}
      {(() => {
        const trackAverages = useMemo(() => getRacerTrackAverages(stats.id, schedule), [stats.id, schedule]);
        console.log('🏁 trackAverages', { racerId: stats.id, count: trackAverages.length, data: trackAverages });
        if (trackAverages.length === 0) return null;

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
          <View style={{ marginTop: 16 }}>
            <Text style={{ 
              color: theme.text.muted, 
              fontSize: 10, 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              marginBottom: 16, 
              letterSpacing: 1,
            }}>Track Averages</Text>
            
            {trackAverages.map((track: TrackAverage) => (
              <View 
                key={track.trackId}
                style={{
                  backgroundColor: theme.surface.elevated,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: theme.text.primary, fontWeight: '700', fontSize: 15, flex: 1 }}>
                    {track.trackName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {track.wins > 0 && (
                      <Text style={{ fontSize: 14, marginRight: 8 }}>
                        {track.wins === 1 ? '🥇' : `🥇x${track.wins}`}
                      </Text>
                    )}
                    <Text style={{ color: theme.text.secondary, fontSize: 12 }}>
                      {track.totalRaces} {track.totalRaces === 1 ? 'race' : 'races'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: theme.text.muted, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Avg</Text>
                    <Text style={{ color: theme.text.primary, fontWeight: '600', fontSize: 14 }}>{formatTime(track.averageFinishTime)}</Text>
                  </View>
                  <View>
                    <Text style={{ color: theme.text.muted, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Best</Text>
                    <Text style={{ color: theme.primary[300], fontWeight: '600', fontSize: 14 }}>{formatTime(track.bestFinishTime)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        );
      })()}
    </ScrollView>
  );
};
