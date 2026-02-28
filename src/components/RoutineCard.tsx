import { View, Text, Pressable } from 'react-native';
import { Play, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ExerciseIllustration } from './ExerciseIllustration';
import type { Routine } from '@/types';

interface RoutineExerciseSummary {
  exerciseId: number;
  exerciseName: string;
  illustration: string | null;
}

interface RoutineCardProps {
  routine: Routine;
  exercises: RoutineExerciseSummary[];
  onPress: (routine: Routine) => void;
  onStart: (routine: Routine) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RoutineCard({ routine, exercises, onPress, onStart }: RoutineCardProps) {
  const exerciseCount = exercises.length;

  return (
    <Pressable
      onPress={() => onPress(routine)}
      accessibilityRole="button"
      accessibilityLabel={`${routine.name}, ${exerciseCount} exercises`}
    >
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: pressed ? colors.bg.elevated : colors.bg.tertiary,
            borderWidth: 1,
            borderColor: colors.borderBright,
            borderRadius: 12,
            padding: 16,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          {/* Header: name + start button */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
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
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onStart(routine);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Start ${routine.name} workout`}
            >
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor: pressed ? '#2B7FE0' : colors.brand.blue,
                  }}
                >
                  <Play size={14} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#FFFFFF',
                    }}
                  >
                    Start
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Exercise list */}
          {exerciseCount > 0 && (
            <View
              style={{
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                gap: 8,
              }}
            >
              {exercises.slice(0, 5).map((ex) => (
                <View
                  key={ex.exerciseId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ExerciseIllustration illustrationKey={ex.illustration} size={28} />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.text.secondary,
                    }}
                    numberOfLines={1}
                  >
                    {ex.exerciseName}
                  </Text>
                </View>
              ))}
              {exerciseCount > 5 && (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.text.tertiary,
                    marginLeft: 36,
                  }}
                >
                  +{exerciseCount - 5} more
                </Text>
              )}
            </View>
          )}

          {/* Footer: created date + chevron */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.text.tertiary,
              }}
            >
              Created {formatDate(routine.createdAt)}
            </Text>
            <ChevronRight size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          </View>
        </View>
      )}
    </Pressable>
  );
}
