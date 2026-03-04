import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ExerciseIllustration } from './ExerciseIllustration';
import { Button } from './ui';
import { useTranslation } from '@/i18n';
import type { RoutineWithExercises } from '@/repositories/routine.repo';

interface TemplatePreviewModalProps {
  visible: boolean;
  template: RoutineWithExercises | null;
  onClose: () => void;
  onUseTemplate: (template: RoutineWithExercises) => void;
  loading: boolean;
}

export function TemplatePreviewModal({
  visible,
  template,
  onClose,
  onUseTemplate,
  loading,
}: TemplatePreviewModalProps) {
  const { t } = useTranslation();

  if (!template) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
        <View
          style={{
            backgroundColor: colors.bg.secondary,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '70%',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text.primary,
                letterSpacing: -0.3,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {template.name}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              {({ pressed }) => (
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.bg.tertiary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  }}
                >
                  <X size={18} color={colors.text.secondary} strokeWidth={1.5} />
                </View>
              )}
            </Pressable>
          </View>

          {/* Exercise count */}
          <Text
            style={{
              paddingHorizontal: 20,
              paddingBottom: 16,
              fontSize: 13,
              color: colors.text.tertiary,
            }}
          >
            {t('routines.templateExercises', { count: template.exercises.length })}
          </Text>

          {/* Exercise list */}
          <ScrollView
            style={{ maxHeight: 340 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 8,
              gap: 10,
            }}
            showsVerticalScrollIndicator={false}
          >
            {template.exercises.map((re, index) => (
              <View
                key={re.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    width: 20,
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.text.tertiary,
                    textAlign: 'center',
                  }}
                >
                  {index + 1}
                </Text>
                <ExerciseIllustration illustrationKey={re.exercise.illustration} size={36} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: colors.text.primary,
                  }}
                  numberOfLines={1}
                >
                  {re.exercise.name}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Use Template button */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 32,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Button
              title={t('routines.useTemplate')}
              onPress={() => onUseTemplate(template)}
              loading={loading}
              disabled={loading}
              size="lg"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
