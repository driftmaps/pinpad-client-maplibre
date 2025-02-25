import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Linking,
  Platform,
} from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { useTileManager } from "./hooks/useTileManager";

// Main App component that handles map display and URI-based tile loading
export default function App() {
  // TileManager handles loading and processing of map tile data
  const { tileManager, isLoading, error } = useTileManager();
  // styleUri state tracks the current map style and forces re-renders when needed
  const [styleUri, setStyleUri] = useState(null);

  // Updates the style URI with a version timestamp to force MapView to reload
  const updateStyleUri = () => {
    const baseStyleUri = tileManager.getStyleUri();
    const version = new Date().getTime();
    setStyleUri({ base: baseStyleUri, version });
  };

  // Handles incoming .drift file URIs, processes them with TileManager
  const handleUri = async (uri) => {
    if (!uri) return;
    if (isLoading) {
      console.log("Skipping URI handling while TileManager is initializing");
      return;
    }
    try {
      await tileManager.handleDriftUri(uri);
      updateStyleUri();
    } catch (err) {
      console.error("Error handling URI:", err);
    }
  };

  // Sets up URI handling for deep links and initial URIs
  useEffect(() => {
    if (!isLoading) {
      // Only set up URI handling after TileManager is ready
      Linking.getInitialURL().then(handleUri);
      const subscription = Linking.addEventListener("url", (event) =>
        handleUri(event.url)
      );
      return () => subscription.remove();
    }
  }, [isLoading, tileManager]);

  // MapLibre initialization - no access token needed as we're using local tiles
  useEffect(() => {
    MapLibreGL.setAccessToken(null);
  }, []);

  // Loading and error states
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
        key={styleUri?.version} // Forces remount when styleUri changes
        style={styles.map}
        styleURL={styleUri?.base || tileManager.getStyleUri()}
        testID="map-view"
      >
        <MapLibreGL.Camera
          zoomLevel={9}
          centerCoordinate={tileManager.getCenter()}
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
