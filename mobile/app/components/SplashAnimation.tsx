import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions, Easing } from 'react-native';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const LETTERS = ['Х', 'Л', 'О', 'П', 'О', 'К'];

const DOTS = [
  { x: 0.10, y: 0.14, size: 16 },
  { x: 0.86, y: 0.18, size: 10 },
  { x: 0.06, y: 0.62, size: 13 },
  { x: 0.91, y: 0.56, size: 18 },
  { x: 0.74, y: 0.84, size: 9 },
  { x: 0.20, y: 0.80, size: 12 },
  { x: 0.52, y: 0.08, size: 8 },
  { x: 0.64, y: 0.91, size: 11 },
];

const SplashAnimation = () => {
  const circleScale   = useRef(new Animated.Value(0)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;

  const letterScales = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const letterOpas   = useRef(LETTERS.map(() => new Animated.Value(0))).current;

  // Wave (bounce) animatsiyasi uchun alohida
  const waveY = useRef(LETTERS.map(() => new Animated.Value(0))).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY       = useRef(new Animated.Value(12)).current;
  const lineWidth      = useRef(new Animated.Value(0)).current;
  const dotAnims       = useRef(DOTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // 1) Oq doira chiqadi
    Animated.parallel([
      Animated.timing(circleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(circleScale, { toValue: 1, tension: 45, friction: 7, useNativeDriver: true }),
    ]).start();

    // 2) Nuqtalar tarqaladi
    Animated.stagger(45, dotAnims.map(a =>
      Animated.spring(a, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true })
    )).start();

    // 3) Harflar bir-bir scale bilan chiqadi
    LETTERS.forEach((_, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(letterScales[i], { toValue: 1, tension: 240, friction: 7, useNativeDriver: true }),
          Animated.timing(letterOpas[i], { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
      }, 250 + i * 80);
    });

    // 4) Chiziq chiqadi
    Animated.timing(lineWidth, {
      toValue: 1, duration: 380, delay: 820,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();

    // 5) Tagline chiqadi
    Animated.parallel([
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, delay: 980, useNativeDriver: true }),
      Animated.timing(taglineY, { toValue: 0, duration: 400, delay: 980, useNativeDriver: true }),
    ]).start();

    // 6) Kirish tugagach — to'lqin (wave) sikli boshlanadi va app tayyor bo'lguncha davom etadi
    const startWaveLoop = () => {
      Animated.stagger(70, waveY.map(y =>
        Animated.sequence([
          Animated.timing(y, { toValue: -14, duration: 190, useNativeDriver: true }),
          Animated.timing(y, { toValue: 0,   duration: 190, useNativeDriver: true }),
        ])
      )).start(() => {
        setTimeout(startWaveLoop, 650);
      });
    };

    const waveTimer = setTimeout(startWaveLoop, 1350);
    return () => clearTimeout(waveTimer);
  }, []);

  const lineInterp = lineWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 230] });

  return (
    <View style={styles.container}>
      {/* Oq doira */}
      <Animated.View style={[styles.circle, {
        opacity: circleOpacity,
        transform: [{ scale: circleScale }],
      }]} />

      {/* Floating dots */}
      {DOTS.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, {
          left: d.x * width  - d.size / 2,
          top:  d.y * height - d.size / 2,
          width: d.size, height: d.size, borderRadius: d.size / 2,
          opacity:   dotAnims[i],
          transform: [{ scale: dotAnims[i] }],
        }]} />
      ))}

      {/* Kontent */}
      <View style={styles.content}>
        {/* "одежда для детей" */}
        <Animated.Text style={[styles.sub, { opacity: taglineOpacity, transform: [{ translateY: taglineY }] }]}>
          одежда для детей
        </Animated.Text>

        {/* ХЛОПОК — kirish + to'lqin */}
        <View style={styles.lettersRow}>
          {LETTERS.map((letter, i) => (
            <Animated.Text
              key={i}
              style={[styles.letter, {
                opacity: letterOpas[i],
                transform: [
                  { scale: letterScales[i] },
                  { translateY: waveY[i] },
                ],
              }]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>

        {/* Chiziq */}
        <Animated.View style={[styles.underline, { width: lineInterp }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    width: width * 0.82,
    height: width * 0.82,
    borderRadius: width * 0.41,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  dot: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.60)',
  },
  content: {
    alignItems: 'center',
  },
  sub: {
    fontSize: 13,
    color: '#6B3A1F',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  letter: {
    fontSize: 66,
    fontWeight: '900',
    color: '#1A1A1A',
    marginHorizontal: 1,
  },
  underline: {
    height: 3,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    opacity: 0.70,
  },
});

export default SplashAnimation;
