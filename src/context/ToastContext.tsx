import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../utils/palette';

type ToastType = 'success' | 'error' | 'info';

type ToastPayload = {
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
};

type ToastState = ToastPayload & { visible: boolean };

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

export default function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (!toast?.visible) return;
    Animated.timing(anim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [anim, toast?.visible]);

  const showToast = useCallback(
    (payload: ToastPayload) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      setToast({ ...payload, visible: true });
      anim.setValue(0);

      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      const durationMs = payload.durationMs ?? 2600;
      hideTimeoutRef.current = setTimeout(() => hide(), durationMs);
    },
    [anim, hide]
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.container,
              {
                paddingTop: insets.top + 10,
                opacity,
                transform: [{ translateY }],
              },
            ]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={hide}
              style={[styles.toast, toastStyle(toast.type)]}
            >
              <Text style={styles.title}>{toast.title}</Text>
              {toast.message ? (
                <Text style={styles.message}>{toast.message}</Text>
              ) : null}
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

function toastStyle(type: ToastType): { borderColor: string } {
  switch (type) {
    case 'success':
      return { borderColor: palette.success };
    case 'error':
      return { borderColor: palette.danger };
    case 'info':
      return { borderColor: palette.brand2 };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: palette.cardDark,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  title: {
    color: palette.textDark,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: palette.mutedDark,
    fontSize: 13,
    lineHeight: 18,
  },
});

