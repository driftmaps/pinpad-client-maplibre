import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { MapView, Camera } from '@maplibre/maplibre-react-native';
import { PinMarker } from './PinMarker';
import { Pin } from '@/types/pin';

interface MapContainerProps {
  styleUrl: { base: string; version: number } | null;
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
      key={styleUrl?.version}
      style={styles.map}
      mapStyle={styleUrl?.base}
      testID="map-view"
      onPress={onMapPress}
    >
      <Camera
        ref={cameraRef}
        {...cameraProps}
      />
      {
        pins.map(pin => (
          <PinMarker
            key={pin.id}
            pin={pin}
            onRemove={onPinRemove}
            onPress={onPinPress}
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
