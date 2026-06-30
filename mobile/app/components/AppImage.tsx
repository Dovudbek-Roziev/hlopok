import React, { useState } from 'react';
import { Image, YStack } from 'tamagui';
import { Package } from 'lucide-react-native';
import { useColors } from '../theme/useColors';

type Props = {
  uri?: string;
  width?: number | string;
  height?: number | string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  borderRadius?: number;
  style?: any;
};

const AppImage = ({ uri, width = '100%', height = 160, resizeMode = 'cover', borderRadius = 0, style }: Props) => {
  const Colors = useColors();
  const [error, setError] = useState(false);

  if (!uri || error) {
    return (
      <YStack
        width={width as any}
        height={height as any}
        backgroundColor={Colors.grayLight}
        alignItems="center"
        justifyContent="center"
        borderRadius={borderRadius}
        style={style}
      >
        <Package color={Colors.gray} size={32} />
      </YStack>
    );
  }

  return (
    <Image
      source={{ uri }}
      width={width as any}
      height={height as any}
      resizeMode={resizeMode}
      borderRadius={borderRadius}
      style={style}
      onError={() => setError(true)}
    />
  );
};

export default AppImage;
