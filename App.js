import { useMemo, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, InteractionManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTileManager } from './hooks/useTileManager';
import { usePinsState } from './hooks/usePinsState';
import { useDriftfileListener } from './hooks/useDriftfileListener';
import { MapContainer } from './components/MapContainer';
import { PinManagement } from './components/PinManagement';

let mapStyle = require('./assets/map_style.json');

export default function App() {
  let { tileManager, isLoading, error } = useTileManager();
  mapStyle.sources = {
    'custom-tiles': {
      type: 'vector',
      tiles: [`${tileManager.getTilesPath()}/{z}/{x}/{y}.pbf`],
      zoomlevel: 9,
      maxzoom: 14,
      minzoom: 5,
    },
  };

  const [CameraProps, setCameraProps] = useState({
    centerCoordinate: null,
    zoomLevel: 0,
  });

  useDriftfileListener(tileManager, isLoading, setCameraProps);

  let { pins, setPendingPin, clearPendingPin, deletePin, finalizePendingPin, updatePendingPin } =
    usePinsState(tileManager.getPins());
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);

  const isTransitioningRef = useRef(false);

  const handleMapPress = useCallback(
    event => {
      if (!event?.geometry?.coordinates || isTransitioningRef.current) return;

      isTransitioningRef.current = true;
      const coordinates = {
        longitude: event.geometry.coordinates[0],
        latitude: event.geometry.coordinates[1],
      };

      clearPendingPin();
      setSelectedPin(null);

      setCameraProps({
        centerCoordinate: [coordinates.longitude, coordinates.latitude],
        padding: { paddingBottom: 400 },
        animationMode: 'easeTo',
        animationDuration: 250,
      });

      setPendingPin(coordinates);
      setSelectedLocation(coordinates);

      InteractionManager.runAfterInteractions(() => {
        isTransitioningRef.current = false;
      });
    },
    [setPendingPin, clearPendingPin]
  );

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

  const handlePinPress = useCallback(
    pin => {
      if (!isTransitioningRef.current) {
        isTransitioningRef.current = true;

        setCameraProps({
          centerCoordinate: [pin.coordinates.longitude, pin.coordinates.latitude],
          padding: { paddingBottom: 400 },
          animationMode: 'easeTo',
          animationDuration: 250,
        });

        setSelectedPin(pin);
        setSelectedLocation(pin.coordinates);
        clearPendingPin();

        InteractionManager.runAfterInteractions(() => {
          isTransitioningRef.current = false;
        });
      }
    },
    [clearPendingPin]
  );

  const handlePinDelete = useCallback(
    pin => {
      deletePin(pin);
      handleBottomSheetClose();
    },
    [deletePin, handleBottomSheetClose]
  );

  const handlePinCreate = useCallback(
    (emoji, message) => {
      finalizePendingPin({
        emoji,
        message,
        coordinates: selectedLocation,
        timestamp: Date.now(),
      });

      requestAnimationFrame(() => {
        setSelectedLocation(null);
        setSelectedPin(null);
        clearPendingPin();
      });
    },
    [finalizePendingPin, selectedLocation, clearPendingPin]
  );

  pins = tileManager.getPins();
  const visiblePins = useMemo(() => pins.filter(pin => pin && pin.coordinates), [pins]);

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
          mapStyle={mapStyle}
          pins={visiblePins}
          onMapPress={handleMapPress}
          onPinPress={handlePinPress}
          onPinRemove={deletePin}
          cameraProps={CameraProps}
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
