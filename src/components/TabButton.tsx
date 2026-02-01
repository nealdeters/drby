import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface TabButtonProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

export const TabButton = ({ title, active, onPress }: TabButtonProps) => (
  <TouchableOpacity 
    onPress={onPress} 
    className={`px-5 py-2 rounded-full ml-1 ${active ? 'bg-[#6366f1]' : 'bg-transparent'}`}
    style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, marginLeft: 4, backgroundColor: active ? '#6366f1' : 'transparent' }}
  >
    <Text className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-[#64748b]'}`} style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: active ? 'white' : '#64748b' }}>{title}</Text>
  </TouchableOpacity>
);