import React, { useMemo, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, InteractionManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTileManager } from './hooks/useTileManager';
import { usePinsState } from './hooks/usePinsState';
import { MapContainer } from './components/MapContainer';
import { PinManagement } from './components/PinManagement';

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

  const isTransitioningRef = useRef(false);
  
  const handleMapPress = useCallback((event) => {
    if (!event?.geometry?.coordinates || isTransitioningRef.current) return;
    
    isTransitioningRef.current = true;
    const coordinates = {
      longitude: event.geometry.coordinates[0],
      latitude: event.geometry.coordinates[1]
    };
    
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

  if (isLoading) return <ActivityIndicator />;
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
        <MapContainer
          styleUrl={tileManager.getStyleUrl()}
          pins={visiblePins}
          onMapPress={handleMapPress}
          onPinPress={handlePinPress}
          onPinRemove={deletePin}
          cameraProps={initialCameraProps}
        />
        
        <PinManagement
          selectedLocation={selectedLocation}
          selectedPin={selectedPin}
          onClose={handleBottomSheetClose}
          onPinCreate={handlePinCreate}
          onPinDelete={handlePinDelete}
          onUpdatePendingPin={updatePendingPin}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
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
