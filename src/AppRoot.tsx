import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ToastProvider from './context/ToastContext';
import { useAppNavigationTheme } from './hooks/useAppNavigationTheme';
import RootNavigator from './navigation/RootNavigator';
import Spinner from './components/Spinner';
import { View } from 'react-native';
import { palette } from './utils/palette';

export default function AppRoot() {
  const navigationTheme = useAppNavigationTheme();
  const [fontsLoaded] = useFonts(Ionicons.font);

  if (!fontsLoaded) {
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
    <SafeAreaProvider>
      <ToastProvider>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
