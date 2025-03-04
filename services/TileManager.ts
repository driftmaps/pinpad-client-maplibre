import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { unzip } from 'react-native-zip-archive';
import { Pin } from '../types/pin';

export class TileManager {
  private initialized = false;
  private readonly extractionPath: string | null = FileSystem.documentDirectory;
  private readonly dataPath: string | null = `${this.extractionPath}map_data`;
  private readonly mapDataPath: string | null = `${this.dataPath}/map_state.json`;
  private readonly tilesPath: string | null = `${this.dataPath}/tiles`;
  private centerCoordinate: [number, number] | null = null;
  private pins: Pin[] = [];

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

  async handleDriftUri(uri: string): Promise<void> {
    // Skip Expo development client URIs to avoid conflicts
    if (uri.startsWith('exp+pinpad-client-maplibre://')) {
      console.log('[TileManager] Skipping Expo development client URI:', uri);
      return;
    }

    try {
      const localPath = FileSystem.cacheDirectory + 'downloaded.drift';
      await FileSystem.copyAsync({ from: uri, to: localPath });
      await this.processDriftFile(localPath);
    } catch (error) {
      throw error;
    }
  }

  // Process a .drift file: extract it and set up the tile structure
  async processDriftFile(filePath: string): Promise<void> {
    console.log('[TileManager] Processing drift file:', filePath);
    try {
      console.log('[TileManager] Creating extraction directory');
      await FileSystem.makeDirectoryAsync(this.extractionPath, { intermediates: true });

      // Extract the .drift file
      console.log('[TileManager] Starting file extraction...');
      const startTime = Date.now();
      await unzip(filePath, this.extractionPath);
      const endTime = Date.now();
      console.log(`[TileManager] Extraction completed in ${endTime - startTime}ms`);

      // Process the style file
      if (await FileSystem.getInfoAsync(this.mapDataPath)) {
        console.log('[TileManager] Map data found:', this.mapDataPath);
        const mapData = JSON.parse(await FileSystem.readAsStringAsync(this.mapDataPath));

        // Get center coordinates from mapData or use default
        if (mapData && mapData.centerCoordinate) {
          this.centerCoordinate = mapData.centerCoordinate;
          console.log('setting centerCoordinate to [lon, lat] = ', this.centerCoordinate);
        }

        // Get pins from mapData
        if (mapData && Array.isArray(mapData.pins)) {
          this.pins = mapData.pins;
          console.log('Loaded pins from map state:', this.pins.length);
        }
      } else {
        throw new Error('No map data found or no center coordinate in map data');
      }
    } catch (error: any) {
      console.error('TileManager initialization error:', error);
      throw new Error(`Failed to initialize TileManager: ${error.message}`);
    }
  }

  getTilesPath(): string {
    return this.tilesPath;
  }

  public getCenter(): number[] {
    if (!this.initialized || !this.centerCoordinate) {
      throw new Error('TileManager not initialized or center coordinate not set');
    }
    return this.centerCoordinate;
  }

  public getPins(): Pin[] {
    return this.pins;
  }
}
