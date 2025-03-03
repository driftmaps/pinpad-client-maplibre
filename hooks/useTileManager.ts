import { useState, useEffect } from 'react';
import { TileManager } from '../services/TileManager';
import { TileManagerState } from '../types/tiles';

export function useTileManager() {
  const [state, setState] = useState<TileManagerState>({
    isInitialized: false,
    isLoading: true,
    error: null,
  });

  const [tileManager] = useState(() => new TileManager());

  useEffect(() => {
    const initializeTiles = async () => {
      try {
        await tileManager.initialize();
        setState({ isInitialized: true, isLoading: false, error: null });
      } catch (error) {
        setState({ isInitialized: false, isLoading: false, error: error as Error });
      }
    };

    initializeTiles();
  }, []);

  // Set up a polling mechanism to check the loading state
  // Check the loading state every 100ms, this is an absurdity
  // TODO: This should just be centralized state
  useEffect(() => {
    if (!state.isInitialized) return;
    const interval = setInterval(() => {
      const currentLoading = tileManager.getIsLoading();

      if (currentLoading !== state.isLoading) {
        console.log('[useTileManager] Loading state changed:', state.isLoading, '->', currentLoading);
        setState(prevState => ({
          ...prevState,
          isLoading: currentLoading
        }));
      }
    }, 100);

    return () => {
      console.log('[useTileManager] Cleaning up loading state polling');
      clearInterval(interval);
    };
  }, [state.isInitialized, state.isLoading, tileManager]);

  return { tileManager, ...state };
}
