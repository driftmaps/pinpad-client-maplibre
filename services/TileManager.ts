import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { unzip } from 'react-native-zip-archive';

export class TileManager {
  private initialized = false;
  private dataPath: string | null = null;
  private stylePath: string | null = null;
  private tilesPath: string | null = null;
  private centerCoordinate: [number, number] | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const asset = await Asset.fromModule(require('../assets/test.drift')).downloadAsync();
      await this.processDriftFile(asset.localUri!);
      this.initialized = true;
    } catch (error: any) {
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

      // Currently we are forcing a clean up
      // in real world we would be keeping caches
      if (await FileSystem.getInfoAsync(extractionPath)) {
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
      if (await FileSystem.getInfoAsync(this.stylePath)) {
        const styleContent = await FileSystem.readAsStringAsync(this.stylePath);
        const style = JSON.parse(styleContent);

        // Get center coordinates from metadata or use default
        if (style.metadata && style.metadata.centerCoordinate) {
          this.centerCoordinate = style.metadata.centerCoordinate;
          console.log('setting centerCoordinate to [lon, lat] = ', this.centerCoordinate);
        }

        // This code adds the tiles to the sources definition
        // This approach suggests that we are going to limit the view
        // to the tiles that we have at the point of interaction
        // This may prove to be annoying for us and we may need
        // to somehow intercept the request event
        // but this is fine for now
        // TODO: determine whether this is acceptable once we start
        // using non-streaming approach
        style.sources = {
          "custom-tiles": {
            "type": "vector",
            "tiles": [`${this.tilesPath}/{z}/{x}/{y}.pbf`],
            "zoomlevel": 9,
            "maxzoom": 14,
            "minzoom": 5
          }
        };

        // Write back the modified style file
        await FileSystem.writeAsStringAsync(
            this.stylePath, JSON.stringify(style, null, 2));
      } else {
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
      throw new Error('TileManager not initialized or no stylePath');
    }
    return this.stylePath;
  }

  getTilePath(): string {
    if (!this.initialized || !this.tilesPath) {
      throw new Error('TileManager not initialized or no tilesPath');
    }
    console.log('[TileManager] Returning tile path:', this.tilesPath);
    return this.tilesPath;
  }

  public getCenter(): number[] {
    if (!this.initialized || !this.centerCoordinate) {
      throw new Error('TileManager not initialized or center coordinate not set');
    }
    return this.centerCoordinate;
  }
}
