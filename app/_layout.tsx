import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { runMigrations } from '@/db/schema';
import { seedExercises, seedRoutineTemplates } from '@/db/seed';
import { I18nProvider } from '@/i18n';

import '../global.css';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function initDatabase() {
      try {
        const db = await getDatabase();
        await runMigrations(db);
        await seedExercises(db);
        await seedRoutineTemplates(db);
        setDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbReady(true);
      }
    }
    initDatabase();
  }, []);

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
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg.primary },
              animation: 'slide_from_right',
            }}
          />
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
