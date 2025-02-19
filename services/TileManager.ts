import * as FileSystem from '@dr.pogodin/react-native-fs';
import {Asset} from 'expo-asset';
import {unzip} from 'react-native-zip-archive';

export class TileManager {
  private initialized = false;
  private dataPath: string|null = null;
  private stylePath: string|null = null;
  private tilesPath: string|null = null;
  private centerCoordinate: [number, number] | null = null;

  async initialize(): Promise<void> {
    // console.log('initialize called');
    if (this.initialized) return;

    try {
      const asset = await Asset.fromModule(require('../assets/test.drift'))
                        .downloadAsync();

      // Move this to its own function
      const extractionPath = `${FileSystem.DocumentDirectoryPath}`;

      // Currently we are forcing a clean up
      // in real world we would be keeping caches
      if (await FileSystem.exists(extractionPath)) {
        await FileSystem.unlink(extractionPath);
      }
      await FileSystem.mkdir(extractionPath);

      console.log(`unzipping to ${extractionPath}`);
      await unzip(asset.localUri!, extractionPath);

      console.log(`in initialize, extraction path is ${extractionPath}`);
      this.dataPath = `${extractionPath}/tiles`;
      this.tilesPath = `${this.dataPath}/data`;
      this.stylePath = `${this.dataPath}/style.json`;

      console.log('Checking style path:', this.stylePath);
      // /data/user/0/com.anonymous.pinpadclientmaplibre/files/tiles/style.json
      if (await FileSystem.exists(this.stylePath)) {
        const styleContent = await FileSystem.readFile(this.stylePath);
        const style = JSON.parse(styleContent);

        // If you decide to package the centerCoordinate in the style file, you might add a metadata property:
        // Example: { "metadata": { "centerCoordinate": [-84.3837773, 33.7521521] } }
        if (style.metadata && style.metadata.centerCoordinate) {
          console.log('center coordinate set from metadata');
          this.centerCoordinate = style.metadata.centerCoordinate;
        } else {
          // Set a default if not provided.
          console.log('center coordinate set from default');
          this.centerCoordinate = [-73.72826520392081, 45.584043985983];
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
          'custom-tiles': {
            'type': 'vector',
            'tiles': [`file://${this.tilesPath}/{z}/{x}/{y}.pbf`],
            'zoomlevel': 9,
            'maxzoom': 14,
            'minzoom': 5
          }
        };

        await FileSystem.writeFile(
            this.stylePath, JSON.stringify(style, null, 2));
      } else {
        console.error('Style file does not exist at', this.stylePath);
      }

      this.initialized = true;
    } catch (error: any) {
      console.error('TileManager initialization error:', error);
      throw new Error(`Failed to initialize TileManager: ${error.message}`);
    }
  }

  async processDriftFile(filePath: string): Promise<void> {
    console.log('processDriftFile called');
    try {
      const extractionPath = `${FileSystem.DocumentDirectoryPath}`;

      // Currently we are forcing a clean up
      // in real world we would be keeping caches
      if (await FileSystem.exists(extractionPath)) {
        await FileSystem.unlink(extractionPath);
      }
      await FileSystem.mkdir(extractionPath);

      console.log(`unzipping to ${extractionPath}`);
      await unzip(filePath, extractionPath);

      const files = await FileSystem.readDir(extractionPath);
      console.log('Extraction directory contents:', files);
      console.log(`in processDriftFile, extraction path is ${extractionPath}`);

      this.dataPath = `${extractionPath}/tiles`;
      this.tilesPath = `${this.dataPath}/data`;
      this.stylePath = `${this.dataPath}/style.json`;

      if (await FileSystem.exists(this.stylePath)) {
        const styleContent = await FileSystem.readFile(this.stylePath);
        const style = JSON.parse(styleContent);

        // If you decide to package the centerCoordinate in the style file, you might add a metadata property:
        // Example: { "metadata": { "centerCoordinate": [-84.3837773, 33.7521521] } }
        if (style.metadata && style.metadata.centerCoordinate) {
          console.log('center coordinate set from metadata');
          this.centerCoordinate = style.metadata.centerCoordinate;
        } else {
          // Set a default if not provided.
          console.log('center coordinate provided with default');
          this.centerCoordinate = [-73.72826520392081, 45.584043985983];
        }

        style.sources = {
          'custom-tiles': {
            'type': 'vector',
            'tiles': [`file://${this.tilesPath}/{z}/{x}/{y}.pbf`],
            'zoomlevel': 9,
            'maxzoom': 14,
            'minzoom': 5
          }
        };

        await FileSystem.writeFile(
            this.stylePath, JSON.stringify(style, null, 2));
      } else {
        console.error('Style file does not exist at', this.stylePath);
      }
      // this.initialized = true;
    } catch (error: any) {
      console.error('TileManager initialization error:', error);
      throw new Error(`Failed to initialize TileManager: ${error.message}`);
    }
  }

  getStyleUrl(): string {
    if (!this.initialized || !this.stylePath) {
      throw new Error('TileManager not initialized');
    }
    return `file://${this.stylePath}`;
  }

  getTilePath(): string {
    if (!this.initialized || !this.tilesPath) {
      throw new Error('TileManager not initialized');
    }
    return this.tilesPath;
  }

  public getCenterCoordinate(): number[] {
    if (!this.initialized || !this.centerCoordinate) {
      throw new Error('TileManager not initialized or center coordinate not set');
    }
    console.log('center coordinate:', this.centerCoordinate);
    return this.centerCoordinate;
  }
}
