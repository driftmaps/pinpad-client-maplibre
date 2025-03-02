import {useEffect} from 'react';
import {Linking} from 'react-native';

import {TileManager} from '../services/TileManager';


export async function listenForDriftFiles(
    tileManager: TileManager, isLoading: boolean,
    setStyleUri: (styleUri: {base: string; version: number}) => void,
    setCameraProps: (props: any) => void) {
  // Updates the style URI with a version timestamp to force MapView to reload
  const updateStyleUri = () => {
    const baseStyleUri = tileManager.getStyleUri();
    if (!baseStyleUri) {
      console.log('[listenForDriftFiles] No style URI available yet');
      return;
    }
    const version = new Date().getTime();
    console.log('[listenForDriftFiles] Updating style URI:', { baseStyleUri, version });
    setStyleUri({base: baseStyleUri, version});

    // Update camera position to match new drift file's center
    const centerCoordinate = tileManager.getCenter();
    console.log('[listenForDriftFiles] Updating camera position to:', centerCoordinate);
    setCameraProps({
      centerCoordinate,
      zoomLevel: 10,
      animationMode: 'flyTo',
      animationDuration: 2000
    });
  };

  // Handles incoming .drift file URIs, processes them with TileManager
  const handleUri = async (uri: string | null): Promise<void> => {
    console.log('[listenForDriftFiles] Received URI:', uri);
    if (!uri) {
      console.log('[listenForDriftFiles] Empty URI received, skipping');
      return;
    }
    if (isLoading) {
      console.log('[listenForDriftFiles] TileManager still initializing, skipping URI');
      return;
    }
    try {
      console.log('[listenForDriftFiles] Processing URI with TileManager');
      await tileManager.handleDriftUri(uri);
      updateStyleUri();
    } catch (err) {
      console.error('[listenForDriftFiles] Error handling URI:', err);
    }
  };

  // Sets up URI handling for deep links and initial URIs
  useEffect(() => {
    console.log('[listenForDriftFiles] Setting up URI listeners, isLoading:', isLoading);
    if (!isLoading) {
      // Only set up URI handling after TileManager is ready
      console.log('[listenForDriftFiles] Checking for initial URL');
      Linking.getInitialURL().then(initialUrl => {
        if (initialUrl) {
          handleUri(initialUrl);
        } else {
          // If no initial URL is found but TileManager is ready,
          // still update the style URI to display the map
          console.log('[listenForDriftFiles] No initial URL found, using default style');
          updateStyleUri();
        }
      });
      
      const subscription =
          Linking.addEventListener('url', (event) => handleUri(event.url));
      return () => {
        console.log('[listenForDriftFiles] Cleaning up URI listeners');
        subscription.remove();
      };
    }
  }, [isLoading, tileManager]);
}