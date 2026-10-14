import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

interface Props {
  size?: 'compact' | 'sm' | 'header' | 'lg' | 'hero';
  tone?: 'dark' | 'light';
  align?: 'left' | 'center';
}

const SIZES = {
  compact: { width: 154, title: 28, tagline: 9 },
  sm: { width: 150, title: 25, tagline: 8 },
  header: { width: 196, title: 34, tagline: 10 },
  lg: { width: 254, title: 44, tagline: 11 },
  hero: { width: 304, title: 60, tagline: 14 },
};

const CottonMark = ({ size }: { size: number }) => (
  <Svg width={size} height={size * 1.125} viewBox="0 0 256 288" fill="none">
    <G stroke="#242923" strokeLinejoin="round" strokeLinecap="round">
      <Path d="M48 153 C29 145 23 125 37 110 C30 80 48 51 80 57 C91 29 117 19 140 27 C158 33 170 46 174 62 C198 62 212 81 209 105 C232 120 234 145 217 163 C231 188 215 213 191 218 C174 235 146 230 130 220 C104 234 77 219 72 199 C50 197 39 175 48 153Z" fill="#FFFDFC" strokeWidth="4.4" />
      <Path d="M80 57 C88 57 96 60 104 64 C92 63 82 68 75 77" strokeWidth="3.2" />
      <Path d="M70 88 C51 120 57 149 77 168" strokeWidth="2.7" />
      <Path d="M170 170 C183 163 193 151 197 143" strokeWidth="2.7" />
      <Path d="M184 203 C198 198 208 187 212 174" strokeWidth="2.7" />
      <Path d="M94 205 C70 188 26 159 14 113 C13 146 31 177 61 196 L88 215Z" fill="#43B75D" strokeWidth="3.5" />
      <Path d="M92 208 C108 177 140 147 132 103 C128 126 109 142 99 164 C91 182 86 195 92 208Z" fill="#48B95C" strokeWidth="3.5" />
      <Path d="M93 211 C124 184 156 166 196 146 C183 167 167 196 140 207 C126 213 111 216 93 211Z" fill="#39A956" strokeWidth="3.5" />
      <Path d="M94 214 C134 213 170 214 220 236 C180 232 155 245 125 230Z" fill="#3EAF58" strokeWidth="3.5" />
      <Path d="M90 209 C82 233 69 251 42 268 L51 278 C79 262 96 239 103 216Z" fill="#39B25C" strokeWidth="3.7" />
      <Path d="M32 151 C48 176 70 196 92 211" stroke="#277642" strokeWidth="2.2" />
      <Path d="M96 199 C105 171 120 149 129 124" stroke="#287B42" strokeWidth="2.1" />
      <Path d="M102 208 C133 195 161 176 183 158" stroke="#226B3B" strokeWidth="2.2" />
      <Path d="M108 219 C142 226 173 229 199 233" stroke="#287342" strokeWidth="2.2" />
    </G>
  </Svg>
);

const HlopokLogo = ({ size = 'sm', tone = 'dark', align = 'center' }: Props) => {
  const metrics = SIZES[size];
  const light = tone === 'light';

  return (
    <View
      style={[styles.container, { width: metrics.width, alignItems: align === 'left' ? 'flex-start' : 'center' }]}
      accessible
      accessibilityLabel="Хлопок, одежда для детей"
    >
      <View style={styles.lockup}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          maxFontSizeMultiplier={1}
          style={[styles.tagline, {
            fontSize: metrics.tagline,
            lineHeight: metrics.tagline * 1.2,
            marginBottom: -(metrics.title * 0.15 + metrics.tagline * 0.05),
            transform: [{ translateY: metrics.tagline * 0.3 }],
            color: light ? '#DDE6EC' : '#29251F',
          }]}
        >одежда для детей</Text>
        <View style={styles.nameRow}>
          <Text maxFontSizeMultiplier={1} style={[styles.name, {
            fontSize: metrics.title,
            lineHeight: metrics.title * 1.15,
            color: light ? '#FFFFFF' : '#171512',
          }]}>ХЛОП</Text>
          <CottonMark size={metrics.title} />
          <Text maxFontSizeMultiplier={1} style={[styles.name, {
            fontSize: metrics.title,
            lineHeight: metrics.title * 1.15,
            color: light ? '#FFFFFF' : '#171512',
          }]}>К</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '100%',
    flexShrink: 1,
    justifyContent: 'center',
  },
  lockup: {
    alignItems: 'flex-start',
  },
  tagline: {
    color: '#29251F',
    fontWeight: '700',
    textAlign: 'left',
    includeFontPadding: false,
  },
  name: {
    color: '#171512',
    fontWeight: '900',
    includeFontPadding: false,
    letterSpacing: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default HlopokLogo;
