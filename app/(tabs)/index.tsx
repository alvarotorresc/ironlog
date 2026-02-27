import { useCallback, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Play, Dumbbell, X, ListChecks } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { RoutineRepository, type RoutineWithExercises } from '@/repositories/routine.repo';
import { WorkoutRepository } from '@/repositories/workout.repo';
import { ExerciseIllustration } from '@/components/ExerciseIllustration';

export default function HomeScreen() {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [starting, setStarting] = useState(false);

  const loadRoutines = useCallback(async () => {
    setLoadingRoutines(true);
    try {
      const db = await getDatabase();
      const repo = new RoutineRepository(db);
      const data = await repo.getAllWithExercises();
      setRoutines(data);
    } catch (error) {
      console.error('Failed to load routines:', error);
    } finally {
      setLoadingRoutines(false);
    }
  }, []);

  const handleStartPress = useCallback(() => {
    loadRoutines();
    setShowPicker(true);
  }, [loadRoutines]);

  const handleSelectRoutine = useCallback(
    async (routineId: number) => {
      if (starting) return;
      setStarting(true);
      try {
        const db = await getDatabase();
        const workoutRepo = new WorkoutRepository(db);
        const workout = await workoutRepo.start(routineId);
        setShowPicker(false);
        router.push(`/workout/${routineId}?workoutId=${workout.id}`);
      } catch (error) {
        console.error('Failed to start workout:', error);
      } finally {
        setStarting(false);
      }
    },
    [router, starting],
  );

  const handleStartEmpty = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    try {
      const db = await getDatabase();
      const workoutRepo = new WorkoutRepository(db);
      const workout = await workoutRepo.start();
      setShowPicker(false);
      router.push(`/workout/empty?workoutId=${workout.id}`);
    } catch (error) {
      console.error('Failed to start empty workout:', error);
    } finally {
      setStarting(false);
    }
  }, [router, starting]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text.primary,
            letterSpacing: -0.5,
          }}
        >
          IronLog
        </Text>
      </View>

      {/* Start Workout CTA */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Pressable
          onPress={handleStartPress}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#2B7FE0' : colors.brand.blue,
            borderRadius: 16,
            paddingVertical: 20,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 12,
            opacity: pressed ? 0.95 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="Start workout"
        >
          <Play size={24} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: -0.3,
            }}
          >
            Start Workout
          </Text>
        </Pressable>
      </View>

      {/* Routine Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text.primary,
                letterSpacing: -0.3,
              }}
            >
              Select Routine
            </Text>
            <Pressable
              onPress={() => setShowPicker(false)}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.bg.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.text.secondary} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Start Empty Workout option */}
          <Pressable
            onPress={handleStartEmpty}
            disabled={starting}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginHorizontal: 20,
              marginTop: 16,
              marginBottom: 8,
              padding: 16,
              backgroundColor: pressed ? colors.bg.elevated : colors.bg.secondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              borderStyle: 'dashed',
              opacity: starting ? 0.5 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel="Start empty workout without a routine"
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: colors.bg.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Dumbbell size={20} color={colors.text.tertiary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text.primary,
                }}
              >
                Empty Workout
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.text.secondary,
                  marginTop: 2,
                }}
              >
                Start without a routine, add exercises as you go
              </Text>
            </View>
          </Pressable>

          {/* Divider */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 12,
              gap: 12,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ fontSize: 12, color: colors.text.tertiary }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {/* Routine List */}
          {loadingRoutines ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.brand.blue} />
            </View>
          ) : routines.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 32,
              }}
            >
              <ListChecks size={48} color={colors.text.tertiary} strokeWidth={1.5} />
              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: 16,
                  textAlign: 'center',
                  marginTop: 16,
                  lineHeight: 24,
                }}
              >
                No routines yet. Create one in the Routines tab first, or start an empty workout.
              </Text>
            </View>
          ) : (
            <FlatList
              data={routines}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 32,
                gap: 12,
              }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <RoutinePickerItem
                  routine={item}
                  onSelect={handleSelectRoutine}
                  disabled={starting}
                />
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface RoutinePickerItemProps {
  routine: RoutineWithExercises;
  onSelect: (routineId: number) => void;
  disabled: boolean;
}

function RoutinePickerItem({ routine, onSelect, disabled }: RoutinePickerItemProps) {
  const exerciseCount = routine.exercises.length;

  return (
    <Pressable
      onPress={() => onSelect(routine.id)}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.bg.elevated : colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={`Start ${routine.name} workout`}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: exerciseCount > 0 ? 12 : 0,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.text.primary,
              letterSpacing: -0.3,
            }}
            numberOfLines={1}
          >
            {routine.name}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.text.secondary,
              marginTop: 2,
            }}
          >
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: colors.brand.blue,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Play size={18} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
        </View>
      </View>

      {/* Exercise preview */}
      {exerciseCount > 0 && (
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 6,
          }}
        >
          {routine.exercises.slice(0, 4).map((re) => (
            <View
              key={re.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ExerciseIllustration illustrationKey={re.exercise.illustration} size={24} />
              <Text
                style={{
                  fontSize: 14,
                  color: colors.text.secondary,
                }}
                numberOfLines={1}
              >
                {re.exercise.name}
              </Text>
            </View>
          ))}
          {exerciseCount > 4 && (
            <Text
              style={{
                fontSize: 13,
                color: colors.text.tertiary,
                marginLeft: 32,
              }}
            >
              +{exerciseCount - 4} more
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
