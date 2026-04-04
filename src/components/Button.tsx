import { useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../utils/palette';
import Spinner from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const stylesForVariant = useMemo(() => buttonStyles(variant), [variant]);
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      }}
      style={({ pressed }) => [
        baseStyles.pressable,
        fullWidth ? baseStyles.fullWidth : null,
        pressed && !isDisabled ? baseStyles.pressed : null,
        isDisabled ? baseStyles.disabled : null,
      ]}
    >
      <Animated.View
        style={[
          baseStyles.inner,
          stylesForVariant.container,
          isPrimary ? baseStyles.primaryShadow : null,
          { transform: [{ scale }] },
        ]}
      >
        {isPrimary ? (
          <LinearGradient
            colors={[palette.brand, palette.brand2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={baseStyles.gradientFill}
          />
        ) : null}
        <Animated.View style={baseStyles.content}>
          {loading ? (
            <Spinner size="small" />
          ) : (
            <Text style={[stylesForVariant.text, isPrimary ? baseStyles.primaryText : null]}>
              {title}
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function buttonStyles(variant: ButtonVariant): { container: ViewStyle; text: TextStyle } {
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: palette.brand, borderColor: 'transparent', overflow: 'hidden' },
        text: { color: palette.white },
      };
    case 'secondary':
      return {
        container: { backgroundColor: palette.cardDark, borderColor: palette.borderDark },
        text: { color: palette.textDark },
      };
    case 'danger':
      return {
        container: { backgroundColor: palette.danger, borderColor: 'transparent' },
        text: { color: palette.white },
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent', borderColor: palette.borderDark },
        text: { color: palette.textDark },
      };
  }
}

const baseStyles = StyleSheet.create({
  pressable: {
    borderRadius: 16,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  inner: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    position: 'relative',
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  primaryShadow: {
    shadowColor: palette.brand,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  pressed: {
    opacity: 0.95,
  },
  disabled: {
    opacity: 0.55,
  },
});
