import type { ReactNode } from 'react';
import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { palette } from '../utils/palette';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
  right?: ReactNode;
};

const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, right, style, ...props },
  ref
) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          ref={ref}
          placeholderTextColor={palette.mutedDark}
          style={[styles.input, right ? styles.inputWithRight : null, style]}
          {...props}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    gap: 6,
  },
  label: {
    color: palette.mutedDark,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputWrap: {
    position: 'relative',
    alignSelf: 'stretch',
  },
  input: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderDark,
    backgroundColor: palette.cardDark,
    color: palette.textDark,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  inputWithRight: {
    paddingRight: 52,
  },
  right: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: palette.danger,
    fontSize: 12,
    lineHeight: 16,
  },
});
