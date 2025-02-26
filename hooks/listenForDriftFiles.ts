import {useEffect} from 'react';
import {Linking} from 'react-native';

import {TileManager} from '../services/TileManager';


export async function listenForDriftFiles(
    tileManager: TileManager, isLoading: boolean,
    setStyleUri: (styleUri: {base: string; version: number}) => void) {
  // Updates the style URI with a version timestamp to force MapView to reload
  const updateStyleUri = () => {
    const baseStyleUri = tileManager.getStyleUri();
    const version = new Date().getTime();
    setStyleUri({base: baseStyleUri, version});
  };

  // Handles incoming .drift file URIs, processes them with TileManager
  const handleUri = async (uri: string): Promise<void> => {
    if (!uri) return;
    if (isLoading) {
      console.log('Skipping URI handling while TileManager is initializing');
      return;
    }
    try {
      await tileManager.handleDriftUri(uri);
      updateStyleUri();
    } catch (err) {
      console.error('Error handling URI:', err);
    }
  };

  // Sets up URI handling for deep links and initial URIs
  useEffect(() => {
    if (!isLoading) {
      // Only set up URI handling after TileManager is ready
      Linking.getInitialURL().then(handleUri);
      const subscription =
          Linking.addEventListener('url', (event) => handleUri(event.url));
      return () => subscription.remove();
    }
  }, [isLoading, tileManager]);
}