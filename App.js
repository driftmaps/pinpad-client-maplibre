import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useTileManager } from './hooks/useTileManager';
import { usePinManager } from './hooks/usePinManager';
import { BottomSheet } from './components/BottomSheet';
import { PinMarker } from './components/PinMarker';
import { PinCreationForm } from './components/PinCreationForm';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const { tileManager, isLoading, error } = useTileManager();
  const {
    pins,
    setPendingPin,
    clearPendingPin,
    deletePin,
    finalizePendingPin
  } = usePinManager();
  const [selectedLocation, setSelectedLocation] = useState(null);

  const mapRef = useRef(null);
  const cameraRef = useRef(null);

  const handleMapPress = useCallback((event) => {
    if (!event?.geometry?.coordinates) return;

    const coordinates = {
      longitude: event.geometry.coordinates[0],
      latitude: event.geometry.coordinates[1]
    };

    requestAnimationFrame(() => {
      setPendingPin(coordinates);
      setSelectedLocation(coordinates);

      cameraRef.current?.setCamera({
        centerCoordinate: [coordinates.longitude, coordinates.latitude],
        padding: { paddingBottom: 400 },
        animationDuration: 1000
      });
    });
  }, [setPendingPin]);

  const handleBottomSheetClose = useCallback(() => {
    setSelectedLocation(null);
    clearPendingPin();
  }, [clearPendingPin]);

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <MapLibreGL.MapView
          style={styles.map}
          styleURL={tileManager.getStyleUrl()}
          testID="map-view"
          onPress={handleMapPress}
        >
          <MapLibreGL.Camera
            ref={cameraRef}
            zoomLevel={9}
            centerCoordinate={[-73.72826520392081, 45.584043985983]}
            minZoomLevel={5}
            maxZoomLevel={11}
          />
          {pins.map(pin => (
            <PinMarker
              key={pin.id}
              pin={pin}
              onRemove={deletePin}
            />
          ))}
        </MapLibreGL.MapView>

        <BottomSheet
          visible={!!selectedLocation}
          onClose={handleBottomSheetClose}
        >
          <PinCreationForm
            onSubmit={(emoji, message) => {
              finalizePendingPin({
                emoji,
                message,
                coordinates: selectedLocation,
                timestamp: Date.now()
              });
              handleBottomSheetClose();
            }}
            onCancel={handleBottomSheetClose}
            onEmojiSelect={() => {
            }}
          />
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    flex: 1
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});
