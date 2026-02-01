import React from 'react';
import { View, Text } from 'react-native';
import { Track } from '../gameTypes';

interface TrackItemProps {
  track: Track;
}

export const TrackItem = ({ track }: TrackItemProps) => {
  let surfaceColor = '#334155';
  if (track.surface === 'grass') surfaceColor = '#14532d';
  if (track.surface === 'dirt') surfaceColor = '#78350f';

  return (
    <View 
      className="bg-[#1e293b] mb-4 mx-4 rounded-3xl overflow-hidden"
      style={{ backgroundColor: '#1e293b', marginBottom: 16, marginHorizontal: 16, borderRadius: 24, overflow: 'hidden' }}
    >
      <View className="h-2 w-full" style={{ height: 8, width: '100%', backgroundColor: surfaceColor }} />
      <View className="p-6" style={{ padding: 24 }}>
        <View className="flex-row justify-between items-start mb-4" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View>
            <Text className="text-white font-black text-2xl" style={{ color: 'white', fontWeight: '900', fontSize: 24 }}>{track.name}</Text>
            <Text className="text-[#64748b] text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 }}>{track.surface} Circuit</Text>
          </View>
          <View className="bg-[#0f172a] px-3 py-1.5 rounded-full" style={{ backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
            <Text className="text-[#94a3b8] font-bold text-xs" style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>ID: {track.id.toUpperCase()}</Text>
          </View>
        </View>
        
        <View className="flex-row bg-[#0f172a] p-5 rounded-2xl justify-between" style={{ flexDirection: 'row', backgroundColor: '#0f172a', padding: 20, borderRadius: 16, justifyContent: 'space-between' }}>
          <View className="items-center flex-1" style={{ alignItems: 'center', flex: 1 }}>
            <Text className="text-[#64748b] text-[10px] uppercase font-bold mb-1 tracking-wider" style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 }}>Distance</Text>
            <Text className="text-white font-bold text-xl" style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{track.length}m</Text>
          </View>
          <View className="w-[1px] bg-[#1e293b]" style={{ width: 1, backgroundColor: '#1e293b' }} />
          <View className="items-center flex-1" style={{ alignItems: 'center', flex: 1 }}>
            <Text className="text-[#64748b] text-[10px] uppercase font-bold mb-1 tracking-wider" style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 }}>Laps</Text>
            <Text className="text-white font-bold text-xl" style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{track.laps}</Text>
          </View>
          <View className="w-[1px] bg-[#1e293b]" style={{ width: 1, backgroundColor: '#1e293b' }} />
          <View className="items-center flex-1" style={{ alignItems: 'center', flex: 1 }}>
            <Text className="text-[#64748b] text-[10px] uppercase font-bold mb-1 tracking-wider" style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 }}>Total</Text>
            <Text className="text-[#6366f1] font-bold text-xl" style={{ color: '#6366f1', fontWeight: 'bold', fontSize: 20 }}>{track.length * track.laps}m</Text>
          </View>
        </View>
      </View>
    </View>
  );
};