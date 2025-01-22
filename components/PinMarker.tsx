import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MarkerView } from '@maplibre/maplibre-react-native';
import { Pin } from '@/types/pin';

interface PinMarkerProps {
  pin: Pin;
  onRemove: () => void;
  onPress: (pin: Pin) => void;
  testID?: string;
}

export const PinMarker = memo(({ pin, onRemove, onPress, testID }: PinMarkerProps) => {
  const handlePress = () => {
    if (onPress) {
      onPress(pin);
    }
  };

  return (
    <MarkerView
      key={`${pin.id}-marker`}
      id={`${pin.id}-marker`}
      coordinate={[pin.coordinates.longitude, pin.coordinates.latitude]}
      anchor={{ x: 0, y: 0.5 }}
      testID={testID || 'pin-marker'}
    >
      <TouchableOpacity
        style={styles.markerContainer}
        onPress={handlePress}
        testID={`pin-${pin.id}`}
      >
        <Text style={styles.emoji}>{pin.emoji}</Text>
      </TouchableOpacity>
    </MarkerView>
  );
});

PinMarker.displayName = 'PinMarker';

const styles = StyleSheet.create({
  markerContainer: {
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 20,
    elevation: 5,
  },
  emoji: {
    fontSize: 24,
  },
});
