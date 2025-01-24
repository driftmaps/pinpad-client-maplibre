import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import {  MarkerView } from '@maplibre/maplibre-react-native';
import { Pin } from '@/types/pin';

interface PinMarkerProps {
  pin: Pin;
  onRemove: (pin: Pin) => void;
  onPress: (pin: Pin) => void;
  testID?: string;
}

export const PinMarker = memo(({ pin, onRemove, onPress, testID }: PinMarkerProps) => {
  return (
    <MarkerView
      key={`${pin.id}-marker`}
      id={`${pin.id}-marker`}
      coordinate={[pin.coordinates.longitude, pin.coordinates.latitude]}
      anchor={{ x: 0.5, y: 0.5 }}
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
    </MarkerView>
  );
});

PinMarker.displayName = 'PinMarker';

const styles = StyleSheet.create({
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    ...Platform.select({
      android: {
        elevation: 5,
        width: 'auto',
        alignSelf: 'center',
      }
    }),
  },
  emoji: {
    fontSize: 24,
    textAlign: 'center',
  },
});
