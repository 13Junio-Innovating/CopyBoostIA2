import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../utils/palette';

type ScreenProps = PropsWithChildren<{
  title?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  scroll?: boolean;
}>;

export default function Screen({ children, title, headerLeft, headerRight, scroll }: ScreenProps) {
  const Content = scroll ? ScrollView : View;
  const contentProps = scroll
    ? ({
        contentContainerStyle: styles.content,
        keyboardShouldPersistTaps: 'handled',
      } as const)
    : ({ style: styles.content } as const);

  return (
    <LinearGradient colors={[palette.bgDark, palette.bgDark2]} style={styles.fill}>
      <LinearGradient
        colors={['rgba(109, 94, 241, 0.22)', 'rgba(34, 211, 238, 0.00)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.accentTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(167, 139, 250, 0.18)', 'rgba(6, 8, 22, 0.00)']}
        start={{ x: 0.2, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBottom}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
        {title ? (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {headerLeft ?? <View style={styles.headerLeftPlaceholder} />}
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <View style={styles.headerRight}>{headerRight ?? null}</View>
          </View>
        ) : null}
        <Content {...contentProps}>{children}</Content>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  accentTop: {
    position: 'absolute',
    top: -120,
    left: -80,
    right: -80,
    height: 260,
    borderRadius: 999,
    transform: [{ rotate: '-10deg' }],
  },
  accentBottom: {
    position: 'absolute',
    bottom: -180,
    left: -120,
    right: -120,
    height: 320,
    borderRadius: 999,
    transform: [{ rotate: '12deg' }],
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  headerLeftPlaceholder: {
    width: 64,
    height: 32,
  },
  headerTitle: {
    color: palette.textDark,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  headerRight: {
    minHeight: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
});
