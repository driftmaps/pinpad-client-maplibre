import React, { useMemo, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, InteractionManager, TouchableWithoutFeedback } from 'react-native';
import { MapView, Camera } from '@maplibre/maplibre-react-native';
import { useTileManager } from './hooks/useTileManager';
import { usePinsState } from './hooks/usePinsState';
import { BottomSheet } from './components/BottomSheet';
import { PinMarker } from './components/PinMarker';
import { PinCreationForm } from './components/PinCreationForm';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PinDetailsView } from './components/PinDetailsView';

export default function App() {
  const { tileManager, isLoading, error } = useTileManager();
  const {
    pins,
    setPendingPin,
    clearPendingPin,
    deletePin,
    finalizePendingPin,
    updatePendingPin
  } = usePinsState();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);

  const [initialCameraProps, setInitialCameraProps] = useState({
    centerCoordinate: [-73.72826520392081, 45.584043985983],
    zoomLevel: 10,
  });

  const cameraRef = useRef(null);
  const isTransitioningRef = useRef(false);
  
  const handleMapPress = useCallback((event) => {
    if (!event?.geometry?.coordinates) return;
    
    if (!isTransitioningRef.current) {
      const coordinates = {
        longitude: event.geometry.coordinates[0],
        latitude: event.geometry.coordinates[1]
      };
      
      isTransitioningRef.current = true;
      clearPendingPin();
      setSelectedPin(null);
      
      setInitialCameraProps({
        centerCoordinate: [coordinates.longitude, coordinates.latitude],
        padding: { paddingBottom: 400 },
        animationMode: 'easeTo',
        animationDuration: 250
      });
      
      setPendingPin(coordinates);
      setSelectedLocation(coordinates);
      
      InteractionManager.runAfterInteractions(() => {
        isTransitioningRef.current = false;
      });
    }
  }, [setPendingPin, clearPendingPin]);
  
  const handleBottomSheetClose = useCallback(() => {
    if (isTransitioningRef.current) return;
    
    isTransitioningRef.current = true;
    
    setSelectedLocation(null);
    setSelectedPin(null);
    
    requestAnimationFrame(() => {
      clearPendingPin();
      isTransitioningRef.current = false;
    });
  }, [clearPendingPin]);

  const handlePinPress = useCallback((pin) => {
    if (!isTransitioningRef.current) {
      isTransitioningRef.current = true;
      
      setInitialCameraProps({
        centerCoordinate: [pin.coordinates.longitude, pin.coordinates.latitude],
        padding: { paddingBottom: 400 },
        animationMode: 'easeTo',
        animationDuration: 250
      });

      setSelectedPin(pin);
      setSelectedLocation(pin.coordinates);
      clearPendingPin();
      
      InteractionManager.runAfterInteractions(() => {
        isTransitioningRef.current = false;
      });
    }
  }, [clearPendingPin]);

  const handlePinDelete = useCallback((pin) => {
    deletePin(pin);
    handleBottomSheetClose();
  }, [deletePin, handleBottomSheetClose]);

  const handlePinCreate = useCallback((emoji, message) => {
    finalizePendingPin({
      emoji,
      message,
      coordinates: selectedLocation,
      timestamp: Date.now()
    });

    requestAnimationFrame(() => {
      setSelectedLocation(null);
      setSelectedPin(null);
      clearPendingPin();
    });
  }, [finalizePendingPin, selectedLocation, clearPendingPin]);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View 
        style={styles.container}
        pointerEvents="auto"
      >
        <MapView
          style={styles.map}
          mapStyle={tileManager.getStyleUrl()}
          testID="map-view"
          onPress={handleMapPress}
          accessible={false}
          focusable={false}
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
              onPress={handlePinPress}
            />
          ))}
        </MapView>

        <BottomSheet
          visible={!!selectedLocation}
          onClose={handleBottomSheetClose}
        >
          {selectedPin ? (
            <PinDetailsView
              pin={selectedPin}
              onClose={handleBottomSheetClose}
              onDelete={handlePinDelete}
            />
          ) : (
            <PinCreationForm
              onSubmit={handlePinCreate}
              onCancel={handleBottomSheetClose}
              onEmojiSelect={(emoji) => {
                updatePendingPin({ emoji });
              }}
            />
          )}
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
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
