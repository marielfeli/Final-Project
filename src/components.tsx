
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C as BaseC, shadow } from './theme';

// Shared component palette — StayFinder Warm Golden Premium theme.
// Colors are inherited from src/theme.ts to keep the app theme consistent.
const C = {
  ...BaseC,
  blue: BaseC.blue,
  paleBlue: '#E8EAE3',
  navy: BaseC.navy,
  white: BaseC.white,
  ink: BaseC.ink,
  muted: BaseC.muted,
  line: BaseC.line,
  bg: BaseC.bg,
  green: BaseC.green,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const isLight = variant === 'outline' || variant === 'ghost';
  const pressScale = React.useRef(new Animated.Value(1)).current;

  const animatePress = (pressed: boolean) => {
    Animated.spring(pressScale, {
      toValue: pressed && !disabled && !loading ? 0.965 : 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 5,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animatePress(true)}
        onPressOut={() => animatePress(false)}
        disabled={disabled || loading}
        style={({ pressed }) => [
          s.button,
          variant === 'outline' && s.outline,
          variant === 'ghost' && s.ghost,
          variant === 'danger' && s.danger,
          pressed && !disabled && !loading && s.pressed,
          (disabled || loading) && s.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isLight ? C.blue : C.white} />
        ) : icon ? (
          <Ionicons name={icon} size={18} color={isLight ? C.blue : C.white} />
        ) : null}

        <Text style={[s.buttonText, isLight && s.lightButtonText]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  keyboardType,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: any;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={s.fieldContainer}>
      <Text style={s.label}>{label}</Text>

      <View
        style={[
          s.fieldWrap,
          multiline && s.multilineWrap,
          focused && s.fieldFocused,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={19}
            color={focused ? C.blue : C.muted}
          />
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor="#AAB5AC"
          secureTextEntry={secureTextEntry && !showPassword}
          multiline={multiline}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            s.input,
            multiline && s.multilineInput,
          ]}
        />

        {secureTextEntry ? (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={10}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={21}
              color={C.muted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Header({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={s.header}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.h1}>{title}</Text>
        {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Pill({
  text,
  tone = 'blue',
}: {
  text: string;
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'gray';
}) {
  const colors: any = {
    blue: [C.paleBlue, C.blue],
    green: ['#E7F2E9', C.green],
    amber: ['#F8EBDD', C.amber],
    red: ['#F7E5E1', C.red],
    gray: ['#EEEAE3', C.muted],
  };

  return (
    <View
      style={[
        s.pill,
        { backgroundColor: colors[tone][0] },
      ]}
    >
      <View
        style={[
          s.pillDot,
          { backgroundColor: colors[tone][1] },
        ]}
      />

      <Text
        style={[
          s.pillText,
          { color: colors[tone][1] },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

export function PropertyCard({
  item,
  onPress,
  onFavorite,
  favorite = false,
}: {
  item: any;
  onPress: () => void;
  onFavorite?: () => void;
  favorite?: boolean;
}) {
  const image =
    item.image ||
    item.photos?.[0] ||
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900';

  const heartScale = React.useRef(new Animated.Value(1)).current;

  const animateHeart = () => {
    heartScale.setValue(0.72);
    Animated.spring(heartScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 12,
    }).start();
  };

  const handleFavorite = () => {
    animateHeart();
    onFavorite?.();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.propertyCard,
        pressed && s.propertyPressed,
      ]}
    >
      <View style={s.propertyImageContainer}>
        <Image source={{ uri: image }} style={s.propertyImage} resizeMode="cover" />
        <View style={s.imageShade} />

        <View style={s.propertyTypeBadge}>
          <Text style={s.propertyTypeBadgeText}>{item.type || 'Apartment'}</Text>
        </View>

        {onFavorite ? (
          <Pressable
            onPress={handleFavorite}
            hitSlop={8}
            style={s.heart}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={favorite ? C.red : C.navy}
              />
            </Animated.View>
          </Pressable>
        ) : null}
      </View>

      <View style={s.propertyContent}>
        <Text style={s.propertyName} numberOfLines={1}>{item.name}</Text>

        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={15} color={C.muted} />
          <Text style={s.sub} numberOfLines={1}>{item.location}</Text>
        </View>

        <View style={s.propertyBottom}>
          <View>
            <Text style={s.price}>₱{Number(item.price || 0).toLocaleString()}</Text>
            <Text style={s.per}>per month</Text>
          </View>
          <View style={s.priceLabel}>
            <Text style={s.priceLabelText}>MONTHLY RENT</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  // BUTTONS
  button: {
    backgroundColor: C.blue,
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  outline: {
    backgroundColor: C.white,
    borderWidth: 1.2,
    borderColor: C.blue,
  },
  ghost: {
    backgroundColor: C.paleBlue,
  },
  danger: {
    backgroundColor: C.red,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: C.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  lightButtonText: {
    color: C.blue,
  },

  // INPUT FIELDS
  fieldContainer: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: C.ink,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  fieldWrap: {
    height: 54,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    backgroundColor: C.white,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  fieldFocused: {
    borderColor: C.blue,
    backgroundColor: '#F3EBDD',
  },
  multilineWrap: {
    height: 115,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  input: {
    flex: 1,
    color: C.ink,
    fontSize: 15,
    paddingVertical: 11,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },

  // HEADERS
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 12,
  },
  h1: {
    fontSize: 26,
    fontWeight: '900',
    color: C.navy,
    letterSpacing: -0.7,
  },
  sub: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 18,
  },

  // CARDS
  card: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 17,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
  },

  // STATUS BADGES
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 30,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  // PROPERTY CARDS
  propertyCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 17,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
  },
  propertyPressed: {
    opacity: 0.92,
  },
  propertyImageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 190,
    backgroundColor: '#E3D5BF',
  },
  imageShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(20,30,22,0.08)',
  },
  propertyTypeBadge: {
    position: 'absolute',
    left: 13,
    bottom: 13,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
  },
  propertyTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.navy,
  },
  heart: {
    position: 'absolute',
    right: 13,
    top: 13,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  propertyContent: {
    padding: 16,
    gap: 9,
  },
  propertyName: {
    fontSize: 17,
    fontWeight: '900',
    color: C.ink,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  propertyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  price: {
    fontSize: 21,
    fontWeight: '900',
    color: C.blue,
  },
  per: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  priceLabel: {
    backgroundColor: C.bg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  priceLabelText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: C.muted,
  },
});
