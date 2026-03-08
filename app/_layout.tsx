import { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { Onboarding } from '@/components/Onboarding';
import { getDatabase } from '@/db/connection';
import { runMigrations } from '@/db/schema';
import { seedExercises, seedRoutineTemplates } from '@/db/seed';
import { SettingsRepository } from '@/repositories/settings.repo';
import { I18nProvider } from '@/i18n';
import { SettingsProvider } from '@/contexts/SettingsContext';

import '../global.css';

const ONBOARDING_KEY = 'onboarding_completed';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settingsRepo, setSettingsRepo] = useState<SettingsRepository | null>(null);

  useEffect(() => {
    async function initDatabase() {
      try {
        const db = await getDatabase();
        await runMigrations(db);
        await seedExercises(db);
        await seedRoutineTemplates(db);

        const repo = new SettingsRepository(db);
        setSettingsRepo(repo);

        const onboardingCompleted = await repo.get(ONBOARDING_KEY);
        if (onboardingCompleted !== '1') {
          setShowOnboarding(true);
        }

        setDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbReady(true);
      }
    }
    initDatabase();
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    if (settingsRepo) {
      await settingsRepo.set(ONBOARDING_KEY, '1');
    }
    setShowOnboarding(false);
  }, [settingsRepo]);

  if (!dbReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.brand.blue} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <SafeAreaProvider>
        <I18nProvider>
          <SettingsProvider>
            <StatusBar style="light" />
            {showOnboarding ? (
              <Onboarding onComplete={handleOnboardingComplete} />
            ) : (
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg.primary },
                  animation: 'slide_from_right',
                }}
              />
            )}
          </SettingsProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
