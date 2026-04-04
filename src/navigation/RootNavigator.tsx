import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../context/authStore';
import { useBillingStore } from '../context/billingStore';
import { useHistoryStore } from '../context/historyStore';
import Spinner from '../components/Spinner';
import AuthNavigator from './auth/AuthNavigator';
import AppNavigator from './app/AppNavigator';
import type { RootStackParamList } from './types';
import { palette } from '../utils/palette';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const bootstrapAuth = useAuthStore((s) => s.bootstrap);
  const bootstrapHistory = useHistoryStore((s) => s.bootstrap);
  const historyReady = useHistoryStore((s) => s.ready);
  const bootstrapBilling = useBillingStore((s) => s.bootstrap);
  const billingStatus = useBillingStore((s) => s.status);

  useEffect(() => {
    void bootstrapAuth();
    void bootstrapHistory();
    void bootstrapBilling();
  }, [bootstrapAuth, bootstrapBilling, bootstrapHistory]);

  if (status === 'loading' || !historyReady || billingStatus === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bgDark,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spinner />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'authenticated' ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
