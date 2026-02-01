import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Racer } from '../gameTypes';

interface RosterItemProps {
  racer: Racer;
  onPress: (id: string) => void;
}

export const RosterItem = ({ racer, onPress }: RosterItemProps) => (
  <TouchableOpacity 
    onPress={() => onPress(racer.id)}
    className="bg-[#1e293b] p-5 mb-4 mx-4 rounded-3xl"
    style={{ backgroundColor: '#1e293b', padding: 20, marginBottom: 16, marginHorizontal: 16, borderRadius: 24 }}
  >
    <View className="flex-row justify-between items-center mb-2" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text className="text-white font-bold text-xl" style={{ color: racer.color, fontWeight: 'bold', fontSize: 20 }}>{racer.name}</Text>
      <Text className="text-[#64748b] text-xs uppercase font-bold tracking-wider" style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>{racer.strategy}</Text>
    </View>
    
    <View className="mb-4" style={{ marginBottom: 16 }}>
      <View className="flex-row justify-between mb-1" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text className="text-[#94a3b8] text-xs font-bold" style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>Health</Text>
        <Text className="text-white text-xs font-bold" style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{racer.health.toFixed(0)}%</Text>
      </View>
      <View className="h-2 bg-[#0f172a] rounded-full overflow-hidden" style={{ height: 8, backgroundColor: '#0f172a', borderRadius: 999, overflow: 'hidden' }}>
        <View className="h-full bg-[#22c55e]" style={{ height: '100%', backgroundColor: '#22c55e', width: `${racer.health}%` }} />
      </View>
    </View>

    <View className="flex-row justify-between" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text className="text-[#94a3b8] text-xs" style={{ color: '#94a3b8', fontSize: 12 }}>Speed: <Text className="text-white font-bold" style={{ color: 'white', fontWeight: 'bold' }}>{racer.baseSpeed.toFixed(0)}</Text></Text>
        <Text className="text-[#94a3b8] text-xs" style={{ color: '#94a3b8', fontSize: 12 }}>Pref: <Text className="text-white font-bold capitalize" style={{ color: 'white', fontWeight: 'bold', textTransform: 'capitalize' }}>{racer.trackPreference}</Text></Text>
    </View>
  </TouchableOpacity>
);