import { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Scale,
  Languages,
  Database,
  Info,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation, type Locale } from '@/i18n';
import { useSettings } from '@/contexts/SettingsContext';

const APP_VERSION = '0.2.0';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const { unitSystem, setUnitSystem } = useSettings();

  const handleBackupPress = useCallback(() => {
    router.push('/backup');
  }, [router]);

  const handleAuthorPress = useCallback(() => {
    Linking.openURL('https://alvarotc.com');
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
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
              <ArrowLeft size={20} color={colors.text.primary} strokeWidth={1.5} />
            </View>
          )}
        </Pressable>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.text.primary,
            letterSpacing: -0.3,
          }}
        >
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Units Section */}
        <SettingsSection icon={Scale} title={t('settings.units')} iconColor={colors.brand.blue}>
          <UnitOption
            label={t('settings.metric')}
            selected={unitSystem === 'metric'}
            onPress={() => setUnitSystem('metric')}
          />
          <UnitOption
            label={t('settings.imperial')}
            selected={unitSystem === 'imperial'}
            onPress={() => setUnitSystem('imperial')}
            isLast
          />
        </SettingsSection>

        {/* Language Section */}
        <SettingsSection
          icon={Languages}
          title={t('settings.language')}
          iconColor={colors.semantic.info}
        >
          <UnitOption
            label="English"
            selected={locale === 'en'}
            onPress={() => setLocale('en' as Locale)}
          />
          <UnitOption
            label="Espa\u00F1ol"
            selected={locale === 'es'}
            onPress={() => setLocale('es' as Locale)}
            isLast
          />
        </SettingsSection>

        {/* Data Section */}
        <SettingsSection
          icon={Database}
          title={t('settings.data')}
          iconColor={colors.semantic.warning}
        >
          <Pressable
            onPress={handleBackupPress}
            accessibilityRole="button"
            accessibilityLabel={t('settings.backupRestore')}
          >
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: pressed ? colors.bg.elevated : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.text.primary,
                  }}
                >
                  {t('settings.backupRestore')}
                </Text>
                <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.5} />
              </View>
            )}
          </Pressable>
        </SettingsSection>

        {/* About Section */}
        <SettingsSection icon={Info} title={t('settings.about')} iconColor={colors.theme.slate}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 16, color: colors.text.primary }}>
              {t('settings.version')}
            </Text>
            <Text style={{ fontSize: 16, color: colors.text.secondary }}>{APP_VERSION}</Text>
          </View>
        </SettingsSection>

        {/* Footer */}
        <Pressable
          onPress={handleAuthorPress}
          accessibilityRole="link"
          accessibilityLabel="Visit alvarotc.com"
        >
          {({ pressed }) => (
            <Text
              style={{
                fontSize: 13,
                color: pressed ? colors.brand.blue : colors.text.tertiary,
                textAlign: 'center',
                marginTop: 32,
                paddingHorizontal: 20,
              }}
            >
              Made with {'\uD83C\uDFCB\uFE0F'} by Alvaro Torres
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingsSectionProps {
  icon: typeof Scale;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}

function SettingsSection({ icon: Icon, title, iconColor, children }: SettingsSectionProps) {
  return (
    <View style={{ paddingTop: 24, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Icon size={18} color={iconColor} strokeWidth={1.5} />
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {title}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: colors.bg.secondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

interface UnitOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
}

function UnitOption({ label, selected, onPress, isLast = false }: UnitOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: colors.border,
            backgroundColor: pressed ? colors.bg.elevated : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: colors.text.primary,
              fontWeight: selected ? '600' : '400',
            }}
          >
            {label}
          </Text>
          {selected && <Check size={18} color={colors.brand.blue} strokeWidth={2.5} />}
        </View>
      )}
    </Pressable>
  );
}
