import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Racer } from '../gameTypes';
import { formatRaceTime } from '../utils/format';

interface RacerItemProps {
  racer: Racer;
  index: number;
  onPress: (id: string) => void;
}

export const RacerItem = ({ racer, index, onPress }: RacerItemProps) => (
    <TouchableOpacity 
      onPress={() => onPress(racer.id)}
      className="flex-row items-center bg-[#1e293b] p-5 mb-4 rounded-3xl"
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, marginBottom: 16, borderRadius: 24 }}
    >
      <Text className="text-[#475569] font-mono font-bold w-10 text-xl" style={{ color: '#475569', fontFamily: 'monospace', fontWeight: 'bold', width: 40, fontSize: 20 }}>{(index + 1).toString().padStart(2, '0')}</Text>
      <View className="w-3 h-3 rounded-full mr-4" style={{ width: 12, height: 12, borderRadius: 6, marginRight: 16, backgroundColor: racer.color }} />
      <View className="flex-1" style={{ flex: 1 }}>
        <Text className="text-white text-lg font-bold" style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{racer.name}</Text>
        <Text className="text-[#94a3b8] text-xs font-bold uppercase tracking-wider mt-1" style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
          {racer.status === 'finished' 
            ? `Time: ${formatRaceTime(racer.finishTime!)}` 
            : racer.status === 'injured' 
            ? 'Injured' 
            : `Lap ${racer.laps + 1}`}
        </Text>
      </View>
      <Text className="text-[#6366f1] font-mono font-bold text-lg" style={{ color: '#6366f1', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 18 }}>{racer.totalDistance.toFixed(0)}m</Text>
    </TouchableOpacity>
);