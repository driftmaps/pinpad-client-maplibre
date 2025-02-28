import * as FileSystem from 'expo-file-system';
import { unzip } from 'react-native-zip-archive';
import { Asset } from 'expo-asset';

// Note: This is a temporary sketch and these aren't being used currently
// TODO: Replace
export class FileSystemService {
  // TODO: Generalize these methods
  async extractTileBundle(bundleName: string, extractionPath: string): Promise<string> {
    const zipDestination = `${FileSystem.documentDirectory}${bundleName}`;

    const destinationInfo = await FileSystem.getInfoAsync(zipDestination);
    const extractionInfo = await FileSystem.getInfoAsync(extractionPath);
    
    if (destinationInfo.exists) {
      await FileSystem.deleteAsync(zipDestination, { idempotent: true });
    }
    if (extractionInfo.exists) {
      await FileSystem.deleteAsync(extractionPath, { idempotent: true });
    }

    // Load the asset using Expo's Asset system
    const asset = await Asset.loadAsync(bundleName);
    if (asset && asset[0]) {
      await FileSystem.copyAsync({
        from: asset[0].localUri!,
        to: zipDestination
      });
    } else {
      throw new Error(`Failed to load asset: ${bundleName}`);
    }

    await unzip(zipDestination, extractionPath);
    return `${extractionPath}/tiles`;
  }

  async getTile(tilePath: string): Promise<string> {
    if (!(await FileSystem.getInfoAsync(tilePath))) {
      throw new Error(`Tile not found: ${tilePath}`);
    }
    return tilePath;
  }
}
