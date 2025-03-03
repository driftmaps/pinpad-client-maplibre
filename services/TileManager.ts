import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { unzip } from 'react-native-zip-archive';

// Import the default style directly
const defaultStyle = require('../assets/tiles/style.json');

export type MapMode = 'streaming' | 'reading';

const defaultCenterCoordinate: [number, number] = [-73.72826520392081, 45.584043985983];

export class TileManager {
  private initialized = false;
  private dataPath: string | null = null;
  private stylePath: string | null = null;
  private tilesPath: string | null = null;
  private centerCoordinate: [number, number] | null = null;
  private mode: MapMode = 'streaming'; // Default to streaming mode

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // In streaming mode, initialize with the default style but don't download any .drift file
      if (this.mode === 'streaming') {
        console.log('[TileManager] Initializing in streaming mode');

        try {
          // Get center coordinates from the default style
          if (defaultStyle.metadata && defaultStyle.metadata.centerCoordinate) {
            this.centerCoordinate = defaultStyle.metadata.centerCoordinate;
            console.log('[TileManager] Setting centerCoordinate from streaming mode to [lon, lat] = ', this.centerCoordinate);
          } else {
            // Default coordinates if not found in style file
            this.centerCoordinate = defaultCenterCoordinate;
            console.error('[No centerCoordinate found in style file, using default: ', this.centerCoordinate);
          }

          this.initialized = true;
          console.log('[TileManager] Streaming mode initialized successfully');
          return;
        } catch (err) {
          console.error('[TileManager] Error loading style.json in streaming mode:', err);
          // Fall back to default coordinates
          this.centerCoordinate = defaultCenterCoordinate;
          console.log('[TileManager] Using fallback centerCoordinate: ', this.centerCoordinate);
          this.initialized = true;
          return;
        }
      }
    } catch (error: any) {
      // Even if there's an error, initialize with streaming mode as a fallback
      this.mode = 'streaming';
      this.centerCoordinate = defaultCenterCoordinate;
      this.initialized = true;
      console.log('[TileManager] Forcibly initialized with streaming mode due to error');
    }
  }

  // Handle incoming .drift files from URIs (e.g., from deep links or file system)
  async handleDriftUri(uri: string): Promise<void> {

    // Skip Expo development client URIs to avoid conflicts
    if (uri.startsWith('exp+pinpad-client-maplibre://')) {
      console.log('[TileManager] Skipping Expo development client URI:', uri);
      return;
    }

    try {
      // Switching to reading mode when handling a drift file
      this.mode = 'reading';
      console.log('[TileManager] Switching to reading mode for URI:', uri);

      // Check if the URI is accessible before copying
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists) {
          throw new Error(`File does not exist at URI: ${uri}`);
        }
        console.log('[TileManager] File info:', info);
      } catch (infoError: any) {
        console.error('[TileManager] Error checking file info:', infoError);
        throw new Error(`Cannot access file at URI: ${uri}`);
      }

      const localPath = FileSystem.cacheDirectory + 'downloaded.drift';

      // Delete any existing file at the destination
      try {
        const destInfo = await FileSystem.getInfoAsync(localPath);
        if (destInfo.exists) {
          await FileSystem.deleteAsync(localPath, { idempotent: true });
        }
      } catch (deleteError: any) {
        console.warn('[TileManager] Error deleting existing file:', deleteError);
      }

      // Copy the file
      try {
        await FileSystem.copyAsync({ from: uri, to: localPath });
        console.log('[TileManager] Successfully copied file to:', localPath);
      } catch (copyError: any) {
        console.error('[TileManager] Error copying file:', copyError);
        throw new Error(`Failed to copy file: ${copyError.message}`);
      }

      // Process the file
      await this.processDriftFile(localPath);
    } catch (error: any) {
      console.error('[TileManager] Error handling drift URI:', error);
      // Revert to streaming mode if there's an error
      this.mode = 'streaming';
      console.log('[TileManager] Reverted to streaming mode due to error');
      throw error;
    }
  }

  // Get the current map mode
  getMode(): MapMode {
    return this.mode;
  }

  // Set the map mode
  setMode(mode: MapMode): void {
    this.mode = mode;
    console.log('[TileManager] Mode set to:', mode);
  }

  // Process a .drift file: extract it and set up the tile structure
  async processDriftFile(filePath: string): Promise<void> {
    console.log('[TileManager] Processing drift file:', filePath);
    try {
      const extractionPath = `${FileSystem.documentDirectory}pinpad_tiles`;
      console.log('[TileManager] Extraction path:', extractionPath);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`Drift file does not exist at path: ${filePath}`);
      }

      // Currently we are forcing a clean up
      // in real world we would be keeping caches
      try {
        const dirInfo = await FileSystem.getInfoAsync(extractionPath);
        if (dirInfo.exists) {
          console.log('[TileManager] Cleaning up existing tiles');
          await FileSystem.deleteAsync(extractionPath, { idempotent: true });
        }
      } catch (cleanupError: any) {
        console.warn('[TileManager] Error during cleanup:', cleanupError);
      }

      console.log('[TileManager] Creating extraction directory');
      await FileSystem.makeDirectoryAsync(extractionPath, { intermediates: true });

      // Extract the .drift file
      console.log('[TileManager] Starting file extraction...');
      const startTime = Date.now();
      try {
        await unzip(filePath, extractionPath);
        const endTime = Date.now();
        console.log(`[TileManager] Extraction completed in ${endTime - startTime}ms`);
      } catch (unzipError: any) {
        console.error('[TileManager] Error extracting file:', unzipError);
        throw new Error(`Failed to extract drift file: ${unzipError.message}`);
      }

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
      try {
        const styleInfo = await FileSystem.getInfoAsync(this.stylePath!);
        if (!styleInfo.exists) {
          throw new Error('Style file does not exist in the extracted drift file');
        }

        const styleContent = await FileSystem.readAsStringAsync(this.stylePath!);
        const style = JSON.parse(styleContent);

        // Get center coordinates from metadata or use default
        if (style.metadata && style.metadata.centerCoordinate) {
          this.centerCoordinate = style.metadata.centerCoordinate;
          console.log('[TileManager] Setting centerCoordinate to [lon, lat] = ', this.centerCoordinate);
        } else if (!this.centerCoordinate) {
          // Set default if not already set and not in style
          this.centerCoordinate = [-73.72826520392081, 45.584043985983];
          console.log('[TileManager] Using default centerCoordinate: ', this.centerCoordinate);
        }

        // This code adds the tiles to the sources definition
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
      } catch (styleError: any) {
        console.error('[TileManager] Error processing style file:', styleError);
        throw new Error(`Failed to process style file: ${styleError.message}`);
      }
    } catch (error: any) {
      console.error('[TileManager] Drift file processing error:', error);
      throw new Error(`Failed to process drift file: ${error.message}`);
    }
  }

  // Get the URI or JSON style string for the current style
  getStyleUri(): string {
    if (!this.initialized) {
      console.warn('[TileManager] getStyleUri called but manager not initialized');
      if (this.mode === 'streaming') {
        // Even if not initialized, return the default style for streaming mode
        return JSON.stringify(defaultStyle);
      }
      throw new Error('TileManager not initialized');
    }

    // For streaming mode, return the JSON style as a string
    if (this.mode === 'streaming') {
      return JSON.stringify(defaultStyle);
    }

    // For reading mode, check if we have a style path
    if (!this.stylePath) {
      console.warn('[TileManager] No style path in reading mode, falling back to streaming');
      this.mode = 'streaming';
      return JSON.stringify(defaultStyle);
    }

    return this.stylePath;
  }

  getTilePath(): string {
    if (!this.initialized) {
      throw new Error('TileManager not initialized');
    }

    if (!this.tilesPath && this.mode === 'streaming') {
      // In streaming mode, use the built-in path for streaming tiles
      return 'https://driftm.app/martin/maptiler-north-america-2020';
    }

    if (!this.tilesPath) {
      throw new Error('No tilesPath available');
    }

    console.log('[TileManager] Returning tile path:', this.tilesPath);
    return this.tilesPath;
  }

  public getCenter(): number[] {
    if (!this.initialized) {
      throw new Error('TileManager not initialized');
    }

    if (!this.centerCoordinate) {
      // Use default coordinates if none are set
      this.centerCoordinate = [-73.72826520392081, 45.584043985983];
      console.log('[TileManager] Using default centerCoordinate: ', this.centerCoordinate);
    }

    return this.centerCoordinate;
  }
}
