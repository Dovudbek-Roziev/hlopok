import React from 'react';
import { Image } from 'react-native';

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
    <Image
      source={require('../../assets/logo.png')}
      style={{ width, height }}
      resizeMode="contain"
    />
  );
};

export default BrandLogo;
