import { useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import type { ExerciseType, WorkoutSet } from '@/types';

interface WorkoutSetRowProps {
  set: WorkoutSet;
  setNumber: number;
  exerciseType: ExerciseType;
  onUpdate: (
    setId: number,
    data: {
      weight?: number | null;
      reps?: number | null;
      duration?: number | null;
      distance?: number | null;
    },
  ) => void;
  onDelete: (setId: number) => void;
}

export function WorkoutSetRow({
  set,
  setNumber,
  exerciseType,
  onUpdate,
  onDelete,
}: WorkoutSetRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
      }}
    >
      {/* Set number */}
      <View style={{ width: 28, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text.secondary,
          }}
        >
          {setNumber}
        </Text>
      </View>

      {/* Dynamic fields based on exercise type */}
      <SetFields set={set} exerciseType={exerciseType} onUpdate={onUpdate} />

      {/* Delete button */}
      <Pressable
        onPress={() => onDelete(set.id)}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.5 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel={`Delete set ${setNumber}`}
        hitSlop={8}
      >
        <X size={16} color={colors.text.tertiary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

interface SetFieldsProps {
  set: WorkoutSet;
  exerciseType: ExerciseType;
  onUpdate: WorkoutSetRowProps['onUpdate'];
}

function SetFields({ set, exerciseType, onUpdate }: SetFieldsProps) {
  switch (exerciseType) {
    case 'weights':
      return (
        <>
          <NumericField
            value={set.weight}
            suffix="kg"
            placeholder="0"
            onChange={(val) => onUpdate(set.id, { weight: val })}
          />
          <NumericField
            value={set.reps}
            suffix="reps"
            placeholder="0"
            onChange={(val) => onUpdate(set.id, { reps: val })}
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
            onChange={(val) => onUpdate(set.id, { reps: val })}
          />
          <NumericField
            value={set.weight}
            suffix="kg"
            placeholder="-"
            onChange={(val) => onUpdate(set.id, { weight: val })}
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
            onChange={(val) => onUpdate(set.id, { duration: val != null ? val * 60 : null })}
          />
          <NumericField
            value={set.distance}
            suffix="km"
            placeholder="-"
            onChange={(val) => onUpdate(set.id, { distance: val })}
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
            onChange={(val) => onUpdate(set.id, { duration: val })}
          />
          <NumericField
            value={set.reps}
            suffix="reps"
            placeholder="-"
            onChange={(val) => onUpdate(set.id, { reps: val })}
          />
        </>
      );
    case 'flexibility':
      return (
        <NumericField
          value={set.duration}
          suffix="sec"
          placeholder="0"
          onChange={(val) => onUpdate(set.id, { duration: val })}
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
  onChange: (value: number | null) => void;
  decimal?: boolean;
  wide?: boolean;
}

function NumericField({
  value,
  suffix,
  placeholder,
  onChange,
  decimal = false,
  wide = false,
}: NumericFieldProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (text: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (text === '' || text === '-') {
        onChange(null);
        return;
      }

      const parsed = decimal ? parseFloat(text) : parseInt(text, 10);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }, 300);
  };

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
