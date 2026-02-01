import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Racer } from '../gameTypes';

interface RacerProfileProps {
  stats: Racer & { first: number; second: number; third: number; racesRun: number };
  onBack: () => void;
}

export const RacerProfile = ({ stats, onBack }: RacerProfileProps) => (
      <View className="flex-1 p-4" style={{ flex: 1, padding: 16 }}>
        <View className="bg-[#1e293b] rounded-[32px] overflow-hidden shadow-2xl" style={{ backgroundColor: '#1e293b', borderRadius: 32, overflow: 'hidden' }}>
          
          {/* Header Banner */}
          <View className="bg-[#020617] p-8 items-center" style={{ backgroundColor: '#020617', padding: 32, alignItems: 'center' }}>
             <View className="w-28 h-28 rounded-full mb-4 border-4 border-[#1e293b]" style={{ width: 112, height: 112, borderRadius: 56, marginBottom: 16, backgroundColor: stats.color, borderColor: '#1e293b', borderWidth: 4 }} />
             <Text className="text-4xl font-black text-white tracking-tighter" style={{ fontSize: 36, fontWeight: '900', color: 'white', letterSpacing: -1 }}>{stats.name}</Text>
             <View className="bg-[#1e293b] px-4 py-1.5 rounded-full mt-3" style={{ backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginTop: 12 }}>
                <Text className="text-[#6366f1] text-xs font-bold uppercase tracking-widest" style={{ color: '#6366f1', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 }}>{stats.strategy}</Text>
             </View>
          </View>

          <View className="p-6" style={{ padding: 24, backgroundColor: '#1e293b' }}>
            {/* Stats Grid */}
            <View className="flex-row flex-wrap justify-between mb-6" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
                <View className="w-[48%] bg-[#0f172a] p-4 rounded-2xl mb-3" style={{ width: '48%', backgroundColor: '#0f172a', padding: 16, borderRadius: 16, marginBottom: 12 }}>
                    <Text className="text-[#64748b] text-[10px] uppercase font-bold mb-1 tracking-wider" style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Health</Text>
                    <Text className="text-white font-bold text-xl" style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{stats.health.toFixed(0)}%</Text>
                    <View className="h-1.5 bg-[#1e293b] rounded-full mt-3 overflow-hidden" style={{ height: 6, backgroundColor: '#1e293b', borderRadius: 999, marginTop: 12, overflow: 'hidden' }}>
                        <View className="h-full bg-[#22c55e]" style={{ height: '100%', backgroundColor: '#22c55e', width: `${stats.health}%` }} />
                    </View>
                </View>
                <View className="w-[48%] bg-[#0f172a] p-4 rounded-2xl mb-3" style={{ width: '48%', backgroundColor: '#0f172a', padding: 16, borderRadius: 16, marginBottom: 12 }}>
                    <Text className="text-[#64748b] text-[10px] uppercase font-bold mb-1 tracking-wider" style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Speed</Text>
                    <Text className="text-white font-bold text-xl" style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{stats.baseSpeed.toFixed(0)}</Text>
                     <View className="h-1.5 bg-[#1e293b] rounded-full mt-3 overflow-hidden" style={{ height: 6, backgroundColor: '#1e293b', borderRadius: 999, marginTop: 12, overflow: 'hidden' }}>
                        <View className="h-full bg-[#6366f1]" style={{ height: '100%', backgroundColor: '#6366f1', width: `${Math.min(100, stats.baseSpeed)}%` }} />
                    </View>
                </View>
                <View className="w-[48%] bg-[#0f172a] p-4 rounded-2xl" style={{ width: '48%', backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
                    <Text className="text-[#64748b] text-[10px] uppercase font-bold mb-1 tracking-wider" style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Preference</Text>
                    <Text className="text-white font-bold text-xl capitalize" style={{ color: 'white', fontWeight: 'bold', fontSize: 20, textTransform: 'capitalize' }}>{stats.trackPreference}</Text>
                </View>
                <View className="w-[48%] bg-[#0f172a] p-4 rounded-2xl" style={{ width: '48%', backgroundColor: '#0f172a', padding: 16, borderRadius: 16 }}>
                    <Text className="text-[#64748b] text-[10px] uppercase font-bold mb-1 tracking-wider" style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Races</Text>
                    <Text className="text-white font-bold text-xl" style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{stats.racesRun}</Text>
                </View>
            </View>

            <Text className="text-[#64748b] mb-4 font-bold uppercase text-xs tracking-widest" style={{ color: '#64748b', marginBottom: 16, fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12, letterSpacing: 2 }}>Season Performance</Text>
            <View className="flex-row justify-between" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View className="items-center bg-[#0f172a] p-4 rounded-2xl w-[30%]" style={{ alignItems: 'center', backgroundColor: '#0f172a', padding: 16, borderRadius: 16, width: '30%' }}>
                <Text className="text-2xl mb-1">🥇</Text>
                <Text className="text-white text-3xl font-black" style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>{stats.first}</Text>
                <Text className="text-[#fbbf24] text-xs font-bold uppercase" style={{ color: '#fbbf24', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>1st</Text>
              </View>
              <View className="items-center bg-[#0f172a] p-4 rounded-2xl w-[30%]" style={{ alignItems: 'center', backgroundColor: '#0f172a', padding: 16, borderRadius: 16, width: '30%' }}>
                <Text className="text-2xl mb-1">🥈</Text>
                <Text className="text-white text-3xl font-black" style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>{stats.second}</Text>
                <Text className="text-[#94a3b8] text-xs font-bold uppercase" style={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>2nd</Text>
              </View>
              <View className="items-center bg-[#0f172a] p-4 rounded-2xl w-[30%]" style={{ alignItems: 'center', backgroundColor: '#0f172a', padding: 16, borderRadius: 16, width: '30%' }}>
                <Text className="text-2xl mb-1">🥉</Text>
                <Text className="text-white text-3xl font-black" style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>{stats.third}</Text>
                <Text className="text-[#b45309] text-xs font-bold uppercase" style={{ color: '#b45309', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>3rd</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
);