import {Asset} from 'expo-asset';
import {unzip} from 'react-native-zip-archive';
import * as FileSystem from 'expo-file-system';

export class TileManager {
  private initialized = false;
  private dataPath: string|null = null;
  private stylePath: string|null = null;
  private tilesPath: string|null = null;
  private centerCoordinate: [number, number] | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const asset = await Asset.fromModule(require('../assets/test.drift'))
                        .downloadAsync();
      
      await this.processDriftFile(asset.localUri!);
      this.initialized = true;
    } catch (error: any) {
      console.error('TileManager initialization error:', error);
      throw new Error(`Failed to initialize TileManager: ${error.message}`);
    }
  }

  async handleDriftUrl(url: string): Promise<void> {

    // Skip expo development client URLs
    if (url.startsWith("exp+pinpad-client-maplibre://")) {
      return;
    }

    try {
      const localPath = FileSystem.cacheDirectory + "downloaded.drift";
      await FileSystem.copyAsync({ from: url, to: localPath });
      await this.processDriftFile(localPath);
    } catch (error) {
      throw error;
    }
  }

  async processDriftFile(filePath: string): Promise<void> {
    try {
      const extractionPath = `${FileSystem.documentDirectory}pinpad_tiles`;

      // Currently we are forcing a clean up
      // in real world we would be keeping caches
      const dirInfo = await FileSystem.getInfoAsync(extractionPath);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(extractionPath, { idempotent: true });
      }
      await FileSystem.makeDirectoryAsync(extractionPath, { intermediates: true });

      await unzip(filePath, extractionPath);

      this.dataPath = `${extractionPath}/tiles`;
      this.tilesPath = `${this.dataPath}/data`;
      this.stylePath = `${this.dataPath}/style.json`;
      

      const styleInfo = await FileSystem.getInfoAsync(this.stylePath);
      
      if (styleInfo.exists) {
        const styleContent = await FileSystem.readAsStringAsync(this.stylePath);
        
        const style = JSON.parse(styleContent);

        if (style.metadata && style.metadata.centerCoordinate) {
          this.centerCoordinate = style.metadata.centerCoordinate;
        } else {
          this.centerCoordinate = [-73.72826520392081, 45.584043985983];
        }

        style.sources = {
          'custom-tiles': {
            'type': 'vector',
            'tiles': [`${this.tilesPath}/{z}/{x}/{y}.pbf`],
            'zoomlevel': 9,
            'maxzoom': 14,
            'minzoom': 5
          }
        };

        await FileSystem.writeAsStringAsync(
            this.stylePath, JSON.stringify(style, null, 2));
            
      } else {
        console.error('Style file does not exist at', this.stylePath);
        throw new Error('Style file does not exist');
      }
    } catch (error: any) {
      console.error('TileManager initialization error:', error);
      throw new Error(`Failed to initialize TileManager: ${error.message}`);
    }
  }

  getStyleUrl(): string {
    if (!this.initialized || !this.stylePath) {
      throw new Error('TileManager not initialized or no stylePath');
    }
    const styleUrl = `${this.stylePath}`;
    return styleUrl;
  }

  getTilePath(): string {
    if (!this.initialized || !this.tilesPath) {
      throw new Error('TileManager not initialized or no tilesPath');
    }
    return this.tilesPath;
  }

  public getCenter(): number[] {
    if (!this.initialized || !this.centerCoordinate) {
      throw new Error('TileManager not initialized or center coordinate not set');
    }
    return this.centerCoordinate;
  }
}
