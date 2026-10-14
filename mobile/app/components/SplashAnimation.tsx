import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Heart, Shirt, ShoppingBag, Sparkles, Truck } from 'lucide-react-native';
import HlopokLogo from './HlopokLogo';

const SplashAnimation = () => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const compactScreen = screenHeight < 500;
  const roomyScreen = !compactScreen && screenWidth >= 700;
  const sceneWidth = roomyScreen
    ? Math.min(screenWidth * 0.76, 760)
    : Math.min(screenWidth - 32, 360);
  const sceneHeight = roomyScreen ? 350 : compactScreen ? 224 : 272;
  const bagSize = Math.min(roomyScreen ? 144 : 116, sceneWidth * 0.32);
  const itemSize = Math.min(roomyScreen ? 72 : 56, Math.max(48, sceneWidth * 0.15));
  const truckSize = roomyScreen ? 64 : 52;
  const bagLeft = (sceneWidth - bagSize) / 2;
  const itemLeft = (sceneWidth - itemSize) / 2;
  const trackLeft = sceneWidth * 0.14;
  const trackWidth = sceneWidth * 0.72;
  const truckLeft = trackLeft + 4;
  const truckTravel = trackLeft + trackWidth - truckSize - truckLeft;
  const bagTop = sceneHeight * 0.19;
  const itemTop = sceneHeight * 0.035;
  const roadTop = sceneHeight - 34;
  const truckTop = roadTop - truckSize * 0.62;
  const trackTop = sceneHeight - 10;

  const opacity = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const shoppingProgress = useRef(new Animated.Value(0)).current;
  const shoppingLoop = useRef<Animated.CompositeAnimation | null>(null);
  const logoPulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);

    entrance.start(({ finished }) => {
      if (!finished) return;
      shoppingLoop.current = Animated.loop(Animated.timing(shoppingProgress, {
        toValue: 1,
        duration: 2100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
        isInteraction: false,
      }));
      shoppingLoop.current.start();
      logoPulseLoop.current = Animated.loop(Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.035,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]));
      logoPulseLoop.current.start();
    });

    return () => {
      entrance.stop();
      shoppingLoop.current?.stop();
      logoPulseLoop.current?.stop();
    };
  }, [opacity, rise, shoppingProgress]);

  const shirtY = shoppingProgress.interpolate({ inputRange: [0, 0.16, 0.5, 1], outputRange: [-18, 0, bagSize * 0.52, bagSize * 0.52] });
  const shirtOpacity = shoppingProgress.interpolate({ inputRange: [0, 0.1, 0.32, 0.5, 1], outputRange: [0, 1, 1, 0, 0] });
  const bagScale = shoppingProgress.interpolate({ inputRange: [0, 0.16, 0.35, 0.55, 1], outputRange: [1, 1, 1.045, 1, 1] });
  const truckX = shoppingProgress.interpolate({ inputRange: [0, 0.45, 0.95, 1], outputRange: [0, 0, truckTravel * 0.9, truckTravel] });
  const truckOpacity = shoppingProgress.interpolate({ inputRange: [0, 0.44, 0.55, 0.91, 1], outputRange: [0, 0, 1, 1, 0] });
  const lineScale = shoppingProgress.interpolate({ inputRange: [0, 0.45, 0.95, 1], outputRange: [0.05, 0.05, 1, 1] });
  const sparkleOpacity = shoppingProgress.interpolate({ inputRange: [0, 0.15, 0.3, 0.7, 1], outputRange: [0.45, 0.85, 1, 0.7, 0.45] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY: rise }] }]}>
        <Animated.View style={[styles.logoPulse, { transform: [{ scale: logoPulse }] }]}>
          <HlopokLogo size="hero" />
        </Animated.View>
        <View style={[styles.scene, { width: sceneWidth, height: sceneHeight }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Animated.View style={[styles.sparkle, {
            left: bagLeft - (roomyScreen ? 78 : 48),
            top: bagTop + bagSize * 0.28,
            opacity: sparkleOpacity,
          }]}>
            <Sparkles size={roomyScreen ? 30 : 22} color="#D6A91C" strokeWidth={1.8} />
          </Animated.View>
          <Animated.View style={[styles.sparkle, {
            left: bagLeft + bagSize + (roomyScreen ? 48 : 26),
            top: bagTop + bagSize * 0.5,
            opacity: sparkleOpacity,
          }]}>
            <Heart size={roomyScreen ? 24 : 18} color="#D77675" fill="#F7D5D0" strokeWidth={1.8} />
          </Animated.View>
          <Animated.View style={[styles.shirt, {
            left: itemLeft,
            top: itemTop,
            opacity: shirtOpacity,
            transform: [{ translateY: shirtY }],
          }]}>
            <Shirt size={itemSize} color="#344D3F" fill="#DAEEF2" strokeWidth={1.8} />
          </Animated.View>
          <Animated.View style={[styles.bag, {
            left: bagLeft,
            top: bagTop,
            width: bagSize,
            height: bagSize,
            transform: [{ scale: bagScale }],
          }]}>
            <ShoppingBag size={bagSize} color="#344D3F" fill="#FFE68A" strokeWidth={1.5} />
          </Animated.View>
          <View style={[styles.road, { top: roadTop, left: trackLeft, width: trackWidth }]} />
          <Animated.View style={[styles.truck, {
            left: truckLeft,
            top: truckTop,
            opacity: truckOpacity,
            transform: [{ translateX: truckX }],
          }]}>
            <Truck size={truckSize} color="#344D3F" strokeWidth={1.8} />
          </Animated.View>
          <View style={[styles.track, { top: trackTop, left: trackLeft, width: trackWidth }]}>
            <Animated.View style={[styles.progress, { transform: [{ scaleX: lineScale }] }]} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { width: '100%', paddingHorizontal: 8, alignItems: 'center', gap: 32 },
  logoPulse: { alignItems: 'center' },
  scene: { position: 'relative' },
  shirt: { position: 'absolute' },
  bag: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  sparkle: { position: 'absolute' },
  truck: { position: 'absolute' },
  road: { position: 'absolute', height: 1, backgroundColor: '#E7EBE8' },
  track: { position: 'absolute', height: 4, backgroundColor: '#F0F2EF', overflow: 'hidden', borderRadius: 2 },
  progress: { width: 120, height: 4, backgroundColor: '#FFD64B', borderRadius: 2 },
});

export default SplashAnimation;
