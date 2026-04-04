import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '../utils/palette';

type CardProps = PropsWithChildren<{
  padding?: number;
}>;

export default function Card({ children, padding = 14 }: CardProps) {
  return <View style={[styles.card, { padding }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.cardDark,
    borderColor: palette.borderDark,
    borderWidth: 1,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
});
