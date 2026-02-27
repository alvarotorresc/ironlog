import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

export default function RoutinesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text.primary }}>
          Routines
        </Text>
      </View>
    </SafeAreaView>
  );
}
