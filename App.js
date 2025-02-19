import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Linking } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import * as FileSystem from 'expo-file-system';
import { useTileManager } from './hooks/useTileManager';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';

// Helper: download a file from a content URI to a local path.
async function resolveContentUri(contentUri) {
  const destPath = FileSystem.cacheDirectory + 'downloaded.drift';
  try {
    if (contentUri.startsWith('content://')) {
      // Use copyAsync for content URIs.
      await FileSystem.copyAsync({ from: contentUri, to: destPath });
      console.log('File copied to', destPath);
      return destPath;
    } else {
      // For http/https URIs, use downloadAsync.
      const result = await FileSystem.downloadAsync(contentUri, destPath);
      console.log('File downloaded to', result.uri);
      return result.uri;
    }
  } catch (error) {
    console.error('Failed to resolve content URI:', error);
    return null;
  }
}

export default function App() {
  const { tileManager, isLoading, error } = useTileManager();
  const [styleUrl, setStyleUrl] = useState(null);

  console.log("calling App");

  // Process a drift file URL.
  const handleDriftUrl = async (url) => {
    console.log('Drift file URL detected:', url);
    
    // Skip expo development client URLs.
    if (url.startsWith('exp+pinpad-client-maplibre://')) {
      console.log('Ignoring development URL:', url);
      return;
    }
    
    let localPath = url;
    if (url.startsWith('content://')) {
      console.log("DETECTED FILE");
      localPath = await resolveContentUri(url);
      if (!localPath) {
        console.error("Failed to resolve content URI.");
        return;
      }
    }
    
    await tileManager.processDriftFile(localPath);
    try {
      const baseStyleUrl = tileManager.getStyleUrl();
      // Instead of appending a query param to styleURL,
      // update a separate version (to be used as the key)
      const version = new Date().getTime();
      setStyleUrl({ base: baseStyleUrl, version });
    } catch (err) {
      console.error(err);
    }
  };

  // Process the initial URL at launch.
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL detected:', url);
        handleDriftUrl(url);
      }
    }).catch(err => {
      console.log('Error getting initial URL', err);
    });
  }, [tileManager]);

  // Listen for URL events while the app is running.
  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('URL event received:', event.url);
      handleDriftUrl(event.url);
    });
    return () => {
      subscription.remove();
    };
  }, [tileManager]);

  useEffect(() => {
    if (global.HermesInternal) {
      console.log("Hermes is enabled.");
    } else {
      console.log("Hermes is not enabled.");
    }
    MapLibreGL.setAccessToken(null);
  }, []);

  if (isLoading) {
    return <ActivityIndicator />;
  }
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        key={styleUrl?.version} // <== Force mount when styleUrl changes.
        style={styles.map}
        styleURL={styleUrl?.base || tileManager.getStyleUrl()}
        testID="map-view"
      >
        <MapLibreGL.Camera
          zoomLevel={9}
          centerCoordinate={tileManager.getCenterCoordinate()} // now uses the packaged center
          minZoomLevel={5}
          maxZoomLevel={14}
        />
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});