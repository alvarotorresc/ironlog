import { View, Image, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface PhotoThumbnailProps {
  uri: string;
  onDelete?: () => void;
  onPress?: () => void;
  size?: number;
}

export function PhotoThumbnail({ uri, onDelete, onPress, size = 80 }: PhotoThumbnailProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="image" accessibilityLabel="Photo thumbnail">
      {({ pressed }) => (
        <View style={{ width: size, height: size, opacity: pressed ? 0.8 : 1 }}>
          <Image
            source={{ uri }}
            style={{
              width: size,
              height: size,
              borderRadius: 8,
              backgroundColor: colors.bg.tertiary,
            }}
            resizeMode="cover"
          />
          {onDelete && (
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.bg.primary,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={12} color={colors.text.secondary} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}
