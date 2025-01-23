import React, { useRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { MapView, Camera } from '@maplibre/maplibre-react-native';
import { PinMarker } from './PinMarker';
import { Pin } from '@/types/pin';

interface MapContainerProps {
  styleUrl: string;
  pins: Pin[];
  onMapPress: (event: any) => void;
  onPinPress: (pin: Pin) => void;
  onPinRemove: (pin: Pin) => void;
  cameraProps: Record<string, any>;
}

export function MapContainer({
  styleUrl,
  pins,
  onMapPress,
  onPinPress,
  onPinRemove,
  cameraProps
}: MapContainerProps) {
  const cameraRef = useRef(null);

  return (
    <MapView
      style= { styles.map }
  mapStyle = { styleUrl }
  testID = "map-view"
  onPress = { onMapPress }
  accessible = { false}
  focusable = { false}
    >
    <Camera
        ref={ cameraRef }
  {...cameraProps }
      />
  {
    pins.map(pin => (
      <PinMarker
          key= { pin.id }
          pin = { pin }
          onRemove = { onPinRemove }
          onPress = { onPinPress }
      />
      ))
  }
  </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
}); 
