import * as ImagePicker from 'expo-image-picker';
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  deleteAsync,
} from 'expo-file-system/legacy';

const PHOTO_DIR = `${documentDirectory}body-photos/`;

async function ensurePhotoDir(): Promise<void> {
  const info = await getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

function generateFileName(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `body-${timestamp}-${random}.jpg`;
}

export interface PhotoPickResult {
  uri: string;
  cancelled: false;
}

export interface PhotoPickCancelled {
  cancelled: true;
}

export type PhotoPickResponse = PhotoPickResult | PhotoPickCancelled;

export async function pickFromGallery(): Promise<PhotoPickResponse> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { cancelled: true };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return { cancelled: true };
  }

  return { uri: result.assets[0].uri, cancelled: false };
}

export async function takePhoto(): Promise<PhotoPickResponse> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { cancelled: true };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return { cancelled: true };
  }

  return { uri: result.assets[0].uri, cancelled: false };
}

export async function savePhoto(uri: string): Promise<string> {
  await ensurePhotoDir();
  const fileName = generateFileName();
  const destination = `${PHOTO_DIR}${fileName}`;
  await copyAsync({ from: uri, to: destination });
  return destination;
}

export async function deletePhotoFile(path: string): Promise<void> {
  try {
    const info = await getInfoAsync(path);
    if (info.exists) {
      await deleteAsync(path, { idempotent: true });
    }
  } catch {
    // Silently ignore if file is already gone
  }
}
