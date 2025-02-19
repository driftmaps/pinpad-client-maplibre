import {TileManager} from '@/services/TileManager';
import {useEffect} from 'react';
import {DeviceEventEmitter, NativeEventEmitter, NativeModules} from 'react-native';

const emitter = new NativeEventEmitter();

// eslint-disable-next-line react-hooks/exhaustive-deps
export function useDriftFile(tileManager: TileManager) {
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('DriftFileOpened', async (fileUri) => {
      console.log("EVENT TRIGGERED");
      // Possibly handle content:// if needed
      let localPath = fileUri;
      if (fileUri.startsWith('content://')) {
        console.log("DETECTED FILE");
        localPath = fileUri.replace('content://', '');
      }
      console.log('Received .drift file:', fileUri);
      await tileManager.processDriftFile(localPath);
    });

    emitter.addListener('DriftFileOpened', (fileUri) => {
      console.log("EVENT TRIGGERED via NativeEventEmitter", fileUri);
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
