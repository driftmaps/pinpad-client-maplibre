import {TileManager} from '@/services/TileManager';
import {useEffect} from 'react';
import {DeviceEventEmitter, NativeEventEmitter, NativeModules} from 'react-native';

const emitter = new NativeEventEmitter();

// Hook that sets up listeners for .drift file open events
export function useDriftFile(tileManager: TileManager) {
  useEffect(() => {
    // Listen for Android events via DeviceEventEmitter
    const subscription = DeviceEventEmitter.addListener('DriftFileOpened', async (fileUri) => {
      console.log("EVENT TRIGGERED");
      // Handle Android content:// URIs
      let localPath = fileUri;
      if (fileUri.startsWith('content://')) {
        console.log("DETECTED FILE");
        localPath = fileUri.replace('content://', '');
      }
      console.log('Received .drift file:', fileUri);
      await tileManager.processDriftFile(localPath);
    });

    // Listen for iOS events via NativeEventEmitter
    emitter.addListener('DriftFileOpened', (fileUri) => {
      console.log("EVENT TRIGGERED via NativeEventEmitter", fileUri);
    });

    // Clean up listeners on unmount
    return () => {
      subscription.remove();
    };
  }, []);
}
