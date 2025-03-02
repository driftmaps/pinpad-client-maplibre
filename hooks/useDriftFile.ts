import {TileManager} from '@/services/TileManager';
import {useEffect} from 'react';
import {DeviceEventEmitter, NativeEventEmitter, NativeModules} from 'react-native';

const emitter = new NativeEventEmitter();

// Hook that sets up listeners for .drift file open events
export function useDriftFile(tileManager: TileManager) {
  useEffect(() => {
    console.log('[useDriftFile] Setting up file event listeners');
    
    // Listen for Android events via DeviceEventEmitter
    const subscription = DeviceEventEmitter.addListener('DriftFileOpened', async (fileUri) => {
      console.log('[useDriftFile] Android event triggered with URI:', fileUri);
      
      // Handle Android content:// URIs
      let localPath = fileUri;
      if (fileUri.startsWith('content://')) {
        console.log('[useDriftFile] Converting content:// URI to local path');
        localPath = fileUri.replace('content://', '');
      }
      
      console.log('[useDriftFile] Processing file:', localPath);
      await tileManager.processDriftFile(localPath);
    });

    // Listen for iOS events via NativeEventEmitter
    emitter.addListener('DriftFileOpened', (fileUri) => {
      console.log('[useDriftFile] iOS event triggered with URI:', fileUri);
    });

    return () => {
      console.log('[useDriftFile] Cleaning up file event listeners');
      subscription.remove();
    };
  }, []);
}
