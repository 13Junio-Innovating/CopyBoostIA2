import { ActivityIndicator } from 'react-native';
import { palette } from '../utils/palette';

export default function Spinner({ size = 'large' }: { size?: 'small' | 'large' }) {
  return <ActivityIndicator size={size} color={palette.brand} />;
}

