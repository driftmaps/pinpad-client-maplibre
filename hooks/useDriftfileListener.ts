import { useEffect } from 'react';
import { Linking } from 'react-native';
import { TileManager } from '../services/TileManager';

export async function useDriftfileListener(
  tileManager: TileManager,
  isLoading: boolean,
  setCameraProps: (props: any) => void
) {
  // Updates the style URI with a version timestamp to force MapView to reload
  const recenterMap = () => {
    // Update camera position to match new drift file's center
    const centerCoordinate = tileManager.getCenter();
    console.log('[useDriftfileListener] Updating camera position to:', centerCoordinate);
    setCameraProps({
      centerCoordinate,
      zoomLevel: 10,
      animationMode: 'flyTo',
      animationDuration: 2000,
    });
  };

  // Handles incoming .drift file URIs, processes them with TileManager
  const handleDriftfileUri = async (uri: string | null): Promise<void> => {
    console.log('[useDriftfileListener] Received URI:', uri);
    if (!uri) {
      console.log('[useDriftfileListener] Empty URI received, skipping');
      return;
    }
    if (isLoading) {
      console.log('[useDriftfileListener] TileManager still initializing, skipping URI');
      return;
    }
    try {
      console.log('[useDriftfileListener] Processing URI with TileManager');
      await tileManager.handleDriftUri(uri);
      recenterMap();
    } catch (err) {
      console.error('[useDriftfileListener] Error handling URI:', err);
    }
  };

  // Sets up URI handling for deep links and initial URIs
  useEffect(() => {
    console.log('[useDriftfileListener] Setting up URI listeners, isLoading:', isLoading);
    if (!isLoading) {
      // Only set up URI handling after TileManager is ready
      console.log('[useDriftfileListener] Checking for initial URL');
      Linking.getInitialURL().then(initialUrl => {
        if (initialUrl) {
          handleDriftfileUri(initialUrl);
        } else {
          // If no initial URL is found but TileManager is ready,
          // still update the style URI to display the map
          console.log('[useDriftfileListener] No initial URL found, using default style');
          recenterMap();
        }
      });

      const subscription = Linking.addEventListener('url', event => handleDriftfileUri(event.url));
      return () => {
        console.log('[useDriftfileListener] Cleaning up URI listeners');
        subscription.remove();
      };
    }
  }, [isLoading, tileManager]);
}
