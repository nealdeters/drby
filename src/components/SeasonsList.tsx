import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { theme, layout } from '../theme';
import { CompletedSeason } from '../hooks/useSeason';

interface SeasonsListProps {
  seasons: CompletedSeason[];
  onBack: () => void;
  onSelectSeason: (season: CompletedSeason) => void;
  onSelectChampion: (season: CompletedSeason, racerId: string) => void;
}

export const SeasonsList = ({ seasons, onBack, onSelectSeason, onSelectChampion }: SeasonsListProps) => (
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
            Past Seasons
          </Text>
          <Text style={{ 
            fontSize: 12, 
            color: theme.text.secondary,
            marginTop: 4,
            fontWeight: '600'
          }}>
            {seasons.length} Season{seasons.length !== 1 ? 's' : ''} Completed
          </Text>
        </View>
      </View>

      {seasons.length === 0 ? (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 40
        }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏁</Text>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '700', 
            color: theme.text.primary,
            textAlign: 'center'
          }}>
            No completed seasons yet
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: theme.text.tertiary,
            textAlign: 'center',
            marginTop: 8
          }}>
            Seasons will appear here once they finish
          </Text>
        </View>
      ) : (
        <FlatList
          data={seasons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => onSelectSeason(item)}
              style={{
                backgroundColor: theme.surface.elevated,
                borderRadius: 16,
                padding: 20,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              activeOpacity={0.8}
            >
              {/* Season Number */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.surface.darkest,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '900',
                  color: theme.text.muted,
                }}>
                  #{item.number}
                </Text>
              </View>

              {/* Winner Info */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  color: theme.text.primary,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}>
                  {item.winner ? 'Champion' : 'No Champion'}
                </Text>
                {item.winner ? (
                  <TouchableOpacity
                    onPress={() => onSelectChampion(item, item.winner?.id || '')}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      marginLeft: -8,
                      borderRadius: 8,
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: item.winner.color,
                      marginRight: 8,
                    }} />
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '800',
                      color: theme.text.primary,
                    }}>
                      {item.winner.name}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{
                    fontSize: 14,
                    color: theme.text.tertiary,
                    marginTop: 2,
                  }}>
                    Season data incomplete
                  </Text>
                )}
                {item.winner && (
                  <Text style={{
                    fontSize: 14,
                    color: theme.semantic.gold,
                    fontWeight: '700',
                    marginTop: 2,
                  }}>
                    {item.winner.points} points
                  </Text>
                )}
              </View>

              {/* Season Info */}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{
                  fontSize: 12,
                  color: theme.text.primary,
                  fontWeight: '600',
                }}>
                  {item.totalRaces || 0} races
                </Text>
                {item.completedAt && (
                  <Text style={{
                    fontSize: 11,
                    color: theme.text.tertiary,
                    marginTop: 4,
                  }}>
                    {new Date(item.completedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  </View>
);
