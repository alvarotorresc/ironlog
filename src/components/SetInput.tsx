import { useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { colors } from '@/constants/theme';
import type { ExerciseType, WorkoutSet } from '@/types';

interface SetInputProps {
  set: WorkoutSet;
  exerciseType: ExerciseType;
  onUpdate: (data: {
    weight?: number | null;
    reps?: number | null;
    duration?: number | null;
    distance?: number | null;
  }) => void;
}

export function SetInput({ set, exerciseType, onUpdate }: SetInputProps) {
  switch (exerciseType) {
    case 'weights':
      return (
        <>
          <NumericField
            value={set.weight}
            suffix="kg"
            placeholder="0"
            onValueChange={(val) => onUpdate({ weight: val })}
          />
          <NumericField
            value={set.reps}
            suffix="reps"
            placeholder="0"
            onValueChange={(val) => onUpdate({ reps: val })}
          />
        </>
      );
    case 'calisthenics':
      return (
        <>
          <NumericField
            value={set.reps}
            suffix="reps"
            placeholder="0"
            onValueChange={(val) => onUpdate({ reps: val })}
          />
          <NumericField
            value={set.weight}
            suffix="kg"
            placeholder="-"
            onValueChange={(val) => onUpdate({ weight: val })}
          />
        </>
      );
    case 'cardio':
      return (
        <>
          <NumericField
            value={set.duration != null ? Math.round(set.duration / 60) : null}
            suffix="min"
            placeholder="0"
            onValueChange={(val) => onUpdate({ duration: val != null ? val * 60 : null })}
          />
          <NumericField
            value={set.distance}
            suffix="km"
            placeholder="-"
            onValueChange={(val) => onUpdate({ distance: val })}
            decimal
          />
        </>
      );
    case 'hiit':
      return (
        <>
          <NumericField
            value={set.duration}
            suffix="sec"
            placeholder="0"
            onValueChange={(val) => onUpdate({ duration: val })}
          />
          <NumericField
            value={set.reps}
            suffix="reps"
            placeholder="-"
            onValueChange={(val) => onUpdate({ reps: val })}
          />
        </>
      );
    case 'flexibility':
      return (
        <NumericField
          value={set.duration}
          suffix="sec"
          placeholder="0"
          onValueChange={(val) => onUpdate({ duration: val })}
          wide
        />
      );
    default:
      return null;
  }
}

interface NumericFieldProps {
  value: number | null;
  suffix: string;
  placeholder: string;
  onValueChange: (value: number | null) => void;
  decimal?: boolean;
  wide?: boolean;
}

const DEBOUNCE_MS = 300;

function NumericField({
  value,
  suffix,
  placeholder,
  onValueChange,
  decimal = false,
  wide = false,
}: NumericFieldProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (text: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (text === '' || text === '-') {
          onValueChange(null);
          return;
        }

        const parsed = decimal ? parseFloat(text) : parseInt(text, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          onValueChange(parsed);
        }
      }, DEBOUNCE_MS);
    },
    [onValueChange, decimal],
  );

  return (
    <View
      style={{
        flex: wide ? 2 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bg.tertiary,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 10,
        height: 40,
        minHeight: 40,
      }}
    >
      <TextInput
        style={{
          flex: 1,
          fontSize: 18,
          fontWeight: '700',
          color: colors.text.primary,
          fontVariant: ['tabular-nums'],
          paddingVertical: 0,
        }}
        defaultValue={value != null ? String(value) : ''}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        onChangeText={handleChange}
        selectTextOnFocus
        cursorColor={colors.brand.blue}
        selectionColor={colors.brand.blue}
        accessibilityLabel={`${suffix} input`}
      />
      <Text
        style={{
          fontSize: 12,
          color: colors.text.tertiary,
          marginLeft: 4,
        }}
      >
        {suffix}
      </Text>
    </View>
  );
}
