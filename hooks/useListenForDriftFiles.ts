import { useEffect } from 'react';
import { Linking } from 'react-native';

import { TileManager } from '../services/TileManager';

export function useListenForDriftFiles(
  tileManager: TileManager | null,
  isLoading: boolean,
  setStyleUri: (styleUri: { base: string; version: number }) => void,
  setCameraProps: (props: any) => void) {
  // Updates the style URI with a version timestamp to force MapView to reload
  const updateStyleUri = () => {
    if (!tileManager) {
      console.error('[useListenForDriftFiles] TileManager is null');
      return;
    }

    try {
      // Get the style URI - this should return a JSON string in streaming mode
      const baseStyleUri = tileManager.getStyleUri();
      console.log('[useListenForDriftFiles] Got style URI, length:', baseStyleUri?.length || 0);

      if (!baseStyleUri) {
        console.log('[useListenForDriftFiles] No style URI available');
        return;
      }

      const version = new Date().getTime();
      setStyleUri({ base: baseStyleUri, version });
      console.log('[useListenForDriftFiles] Set style URI with version:', version);

      // Update camera position to match current mode's center
      try {
        const centerCoordinate = tileManager.getCenter();
        console.log('[useListenForDriftFiles] Updating camera position to:', centerCoordinate);

        // Adjust animation based on mode
        const currentMode = tileManager.getMode();
        console.log('[useListenForDriftFiles] Current map mode:', currentMode);

        const animationConfig = currentMode === 'reading'
          ? { animationMode: 'flyTo', animationDuration: 2000 }
          : { animationMode: 'easeTo', animationDuration: 500 };

        setCameraProps({
          centerCoordinate,
          zoomLevel: currentMode === 'reading' ? 10 : 5,
          ...animationConfig
        });
      } catch (cameraError) {
        console.error('[useListenForDriftFiles] Error setting camera props:', cameraError);
        // Set default camera position if there's an error
        setCameraProps({
          centerCoordinate: [-73.72826520392081, 45.584043985983],
          zoomLevel: 5,
          animationMode: 'easeTo',
          animationDuration: 500
        });
      }
    } catch (error) {
      console.error('[useListenForDriftFiles] Error updating style URI:', error);
    }
  };

  // Immediately update the style URI when TileManager becomes ready
  useEffect(() => {
    if (tileManager && !isLoading) {
      console.log('[useListenForDriftFiles] TileManager ready, updating style URI immediately');
      updateStyleUri();
    }
  }, [tileManager, isLoading]);

  // Handles incoming .drift file URIs, processes them with TileManager
  const handleUri = async (uri: string | null): Promise<void> => {
    if (!tileManager) return;

    if (!uri) {
      console.warn('[useListenForDriftFiles] Empty URI received, skipping');
      return;
    }
    if (isLoading) {
      console.log('[useListenForDriftFiles] TileManager still initializing, skipping URI');
      return;
    }
    try {
      await tileManager.handleDriftUri(uri);
      updateStyleUri();

    } catch (err) {

      // If there's an error, ensure we're still in a valid state
      const currentMode = tileManager.getMode();
      if (currentMode !== 'streaming') {
        console.warn('[useListenForDriftFiles] Error occurred, switching back to streaming mode');
        tileManager.setMode('streaming');
        updateStyleUri();
      }
    }
  };

  // Sets up URI handling for deep links and initial URIs
  useEffect(() => {
    if (!tileManager || isLoading) return;

    // Only set up URI handling after TileManager is ready
    console.log('[useListenForDriftFiles] Setting up URI listeners');

    // Check for initial URL only if not already in a session
    if (tileManager.getMode() === 'streaming') {
      Linking.getInitialURL().then(initialUrl => {
        if (initialUrl && initialUrl.toLowerCase().endsWith('.drift')) {
          handleUri(initialUrl);
        } else {
          console.log('[useListenForDriftFiles] No valid initial drift URL found, using default style');
        }
      }).catch(err => {
        console.error('[useListenForDriftFiles] Error getting initial URL:', err);
      });
    }

    // Always listen for new URLs
    const subscription = Linking.addEventListener('url', (event) => handleUri(event.url));

    return () => {
      console.log('[useListenForDriftFiles] Cleaning up URI listeners');
      subscription.remove();
    };
  }, [isLoading, tileManager]);
}
