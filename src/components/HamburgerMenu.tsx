import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { theme } from '../theme';

interface NavItem {
  id: string;
  title: string;
  onPress: () => void;
}

interface HamburgerMenuProps {
  items: NavItem[];
  activeView: string;
  onClose: () => void;
  visible: boolean;
}

export const HamburgerMenu = ({ items, activeView, onClose, visible }: HamburgerMenuProps) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity 
      style={{ flex: 1, backgroundColor: 'rgba(10, 13, 20, 0.8)' }}
      onPress={onClose}
      activeOpacity={1}
    >
       <View 
         style={{ 
           backgroundColor: theme.surface.darkest, 
           borderRadius: 16, 
           margin: 12, 
           marginTop: 70,
           padding: 6,
           shadowColor: '#000',
           shadowOffset: { width: 0, height: 4 },
           shadowOpacity: 0.3,
           shadowRadius: 8,
           maxWidth: 280,
           alignSelf: 'flex-end'
         }}
       >
        {items.map((item) => (
           <TouchableOpacity
             key={item.id}
             onPress={() => {
               item.onPress();
               onClose();
             }}
             style={{ 
               paddingHorizontal: 16, 
               paddingVertical: 12,
               borderRadius: 12,
               backgroundColor: activeView === item.id ? theme.surface.elevated : 'transparent',
               marginVertical: 2,
             }}
           >
            <Text 
              style={{ 
                color: activeView === item.id ? theme.text.primary : theme.text.muted, 
                fontSize: 16, 
                fontWeight: '600',
              }}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  </Modal>
);
