import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  Dimensions,
  FlatList,
  type ListRenderItemInfo,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoViewerProps {
  photos: string[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

export function PhotoViewer({ photos, initialIndex, visible, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const renderItem = ({ item }: ListRenderItemInfo<string>) => (
    <View
      style={{
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={{ uri: item }}
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT * 0.8,
        }}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 56,
            paddingHorizontal: 20,
            paddingBottom: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.text.secondary }}>
            {currentIndex + 1} / {photos.length}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            {({ pressed }) => (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                }}
              >
                <X size={20} color="#FFFFFF" strokeWidth={2} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Photo carousel */}
        <FlatList
          data={photos}
          renderItem={renderItem}
          keyExtractor={(_, index) => String(index)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(index);
          }}
        />
      </View>
    </Modal>
  );
}
