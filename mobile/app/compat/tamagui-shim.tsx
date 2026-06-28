/**
 * Tamagui compatibility shim.
 * Replaces tamagui with plain React Native components.
 * All 24 screen files keep their imports unchanged — metro resolves 'tamagui' here.
 */
import React from 'react';
import {
  View,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';

// ─── Token resolver ──────────────────────────────────────────────────────────
const TOKENS: Record<string, number> = {
  '$0.25': 1, '$0.5': 2, '$0.75': 3,
  '$1': 4,   '$1.5': 6,
  '$2': 8,   '$2.5': 10,
  '$3': 12,  '$3.5': 14,
  '$4': 16,  '$4.5': 18,
  '$5': 20,  '$5.5': 22,
  '$6': 24,  '$7': 28,
  '$8': 32,  '$9': 36,
  '$10': 40, '$11': 44,
  '$12': 48, '$true': 16,
};

const rv = (v: any): any => (typeof v === 'string' && v.startsWith('$') ? (TOKENS[v] ?? 16) : v);

// ─── Style collectors ────────────────────────────────────────────────────────
const VIEW_STYLE_KEYS = [
  'flex','flexDirection','flexWrap','alignItems','justifyContent','alignSelf',
  'backgroundColor','padding','paddingHorizontal','paddingVertical',
  'paddingTop','paddingBottom','paddingLeft','paddingRight',
  'margin','marginHorizontal','marginVertical',
  'marginTop','marginBottom','marginLeft','marginRight',
  'width','height','minWidth','minHeight','maxWidth','maxHeight',
  'borderRadius','borderTopLeftRadius','borderTopRightRadius',
  'borderBottomLeftRadius','borderBottomRightRadius',
  'borderWidth','borderColor','borderBottomWidth','borderTopWidth',
  'borderLeftWidth','borderRightWidth',
  'gap','rowGap','columnGap',
  'position','top','bottom','left','right','zIndex','overflow',
  'opacity','elevation',
  'shadowColor','shadowOffset','shadowOpacity','shadowRadius',
  'transform',
];

const TEXT_STYLE_KEYS = [
  'fontSize','fontWeight','color','textAlign','lineHeight',
  'letterSpacing','textDecorationLine','fontStyle','textTransform',
  'includeFontPadding',
];

const collectView = (p: any): ViewStyle => {
  const s: any = {};
  for (const k of VIEW_STYLE_KEYS) if (p[k] !== undefined) s[k] = rv(p[k]);
  return s;
};

const collectText = (p: any): TextStyle => {
  const s: any = {};
  for (const k of TEXT_STYLE_KEYS) if (p[k] !== undefined) s[k] = rv(p[k]);
  return s;
};

// ─── Components ──────────────────────────────────────────────────────────────

export const YStack = ({ children, style, onLayout, testID, pointerEvents, ...p }: any) => (
  <View
    style={[{ flexDirection: 'column' }, collectView(p), style]}
    onLayout={onLayout}
    testID={testID}
    pointerEvents={pointerEvents}
  >
    {children}
  </View>
);

export const XStack = ({ children, style, onLayout, testID, pointerEvents, ...p }: any) => (
  <View
    style={[{ flexDirection: 'row' }, collectView(p), style]}
    onLayout={onLayout}
    testID={testID}
    pointerEvents={pointerEvents}
  >
    {children}
  </View>
);

export const Stack = ({ children, style, onLayout, testID, ...p }: any) => (
  <View style={[collectView(p), style]} onLayout={onLayout} testID={testID}>
    {children}
  </View>
);

export const Text = ({ children, style, numberOfLines, onPress, ...p }: any) => (
  <RNText
    style={[collectView(p), collectText(p), style]}
    numberOfLines={numberOfLines}
    onPress={onPress}
  >
    {children}
  </RNText>
);

export const Input = ({
  style, value, onChangeText, onChange, placeholder,
  secureTextEntry, keyboardType, autoCapitalize, autoCorrect,
  returnKeyType, onSubmitEditing, editable, multiline,
  numberOfLines, maxLength, onFocus, onBlur, autoFocus,
  inputMode, textContentType, ...p
}: any) => (
  <TextInput
    style={[{
      borderWidth: 1.5,
      borderColor: '#E0E0E0',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: '#1A1A1A',
      backgroundColor: '#FFFFFF',
    }, collectView(p), collectText(p), style]}
    value={value}
    onChangeText={onChangeText}
    onChange={onChange}
    placeholder={placeholder}
    placeholderTextColor="#9E9E9E"
    secureTextEntry={secureTextEntry}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
    autoCorrect={autoCorrect}
    returnKeyType={returnKeyType}
    onSubmitEditing={onSubmitEditing}
    editable={editable}
    multiline={multiline}
    numberOfLines={numberOfLines}
    maxLength={maxLength}
    onFocus={onFocus}
    onBlur={onBlur}
    autoFocus={autoFocus}
    inputMode={inputMode}
    textContentType={textContentType}
  />
);

export const Button = ({ children, onPress, disabled, style, pressStyle, ...p }: any) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
    style={[{ alignItems: 'center', justifyContent: 'center' }, collectView(p), style]}
  >
    {typeof children === 'string'
      ? <RNText style={[{ textAlign: 'center' }, collectText(p)]}>{children}</RNText>
      : children}
  </TouchableOpacity>
);

export const Spinner = ({ size, color, ...p }: any) => (
  <ActivityIndicator size={size === 'large' ? 'large' : 'small'} color={color ?? '#FFD700'} />
);

export const Image = ({ src, source, style, resizeMode, ...p }: any) => (
  <RNImage
    source={src ? { uri: src } : source}
    style={[collectView(p), style as ImageStyle]}
    resizeMode={resizeMode ?? 'cover'}
  />
);

export const Separator = ({ style, ...p }: any) => (
  <View style={[{ height: 1, backgroundColor: '#E0E0E0' }, collectView(p), style]} />
);

// ─── Provider / Theme (no-op wrappers) ───────────────────────────────────────
export const TamaguiProvider = ({ children }: any) => <>{children}</>;
export const Theme = ({ children }: any) => <>{children}</>;
export const useTheme = () => ({});
export const createTamagui = (cfg: any) => cfg;

// ─── Misc exports screens might reference ────────────────────────────────────
export const styled = () => () => null;
export const getTokens = () => ({ space: TOKENS });
