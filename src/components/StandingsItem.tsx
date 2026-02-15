import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Racer } from '../gameTypes';

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
    className="bg-[#1e293b] p-5 mb-4 mx-4 rounded-3xl"
    style={{ backgroundColor: '#1e293b', padding: 20, marginBottom: 16, marginHorizontal: 16, borderRadius: 24 }}
  >
    {/* Header: Rank, Color dot, Name, Points */}
    <View className="flex-row items-center mb-3" style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Text className="text-[#475569] font-mono font-bold text-xl mr-3" style={{ color: '#475569', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 20, marginRight: 12 }}>
        {(index + 1).toString().padStart(2, '0')}
      </Text>
      <View 
        className="w-10 h-10 rounded-full mr-3" 
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: racer.color, marginRight: 12 }} 
      />
      <View className="flex-1" style={{ flex: 1 }}>
        <Text className="text-white font-bold text-xl" style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{racer.name}</Text>
        <Text className="text-[#64748b] text-xs uppercase font-bold tracking-wider" style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
          {racer.strategy} • {racer.trackPreference}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-[#fbbf24] font-black text-2xl" style={{ color: '#fbbf24', fontWeight: '900', fontSize: 24 }}>{points}</Text>
        <Text className="text-[#64748b] text-[10px] uppercase font-bold tracking-wider" style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>PTS</Text>
      </View>
    </View>

    {/* Health Bar */}
    <View className="mb-3" style={{ marginBottom: 12 }}>
      <View className="flex-row justify-between mb-1" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text className="text-[#94a3b8] text-xs font-bold" style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>Health</Text>
        <Text className="text-white text-xs font-bold" style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{racer.health.toFixed(0)}%</Text>
      </View>
      <View className="h-2 bg-[#0f172a] rounded-full overflow-hidden" style={{ height: 8, backgroundColor: '#0f172a', borderRadius: 999, overflow: 'hidden' }}>
        <View 
          className="h-full rounded-full" 
          style={{ 
            height: '100%', 
            borderRadius: 999,
            width: `${racer.health}%`,
            backgroundColor: racer.health > 70 ? '#22c55e' : racer.health > 30 ? '#f59e0b' : '#ef4444'
          }} 
        />
      </View>
    </View>

    {/* Stats Row: Speed & Podiums */}
    <View className="flex-row justify-between items-center" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text className="text-[#94a3b8] text-xs" style={{ color: '#94a3b8', fontSize: 12 }}>
        Speed: <Text className="text-white font-bold" style={{ color: 'white', fontWeight: 'bold' }}>{racer.baseSpeed.toFixed(0)}</Text>
      </Text>
      
      <View className="flex-row" style={{ flexDirection: 'row' }}>
        <View className="flex-row items-center mr-3 bg-[#0f172a] px-2 py-1 rounded-md" style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
          <Text style={{ fontSize: 10, marginRight: 4 }}>🥇</Text>
          <Text className="text-[#fbbf24] text-xs font-bold" style={{ color: '#fbbf24', fontSize: 12, fontWeight: 'bold' }}>{stats.first}</Text>
        </View>
        <View className="flex-row items-center mr-3 bg-[#0f172a] px-2 py-1 rounded-md" style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
          <Text style={{ fontSize: 10, marginRight: 4 }}>🥈</Text>
          <Text className="text-[#94a3b8] text-xs font-bold" style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>{stats.second}</Text>
        </View>
        <View className="flex-row items-center bg-[#0f172a] px-2 py-1 rounded-md" style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
          <Text style={{ fontSize: 10, marginRight: 4 }}>🥉</Text>
          <Text className="text-[#b45309] text-xs font-bold" style={{ color: '#b45309', fontSize: 12, fontWeight: 'bold' }}>{stats.third}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);
