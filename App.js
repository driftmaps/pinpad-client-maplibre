import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, InteractionManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTileManager } from './hooks/useTileManager';
import { usePinsState } from './hooks/usePinsState';
import { useListenForDriftFiles } from './hooks/listenForDriftFiles';
import { MapContainer } from './components/MapContainer';
import { PinManagement } from './components/PinManagement';

export default function App() {
  const { tileManager, isLoading, error } = useTileManager();

  const [styleUri, setStyleUri] = useState(null);
  console.log("[App] Current styleUri:", styleUri);

  const [CameraProps, setCameraProps] = useState({
    centerCoordinate: [-73.72826520392081, 45.584043985983], // Default coordinates
    zoomLevel: 5,
  });
  
  const [mapMode, setMapMode] = useState('streaming');
  const [setupError, setSetupError] = useState(null);

  // Use the drift files hook directly, which will set up the listeners internally
  try {
    useListenForDriftFiles(tileManager, isLoading, setStyleUri, setCameraProps);
  } catch (err) {
    console.error("[App] Error in useListenForDriftFiles:", err);
    setSetupError(err.message || "Failed to set up file listeners");
  }
  
  // Update map mode when TileManager mode changes
  useEffect(() => {
    if (tileManager && !isLoading) {
      try {
        const currentMode = tileManager.getMode();
        setMapMode(currentMode);
        console.log("[App] Map mode set to:", currentMode);
      } catch (err) {
        console.error("[App] Error getting map mode:", err);
      }
    }
  }, [tileManager, isLoading, styleUri]);

  // Fallback for style URI if none was set
  useEffect(() => {
    // If we still don't have a style URI but TileManager is ready
    if (!styleUri && tileManager && !isLoading) {
      try {
        console.log("[App] Style URI not set yet, creating fallback");
        const defaultStyleJson = require('./assets/tiles/style.json');
        setStyleUri({
          base: JSON.stringify(defaultStyleJson),
          version: new Date().getTime()
        });
      } catch (err) {
        console.error("[App] Error creating fallback style URI:", err);
      }
    }
  }, [styleUri, tileManager, isLoading]);

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
    
    setCameraProps({
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
      
      setCameraProps({
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

  // Create a direct style URI from the default style if none exists yet
  const defaultStyleUri = useMemo(() => {
    if (!styleUri) {
      try {
        const defaultStyleJson = require('./assets/tiles/style.json');
        return {
          base: JSON.stringify(defaultStyleJson),
          version: new Date().getTime()
        };
      } catch (err) {
        console.error("[App] Error creating default style URI:", err);
        return null;
      }
    }
    return null;
  }, [styleUri]);

  // Determine what style to use (regular or default)
  const effectiveStyleUri = styleUri || defaultStyleUri;

  // Determine if we have a critical error that prevents rendering the map
  const criticalError = error || setupError;
  const showErrorState = criticalError && !effectiveStyleUri;

  if (isLoading && !effectiveStyleUri) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff8080" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }
  
  if (showErrorState) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {criticalError.message || "Unknown error"}</Text>
        <Text style={styles.errorDetails}>Try restarting the application or check your connection</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {mapMode === 'streaming' && (
          <View style={styles.modeIndicator}>
            <Text style={styles.modeText}>Streaming Mode</Text>
          </View>
        )}
        
        {mapMode === 'reading' && (
          <View style={[styles.modeIndicator, styles.readingMode]}>
            <Text style={styles.modeText}>Reading Mode</Text>
          </View>
        )}
        
        {/* Always show the map if we have any style */}
        {effectiveStyleUri && (
          <MapContainer
            styleUrl={effectiveStyleUri}
            pins={visiblePins}
            onMapPress={handleMapPress}
            onPinPress={handlePinPress}
            onPinRemove={deletePin}
            cameraProps={CameraProps}
          />
        )}
        
        {/* Only show loading if we don't have any style */}
        {!effectiveStyleUri && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="medium" color="#ff8080" />
            <Text style={styles.loadingText}>Preparing map...</Text>
          </View>
        )}
        
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
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#ff8080',
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  errorDetails: {
    color: '#ff8080',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#ff8080',
    marginTop: 10,
    fontSize: 16,
  },
  modeIndicator: {
    position: 'absolute',
    top: 40,
    right: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 128, 128, 0.8)',
    borderRadius: 4,
    zIndex: 1000,
  },
  readingMode: {
    backgroundColor: 'rgba(128, 170, 255, 0.8)',
  },
  modeText: {
    color: '#000000',
    fontWeight: 'bold',
  }
});
