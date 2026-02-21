import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { theme } from '../theme';

interface TabButtonProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

export const TabButton = ({ title, active, onPress }: TabButtonProps) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={{ 
      paddingHorizontal: 20, 
      paddingVertical: 8, 
      borderRadius: 999, 
      marginLeft: 4, 
      backgroundColor: active ? theme.surface.elevated : 'transparent' 
    }}
  >
    <Text style={{ 
      fontSize: 12, 
      fontWeight: 'bold', 
      textTransform: 'uppercase', 
      letterSpacing: 1, 
      color: active ? theme.text.primary : theme.text.secondary 
    }}>{title}</Text>
  </TouchableOpacity>
);
