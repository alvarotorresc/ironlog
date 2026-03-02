import { useState, useCallback } from 'react';
import {
  cacheDirectory,
  writeAsStringAsync,
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '@/db/connection';
import { BackupRepository } from '@/repositories/backup.repo';
import { useTranslation } from '@/i18n';
import type { IronLogBackup } from '@/types';

export interface ImportResult {
  success: boolean;
  error?: string;
}

export function useBackup() {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const exportData = useCallback(async (): Promise<void> => {
    setExporting(true);
    try {
      const db = await getDatabase();
      const repo = new BackupRepository(db);
      const backup = await repo.exportData();
      const json = JSON.stringify(backup, null, 2);

      const filename = `ironlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const fileUri = `${cacheDirectory}${filename}`;
      await writeAsStringAsync(fileUri, json, {
        encoding: EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error(t('backup.sharingUnavailable'));
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export IronLog Backup',
      });
    } finally {
      setExporting(false);
    }
  }, [t]);

  const importData = useCallback(async (): Promise<ImportResult> => {
    setImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return { success: false };

      const asset = result.assets[0];
      if (!asset?.uri) return { success: false, error: 'No file selected' };

      const json = await readAsStringAsync(asset.uri, {
        encoding: EncodingType.UTF8,
      });

      let backup: IronLogBackup;
      try {
        backup = JSON.parse(json) as IronLogBackup;
      } catch {
        return { success: false, error: 'Invalid backup file' };
      }

      if (backup.version !== 1) {
        return { success: false, error: 'Unsupported backup version' };
      }

      if (
        !Array.isArray(backup.exercises) ||
        !Array.isArray(backup.routines) ||
        !Array.isArray(backup.workouts) ||
        !Array.isArray(backup.bodyMeasurements)
      ) {
        return { success: false, error: t('backup.importInvalidFormat') };
      }

      const db = await getDatabase();
      const repo = new BackupRepository(db);
      await repo.importData(backup);

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      return { success: false, error: message };
    } finally {
      setImporting(false);
    }
  }, [t]);

  return { exportData, exporting, importData, importing };
}
