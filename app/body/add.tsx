import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useSettings } from '@/contexts/SettingsContext';
import { getDatabase } from '@/db/connection';
import { BodyRepository } from '@/repositories/body.repo';
import { Input } from '@/components/ui';

interface FormData {
  weight: string;
  bodyFat: string;
  chest: string;
  waist: string;
  hips: string;
  biceps: string;
  thighs: string;
  notes: string;
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

export default function AddMeasurementScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { weightUnit, lengthUnit, toMetricWeight, toMetricLength } = useSettings();
  const wUnit = weightUnit();
  const lUnit = lengthUnit();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    weight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    thighs: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    const weight = parseOptionalNumber(form.weight);
    if (form.weight.trim() && (weight === null || weight <= 0)) {
      newErrors.weight = t('body.add.validWeight');
    }

    const bodyFat = parseOptionalNumber(form.bodyFat);
    if (form.bodyFat.trim() && (bodyFat === null || bodyFat < 0 || bodyFat > 100)) {
      newErrors.bodyFat = t('body.add.validBodyFat');
    }

    const numericFields: Array<keyof FormData> = ['chest', 'waist', 'hips', 'biceps', 'thighs'];
    for (const field of numericFields) {
      const val = parseOptionalNumber(form[field]);
      if (form[field].trim() && (val === null || val <= 0)) {
        newErrors[field] = t('body.add.validMeasurement');
      }
    }

    // At least weight should be provided
    const hasAnyValue =
      form.weight.trim() || form.bodyFat.trim() || numericFields.some((f) => form[f].trim());

    if (!hasAnyValue) {
      newErrors.weight = t('body.add.atLeastOne');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, t]);

  const handleSave = useCallback(async () => {
    if (!validate() || saving) return;
    setSaving(true);

    try {
      const db = await getDatabase();
      const repo = new BodyRepository(db);
      const rawWeight = parseOptionalNumber(form.weight);
      const rawChest = parseOptionalNumber(form.chest);
      const rawWaist = parseOptionalNumber(form.waist);
      const rawHips = parseOptionalNumber(form.hips);
      const rawBiceps = parseOptionalNumber(form.biceps);
      const rawThighs = parseOptionalNumber(form.thighs);

      await repo.create({
        weight: rawWeight != null ? toMetricWeight(rawWeight) : null,
        bodyFat: parseOptionalNumber(form.bodyFat),
        chest: rawChest != null ? toMetricLength(rawChest) : null,
        waist: rawWaist != null ? toMetricLength(rawWaist) : null,
        hips: rawHips != null ? toMetricLength(rawHips) : null,
        biceps: rawBiceps != null ? toMetricLength(rawBiceps) : null,
        thighs: rawThighs != null ? toMetricLength(rawThighs) : null,
        notes: form.notes.trim() || null,
      });
      router.back();
    } catch (error) {
      console.error('Failed to save measurement:', error);
      Alert.alert(t('common.error'), t('body.add.saveError'));
    } finally {
      setSaving(false);
    }
  }, [form, validate, saving, router, t, toMetricWeight, toMetricLength]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
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
          }}
        >
          {t('body.add.title')}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save measurement"
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
                opacity: pressed || saving ? 0.5 : 1,
              }}
            >
              <Check size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Weight — Primary */}
          <Input
            label={`${t('body.add.weight')} (${wUnit})`}
            placeholder={t('body.add.weightPlaceholder')}
            keyboardType="decimal-pad"
            value={form.weight}
            onChangeText={(v) => updateField('weight', v)}
            error={errors.weight}
          />

          <Input
            label={t('body.add.bodyFat')}
            placeholder={t('body.add.bodyFatPlaceholder')}
            keyboardType="decimal-pad"
            value={form.bodyFat}
            onChangeText={(v) => updateField('bodyFat', v)}
            error={errors.bodyFat}
          />

          {/* Measurements Section */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.text.secondary,
              marginTop: 8,
            }}
          >
            {`${t('body.add.measurements')} (${lUnit})`}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label={t('body.chest')}
                placeholder={lUnit}
                keyboardType="decimal-pad"
                value={form.chest}
                onChangeText={(v) => updateField('chest', v)}
                error={errors.chest}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={t('body.waist')}
                placeholder={lUnit}
                keyboardType="decimal-pad"
                value={form.waist}
                onChangeText={(v) => updateField('waist', v)}
                error={errors.waist}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label={t('body.hips')}
                placeholder={lUnit}
                keyboardType="decimal-pad"
                value={form.hips}
                onChangeText={(v) => updateField('hips', v)}
                error={errors.hips}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={t('body.biceps')}
                placeholder={lUnit}
                keyboardType="decimal-pad"
                value={form.biceps}
                onChangeText={(v) => updateField('biceps', v)}
                error={errors.biceps}
              />
            </View>
          </View>

          <Input
            label={t('body.thighs')}
            placeholder={lUnit}
            keyboardType="decimal-pad"
            value={form.thighs}
            onChangeText={(v) => updateField('thighs', v)}
            error={errors.thighs}
          />

          <Input
            label={t('body.add.notes')}
            placeholder={t('body.add.notesPlaceholder')}
            value={form.notes}
            onChangeText={(v) => updateField('notes', v)}
            multiline
            numberOfLines={3}
            maxLength={500}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
