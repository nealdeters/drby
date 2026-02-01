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
        className="flex-row items-center bg-[#1e293b] p-5 mb-4 rounded-3xl"
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, marginBottom: 16, borderRadius: 24 }}
      >
        <Text className="text-[#475569] font-mono font-bold w-10 text-xl mr-2" style={{ color: '#475569', fontFamily: 'monospace', fontWeight: 'bold', width: 40, fontSize: 20, marginRight: 8 }}>{(index + 1).toString().padStart(2, '0')}</Text>
        <View className="w-12 h-12 rounded-full mr-5 border-4 border-[#0f172a]" style={{ width: 48, height: 48, borderRadius: 24, marginRight: 20, backgroundColor: racer.color, borderColor: '#0f172a', borderWidth: 4 }} />
        <View className="flex-1" style={{ flex: 1 }}>
          <Text className="text-white text-xl font-bold" style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{racer.name}</Text>
          <View className="flex-row mt-1" style={{ flexDirection: 'row', marginTop: 4 }}>
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
        <View className="items-end">
            <Text className="text-[#fbbf24] font-black text-2xl" style={{ color: '#fbbf24', fontWeight: '900', fontSize: 24 }}>{points}</Text>
            <Text className="text-[#64748b] text-[10px] uppercase font-bold tracking-wider" style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>PTS</Text>
        </View>
      </TouchableOpacity>
);