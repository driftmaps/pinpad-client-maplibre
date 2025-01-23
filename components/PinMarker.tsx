import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Annotation, Callout, PointAnnotation } from '@maplibre/maplibre-react-native';
import { Pin } from '@/types/pin';

interface PinMarkerProps {
  pin: Pin;
  onRemove: () => void;
  onPress: (pin: Pin) => void;
  testID?: string;
}

export const PinMarker = memo(({ pin, onRemove, onPress, testID }: PinMarkerProps) => {
  return (
    <PointAnnotation
      key={`${pin.id}-marker`}
      id={`${pin.id}-marker`}
      coordinate={[pin.coordinates.longitude, pin.coordinates.latitude]}
    >
      <TouchableOpacity
        style={styles.markerContainer}
        onPress={() => onPress(pin)}
        testID={`pin-${pin.id}`}
        activeOpacity={0.7}
        accessible={false}
        focusable={false}
      >
        <Text testID={`pin-${pin.id}-emoji`} style={styles.emoji}>{pin.emoji}</Text>
      </TouchableOpacity>
    </PointAnnotation>
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
  calloutContainer: {
    marginLeft: -68,
    marginTop: -40,
  },
  emoji: {
    fontSize: 24,
  },
});
