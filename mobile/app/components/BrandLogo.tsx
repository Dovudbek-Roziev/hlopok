import React from 'react';
import { View } from 'react-native';
import HlopokLogo from './HlopokLogo';

interface Props {
  size?: 'small' | 'medium' | 'large';
}

const SIZES = {
  large:  { width: 300, height: 220 },
  medium: { width: 340, height: 126  },
  small:  { width: 270, height: 168  },
};

const BrandLogo = ({ size = 'large' }: Props) => {
  const { width, height } = SIZES[size];
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <HlopokLogo size="lg" />
    </View>
  );
};

export default BrandLogo;
