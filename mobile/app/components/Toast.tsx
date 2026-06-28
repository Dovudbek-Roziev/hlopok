import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';
import { Text, XStack } from 'tamagui';
import { CircleCheck, CircleX, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '../store/toastStore';
import { useColors } from '../theme/useColors';

const ICONS = { success: CircleCheck, error: CircleX, info: Info };

const Toast = () => {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const { visible, message, type, hide } = useToastStore();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!message) return null;

  const accent = type === 'success' ? Colors.green : type === 'error' ? Colors.red : Colors.brand;
  const Icon = ICONS[type];

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={{
        position: 'absolute',
        left: 16, right: 16,
        top: insets.top + 8,
        zIndex: 999,
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={hide}>
        <XStack
          backgroundColor={Colors.white}
          borderRadius={14}
          paddingVertical={12}
          paddingHorizontal={14}
          alignItems="center"
          gap={10}
          style={{
            borderLeftWidth: 4, borderLeftColor: accent,
            shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <Icon color={accent} size={20} />
          <Text flex={1} color={Colors.black} fontSize={14} fontWeight="600">{message}</Text>
        </XStack>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Toast;
