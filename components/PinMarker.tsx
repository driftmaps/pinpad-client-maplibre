import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';

export const PinMarker = memo(({ pin, onRemove, onPress, testID, style }: PinMarkerProps) => {
  const handlePress = () => {
    if (onPress) {
      onPress(pin);
    }
  };

  return (
    <MapLibreGL.MarkerView
      key={`${pin.id}-marker`}
      id={`${pin.id}-marker`}
      coordinate={[pin.coordinates.longitude, pin.coordinates.latitude]}
      anchor={{ x: 0, y: 0.5 }}
      testID={testID || 'pin-marker'}
    >
      <TouchableOpacity
        style={[styles.markerContainer, style]}
        onPress={handlePress}
        testID={`pin-${pin.id}`}
      >
        <Text style={styles.emoji}>{pin.emoji}</Text>
      </TouchableOpacity>
    </MapLibreGL.MarkerView>
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
