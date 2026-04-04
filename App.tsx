import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import AppRoot from './src/AppRoot';

export default function App() {
  return (
    <>
      <AppRoot />
      <StatusBar style="auto" />
    </>
  );
}
