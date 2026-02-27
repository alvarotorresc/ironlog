import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/theme';

export default function WorkoutScreen() {
  const { routineId, workoutId } = useLocalSearchParams<{
    routineId: string;
    workoutId: string;
  }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.text.primary,
          }}
        >
          Workout Active
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.text.secondary,
            marginTop: 8,
          }}
        >
          Routine: {routineId === 'empty' ? 'Empty Workout' : `#${routineId}`} | Workout ID:{' '}
          {workoutId}
        </Text>
      </View>
    </SafeAreaView>
  );
}
