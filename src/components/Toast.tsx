import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  type?: 'info' | 'warning' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, visible, onHide, type = 'info' }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible, opacity, onHide]);

  if (!visible) return null;

  const backgroundColor = {
    info: '#4A895C',
    warning: '#F59E0B',
    error: '#EF4444',
  }[type];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 60,
          left: 16,
          right: 16,
          backgroundColor,
          padding: 16,
          borderRadius: 12,
          zIndex: 1000,
          opacity,
        },
      ]}
    >
      <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
        {message}
      </Text>
    </Animated.View>
  );
};
