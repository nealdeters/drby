import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { theme, layout } from '../theme';
import { CompletedSeason, RacerSeasonStats } from '../hooks/useSeason';

interface SeasonsListProps {
  seasons: CompletedSeason[];
  onBack: () => void;
  onSelectSeason: (season: CompletedSeason) => void;
  onSelectChampion: (season: CompletedSeason, racerId: string) => void;
}

const getTopThree = (season: CompletedSeason): RacerSeasonStats[] => {
  if (season.racerStats && season.racerStats.length > 0) {
    return [...season.racerStats].sort((a, b) => b.points - a.points).slice(0, 3);
  }
  if (season.finalStandings) {
    const entries = Object.entries(season.finalStandings);
    return entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, points]) => ({
        id,
        name: `Racer ${id}`,
        color: '#888888',
        baseSpeed: 50,
        health: 100,
        strategy: 'balanced',
        trackPreference: 'asphalt',
        acceleration: 50,
        endurance: 50,
        consistency: 50,
        staminaRecovery: 50,
        points,
        first: 0,
        second: 0,
        third: 0,
        racesRun: 0,
      }));
  }
  return [];
};

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
          renderItem={({ item, index }) => {
            const topThree = getTopThree(item);
            return (
            <TouchableOpacity
              onPress={() => onSelectSeason(item)}
              style={{
                backgroundColor: theme.surface.elevated,
                borderRadius: 16,
                padding: 20,
                marginBottom: 12,
              }}
              activeOpacity={0.8}
            >
              {/* Season Number and Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
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
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 12,
                    color: theme.text.secondary,
                  }}>
                    {item.totalRaces || 0} races
                  </Text>
                  {item.completedAt && (
                    <Text style={{
                      fontSize: 11,
                      color: theme.text.tertiary,
                      marginTop: 2,
                    }}>
                      {new Date(item.completedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>

              {/* Top 3 Podium */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingTop: 8 }}>
                {/* 2nd Place */}
                {topThree[1] && (
                  <TouchableOpacity
                    onPress={() => onSelectChampion(item, topThree[1].id)}
                    style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}
                    activeOpacity={0.7}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: topThree[1].color, marginBottom: 8, borderWidth: 2, borderColor: '#C0C0C0' }} />
                    <Text style={{ fontSize: 28, marginBottom: 4 }}>🥈</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text.primary, textAlign: 'center' }} numberOfLines={1}>
                      {topThree[1].name}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.text.secondary }}>
                      {topThree[1].points} pts
                    </Text>
                    <View style={{ width: '100%', height: 60, backgroundColor: '#C0C0C0', borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 8, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
                      <Text style={{ color: '#333', fontWeight: '800', fontSize: 16 }}>2</Text>
                    </View>
                  </TouchableOpacity>
                )}
                
                {/* 1st Place */}
                {topThree[0] && (
                  <TouchableOpacity
                    onPress={() => onSelectChampion(item, topThree[0].id)}
                    style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}
                    activeOpacity={0.7}
                  >
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: topThree[0].color, marginBottom: 8, borderWidth: 3, borderColor: '#FFD700' }} />
                    <Text style={{ fontSize: 36, marginBottom: 4 }}>🥇</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text.primary, textAlign: 'center' }} numberOfLines={1}>
                      {topThree[0].name}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.text.secondary }}>
                      {topThree[0].points} pts
                    </Text>
                    <View style={{ width: '100%', height: 80, backgroundColor: '#FFD700', borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 8, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
                      <Text style={{ color: '#333', fontWeight: '800', fontSize: 20 }}>1</Text>
                    </View>
                  </TouchableOpacity>
                )}
                
                {/* 3rd Place */}
                {topThree[2] && (
                  <TouchableOpacity
                    onPress={() => onSelectChampion(item, topThree[2].id)}
                    style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}
                    activeOpacity={0.7}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: topThree[2].color, marginBottom: 8, borderWidth: 2, borderColor: '#CD7F32' }} />
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>🥉</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text.primary, textAlign: 'center' }} numberOfLines={1}>
                      {topThree[2].name}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.text.secondary }}>
                      {topThree[2].points} pts
                    </Text>
                    <View style={{ width: '100%', height: 48, backgroundColor: '#CD7F32', borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 8, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
                      <Text style={{ color: '#333', fontWeight: '800', fontSize: 14 }}>3</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
          }}
        />
      )}
    </View>
  </View>
);
