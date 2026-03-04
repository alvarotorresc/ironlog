import { View, Text, ScrollView, Pressable, Alert, ActionSheetIOS, Platform } from 'react-native';
import { ImagePlus } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { PhotoThumbnail } from './PhotoThumbnail';
import { MAX_PHOTOS_PER_MEASUREMENT } from '@/repositories/body-photo.repo';

interface PhotoItem {
  id?: number;
  uri: string;
}

interface PhotoSectionProps {
  photos: PhotoItem[];
  onAddFromCamera: () => void;
  onAddFromGallery: () => void;
  onDelete: (index: number) => void;
  onPhotoPress?: (index: number) => void;
}

export function PhotoSection({
  photos,
  onAddFromCamera,
  onAddFromGallery,
  onDelete,
  onPhotoPress,
}: PhotoSectionProps) {
  const { t } = useTranslation();
  const canAdd = photos.length < MAX_PHOTOS_PER_MEASUREMENT;

  const handleAddPress = () => {
    if (!canAdd) {
      Alert.alert(t('body.maxPhotos'));
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('common.cancel'), t('body.camera'), t('body.gallery')],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) onAddFromCamera();
          if (buttonIndex === 2) onAddFromGallery();
        },
      );
    } else {
      Alert.alert(t('body.addPhoto'), undefined, [
        { text: t('body.camera'), onPress: onAddFromCamera },
        { text: t('body.gallery'), onPress: onAddFromGallery },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  };

  const handleDelete = (index: number) => {
    Alert.alert(t('body.deletePhoto'), t('body.deletePhotoMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => onDelete(index) },
    ]);
  };

  return (
    <View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.text.secondary,
          marginBottom: 8,
        }}
      >
        {t('body.photos')}
        {photos.length > 0 ? ` (${photos.length}/${MAX_PHOTOS_PER_MEASUREMENT})` : ''}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingRight: 4 }}
      >
        {photos.map((photo, index) => (
          <PhotoThumbnail
            key={photo.id ?? photo.uri}
            uri={photo.uri}
            onDelete={() => handleDelete(index)}
            onPress={onPhotoPress ? () => onPhotoPress(index) : undefined}
          />
        ))}

        {canAdd && (
          <Pressable
            onPress={handleAddPress}
            accessibilityRole="button"
            accessibilityLabel={t('body.addPhoto')}
          >
            {({ pressed }) => (
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                  backgroundColor: colors.bg.tertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  opacity: pressed ? 0.6 : 1,
                }}
              >
                <ImagePlus size={20} color={colors.text.tertiary} strokeWidth={1.5} />
                <Text style={{ fontSize: 10, color: colors.text.tertiary }}>
                  {t('body.addPhoto')}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
