import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ImageScreen from '../../screens/ImageScreen';
import ResultScreen from '../../screens/ResultScreen';
import SubscriptionScreen from '../../screens/SubscriptionScreen';
import TabNavigator from './TabNavigator';
import type { AppStackParamList } from '../types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
      />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
      />
      <Stack.Screen
        name="Image"
        component={ImageScreen}
      />
    </Stack.Navigator>
  );
}
