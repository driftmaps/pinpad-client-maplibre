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

export default function App() {
  const { tileManager, isLoading, error } = useTileManager();
  const [styleUrl, setStyleUrl] = useState(null);

  const updateStyleUrl = () => {
    const baseStyleUrl = tileManager.getStyleUrl();
    const version = new Date().getTime();
    setStyleUrl({ base: baseStyleUrl, version });
  };

  const handleUrl = async (url) => {
    if (!url) return;
    if (isLoading) {
      console.log("Skipping URL handling while TileManager is initializing");
      return;
    }
    try {
      await tileManager.handleDriftUrl(url);
      updateStyleUrl();
    } catch (err) {
      console.error("Error handling URL:", err);
    }
  };

  useEffect(() => {
    if (!isLoading) {  // Only set up URL handling after TileManager is ready
      Linking.getInitialURL().then(handleUrl);
      const subscription = Linking.addEventListener("url", (event) => handleUrl(event.url));
      return () => subscription.remove();
    }
  }, [isLoading, tileManager]);

  useEffect(() => {
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
          centerCoordinate={tileManager.getCenter()} // now uses the packaged center
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
