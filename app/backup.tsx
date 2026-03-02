import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Upload, Download } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useBackup } from '@/hooks/useBackup';

export default function BackupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { exportData, exporting, importData, importing } = useBackup();

  const handleExport = async () => {
    try {
      await exportData();
      Alert.alert(t('backup.exportSuccess'));
    } catch {
      Alert.alert(t('common.error'), t('backup.importError'));
    }
  };

  const handleImport = async () => {
    const result = await importData();
    if (result.success) {
      Alert.alert(t('backup.importSuccess'));
    } else if (result.error) {
      Alert.alert(t('common.error'), result.error);
    }
  };

  const busy = exporting || importing;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          {({ pressed }) => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.bg.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <ArrowLeft size={20} color={colors.text.secondary} strokeWidth={1.5} />
            </View>
          )}
        </Pressable>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.text.primary,
            letterSpacing: -0.3,
            flex: 1,
          }}
        >
          {t('backup.title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Export section */}
        <View
          style={{
            backgroundColor: colors.bg.secondary,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 20,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Upload size={20} color={colors.brand.blue} strokeWidth={1.5} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>
              {t('backup.exportTitle')}
            </Text>
          </View>

          <Text style={{ fontSize: 14, color: colors.text.secondary, lineHeight: 20 }}>
            {t('backup.exportDesc')}
          </Text>

          <Pressable
            onPress={handleExport}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t('backup.exportButton')}
          >
            {({ pressed }) => (
              <View
                style={{
                  backgroundColor: colors.brand.blue,
                  borderRadius: 10,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  opacity: pressed || busy ? 0.6 : 1,
                }}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Upload size={16} color="#FFFFFF" strokeWidth={2} />
                )}
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>
                  {exporting ? t('backup.exporting') : t('backup.exportButton')}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Import section */}
        <View
          style={{
            backgroundColor: colors.bg.secondary,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 20,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Download size={20} color={colors.theme.slateBright} strokeWidth={1.5} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>
              {t('backup.importTitle')}
            </Text>
          </View>

          <Text style={{ fontSize: 14, color: colors.text.secondary, lineHeight: 20 }}>
            {t('backup.importDesc')}
          </Text>

          <Pressable
            onPress={handleImport}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t('backup.importButton')}
          >
            {({ pressed }) => (
              <View
                style={{
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.borderBright,
                  borderRadius: 10,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  opacity: pressed || busy ? 0.6 : 1,
                }}
              >
                {importing ? (
                  <ActivityIndicator size="small" color={colors.text.primary} />
                ) : (
                  <Download size={16} color={colors.text.primary} strokeWidth={2} />
                )}
                <Text style={{ color: colors.text.primary, fontWeight: '600', fontSize: 15 }}>
                  {importing ? t('backup.importing') : t('backup.importButton')}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
