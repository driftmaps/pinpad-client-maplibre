import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, InteractionManager } from 'react-native';
import { MapView, Camera } from '@maplibre/maplibre-react-native';
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

  const [initialCameraProps, setInitialCameraProps] = useState({
    centerCoordinate: [-73.72826520392081, 45.584043985983],
    zoomLevel: 10,
  });

  const cameraRef = useRef(null);
  const isTransitioningRef = useRef(false);
  
  const handleMapPress = useCallback((event) => {
    if (!event?.geometry?.coordinates || isTransitioningRef.current) return;
  
    // Prevent multiple rapid-fire events
    isTransitioningRef.current = true;
  
    const coordinates = {
      longitude: event.geometry.coordinates[0],
      latitude: event.geometry.coordinates[1]
    };
    
    clearPendingPin();
    
    // Small delay to ensure we don't get multiple events
    setTimeout(() => {
      setInitialCameraProps({
        centerCoordinate: [coordinates.longitude, coordinates.latitude],
        padding: { paddingBottom: 400 },
        animationMode: 'easeTo',
        animationDuration: 250
      });
      
      setPendingPin(coordinates);
      setSelectedLocation(coordinates);
      
      // Reset the transition flag after a short delay
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 300);
    }, 0);
  }, [setPendingPin, clearPendingPin]);
  
  const handleBottomSheetClose = useCallback(() => {
    if (isTransitioningRef.current) return;
    
    isTransitioningRef.current = true;
    
    setSelectedLocation(null);
    
    requestAnimationFrame(() => {
      clearPendingPin();
      isTransitioningRef.current = false;
    });
  }, [clearPendingPin]);

  const visiblePins = useMemo(() => 
    pins.filter(pin => pin && pin.coordinates), 
    [pins]
  );

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
  console.log(visiblePins);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <MapView
          style={styles.map}
          mapStyle={tileManager.getStyleUrl()}
          testID="map-view"
          onPress={handleMapPress}
        >
          <Camera
            ref={cameraRef}
            {...initialCameraProps}
          />
          {visiblePins.map(pin => (
            <PinMarker
              key={pin.id}
              pin={pin}
              onRemove={deletePin}
              style={{ zIndex: 100 }}
            />
          ))}
        </MapView>

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
    flex: 1,
    zIndex: -1
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
