import React from 'react';
import { View } from 'react-native';
import { Text } from 'tamagui';
import { useColors } from '../theme/useColors';

interface Props {
  size?: 'sm' | 'lg';
}

const HlopokLogo = ({ size = 'sm' }: Props) => {
  const Colors = useColors();
  const fontSize = size === 'lg' ? 36 : 22;
  const subSize  = size === 'lg' ? 11 : 9;

  return (
    <View style={{ alignItems: 'flex-start' }}>
      <Text fontSize={subSize} color={Colors.grayDark} letterSpacing={1.2} fontWeight="500">
        одежда для детей
      </Text>
      <Text fontSize={fontSize} fontWeight="900" color={Colors.black} letterSpacing={1.5}
        style={{ lineHeight: fontSize * 1.1 }}>
        ХЛОПОК
      </Text>
    </View>
  );
};

export default HlopokLogo;
