import {Asset} from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import {unzip} from 'react-native-zip-archive';

// TileManager handles the loading, extraction, and management of map tile data
// from .drift files
export class TileManager {
  private initialized = false;
  private dataPath: string|null = null;
  private stylePath: string|null = null;
  private tilesPath: string|null = null;
  private centerCoordinate: [number, number]|null = null;

  // Initialize TileManager by loading and processing the default .drift file
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load the bundled test.drift file using Expo's Asset system
      const asset = await Asset.fromModule(require('../assets/test.drift'))
                        .downloadAsync();

      await this.processDriftFile(asset.localUri!);
      this.initialized = true;
    } catch (error: any) {
      console.error('TileManager initialization error:', error);
      throw new Error(`Failed to initialize TileManager: ${error.message}`);
    }
  }

  // Handle incoming .drift files from URIs (e.g., from deep links or file
  // system)
  async handleDriftUri(uri: string): Promise<void> {
    // Skip Expo development client URIs to avoid conflicts
    if (uri.startsWith('exp+pinpad-client-maplibre://')) {
      console.log('[TileManager] Skipping Expo development client URI:', uri);
      return;
    }

    try {
      const localPath = FileSystem.cacheDirectory + 'downloaded.drift';
      await FileSystem.copyAsync({from: uri, to: localPath});
      await this.processDriftFile(localPath);
    } catch (error) {
      throw error;
    }
  }

  // Process a .drift file: extract it and set up the tile structure
  async processDriftFile(filePath: string): Promise<void> {
    console.log('[TileManager] Processing drift file:', filePath);
    try {
      const extractionPath = `${FileSystem.documentDirectory}pinpad_tiles`;
      console.log('[TileManager] Extraction path:', extractionPath);

      // Clean up existing tiles
      const dirInfo = await FileSystem.getInfoAsync(extractionPath);
      if (dirInfo.exists) {
        console.log('[TileManager] Cleaning up existing tiles');
        await FileSystem.deleteAsync(extractionPath, {idempotent: true});
      }

      console.log('[TileManager] Creating extraction directory');
      await FileSystem.makeDirectoryAsync(extractionPath, {intermediates: true});

      // Extract the .drift file
      console.log('[TileManager] Starting file extraction...');
      const startTime = Date.now();
      await unzip(filePath, extractionPath);
      const endTime = Date.now();
      console.log(`[TileManager] Extraction completed in ${endTime - startTime}ms`);

      // Set up paths
      this.dataPath = `${extractionPath}/tiles`;
      this.tilesPath = `${this.dataPath}/data`;
      this.stylePath = `${this.dataPath}/style.json`;
      console.log('[TileManager] Paths configured:', {
        dataPath: this.dataPath,
        tilesPath: this.tilesPath,
        stylePath: this.stylePath
      });

      // Process the style file
      const styleInfo = await FileSystem.getInfoAsync(this.stylePath);

      if (styleInfo.exists) {
        const styleContent = await FileSystem.readAsStringAsync(this.stylePath);

        const style = JSON.parse(styleContent);

        // Get center coordinates from metadata or use default
        if (style.metadata && style.metadata.centerCoordinate) {
          this.centerCoordinate = style.metadata.centerCoordinate;
          console.log('setting centerCoordinate to [lon, lat] = ', this.centerCoordinate);
        }

        // Configure the tile source
        style.sources = {
          'custom-tiles': {
            'type': 'vector',
            'tiles': [`${this.tilesPath}/{z}/{x}/{y}.pbf`],
            'zoomlevel': 9,
            'maxzoom': 14,
            'minzoom': 5
          }
        };

        // Write back the modified style file
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

  // Get the URI for the current style file
  getStyleUri(): string {
    if (!this.initialized || !this.stylePath) {
      console.error('[TileManager] Not initialized or no stylePath');
      throw new Error('TileManager not initialized or no stylePath');
    }
    console.log('[TileManager] Returning style URI:', this.stylePath);
    return this.stylePath;
  }

  getTilePath(): string {
    if (!this.initialized || !this.tilesPath) {
      console.error('[TileManager] Not initialized or no tilesPath');
      throw new Error('TileManager not initialized or no tilesPath');
    }
    console.log('[TileManager] Returning tile path:', this.tilesPath);
    return this.tilesPath;
  }

  public getCenter(): number[] {
    if (!this.initialized || !this.centerCoordinate) {
      console.error('[TileManager] Not initialized or no centerCoordinate');
      throw new Error('TileManager not initialized or center coordinate not set');
    }
    console.log('[TileManager] Returning center coordinate:', this.centerCoordinate);
    return this.centerCoordinate;
  }
}
