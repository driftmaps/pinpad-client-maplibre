import { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { useTileManager } from "./hooks/useTileManager";
import { listenForDriftFiles } from "./hooks/listenForDriftFiles";

// Main App component that handles map display and URI-based tile loading
export default function App() {
  // TileManager handles loading and processing of map tile data
  const { tileManager, isLoading, error } = useTileManager();
  // styleUri state tracks the current map style and center coordinates and re-renders when needed.
  const [styleUri, setStyleUri] = useState(null);
  // set up handling of files evens via deep linking
  listenForDriftFiles(tileManager, isLoading, setStyleUri);

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
