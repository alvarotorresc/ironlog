import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, ListChecks } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { RoutineRepository, type RoutineWithExercises } from '@/repositories/routine.repo';
import { WorkoutRepository } from '@/repositories/workout.repo';
import { RoutineCard } from '@/components/RoutineCard';
import { TemplateCard } from '@/components/TemplateCard';
import { TemplatePreviewModal } from '@/components/TemplatePreviewModal';
import { EmptyState } from '@/components/ui';
import { useTranslation } from '@/i18n';
import type { Routine } from '@/types';

export default function RoutinesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [templates, setTemplates] = useState<RoutineWithExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<RoutineWithExercises | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [cloning, setCloning] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const db = await getDatabase();
      const repo = new RoutineRepository(db);
      const [userRoutines, templateRoutines] = await Promise.all([
        repo.getAllWithExercises(),
        repo.getTemplates(),
      ]);
      setRoutines(userRoutines);
      setTemplates(templateRoutines);
    } catch (error) {
      console.error('Failed to load routines:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleRoutinePress = useCallback(
    (routine: Routine) => {
      router.push(`/routine/${routine.id}`);
    },
    [router],
  );

  const handleStartPress = useCallback(
    async (routine: Routine) => {
      try {
        const db = await getDatabase();
        const workoutRepo = new WorkoutRepository(db);
        const workout = await workoutRepo.start(routine.id);
        router.push(`/workout/${routine.id}?workoutId=${workout.id}`);
      } catch (error) {
        console.error('Failed to start workout:', error);
      }
    },
    [router],
  );

  const handleCreatePress = useCallback(() => {
    router.push('/routine/create');
  }, [router]);

  const handleTemplatePress = useCallback((template: RoutineWithExercises) => {
    setSelectedTemplate(template);
    setPreviewVisible(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewVisible(false);
    setSelectedTemplate(null);
  }, []);

  const handleUseTemplate = useCallback(
    async (template: RoutineWithExercises) => {
      setCloning(true);
      try {
        const db = await getDatabase();
        const repo = new RoutineRepository(db);
        const cloned = await repo.cloneTemplate(template.id, template.name);
        setPreviewVisible(false);
        setSelectedTemplate(null);
        Alert.alert('', t('routines.templateCloned'));
        router.push(`/routine/${cloned.id}`);
      } catch (error) {
        console.error('Failed to clone template:', error);
      } finally {
        setCloning(false);
      }
    },
    [router, t],
  );

  const renderHeader = useCallback(() => {
    if (templates.length === 0) return null;

    return (
      <View style={{ marginBottom: 16 }}>
        {/* Templates section header */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
          }}
        >
          {t('routines.templates')}
        </Text>

        {/* Horizontal template scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
          style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} onPress={handleTemplatePress} />
          ))}
        </ScrollView>

        {/* My Routines section header */}
        {routines.length > 0 && (
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginTop: 24,
              marginBottom: 4,
            }}
          >
            {t('routines.myRoutines')}
          </Text>
        )}
      </View>
    );
  }, [templates, routines.length, t, handleTemplatePress]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text.primary,
            letterSpacing: -0.5,
          }}
        >
          {t('routines.title')}
        </Text>
        <Pressable
          onPress={handleCreatePress}
          accessibilityRole="button"
          accessibilityLabel={t('routines.createNew')}
        >
          {({ pressed }) => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.brand.blue,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
          )}
        </Pressable>
      </View>

      {/* Routine count */}
      {!loading && routines.length > 0 && (
        <Text
          style={{
            paddingHorizontal: 20,
            paddingBottom: 8,
            fontSize: 13,
            color: colors.text.tertiary,
          }}
        >
          {routines.length} routine{routines.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      ) : routines.length === 0 && templates.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          message={t('routines.empty')}
          actionLabel={t('routines.createRoutine')}
          onAction={handleCreatePress}
        />
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            templates.length > 0 ? (
              <EmptyState
                icon={ListChecks}
                message={t('routines.empty')}
                actionLabel={t('routines.createRoutine')}
                onAction={handleCreatePress}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <RoutineCard
              routine={item}
              exercises={item.exercises.map((re) => ({
                exerciseId: re.exercise.id,
                exerciseName: re.exercise.name,
                illustration: re.exercise.illustration,
              }))}
              onPress={handleRoutinePress}
              onStart={handleStartPress}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 32,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Template preview modal */}
      <TemplatePreviewModal
        visible={previewVisible}
        template={selectedTemplate}
        onClose={handleClosePreview}
        onUseTemplate={handleUseTemplate}
        loading={cloning}
      />
    </SafeAreaView>
  );
}
